package com.dgonzamat.limpiador

import android.net.Uri
import java.util.Locale

/** De dónde sale un elemento y cómo se elimina. */
enum class Kind { MEDIA, FILE, APP }

/** Categorías de basura detectadas. [preselected] marca las que se limpian por defecto. */
enum class Category(val titleRes: Int, val descRes: Int, val iconRes: Int, val preselected: Boolean) {
    SCREENSHOTS(R.string.cat_screenshots, R.string.cat_screenshots_desc, R.drawable.ic_phone, true),
    DUPLICATES(R.string.cat_duplicates, R.string.cat_duplicates_desc, R.drawable.ic_copy, true),
    SIMILAR(R.string.cat_similar, R.string.cat_similar_desc, R.drawable.ic_burst, false),
    DUPLICATE_FILES(R.string.cat_dup_files, R.string.cat_dup_files_desc, R.drawable.ic_file_copy, true),
    TINY(R.string.cat_tiny, R.string.cat_tiny_desc, R.drawable.ic_crop, true),
    RESIDUE(R.string.cat_residue, R.string.cat_residue_desc, R.drawable.ic_sweep, true),
    APK_FILES(R.string.cat_apk, R.string.cat_apk_desc, R.drawable.ic_apk, true),
    LARGE_VIDEOS(R.string.cat_large_videos, R.string.cat_large_videos_desc, R.drawable.ic_video, false),
    LARGE_FILES(R.string.cat_large_files, R.string.cat_large_files_desc, R.drawable.ic_file, false),
    OLD_DOWNLOADS(R.string.cat_old_downloads, R.string.cat_old_downloads_desc, R.drawable.ic_download, false),
    UNUSED_APPS(R.string.cat_unused_apps, R.string.cat_unused_apps_desc, R.drawable.ic_apps, false),
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

/**
 * Un elemento clasificado como basura. Exactamente uno de [uri] (galería, se borra
 * con MediaStore), [path] (archivo o carpeta, se borra directo) o [packageName]
 * (app, se desinstala) está presente.
 */
data class JunkItem(
    val category: Category,
    val name: String,
    val size: Long,
    val note: String? = null,
    val uri: Uri? = null,
    val path: String? = null,
    val packageName: String? = null,
    val isVideo: Boolean = false,
    val isDir: Boolean = false,
    val dateModified: Long = 0,
    var selected: Boolean = category.preselected,
) {
    val kind: Kind
        get() = when {
            packageName != null -> Kind.APP
            uri != null -> Kind.MEDIA
            else -> Kind.FILE
        }
}

/** Progreso del escaneo, para mensajes amigables en pantalla. */
sealed class ScanProgress {
    object Reading : ScanProgress()
    data class Found(val total: Int) : ScanProgress()
    data class Hashing(val done: Int, val total: Int) : ScanProgress()
    /** Huellas perceptuales de fotos para buscar parecidas. */
    data class Similar(val done: Int, val total: Int) : ScanProgress()
    data class Files(val visited: Int) : ScanProgress()
    /** Hash de archivos del mismo tamaño para buscar repetidos fuera de la galería. */
    data class FileHashing(val done: Int, val total: Int) : ScanProgress()
    object Apps : ScanProgress()
}

/** Qué alcanzó el último escaneo, para decirlo en pantalla. */
data class ScanScope(val allFiles: Boolean = false, val usage: Boolean = false, val filesVisited: Int = 0)

data class ScanResult(val items: List<JunkItem>, val scope: ScanScope)

/** Resultado del último escaneo, compartido entre pantallas (en memoria). */
object ScanStore {
    var items: List<JunkItem> = emptyList()
    var scope: ScanScope = ScanScope()

    fun byCategory(cat: Category): List<JunkItem> = items.filter { it.category == cat }
    fun selected(): List<JunkItem> = items.filter { it.selected }
    fun remove(deleted: Collection<JunkItem>) {
        val set = deleted.toHashSet()
        items = items.filter { it !in set }
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
