package com.dgonzamat.limpiador

import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/**
 * Recorre el almacenamiento compartido (/storage/emulated/0) con la API de archivos
 * y clasifica residuos: temporales, carpetas de caché ocultas, carpetas vacías,
 * instaladores APK, descargas antiguas, archivos grandes que no son fotos ni videos
 * y, con [findDuplicates], copias exactas de documentos y otros archivos fuera de la
 * galería (fotos y videos repetidos los detecta JunkScanner vía MediaStore).
 * Requiere «Acceso a todos los archivos» (MANAGE_EXTERNAL_STORAGE).
 */
class FileScanner(
    private val root: File,
    private val now: Long = System.currentTimeMillis(),
    private val strings: Strings = Strings(),
    private val findDuplicates: Boolean = true,
) {
    /** Textos de las notas (inyectables para no depender de Context). */
    data class Strings(
        val emptyDir: String = "carpeta vacía",
        val zeroBytes: String = "0 bytes",
        val cacheDir: String = "carpeta de caché",
        val daysOld: (Int) -> String = { "hace $it días" },
        val copyOf: (String) -> String = { "Copia de $it" },
    )

    companion object {
        val TEMP_EXT = setOf("tmp", "temp", "log", "bak", "old", "part", "crdownload", "partial", "dmp", "download")
        val APK_EXT = setOf("apk", "apks", "xapk", "apkm")
        val IMAGE_EXT = setOf("jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "dng")
        val VIDEO_EXT = setOf("mp4", "mkv", "mov", "3gp", "webm", "avi", "m4v", "mts")
        /** Carpetas que son caché por convención: se listan enteras, sin descender. */
        val RESIDUE_DIRS = setOf(".thumbnails", ".thumbs", ".statuses", ".shared", ".trash", ".trashed", ".cache", ".temp", ".tmp", "cache", "temp", "tmp", "lost.dir")
        /** Inaccesibles para terceros desde Android 11; no vale la pena intentarlo. */
        val SKIP_RELATIVE = setOf("Android/data", "Android/obb")
        /** Carpetas estándar: nunca se proponen como «carpeta vacía». */
        val STANDARD_DIRS = setOf("DCIM", "Pictures", "Download", "Downloads", "Movies", "Music", "Documents", "Alarms", "Ringtones", "Notifications", "Podcasts", "Android", "Audiobooks", "Recordings", "Screenshots", "Camera", "media")
        const val OLD_DOWNLOAD_DAYS = 30
        const val LARGE_MIN_BYTES = 100L * 1024 * 1024
        /** Por debajo de esto no se buscan repetidos: archivos pequeños idénticos suelen ser de apps, no del usuario. */
        const val DUP_MIN_BYTES = 16L * 1024
        const val DUP_MAX_BYTES = 2L * 1024 * 1024 * 1024
        const val PREFIX_BYTES = 64L * 1024
    }

    /** Entradas visitadas en el último escaneo (para informar el alcance). */
    var visited = 0
        private set

    /** Archivos candidatos a repetido, recogidos durante el recorrido. */
    private val dupCandidates = mutableListOf<File>()

    suspend fun scan(
        onProgress: suspend (Int) -> Unit = {},
        onHashing: suspend (done: Int, total: Int) -> Unit = { _, _ -> },
    ): List<JunkItem> {
        val out = mutableListOf<JunkItem>()
        val downloadDir = File(root, "Download")
        visited = 0
        dupCandidates.clear()
        walk(root, 0, downloadDir, out, onProgress)
        if (findDuplicates) out += duplicates(onHashing)
        return out.sortedWith(compareBy<JunkItem> { it.category.ordinal }.thenByDescending { it.size })
    }

    /**
     * Copias exactas fuera de la galería: mismo tamaño → mismos primeros 64 KB → mismo
     * SHA-256. Se conserva la más antigua; las demás se proponen con «Copia de …».
     */
    private suspend fun duplicates(onHashing: suspend (Int, Int) -> Unit): List<JunkItem> {
        val out = mutableListOf<JunkItem>()
        val bySize = dupCandidates.groupBy { it.length() }.values.filter { it.size >= 2 }
        val total = bySize.sumOf { it.size }
        var done = 0
        for (group in bySize) {
            val byPrefix = HashMap<String, MutableList<File>>()
            for (f in group) {
                currentCoroutineContext().ensureActive()
                done++
                if (done % 5 == 0) onHashing(done, total)
                val h = sha256(f, PREFIX_BYTES) ?: continue
                byPrefix.getOrPut(h) { mutableListOf() } += f
            }
            for (sameStart in byPrefix.values) {
                if (sameStart.size < 2) continue
                val byHash = HashMap<String, MutableList<File>>()
                for (f in sameStart) {
                    currentCoroutineContext().ensureActive()
                    val h = sha256(f) ?: continue
                    byHash.getOrPut(h) { mutableListOf() } += f
                }
                for (dups in byHash.values) {
                    if (dups.size < 2) continue
                    val sorted = dups.sortedWith(compareBy({ it.lastModified() }, { it.absolutePath }))
                    val keep = sorted.first()
                    for (d in sorted.drop(1)) {
                        out += JunkItem(
                            Category.DUPLICATE_FILES, d.name, d.length(), strings.copyOf(keep.name),
                            path = d.absolutePath, dateModified = d.lastModified(),
                        )
                    }
                }
            }
        }
        onHashing(total, total)
        return out
    }

    private fun sha256(f: File, limit: Long = Long.MAX_VALUE): String? = try {
        val md = MessageDigest.getInstance("SHA-256")
        f.inputStream().use { input ->
            val buf = ByteArray(64 * 1024)
            var remaining = limit
            while (remaining > 0) {
                val n = input.read(buf, 0, minOf(buf.size.toLong(), remaining).toInt())
                if (n <= 0) break
                md.update(buf, 0, n)
                remaining -= n
            }
        }
        md.digest().joinToString("") { "%02x".format(it) }
    } catch (e: Exception) {
        null
    }

    /** Devuelve true si la carpeta quedó vacía (sin entradas). */
    private suspend fun walk(dir: File, depth: Int, downloadDir: File, out: MutableList<JunkItem>, onProgress: suspend (Int) -> Unit): Boolean {
        val children = dir.listFiles() ?: return false // sin permiso o no es carpeta: no tocar
        if (children.isEmpty()) return true
        for (f in children) {
            currentCoroutineContext().ensureActive() // «Cancelar» detiene el recorrido aquí
            visited++
            if (visited % 300 == 0) onProgress(visited)
            val rel = f.relativeTo(root).path
            if (f.isDirectory) {
                if (rel in SKIP_RELATIVE) continue
                if (f.name.lowercase() in RESIDUE_DIRS) {
                    val size = dirSize(f)
                    out += JunkItem(Category.RESIDUE, f.name, size, strings.cacheDir, path = f.absolutePath, isDir = true, dateModified = f.lastModified())
                    continue
                }
                val empty = walk(f, depth + 1, downloadDir, out, onProgress)
                if (empty && f.name !in STANDARD_DIRS && !f.name.startsWith(".")) {
                    out += JunkItem(Category.RESIDUE, f.name, 0, strings.emptyDir, path = f.absolutePath, isDir = true, dateModified = f.lastModified())
                }
                continue
            }
            try {
                val junk = classify(f, downloadDir)
                if (junk != null) out += junk else if (findDuplicates && isDupCandidate(f, rel)) dupCandidates += f
            } catch (e: Exception) {
                // Un archivo ilegible no debe abortar el recorrido completo.
            }
        }
        return false
    }

    private fun classify(f: File, downloadDir: File): JunkItem? {
        val ext = f.extension.lowercase()
        val size = f.length()
        val modified = f.lastModified()
        fun item(cat: Category, note: String? = null) =
            JunkItem(cat, f.name, size, note, path = f.absolutePath, isVideo = ext in VIDEO_EXT, dateModified = modified)

        if (ext in TEMP_EXT) return item(Category.RESIDUE)
        if (size == 0L && !f.name.startsWith(".")) return item(Category.RESIDUE, strings.zeroBytes)
        if (ext in APK_EXT) return item(Category.APK_FILES)
        val ageDays = TimeUnit.MILLISECONDS.toDays(now - modified).toInt()
        if (f.parentFile == downloadDir && ageDays >= OLD_DOWNLOAD_DAYS) return item(Category.OLD_DOWNLOADS, strings.daysOld(ageDays))
        if (size >= LARGE_MIN_BYTES && ext !in IMAGE_EXT && ext !in VIDEO_EXT) return item(Category.LARGE_FILES)
        return null
    }

    /** Documentos, audios, descargas…: no fotos ni videos (los cubre la galería), no ocultos, no minúsculos. */
    private fun isDupCandidate(f: File, rel: String): Boolean {
        val ext = f.extension.lowercase()
        if (ext in IMAGE_EXT || ext in VIDEO_EXT) return false
        if (f.name.startsWith(".") || rel.contains("/.")) return false
        val size = f.length()
        return size in DUP_MIN_BYTES..DUP_MAX_BYTES
    }

    private fun dirSize(dir: File): Long {
        var total = 0L
        val stack = ArrayDeque<File>().apply { add(dir) }
        while (stack.isNotEmpty()) {
            val d = stack.removeLast()
            for (f in d.listFiles() ?: continue) {
                if (f.isDirectory) stack.add(f) else total += f.length()
            }
        }
        return total
    }
}
