package com.dgonzamat.limpiador

import android.content.ContentResolver
import android.content.ContentUris
import android.net.Uri
import android.provider.MediaStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.security.MessageDigest

/**
 * Recorre la galería (MediaStore) y clasifica fotos y videos basura.
 * Solo lee: la eliminación la hace el sistema con confirmación del usuario.
 */
class JunkScanner(
    private val resolver: ContentResolver,
    /** Huella perceptual de una foto (inyectable en pruebas); null si no se pudo obtener. */
    private val perceptualHash: (Uri) -> Long? = { uri -> defaultPerceptualHash(resolver, uri) },
) {

    companion object {
        const val TINY_MAX_BYTES = 20L * 1024          // < 20 KB
        const val TINY_MAX_DIMENSION = 256             // lado mayor < 256 px
        const val LARGE_VIDEO_MIN_BYTES = 200L * 1024 * 1024 // >= 200 MB
        const val HASH_MAX_BYTES = 300L * 1024 * 1024  // no hashear archivos > 300 MB
        const val PREFIX_BYTES = 64L * 1024            // primera etapa del hash de duplicados
        const val BURST_WINDOW_SECONDS = 10L           // fotos a ≤10 s en la misma carpeta = ráfaga
        const val MAX_SIMILAR_THUMBS = 3000            // tope de miniaturas a comparar por análisis

        fun defaultPerceptualHash(resolver: ContentResolver, uri: Uri): Long? = try {
            val bmp = resolver.loadThumbnail(uri, android.util.Size(96, 96), null)
            ImageHash.dHash(bmp).also { bmp.recycle() }
        } catch (e: Exception) {
            null
        }
    }

    suspend fun scan(onProgress: suspend (ScanProgress) -> Unit): List<JunkItem> = withContext(Dispatchers.IO) {
        onProgress(ScanProgress.Reading)
        val images = query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, isVideo = false)
        ensureActive()
        val videos = query(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, isVideo = true)
        ensureActive()
        onProgress(ScanProgress.Found(images.size + videos.size))

        val result = mutableListOf<JunkItem>()
        val used = HashSet<Uri>()
        fun item(f: MediaFile, cat: Category, note: String? = null) = JunkItem(
            category = cat, name = f.name, size = f.size, note = note, uri = f.uri,
            path = f.relativePath, isVideo = f.isVideo, dateModified = f.dateModified,
        )

        // 1. Capturas de pantalla.
        for (f in images) {
            if (isScreenshot(f)) {
                result += item(f, Category.SCREENSHOTS)
                used += f.uri
            }
        }

        // 2. Duplicados exactos: mismo tamaño → mismos primeros 64 KB → mismo hash completo.
        //    Las dos primeras etapas descartan casi todo sin leer los archivos enteros.
        val candidates = (images + videos).filter { it.size > 0 && it.size <= HASH_MAX_BYTES }
        val bySize = candidates.groupBy { it.size }.values.filter { it.size >= 2 }
        val totalToHash = bySize.sumOf { it.size }
        var hashed = 0
        for (group in bySize) {
            val byPrefix = HashMap<String, MutableList<MediaFile>>()
            for (f in group) {
                ensureActive()
                hashed++
                if (hashed % 5 == 0) onProgress(ScanProgress.Hashing(hashed, totalToHash))
                val h = sha256(f.uri, PREFIX_BYTES) ?: continue
                byPrefix.getOrPut(h) { mutableListOf() } += f
            }
            for (sameStart in byPrefix.values) {
                if (sameStart.size < 2) continue
                val byHash = HashMap<String, MutableList<MediaFile>>()
                for (f in sameStart) {
                    ensureActive()
                    val h = sha256(f.uri) ?: continue
                    byHash.getOrPut(h) { mutableListOf() } += f
                }
                for (dups in byHash.values) {
                    if (dups.size < 2) continue
                    val sorted = dups.sortedBy { it.dateModified }
                    val keep = sorted.first()
                    for (d in sorted.drop(1)) {
                        if (d.uri in used) continue
                        result += item(d, Category.DUPLICATES, note = keep.name)
                        used += d.uri
                    }
                }
            }
        }

        // 2b. Fotos parecidas: huella perceptual de cada foto y comparación de todos los pares.
        //     Dos fotos son «parecidas» si su huella difiere poco. En una ráfaga (misma carpeta,
        //     pocos segundos) se admite más diferencia; entre fotos cualesquiera —la misma imagen
        //     reenviada con otra compresión, guardada en dos carpetas— el umbral es estricto para
        //     no juntar fotos distintas. Cada grupo conserva la más grande; el resto queda a revisar.
        val simCandidates = images
            .filter { it.uri !in used && it.width > 0 && it.height > 0 && it.size >= TINY_MAX_BYTES }
            .sortedByDescending { it.dateModified }
            .take(MAX_SIMILAR_THUMBS)
        val hashes = ArrayList<Pair<MediaFile, Long>>(simCandidates.size)
        for ((i, f) in simCandidates.withIndex()) {
            ensureActive()
            if (i % 20 == 0) onProgress(ScanProgress.Similar(i, simCandidates.size))
            val h = perceptualHash(f.uri) ?: continue
            if (h == 0L || h == -1L) continue // imagen plana: la huella no distingue nada
            hashes += f to h
        }
        val parent = IntArray(hashes.size) { it }
        fun find(x: Int): Int { var r = x; while (parent[r] != r) r = parent[r]; var c = x; while (parent[c] != r) { val n = parent[c]; parent[c] = r; c = n }; return r }
        for (i in hashes.indices) {
            ensureActive()
            val (fi, hi) = hashes[i]
            for (j in i + 1 until hashes.size) {
                val (fj, hj) = hashes[j]
                val d = ImageHash.hamming(hi, hj)
                if (d > ImageHash.SIMILAR_MAX_DISTANCE) continue
                val burst = fi.relativePath == fj.relativePath && kotlin.math.abs(fi.dateModified - fj.dateModified) <= BURST_WINDOW_SECONDS
                if (burst || d <= ImageHash.NEAR_DUPLICATE_MAX_DISTANCE) parent[find(i)] = find(j)
            }
        }
        for (group in hashes.indices.groupBy { find(it) }.values) {
            if (group.size < 2) continue
            val keeper = group.maxBy { hashes[it].first.size }
            for (idx in group) {
                val f = hashes[idx].first
                if (idx == keeper || f.uri in used) continue
                result += item(f, Category.SIMILAR, note = hashes[keeper].first.name)
                used += f.uri
            }
        }

        // 3. Imágenes minúsculas o vacías (miniaturas, stickers, restos de caché).
        for (f in images) {
            if (f.uri in used) continue
            val maxDim = maxOf(f.width, f.height)
            val tiny = f.size == 0L ||
                f.size < TINY_MAX_BYTES ||
                (f.width > 0 && f.height > 0 && maxDim < TINY_MAX_DIMENSION)
            if (tiny) {
                val note = if (f.width > 0 && f.height > 0) "${f.width}×${f.height}" else null
                result += item(f, Category.TINY, note = note)
                used += f.uri
            }
        }

        // 4. Videos grandes (solo para revisar; no se preseleccionan).
        for (f in videos) {
            if (f.uri in used) continue
            if (f.size >= LARGE_VIDEO_MIN_BYTES) {
                result += item(f, Category.LARGE_VIDEOS)
                used += f.uri
            }
        }

        result.sortedWith(compareBy<JunkItem> { it.category.ordinal }.thenByDescending { it.size })
    }

    private fun isScreenshot(f: MediaFile): Boolean {
        val path = f.relativePath.lowercase()
        val name = f.name.lowercase()
        return path.contains("screenshot") ||
            path.contains("captura") ||
            name.startsWith("screenshot") ||
            name.startsWith("captura de pantalla") ||
            name.startsWith("img_screenshot")
    }

    private fun query(collection: Uri, isVideo: Boolean): List<MediaFile> {
        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.WIDTH,
            MediaStore.MediaColumns.HEIGHT,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.RELATIVE_PATH,
        )
        val out = mutableListOf<MediaFile>()
        resolver.query(collection, projection, null, null, null)?.use { c ->
            val idCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
            val nameCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
            val sizeCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE)
            val wCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.WIDTH)
            val hCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.HEIGHT)
            val dateCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED)
            val pathCol = c.getColumnIndexOrThrow(MediaStore.MediaColumns.RELATIVE_PATH)
            while (c.moveToNext()) {
                val id = c.getLong(idCol)
                out += MediaFile(
                    uri = ContentUris.withAppendedId(collection, id),
                    name = c.getString(nameCol) ?: id.toString(),
                    size = c.getLong(sizeCol),
                    width = c.getInt(wCol),
                    height = c.getInt(hCol),
                    dateModified = c.getLong(dateCol),
                    relativePath = c.getString(pathCol) ?: "",
                    isVideo = isVideo,
                )
            }
        }
        return out
    }

    /** SHA-256 del archivo, o solo de sus primeros [limit] bytes. */
    private fun sha256(uri: Uri, limit: Long = Long.MAX_VALUE): String? {
        return try {
            val md = MessageDigest.getInstance("SHA-256")
            resolver.openInputStream(uri)?.use { input ->
                val buf = ByteArray(64 * 1024)
                var remaining = limit
                while (remaining > 0) {
                    val n = input.read(buf, 0, minOf(buf.size.toLong(), remaining).toInt())
                    if (n <= 0) break
                    md.update(buf, 0, n)
                    remaining -= n
                }
            } ?: return null
            md.digest().joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            null
        }
    }
}
