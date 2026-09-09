package com.dgonzamat.limpiador

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.dgonzamat.limpiador.databinding.ActivityMainBinding
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var b: ActivityMainBinding
    private lateinit var adapter: JunkAdapter
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
                val removed = adapter.allItems().filter { it.file.uri in set }
                freedBytes += removed.sumOf { it.file.size }
                deletedCount += removed.size
                adapter.remove(set)
                launchNextBatch()
            } else {
                pendingBatches.clear()
                finishDeletion(cancelled = true)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityMainBinding.inflate(layoutInflater)
        setContentView(b.root)

        adapter = JunkAdapter(contentResolver, lifecycleScope) { updateSummary() }
        b.list.layoutManager = LinearLayoutManager(this)
        b.list.adapter = adapter

        b.scanButton.setOnClickListener { requestOrScan() }
        b.deleteButton.setOnClickListener { confirmDelete() }

        updateSummary()
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
        if (hasReadPermission()) startScan()
        else permissionLauncher.launch(requiredPermissions())
    }

    private fun showNoPermission() {
        b.status.text = getString(R.string.status_no_permission)
    }

    // ---- escaneo ----------------------------------------------------------

    private fun startScan() {
        scanJob?.cancel()
        b.progress.visibility = View.VISIBLE
        b.scanButton.isEnabled = false
        b.status.text = getString(R.string.status_scanning)
        adapter.submit(emptyList())
        scanJob = lifecycleScope.launch {
            try {
                val items = JunkScanner(contentResolver).scan { p ->
                    b.status.text = when {
                        p.startsWith("hash:") -> getString(R.string.status_hashing, p.removePrefix("hash:"))
                        else -> getString(R.string.status_found_files, p)
                    }
                }
                adapter.submit(items)
                b.status.text = if (items.isEmpty()) getString(R.string.status_clean)
                else getString(R.string.status_done, items.size, formatSize(items.sumOf { it.file.size }))
            } catch (e: Exception) {
                b.status.text = getString(R.string.status_error, e.message ?: e.javaClass.simpleName)
            } finally {
                b.progress.visibility = View.GONE
                b.scanButton.isEnabled = true
            }
        }
    }

    // ---- selección y borrado ----------------------------------------------

    private fun updateSummary() {
        val sel = adapter.selectedItems()
        val bytes = sel.sumOf { it.file.size }
        b.deleteButton.isEnabled = sel.isNotEmpty()
        b.deleteButton.text = if (sel.isEmpty()) getString(R.string.delete_none)
        else getString(R.string.delete_selected, sel.size, formatSize(bytes))
    }

    private fun confirmDelete() {
        val sel = adapter.selectedItems()
        if (sel.isEmpty()) return
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setTitle(R.string.confirm_title)
            .setMessage(getString(R.string.confirm_message, sel.size, formatSize(sel.sumOf { it.file.size })))
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
        b.deleteButton.isEnabled = false
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
            b.status.text = getString(R.string.status_error, e.message ?: e.javaClass.simpleName)
            updateSummary()
        }
    }

    private fun finishDeletion(cancelled: Boolean) {
        updateSummary()
        val msg = if (deletedCount > 0) getString(R.string.freed, deletedCount, formatSize(freedBytes))
        else if (cancelled) getString(R.string.delete_cancelled)
        else getString(R.string.delete_nothing)
        Snackbar.make(b.root, msg, Snackbar.LENGTH_LONG).show()
        if (deletedCount > 0) b.status.text = msg
    }
}
