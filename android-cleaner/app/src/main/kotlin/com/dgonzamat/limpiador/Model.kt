package com.dgonzamat.limpiador

import android.net.Uri
import java.util.Locale

/** Categorías de basura detectadas. [preselected] marca las que se limpian por defecto. */
enum class Category(val titleRes: Int, val descRes: Int, val iconRes: Int, val preselected: Boolean) {
    SCREENSHOTS(R.string.cat_screenshots, R.string.cat_screenshots_desc, R.drawable.ic_phone, true),
    DUPLICATES(R.string.cat_duplicates, R.string.cat_duplicates_desc, R.drawable.ic_copy, true),
    TINY(R.string.cat_tiny, R.string.cat_tiny_desc, R.drawable.ic_crop, true),
    LARGE_VIDEOS(R.string.cat_large_videos, R.string.cat_large_videos_desc, R.drawable.ic_video, false),
}

/** Un archivo de la galería tal como lo entrega MediaStore. */
data class MediaFile(
    val uri: Uri,
    val name: String,
    val size: Long,
    val width: Int,
    val height: Int,
    val dateModified: Long,
    val relativePath: String,
    val isVideo: Boolean,
)

/** Un archivo clasificado como basura, con el motivo. */
data class JunkItem(
    val file: MediaFile,
    val category: Category,
    val note: String? = null,
    var selected: Boolean = category.preselected,
)

/** Progreso del escaneo, para mensajes amigables en pantalla. */
sealed class ScanProgress {
    object Reading : ScanProgress()
    data class Found(val total: Int) : ScanProgress()
    data class Hashing(val done: Int, val total: Int) : ScanProgress()
}

/** Resultado del último escaneo, compartido entre pantallas (en memoria). */
object ScanStore {
    var items: List<JunkItem> = emptyList()

    fun byCategory(cat: Category): List<JunkItem> = items.filter { it.category == cat }
    fun selected(): List<JunkItem> = items.filter { it.selected }
    fun remove(deleted: Set<Uri>) {
        items = items.filter { it.file.uri !in deleted }
    }
}

fun formatSize(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format(Locale.getDefault(), "%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024) return String.format(Locale.getDefault(), "%.1f MB", mb)
    return String.format(Locale.getDefault(), "%.2f GB", mb / 1024.0)
}
