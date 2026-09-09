package com.dgonzamat.limpiador

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import com.dgonzamat.limpiador.databinding.ActivityCategoryBinding

/** Revisión de una categoría: cuadrícula de miniaturas con selección. */
class CategoryActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_CATEGORY = "category"
    }

    private lateinit var b: ActivityCategoryBinding
    private lateinit var items: List<JunkItem>
    private lateinit var adapter: GridAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val category = Category.entries.getOrNull(intent.getIntExtra(EXTRA_CATEGORY, -1))
        items = category?.let { ScanStore.byCategory(it) } ?: emptyList()
        if (category == null || items.isEmpty()) {
            // El proceso se reinició y el escaneo se perdió: volver al inicio.
            finish()
            return
        }

        b = ActivityCategoryBinding.inflate(layoutInflater)
        setContentView(b.root)

        b.toolbar.title = getString(category.titleRes)
        b.toolbar.setNavigationOnClickListener { finish() }

        adapter = GridAdapter(items, Thumbnails(contentResolver, lifecycleScope), ::updateSummary, ::open)
        b.grid.layoutManager = GridLayoutManager(this, 3)
        b.grid.adapter = adapter

        b.selectAllButton.setOnClickListener {
            val target = items.any { !it.selected }
            items.forEach { it.selected = target }
            adapter.notifyDataSetChanged()
            updateSummary()
        }
        b.doneButton.setOnClickListener { finish() }
        updateSummary()
    }

    private fun updateSummary() {
        val sel = items.filter { it.selected }
        b.selectionSummary.text = getString(
            R.string.selection_summary, sel.size, items.size, formatSize(sel.sumOf { it.file.size }),
        )
        b.selectAllButton.text = getString(if (sel.size == items.size) R.string.select_none else R.string.select_all)
    }

    private fun open(item: JunkItem) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(item.file.uri, if (item.file.isVideo) "video/*" else "image/*")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        try {
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, R.string.open_failed, Toast.LENGTH_SHORT).show()
        }
    }
}
