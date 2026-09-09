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
 * Recorre la galería (MediaStore) y clasifica archivos basura.
 * Solo lee: la eliminación la hace el sistema con confirmación del usuario.
 */
class JunkScanner(private val resolver: ContentResolver) {

    companion object {
        const val TINY_MAX_BYTES = 20L * 1024          // < 20 KB
        const val TINY_MAX_DIMENSION = 256             // lado mayor < 256 px
        const val LARGE_VIDEO_MIN_BYTES = 200L * 1024 * 1024 // >= 200 MB
        const val HASH_MAX_BYTES = 300L * 1024 * 1024  // no hashear archivos > 300 MB
    }

    suspend fun scan(onProgress: suspend (String) -> Unit): List<JunkItem> = withContext(Dispatchers.IO) {
        val images = query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, isVideo = false)
        ensureActive()
        val videos = query(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, isVideo = true)
        ensureActive()
        onProgress("${images.size + videos.size}")

        val result = mutableListOf<JunkItem>()
        val used = HashSet<Uri>()

        // 1. Capturas de pantalla.
        for (f in images) {
            if (isScreenshot(f)) {
                result += JunkItem(f, Category.SCREENSHOTS)
                used += f.uri
            }
        }

        // 2. Duplicados exactos (mismo tamaño → mismo hash). Se conserva el más antiguo.
        val candidates = (images + videos).filter { it.size > 0 && it.size <= HASH_MAX_BYTES }
        val bySize = candidates.groupBy { it.size }.values.filter { it.size >= 2 }
        val totalToHash = bySize.sumOf { it.size }
        var hashed = 0
        for (group in bySize) {
            val byHash = HashMap<String, MutableList<MediaFile>>()
            for (f in group) {
                ensureActive()
                hashed++
                if (hashed % 10 == 0) onProgress("hash:$hashed/$totalToHash")
                val h = sha256(f.uri) ?: continue
                byHash.getOrPut(h) { mutableListOf() } += f
            }
            for (dups in byHash.values) {
                if (dups.size < 2) continue
                val sorted = dups.sortedBy { it.dateModified }
                val keep = sorted.first()
                for (d in sorted.drop(1)) {
                    if (d.uri in used) continue
                    result += JunkItem(d, Category.DUPLICATES, note = keep.name)
                    used += d.uri
                }
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
                result += JunkItem(f, Category.TINY, note = note)
                used += f.uri
            }
        }

        // 4. Videos grandes (solo para revisar; no se preseleccionan).
        for (f in videos) {
            if (f.uri in used) continue
            if (f.size >= LARGE_VIDEO_MIN_BYTES) {
                result += JunkItem(f, Category.LARGE_VIDEOS)
                used += f.uri
            }
        }

        result.sortedWith(compareBy<JunkItem> { it.category.ordinal }.thenByDescending { it.file.size })
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

    private fun sha256(uri: Uri): String? {
        return try {
            val md = MessageDigest.getInstance("SHA-256")
            resolver.openInputStream(uri)?.use { input ->
                val buf = ByteArray(64 * 1024)
                while (true) {
                    val n = input.read(buf)
                    if (n <= 0) break
                    md.update(buf, 0, n)
                }
            } ?: return null
            md.digest().joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            null
        }
    }
}
