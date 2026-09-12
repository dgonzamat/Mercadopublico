package com.dgonzamat.limpiador

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.dgonzamat.limpiador.databinding.ItemGridPhotoBinding
import com.dgonzamat.limpiador.databinding.ItemListRowBinding
import java.io.File

/**
 * Lista de una categoría: fotos y videos en cuadrícula de miniaturas; archivos y
 * apps en filas (nombre, tamaño, motivo y carpeta legibles, sin truncar).
 */
class GridAdapter(
    private val items: List<JunkItem>,
    private val thumbs: Thumbnails,
    private val onToggle: () -> Unit,
    private val onOpen: (JunkItem) -> Unit,
) : RecyclerView.Adapter<GridAdapter.VH>() {

    companion object {
        const val TYPE_PHOTO = 0
        const val TYPE_ROW = 1

        /** Columnas que usa la cuadrícula para este tipo de elementos. */
        fun spanCount(kind: Kind) = if (kind == Kind.MEDIA) 3 else 1
    }

    override fun getItemCount() = items.size

    override fun getItemViewType(position: Int) =
        if (items[position].kind == Kind.MEDIA) TYPE_PHOTO else TYPE_ROW

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == TYPE_PHOTO) PhotoVH(ItemGridPhotoBinding.inflate(inflater, parent, false))
        else RowVH(ItemListRowBinding.inflate(inflater, parent, false))
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])

    abstract inner class VH(root: View) : RecyclerView.ViewHolder(root) {
        abstract fun bind(item: JunkItem)

        protected fun wire(card: com.google.android.material.card.MaterialCardView, item: JunkItem, render: () -> Unit) {
            card.contentDescription = item.name
            card.setOnClickListener {
                item.selected = !item.selected
                render()
                onToggle()
            }
            card.setOnLongClickListener { onOpen(item); true }
        }

        protected fun dp(v: Int) = (v * itemView.resources.displayMetrics.density).toInt()
    }

    /** Celda cuadrada con miniatura (galería). */
    inner class PhotoVH(private val b: ItemGridPhotoBinding) : VH(b.root) {
        override fun bind(item: JunkItem) {
            thumbs.load(item, b.thumb)
            val ctx = b.root.context
            b.label.text = when (item.category) {
                Category.DUPLICATES -> ctx.getString(R.string.note_duplicate_of, item.note)
                Category.SIMILAR -> ctx.getString(R.string.note_similar_to, item.note)
                Category.TINY -> item.note?.let { "$it · ${formatSize(item.size)}" } ?: formatSize(item.size)
                else -> formatSize(item.size)
            }
            render(item)
            wire(b.card, item) { render(item) }
        }

        private fun render(item: JunkItem) {
            b.card.isChecked = item.selected
            b.card.strokeWidth = if (item.selected) dp(3) else 0
            b.thumb.alpha = if (item.selected) 1f else 0.55f
        }
    }

    /** Fila con nombre, tamaño · motivo y carpeta (archivos y apps). */
    inner class RowVH(private val b: ItemListRowBinding) : VH(b.root) {
        override fun bind(item: JunkItem) {
            thumbs.load(item, b.thumb)
            b.name.text = item.name
            b.label.text = listOfNotNull(
                if (item.size == 0L && item.note != null) null else formatSize(item.size),
                item.note,
            ).joinToString(" · ")
            val folder = item.path?.let { folderOf(it) }
            b.path.visibility = if (folder == null) View.GONE else View.VISIBLE
            b.path.text = folder
            render(item)
            wire(b.card, item) { render(item) }
        }

        private fun render(item: JunkItem) {
            b.card.isChecked = item.selected
            b.check.isChecked = item.selected
            b.card.strokeWidth = if (item.selected) dp(2) else 0
            b.thumb.alpha = if (item.selected) 1f else 0.55f
        }

        /** Carpeta relativa al almacenamiento («Download/viejo»); la raíz se nombra. */
        private fun folderOf(path: String): String {
            val root = ScanEngine.storageRoot().absolutePath
            val parent = File(path).parent ?: return ""
            val rel = if (parent.startsWith(root)) parent.removePrefix(root).trimStart('/') else parent
            return rel.ifEmpty { b.root.context.getString(R.string.root_folder) }
        }
    }
}
