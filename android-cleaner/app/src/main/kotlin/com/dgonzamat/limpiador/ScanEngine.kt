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
    /** Dónde se entregan los avisos de progreso (la pantalla vive en el hilo principal). */
    var uiDispatcher: kotlinx.coroutines.CoroutineDispatcher = Dispatchers.Main
    /** Análisis de seguridad de las apps instaladas (reemplazable en pruebas). */
    var securityScan: suspend (Context, VirusTotal?, suspend (Int) -> Unit) -> List<JunkItem> =
        { ctx, vt, onLookup -> SecurityScanner(ctx, vt).scan(onLookup) }
    /** Antivirus en la nube: solo si el usuario guardó su clave de VirusTotal (reemplazable en pruebas). */
    var virusTotal: (Context) -> VirusTotal? = { ctx -> vtKey(ctx)?.let { VirusTotal(it) } }

    const val PREF_VT_KEY = "vt_key"
    fun vtKey(ctx: Context): String? =
        ctx.getSharedPreferences("limpiador", Context.MODE_PRIVATE).getString(PREF_VT_KEY, null)?.trim()?.takeIf { it.isNotEmpty() }

    val MEDIA_CATEGORIES = setOf(Category.SCREENSHOTS, Category.DUPLICATES, Category.SIMILAR, Category.TINY, Category.LARGE_VIDEOS)
    val FILE_CATEGORIES = setOf(Category.RESIDUE, Category.APK_FILES, Category.LARGE_FILES, Category.OLD_DOWNLOADS, Category.DUPLICATE_FILES)

    /** Escanea solo los grupos en [enabled] (por defecto, todos). */
    suspend fun scan(
        context: Context,
        enabled: Set<Category> = Category.entries.toSet(),
        onUiProgress: suspend (ScanProgress) -> Unit,
    ): ScanResult = withContext(Dispatchers.IO) {
        // Los escáneres corren en IO; la pantalla solo se toca desde el hilo principal.
        val onProgress: suspend (ScanProgress) -> Unit = { p -> withContext(uiDispatcher) { onUiProgress(p) } }
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
                copyOf = { context.getString(R.string.note_duplicate_of, it) },
            )
            val fs = FileScanner(storageRoot(), strings = strings, findDuplicates = Category.DUPLICATE_FILES in enabled)
            out += fs.scan(
                onProgress = { onProgress(ScanProgress.Files(it)) },
                onHashing = { done, total -> onProgress(ScanProgress.FileHashing(done, total)) },
            )
            visited = fs.visited
            onProgress(ScanProgress.Files(visited))
        }
        val usage = usageAccess(context)
        if (usage && Category.UNUSED_APPS in enabled) {
            onProgress(ScanProgress.Apps)
            out += AppScanner(context).scan()
        }
        // Seguridad: no necesita permisos especiales (la app ya declara QUERY_ALL_PACKAGES).
        val vt = if (Category.SUSPICIOUS_APPS in enabled || Category.APK_FILES in enabled) virusTotal(context) else null
        if (Category.SUSPICIOUS_APPS in enabled) {
            onProgress(ScanProgress.Security)
            out += securityScan(context, vt) { onProgress(ScanProgress.Antivirus(it)) }
        }
        // Instaladores APK descargados: la vía habitual por la que llega el malware.
        if (vt != null && Category.APK_FILES in enabled) {
            for (i in out.indices) {
                val item = out[i]
                if (item.category != Category.APK_FILES || item.isDir || item.path == null) continue
                val v = vt.check(File(item.path)) ?: continue
                onProgress(ScanProgress.Antivirus(vt.checked))
                val malware = v is VtVerdict.Found && v.malicious > 0
                out[i] = item.copy(
                    note = listOfNotNull(SecurityScanner.verdictNote(context, v), item.note).joinToString(" · "),
                    risk = if (malware) 1000 + (v as VtVerdict.Found).malicious else 0,
                ).also { it.selected = item.selected || malware }
            }
        }
        ScanResult(
            out.filter { it.category in enabled }
                .sortedWith(compareBy<JunkItem> { it.category.ordinal }.thenByDescending { it.risk }.thenByDescending { it.size }),
            ScanScope(allFiles = allFiles, usage = usage, filesVisited = visited, vt = vt?.report() ?: VtReport()),
        )
    }
}
