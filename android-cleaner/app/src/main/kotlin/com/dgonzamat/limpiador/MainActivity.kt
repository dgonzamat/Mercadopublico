package com.dgonzamat.limpiador

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.StatFs
import android.provider.MediaStore
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
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private enum class Screen { WELCOME, SCANNING, RESULTS, DONE }

    private lateinit var b: ActivityMainBinding
    private var screen = Screen.WELCOME
    private var scanJob: Job? = null

    /** Lotes pendientes de borrado (el diálogo del sistema se lanza por lote). */
    private val pendingBatches = ArrayDeque<List<Uri>>()
    private var freedBytes = 0L
    private var deletedCount = 0

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            if (hasReadPermission()) startScan() else showNoPermission()
        }

    private val deleteLauncher =
        registerForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
            val batch = pendingBatches.removeFirstOrNull() ?: return@registerForActivityResult
            if (result.resultCode == Activity.RESULT_OK) {
                val set = batch.toSet()
                val removed = ScanStore.items.filter { it.file.uri in set }
                freedBytes += removed.sumOf { it.file.size }
                deletedCount += removed.size
                ScanStore.remove(set)
                launchNextBatch()
            } else {
                pendingBatches.clear()
                finishDeletion(cancelled = true)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        b = ActivityMainBinding.inflate(layoutInflater)
        setContentView(b.root)
        applyInsets()

        b.primaryButton.setOnClickListener { onPrimaryAction() }
        b.rescanButton.setOnClickListener { requestOrScan() }

        if (ScanStore.items.isNotEmpty()) show(Screen.RESULTS) else show(Screen.WELCOME)
    }

    override fun onResume() {
        super.onResume()
        refreshStorage()
        if (screen == Screen.RESULTS) renderResults()
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
        when (s) {
            Screen.WELCOME -> {
                b.primaryButton.isEnabled = true
                b.primaryButton.text = getString(R.string.analyze)
                b.primaryButton.setIconResource(R.drawable.ic_search)
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
            b.storagePercent.text = "$pct%"
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
        if (hasReadPermission()) startScan() else permissionLauncher.launch(requiredPermissions())
    }

    private fun showNoPermission() {
        show(Screen.WELCOME)
        b.permissionHint.text = getString(R.string.status_no_permission)
        b.permissionHint.visibility = View.VISIBLE
    }

    // ---- escaneo ----------------------------------------------------------

    private fun startScan() {
        scanJob?.cancel()
        b.permissionHint.visibility = View.GONE
        ScanStore.items = emptyList()
        show(Screen.SCANNING)
        b.scanStatus.text = getString(R.string.scanning_reading)
        scanJob = lifecycleScope.launch {
            try {
                val items = JunkScanner(contentResolver).scan { p ->
                    b.scanStatus.text = when (p) {
                        ScanProgress.Reading -> getString(R.string.scanning_reading)
                        is ScanProgress.Found -> resources.getQuantityString(R.plurals.scanning_found, p.total, p.total)
                        is ScanProgress.Hashing -> getString(R.string.scanning_hashing, p.done, p.total)
                    }
                }
                ScanStore.items = items
                show(Screen.RESULTS)
            } catch (e: Exception) {
                show(Screen.WELCOME)
                Snackbar.make(b.root, getString(R.string.status_error, e.message ?: e.javaClass.simpleName), Snackbar.LENGTH_LONG).show()
            }
        }
    }

    // ---- resultados -------------------------------------------------------

    private fun renderResults() {
        val all = ScanStore.items
        b.categoryContainer.removeAllViews()
        if (all.isEmpty()) {
            b.resultsTitle.text = getString(R.string.results_clean_title)
            b.resultsSubtitle.text = getString(R.string.results_clean_subtitle)
            updatePrimaryForSelection()
            return
        }
        b.resultsTitle.text = getString(R.string.results_title, formatSize(all.sumOf { it.file.size }))
        b.resultsSubtitle.text = resources.getQuantityString(R.plurals.results_subtitle, all.size, all.size)
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
        updatePrimaryForSelection()
    }

    private fun bindCardStats(card: ItemCategoryCardBinding, group: List<JunkItem>) {
        val sel = group.filter { it.selected }
        card.stats.text = if (sel.size == group.size || sel.isEmpty()) {
            resources.getQuantityString(R.plurals.category_stats, group.size, group.size, formatSize(group.sumOf { it.file.size }))
        } else {
            getString(R.string.category_stats_partial, sel.size, group.size, formatSize(sel.sumOf { it.file.size }))
        }
    }

    private fun updatePrimaryForSelection() {
        val sel = ScanStore.selected()
        b.primaryButton.isEnabled = sel.isNotEmpty()
        b.primaryButton.text = if (sel.isEmpty()) getString(R.string.clean_none)
        else getString(R.string.clean_now, formatSize(sel.sumOf { it.file.size }))
    }

    // ---- limpieza ---------------------------------------------------------

    private fun confirmClean() {
        val sel = ScanStore.selected()
        if (sel.isEmpty()) return
        val size = formatSize(sel.sumOf { it.file.size })
        MaterialAlertDialogBuilder(this)
            .setTitle(getString(R.string.confirm_title, size))
            .setMessage(resources.getQuantityString(R.plurals.confirm_message, sel.size, sel.size))
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(R.string.confirm_ok) { _, _ -> deleteSelected(sel) }
            .show()
    }

    private fun deleteSelected(sel: List<JunkItem>) {
        freedBytes = 0
        deletedCount = 0
        pendingBatches.clear()
        // Lotes de 250 URIs: el intent del sistema tiene límite de tamaño.
        sel.map { it.file.uri }.chunked(250).forEach { pendingBatches.addLast(it) }
        b.primaryButton.isEnabled = false
        launchNextBatch()
    }

    private fun launchNextBatch() {
        val batch = pendingBatches.firstOrNull()
        if (batch == null) {
            finishDeletion(cancelled = false)
            return
        }
        try {
            val pi = MediaStore.createDeleteRequest(contentResolver, batch)
            deleteLauncher.launch(IntentSenderRequest.Builder(pi.intentSender).build())
        } catch (e: Exception) {
            pendingBatches.clear()
            Snackbar.make(b.root, getString(R.string.status_error, e.message ?: e.javaClass.simpleName), Snackbar.LENGTH_LONG).show()
            renderResults()
        }
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
