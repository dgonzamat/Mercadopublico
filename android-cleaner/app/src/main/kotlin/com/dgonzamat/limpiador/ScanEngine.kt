package com.dgonzamat.limpiador

import android.content.Context
import android.os.Environment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/** Orquesta los tres escáneres. Los ganchos son reemplazables en pruebas. */
object ScanEngine {
    var storageRoot: () -> File = { Environment.getExternalStorageDirectory() }
    var allFilesAccess: (Context) -> Boolean = { Environment.isExternalStorageManager() }
    var usageAccess: (Context) -> Boolean = { AppScanner.hasUsageAccess(it) }

    val MEDIA_CATEGORIES = setOf(Category.SCREENSHOTS, Category.DUPLICATES, Category.TINY, Category.LARGE_VIDEOS)
    val FILE_CATEGORIES = setOf(Category.RESIDUE, Category.APK_FILES, Category.LARGE_FILES, Category.OLD_DOWNLOADS)

    /** Escanea solo los grupos en [enabled] (por defecto, todos). */
    suspend fun scan(
        context: Context,
        enabled: Set<Category> = Category.entries.toSet(),
        onProgress: suspend (ScanProgress) -> Unit,
    ): ScanResult = withContext(Dispatchers.IO) {
        val out = mutableListOf<JunkItem>()
        if (enabled.any { it in MEDIA_CATEGORIES }) out += JunkScanner(context.contentResolver).scan(onProgress)
        val allFiles = allFilesAccess(context)
        var visited = 0
        if (allFiles && enabled.any { it in FILE_CATEGORIES }) {
            onProgress(ScanProgress.Files(0))
            val strings = FileScanner.Strings(
                emptyDir = context.getString(R.string.note_empty_dir),
                zeroBytes = context.getString(R.string.note_zero_bytes),
                cacheDir = context.getString(R.string.note_cache_dir),
                daysOld = { context.getString(R.string.note_days_old, it) },
            )
            // Progreso desde el hilo IO: el callback es suspend, así que se agrupa en lotes.
            val fs = FileScanner(storageRoot(), strings = strings)
            var pending = -1
            out += fs.scan { pending = it }
            visited = fs.visited
            if (pending >= 0) onProgress(ScanProgress.Files(pending))
        }
        val usage = usageAccess(context)
        if (usage && Category.UNUSED_APPS in enabled) {
            onProgress(ScanProgress.Apps)
            out += AppScanner(context).scan()
        }
        ScanResult(
            out.filter { it.category in enabled }
                .sortedWith(compareBy<JunkItem> { it.category.ordinal }.thenByDescending { it.size }),
            ScanScope(allFiles = allFiles, usage = usage, filesVisited = visited),
        )
    }
}
