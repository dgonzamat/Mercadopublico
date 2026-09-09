package com.dgonzamat.limpiador

import android.net.Uri

/** Categorías de basura detectadas. [preselected] marca las que se eliminan por defecto. */
enum class Category(val titleRes: Int, val descRes: Int, val preselected: Boolean) {
    SCREENSHOTS(R.string.cat_screenshots, R.string.cat_screenshots_desc, true),
    DUPLICATES(R.string.cat_duplicates, R.string.cat_duplicates_desc, true),
    TINY(R.string.cat_tiny, R.string.cat_tiny_desc, true),
    LARGE_VIDEOS(R.string.cat_large_videos, R.string.cat_large_videos_desc, false),
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

fun formatSize(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024) return String.format("%.1f MB", mb)
    return String.format("%.2f GB", mb / 1024.0)
}
