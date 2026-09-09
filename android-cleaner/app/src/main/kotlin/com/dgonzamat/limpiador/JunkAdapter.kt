package com.dgonzamat.limpiador

import android.content.ContentResolver
import android.graphics.Bitmap
import android.net.Uri
import android.util.LruCache
import android.util.Size
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.dgonzamat.limpiador.databinding.ItemFileBinding
import com.dgonzamat.limpiador.databinding.ItemHeaderBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Lista plana: cabecera por categoría + archivos. */
sealed class Row {
    data class Header(val category: Category, val items: List<JunkItem>) : Row()
    data class File(val item: JunkItem) : Row()
}

class JunkAdapter(
    private val resolver: ContentResolver,
    private val scope: CoroutineScope,
    private val onSelectionChanged: () -> Unit,
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private var rows: List<Row> = emptyList()
    private var items: List<JunkItem> = emptyList()

    private val thumbs = object : LruCache<Uri, Bitmap>(32 * 1024 * 1024) {
        override fun sizeOf(key: Uri, value: Bitmap) = value.byteCount
    }

    fun submit(newItems: List<JunkItem>) {
        items = newItems
        rebuild()
    }

    fun allItems(): List<JunkItem> = items
    fun selectedItems(): List<JunkItem> = items.filter { it.selected }

    fun remove(deleted: Set<Uri>) {
        items = items.filter { it.file.uri !in deleted }
        rebuild()
    }

    private fun rebuild() {
        val out = mutableListOf<Row>()
        for (cat in Category.entries) {
            val group = items.filter { it.category == cat }
            if (group.isEmpty()) continue
            out += Row.Header(cat, group)
            group.forEach { out += Row.File(it) }
        }
        rows = out
        notifyDataSetChanged()
        onSelectionChanged()
    }

    override fun getItemCount() = rows.size
    override fun getItemViewType(position: Int) = if (rows[position] is Row.Header) 0 else 1

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inf = LayoutInflater.from(parent.context)
        return if (viewType == 0) HeaderVH(ItemHeaderBinding.inflate(inf, parent, false))
        else FileVH(ItemFileBinding.inflate(inf, parent, false))
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (val row = rows[position]) {
            is Row.Header -> (holder as HeaderVH).bind(row)
            is Row.File -> (holder as FileVH).bind(row.item)
        }
    }

    inner class HeaderVH(private val b: ItemHeaderBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(row: Row.Header) {
            val ctx = b.root.context
            val total = row.items.sumOf { it.file.size }
            b.title.text = ctx.getString(row.category.titleRes)
            b.subtitle.text = ctx.getString(R.string.header_subtitle, row.items.size, formatSize(total)) +
                "\n" + ctx.getString(row.category.descRes)
            b.checkAll.setOnCheckedChangeListener(null)
            b.checkAll.isChecked = row.items.all { it.selected }
            b.checkAll.setOnCheckedChangeListener { _, checked ->
                row.items.forEach { it.selected = checked }
                val start = bindingAdapterPosition + 1
                notifyItemRangeChanged(start, row.items.size)
                onSelectionChanged()
            }
        }
    }

    inner class FileVH(private val b: ItemFileBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(item: JunkItem) {
            val f = item.file
            b.name.text = f.name
            val meta = buildString {
                append(formatSize(f.size))
                if (f.relativePath.isNotEmpty()) append(" · ").append(f.relativePath.trimEnd('/'))
            }
            b.meta.text = meta
            b.note.text = when (item.category) {
                Category.DUPLICATES -> b.root.context.getString(R.string.note_duplicate_of, item.note)
                else -> item.note ?: ""
            }
            b.note.visibility = if (b.note.text.isNullOrEmpty()) android.view.View.GONE else android.view.View.VISIBLE
            b.check.setOnCheckedChangeListener(null)
            b.check.isChecked = item.selected
            b.check.setOnCheckedChangeListener { _, checked ->
                item.selected = checked
                onSelectionChanged()
                // Refresca la cabecera de su categoría (checkbox "todos").
                val headerPos = (bindingAdapterPosition downTo 0).firstOrNull { rows[it] is Row.Header }
                if (headerPos != null) notifyItemChanged(headerPos)
            }
            b.root.setOnClickListener { b.check.toggle() }

            b.thumb.tag = f.uri
            val cached = thumbs.get(f.uri)
            if (cached != null) {
                b.thumb.setImageBitmap(cached)
            } else {
                b.thumb.setImageResource(if (f.isVideo) R.drawable.ic_video else R.drawable.ic_image)
                scope.launch {
                    val bmp = withContext(Dispatchers.IO) {
                        try {
                            resolver.loadThumbnail(f.uri, Size(128, 128), null)
                        } catch (e: Exception) {
                            null
                        }
                    }
                    if (bmp != null) {
                        thumbs.put(f.uri, bmp)
                        if (b.thumb.tag == f.uri) b.thumb.setImageBitmap(bmp)
                    }
                }
            }
        }
    }
}
