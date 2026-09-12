package com.dgonzamat.limpiador

import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Recorre el almacenamiento compartido (/storage/emulated/0) con la API de archivos
 * y clasifica residuos: temporales, carpetas de caché ocultas, carpetas vacías,
 * instaladores APK, descargas antiguas y archivos grandes que no son fotos ni videos.
 * Requiere «Acceso a todos los archivos» (MANAGE_EXTERNAL_STORAGE).
 */
class FileScanner(
    private val root: File,
    private val now: Long = System.currentTimeMillis(),
    private val strings: Strings = Strings(),
) {
    /** Textos de las notas (inyectables para no depender de Context). */
    data class Strings(
        val emptyDir: String = "carpeta vacía",
        val zeroBytes: String = "0 bytes",
        val cacheDir: String = "carpeta de caché",
        val daysOld: (Int) -> String = { "hace $it días" },
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
    }

    /** Entradas visitadas en el último escaneo (para informar el alcance). */
    var visited = 0
        private set

    suspend fun scan(onProgress: suspend (Int) -> Unit = {}): List<JunkItem> {
        val out = mutableListOf<JunkItem>()
        val downloadDir = File(root, "Download")
        visited = 0
        walk(root, 0, downloadDir, out, onProgress)
        return out.sortedWith(compareBy<JunkItem> { it.category.ordinal }.thenByDescending { it.size })
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
                classify(f, downloadDir)?.let { out += it }
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
