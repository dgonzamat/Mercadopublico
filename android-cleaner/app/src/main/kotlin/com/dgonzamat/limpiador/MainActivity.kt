package com.dgonzamat.limpiador

import android.Manifest
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.StatFs
import android.os.storage.StorageManager
import android.provider.MediaStore
import android.provider.Settings
import android.view.View
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.lifecycle.lifecycleScope
import com.dgonzamat.limpiador.databinding.ActivityMainBinding
import com.dgonzamat.limpiador.databinding.ItemCategoryCardBinding
import com.dgonzamat.limpiador.databinding.ItemToolCardBinding
import com.dgonzamat.limpiador.databinding.ItemWelcomeRowBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class MainActivity : AppCompatActivity() {

    private enum class Screen { WELCOME, SCANNING, RESULTS, DONE }

    private lateinit var b: ActivityMainBinding
    private var screen = Screen.WELCOME
    private var scanJob: Job? = null

    /** Ya se ofreció «todos los archivos»; no volver a insistir en esta sesión. */
    private var allFilesOffered = false
    private var returningFromSettings = false
    /** El usuario fue a Ajustes a activar «todos los archivos»: al volver, avisar si no quedó activo. */
    private var wentForAllFiles = false

    // ---- limpieza en curso ----
    private val pendingMedia = ArrayDeque<List<JunkItem>>()
    private val pendingApps = ArrayDeque<JunkItem>()
    private var freedBytes = 0L
    private var deletedCount = 0

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            if (hasReadPermission()) startScan() else showNoPermission()
        }

    private val deleteLauncher =
        registerForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
            val batch = pendingMedia.removeFirstOrNull() ?: return@registerForActivityResult
            if (result.resultCode == Activity.RESULT_OK) {
                freedBytes += batch.sumOf { it.size }
                deletedCount += batch.size
                ScanStore.remove(batch)
                continueDeletion()
            } else {
                pendingMedia.clear()
                pendingApps.clear()
                finishDeletion(cancelled = true)
            }
        }

    private val uninstallLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
            val app = pendingApps.removeFirstOrNull() ?: return@registerForActivityResult
            val gone = try { packageManager.getApplicationInfo(app.packageName!!, 0); false } catch (e: PackageManager.NameNotFoundException) { true }
            if (gone) {
                freedBytes += app.size
                deletedCount += 1
                ScanStore.remove(listOf(app))
            }
            continueDeletion()
        }

    private val cacheLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val msg = if (result.resultCode == Activity.RESULT_OK) R.string.cache_cleared else R.string.cache_not_cleared
            Snackbar.make(b.root, msg, Snackbar.LENGTH_LONG).show()
            refreshStorage()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        b = ActivityMainBinding.inflate(layoutInflater)
        setContentView(b.root)
        applyInsets()

        b.primaryButton.setOnClickListener { onPrimaryAction() }
        b.rescanButton.setOnClickListener { requestOrScan() }
        b.cancelScanButton.setOnClickListener { cancelScan() }
        b.appTitle.setOnLongClickListener { showDiagnostics(); true }
        renderWelcomeGroups()

        if (ScanStore.items.isNotEmpty()) show(Screen.RESULTS) else show(Screen.WELCOME)
    }

    override fun onResume() {
        super.onResume()
        refreshStorage()
        if (returningFromSettings) {
            returningFromSettings = false
            if (wentForAllFiles && !ScanEngine.allFilesAccess(this)) {
                wentForAllFiles = false
                Snackbar.make(b.root, R.string.allfiles_not_granted, Snackbar.LENGTH_LONG)
                    .setAction(R.string.retry) { openAllFilesSettings(generalList = true) }
                    .show()
            }
            wentForAllFiles = false
            requestOrScan()
        } else if (screen == Screen.RESULTS) {
            renderResults()
        }
    }

    private fun applyInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(b.root) { _, insets ->
            val sys = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            b.appTitle.updatePadding(top = sys.top)
            b.bottomBar.updatePadding(bottom = sys.bottom + dp(16))
            insets
        }
    }

    // ---- pantallas -------------------------------------------------------

    private fun show(s: Screen) {
        screen = s
        b.welcomeGroup.visibility = if (s == Screen.WELCOME) View.VISIBLE else View.GONE
        b.scanningGroup.visibility = if (s == Screen.SCANNING) View.VISIBLE else View.GONE
        b.resultsGroup.visibility = if (s == Screen.RESULTS) View.VISIBLE else View.GONE
        b.doneGroup.visibility = if (s == Screen.DONE) View.VISIBLE else View.GONE
        b.bottomBar.visibility = if (s == Screen.SCANNING) View.INVISIBLE else View.VISIBLE
        b.root.requestLayout()
        when (s) {
            Screen.WELCOME -> {
                b.primaryButton.setIconResource(R.drawable.ic_search)
                updateWelcomeButton()
            }
            Screen.RESULTS -> {
                b.primaryButton.setIconResource(R.drawable.ic_delete)
                renderResults()
            }
            Screen.DONE -> {
                b.primaryButton.isEnabled = true
                b.primaryButton.text = getString(R.string.scan_again)
                b.primaryButton.setIconResource(R.drawable.ic_refresh)
            }
            Screen.SCANNING -> Unit
        }
    }

    // ---- qué buscar (casillas del inicio, se recuerdan) ----

    private val prefs by lazy { getSharedPreferences("limpiador", MODE_PRIVATE) }

    private fun enabledCategories(): Set<Category> =
        Category.entries.filter { prefs.getBoolean("scan_" + it.name, true) }.toSet()

    private fun setEnabled(cat: Category, enabled: Boolean) {
        prefs.edit().putBoolean("scan_" + cat.name, enabled).apply()
    }

    /** Lista de lo que se va a buscar, con casilla por grupo. */
    private fun renderWelcomeGroups() {
        b.welcomeGroups.removeAllViews()
        val enabled = enabledCategories()
        for (cat in Category.entries) {
            val row = ItemWelcomeRowBinding.inflate(layoutInflater, b.welcomeGroups, false)
            row.icon.setImageResource(cat.iconRes)
            row.title.text = getString(cat.titleRes)
            row.tag.text = getString(if (cat.preselected) R.string.welcome_tag_auto else R.string.welcome_tag_review)
            row.check.isChecked = cat in enabled
            row.row.setOnClickListener {
                row.check.isChecked = !row.check.isChecked
                setEnabled(cat, row.check.isChecked)
                updateWelcomeButton()
            }
            b.welcomeGroups.addView(row.root)
        }
        updateWelcomeButton()
    }

    private fun updateWelcomeButton() {
        if (screen != Screen.WELCOME) return
        val any = enabledCategories().isNotEmpty()
        b.primaryButton.isEnabled = any
        b.primaryButton.text = getString(if (any) R.string.analyze else R.string.analyze_none)
    }

    /** Estado interno para depurar a distancia: mantener presionado el título. */
    private fun showDiagnostics() {
        val pkg = packageManager.getPackageInfo(packageName, 0)
        fun v(view: View, name: String) = "$name: vis=${view.visibility} ${view.width}x${view.height}"
        val text = buildString {
            appendLine("Limpiador ${pkg.versionName} (${pkg.longVersionCode}) · Android ${Build.VERSION.RELEASE} · ${Build.MANUFACTURER} ${Build.MODEL}")
            appendLine("pantalla=$screen elementos=${ScanStore.items.size} seleccionados=${ScanStore.selected().size}")
            appendLine("alcance=${ScanStore.scope} todosLosArchivos=${ScanEngine.allFilesAccess(this@MainActivity)} datosDeUso=${ScanEngine.usageAccess(this@MainActivity)}")
            appendLine("grupos=" + ScanStore.items.groupingBy { it.category }.eachCount())
            appendLine(v(b.welcomeGroup, "inicio")); appendLine(v(b.scanningGroup, "analizando"))
            appendLine(v(b.resultsGroup, "resultados")); appendLine(v(b.categoryContainer, "tarjetas"))
            appendLine(v(b.doneGroup, "listo")); appendLine(v(b.bottomBar, "barra"))
            appendLine("scroll=${b.scroll.scrollY} contenido=${b.scroll.getChildAt(0)?.height}")
        }
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.diagnostics_title)
            .setMessage(text)
            .setPositiveButton(R.string.copy) { _, _ ->
                val cm = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
                cm.setPrimaryClip(android.content.ClipData.newPlainText("limpiador", text))
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun onPrimaryAction() {
        when (screen) {
            Screen.WELCOME, Screen.DONE -> requestOrScan()
            Screen.RESULTS -> confirmClean()
            Screen.SCANNING -> Unit
        }
    }

    private fun refreshStorage() {
        try {
            val stat = StatFs(Environment.getDataDirectory().absolutePath)
            val total = stat.totalBytes
            val free = stat.availableBytes
            if (total <= 0) { b.storageCard.visibility = View.GONE; return }
            b.storageCard.visibility = View.VISIBLE
            val used = total - free
            val pct = (used * 100 / total).toInt()
            b.storageRing.setProgressCompat(pct, true)
            b.storagePercent.text = getString(R.string.percent, pct)
            b.storageUsed.text = getString(R.string.storage_used, formatSize(used), formatSize(total))
            b.storageFree.text = getString(R.string.storage_free, formatSize(free))
        } catch (e: Exception) {
            b.storageCard.visibility = View.GONE
        }
    }

    // ---- permisos ---------------------------------------------------------

    private fun requiredPermissions(): Array<String> =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO)
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }

    private fun hasReadPermission(): Boolean {
        if (ScanEngine.allFilesAccess(this)) return true
        val full = requiredPermissions().all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
        if (full) return true
        // Android 14+: acceso parcial (el usuario eligió algunas fotos).
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) ==
            PackageManager.PERMISSION_GRANTED
    }

    private fun requestOrScan() {
        if (!ScanEngine.allFilesAccess(this) && !allFilesOffered) {
            allFilesOffered = true
            offerAllFilesAccess()
            return
        }
        if (hasReadPermission()) startScan() else permissionLauncher.launch(requiredPermissions())
    }

    /** Explica el permiso «todos los archivos» y deja elegir solo la galería. */
    private fun offerAllFilesAccess() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.allfiles_title)
            .setMessage(R.string.allfiles_message)
            .setNegativeButton(R.string.allfiles_only_gallery) { _, _ -> requestOrScan() }
            .setPositiveButton(R.string.allfiles_open_settings) { _, _ -> openAllFilesSettings() }
            .show()
    }

    /**
     * Abre el ajuste «Acceso a todos los archivos». Primero la pantalla de esta app;
     * con [generalList] (o si esa no existe) la lista general, que en algunos
     * fabricantes es la única que muestra el interruptor.
     */
    private fun openAllFilesSettings(generalList: Boolean = false) {
        returningFromSettings = true
        wentForAllFiles = true
        val specific = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:$packageName"))
        val general = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
        for (intent in if (generalList) listOf(general, specific) else listOf(specific, general)) {
            try {
                startActivity(intent)
                return
            } catch (e: ActivityNotFoundException) {
                // probar la siguiente
            }
        }
        returningFromSettings = false
        wentForAllFiles = false
        Snackbar.make(b.root, R.string.open_failed, Snackbar.LENGTH_LONG).show()
    }

    private fun openUsageAccessSettings() {
        returningFromSettings = true
        try {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        } catch (e: ActivityNotFoundException) {
            returningFromSettings = false
            Snackbar.make(b.root, R.string.open_failed, Snackbar.LENGTH_LONG).show()
        }
    }

    private fun clearAllAppsCache() {
        try {
            cacheLauncher.launch(Intent(StorageManager.ACTION_CLEAR_APP_CACHE))
        } catch (e: Exception) {
            // Algunos fabricantes no exponen el diálogo: llevar a Ajustes › Almacenamiento.
            try {
                startActivity(Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS))
            } catch (e2: Exception) {
                Snackbar.make(b.root, R.string.cache_not_available, Snackbar.LENGTH_LONG).show()
            }
        }
    }

    private fun showNoPermission() {
        show(Screen.WELCOME)
        b.permissionHint.text = getString(R.string.status_no_permission)
        b.permissionHint.visibility = View.VISIBLE
    }

    // ---- escaneo ----------------------------------------------------------

    private fun cancelScan() {
        scanJob?.cancel()
        scanJob = null
        show(if (ScanStore.items.isNotEmpty()) Screen.RESULTS else Screen.WELCOME)
    }

    private fun startScan() {
        scanJob?.cancel()
        b.permissionHint.visibility = View.GONE
        ScanStore.items = emptyList()
        show(Screen.SCANNING)
        b.scanStatus.text = getString(R.string.scanning_reading)
        scanJob = lifecycleScope.launch {
            try {
                val result = ScanEngine.scan(this@MainActivity, enabledCategories()) { p ->
                    b.scanStatus.text = when (p) {
                        ScanProgress.Reading -> getString(R.string.scanning_reading)
                        is ScanProgress.Found -> resources.getQuantityString(R.plurals.scanning_found, p.total, p.total)
                        is ScanProgress.Hashing -> getString(R.string.scanning_hashing, p.done, p.total)
                        is ScanProgress.Files ->
                            if (p.visited == 0) getString(R.string.scanning_files)
                            else resources.getQuantityString(R.plurals.scanning_files_count, p.visited, p.visited)
                        ScanProgress.Apps -> getString(R.string.scanning_apps)
                    }
                }
                ScanStore.items = result.items
                ScanStore.scope = result.scope
                show(Screen.RESULTS)
            } catch (e: CancellationException) {
                throw e // un nuevo análisis reemplazó a este: no es un error
            } catch (e: Exception) {
                show(Screen.WELCOME)
                Snackbar.make(b.root, getString(R.string.status_error, e.message ?: e.javaClass.simpleName), Snackbar.LENGTH_LONG).show()
            }
        }
    }

    // ---- resultados -------------------------------------------------------

    private fun renderResults() {
        try {
            renderResultsUnsafe()
        } catch (e: Exception) {
            // Mejor una lista incompleta con aviso que una app cerrada.
            Snackbar.make(b.root, getString(R.string.status_error, e.message ?: e.javaClass.simpleName), Snackbar.LENGTH_LONG).show()
        }
    }

    private fun renderResultsUnsafe() {
        val all = ScanStore.items
        val scope = ScanStore.scope
        b.categoryContainer.removeAllViews()
        val scopeText = when {
            scope.allFiles && scope.usage -> getString(R.string.scope_full, scope.filesVisited)
            scope.allFiles -> getString(R.string.scope_files, scope.filesVisited)
            else -> getString(R.string.scope_gallery)
        }
        if (all.isEmpty()) {
            b.resultsTitle.text = getString(R.string.results_clean_title)
            b.resultsSubtitle.text = getString(R.string.results_clean_subtitle) + " " + scopeText
        } else {
            b.resultsTitle.text = getString(R.string.results_title, formatSize(all.sumOf { it.size }))
            b.resultsSubtitle.text = resources.getQuantityString(R.plurals.results_subtitle, all.size, all.size) + " " + scopeText
        }
        // Aviso destacado: sin «todos los archivos» solo se revisó la galería (si pidió grupos de archivos).
        val wantsFiles = enabledCategories().any { it in ScanEngine.FILE_CATEGORIES }
        b.scopeBanner.visibility = if (scope.allFiles || !wantsFiles) View.GONE else View.VISIBLE
        b.scopeBannerButton.setOnClickListener { openAllFilesSettings() }
        for (cat in Category.entries) {
            val group = ScanStore.byCategory(cat)
            if (group.isEmpty()) continue
            val card = ItemCategoryCardBinding.inflate(layoutInflater, b.categoryContainer, false)
            card.icon.setImageResource(cat.iconRes)
            card.title.text = getString(cat.titleRes)
            card.description.text = getString(cat.descRes)
            bindCardStats(card, group)
            card.toggle.setOnCheckedChangeListener(null)
            card.toggle.isChecked = group.any { it.selected }
            card.toggle.setOnCheckedChangeListener { _, checked ->
                group.forEach { it.selected = checked }
                bindCardStats(card, group)
                updatePrimaryForSelection()
            }
            card.card.setOnClickListener {
                startActivity(Intent(this, CategoryActivity::class.java).putExtra(CategoryActivity.EXTRA_CATEGORY, cat.ordinal))
            }
            b.categoryContainer.addView(card.root)
        }
        renderTools()
        updatePrimaryForSelection()
    }

    /** Herramientas que no son listas: caché del sistema y permisos que amplían el análisis. */
    private fun renderTools() {
        b.toolsContainer.removeAllViews()
        fun tool(icon: Int, title: Int, desc: Int, button: Int, action: () -> Unit) {
            val t = ItemToolCardBinding.inflate(layoutInflater, b.toolsContainer, false)
            t.icon.setImageResource(icon)
            t.title.text = getString(title)
            t.description.text = getString(desc)
            t.button.text = getString(button)
            t.button.setOnClickListener { action() }
            b.toolsContainer.addView(t.root)
        }
        if (ScanEngine.allFilesAccess(this)) {
            tool(R.drawable.ic_memory, R.string.tool_cache_title, R.string.tool_cache_desc, R.string.tool_cache_button) { clearAllAppsCache() }
        }
        if (!ScanEngine.usageAccess(this)) {
            tool(R.drawable.ic_apps, R.string.tool_usage_title, R.string.tool_usage_desc, R.string.tool_enable) { openUsageAccessSettings() }
        }
        b.toolsTitle.visibility = if (b.toolsContainer.childCount > 0) View.VISIBLE else View.GONE
    }

    private fun bindCardStats(card: ItemCategoryCardBinding, group: List<JunkItem>) {
        val sel = group.filter { it.selected }
        val plural = if (group.first().kind == Kind.APP) R.plurals.category_stats_apps else R.plurals.category_stats
        card.stats.text = if (sel.size == group.size || sel.isEmpty()) {
            resources.getQuantityString(plural, group.size, group.size, formatSize(group.sumOf { it.size }))
        } else {
            getString(R.string.category_stats_partial, sel.size, group.size, formatSize(sel.sumOf { it.size }))
        }
    }

    private fun updatePrimaryForSelection() {
        val sel = ScanStore.selected()
        b.primaryButton.isEnabled = sel.isNotEmpty()
        b.primaryButton.text = if (sel.isEmpty()) getString(R.string.clean_none)
        else getString(R.string.clean_now, formatSize(sel.sumOf { it.size }))
    }

    // ---- limpieza ---------------------------------------------------------

    private fun confirmClean() {
        val sel = ScanStore.selected()
        if (sel.isEmpty()) return
        val size = formatSize(sel.sumOf { it.size })
        val apps = sel.count { it.kind == Kind.APP }
        // Detalle por grupo, para saber qué se va antes de aceptar.
        val detail = Category.entries.mapNotNull { cat ->
            val g = sel.filter { it.category == cat }
            if (g.isEmpty()) null else "• ${getString(cat.titleRes)}: ${g.size} · ${formatSize(g.sumOf { it.size })}"
        }.joinToString("\n")
        val message = resources.getQuantityString(R.plurals.confirm_message, sel.size, sel.size) + "\n\n" + detail +
            if (apps > 0) "\n\n" + resources.getQuantityString(R.plurals.confirm_apps, apps, apps) else ""
        MaterialAlertDialogBuilder(this)
            .setTitle(getString(R.string.confirm_title, size))
            .setMessage(message)
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(R.string.confirm_ok) { _, _ -> deleteSelected(sel) }
            .show()
    }

    private fun deleteSelected(sel: List<JunkItem>) {
        freedBytes = 0
        deletedCount = 0
        pendingMedia.clear()
        pendingApps.clear()
        // Lotes de 250 URIs: el intent del sistema tiene límite de tamaño.
        sel.filter { it.kind == Kind.MEDIA }.chunked(250).forEach { pendingMedia.addLast(it) }
        sel.filter { it.kind == Kind.APP }.forEach { pendingApps.addLast(it) }
        val files = sel.filter { it.kind == Kind.FILE }
        b.primaryButton.isEnabled = false
        lifecycleScope.launch {
            // 1. Archivos y carpetas: borrado directo, sin diálogo del sistema.
            val deleted = withContext(Dispatchers.IO) {
                files.filter { item ->
                    val f = File(item.path!!)
                    try { if (item.isDir) f.deleteRecursively() else f.delete() } catch (e: Exception) { false }
                }
            }
            freedBytes += deleted.sumOf { it.size }
            deletedCount += deleted.size
            ScanStore.remove(deleted)
            continueDeletion()
        }
    }

    /** 2. Galería (un diálogo del sistema por lote) → 3. Apps (un diálogo por app) → Listo. */
    private fun continueDeletion() {
        pendingMedia.firstOrNull()?.let { batch ->
            try {
                val pi = MediaStore.createDeleteRequest(contentResolver, batch.map { it.uri!! })
                deleteLauncher.launch(IntentSenderRequest.Builder(pi.intentSender).build())
            } catch (e: Exception) {
                pendingMedia.clear()
                pendingApps.clear()
                Snackbar.make(b.root, getString(R.string.status_error, e.message ?: e.javaClass.simpleName), Snackbar.LENGTH_LONG).show()
                finishDeletion(cancelled = true)
            }
            return
        }
        pendingApps.firstOrNull()?.let { app ->
            val intent = Intent(Intent.ACTION_DELETE, Uri.parse("package:${app.packageName}"))
                .putExtra(Intent.EXTRA_RETURN_RESULT, true)
            try {
                uninstallLauncher.launch(intent)
            } catch (e: Exception) {
                pendingApps.removeFirst()
                continueDeletion()
            }
            return
        }
        finishDeletion(cancelled = false)
    }

    private fun finishDeletion(cancelled: Boolean) {
        refreshStorage()
        if (deletedCount > 0) {
            b.doneTitle.text = getString(R.string.done_title, formatSize(freedBytes))
            b.doneSubtitle.text = resources.getQuantityString(R.plurals.done_subtitle, deletedCount, deletedCount)
            ScanStore.items = emptyList()
            show(Screen.DONE)
        } else {
            renderResults()
            if (cancelled) Snackbar.make(b.root, R.string.delete_cancelled, Snackbar.LENGTH_LONG).show()
        }
    }

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()
}
