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

    suspend fun scan(context: Context, onProgress: suspend (ScanProgress) -> Unit): List<JunkItem> = withContext(Dispatchers.IO) {
        val out = mutableListOf<JunkItem>()
        out += JunkScanner(context.contentResolver).scan(onProgress)
        if (allFilesAccess(context)) {
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
            if (pending >= 0) onProgress(ScanProgress.Files(pending))
        }
        if (usageAccess(context)) {
            onProgress(ScanProgress.Apps)
            out += AppScanner(context).scan()
        }
        out.sortedWith(compareBy<JunkItem> { it.category.ordinal }.thenByDescending { it.size })
    }
}
