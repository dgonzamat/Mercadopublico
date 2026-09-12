package com.dgonzamat.limpiador

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.dgonzamat.limpiador.databinding.ItemGridPhotoBinding
import com.dgonzamat.limpiador.databinding.ItemListRowBinding
import com.dgonzamat.limpiador.databinding.ItemPairRowBinding
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
        /** Repetidos y parecidas: el original que se conserva junto a la copia, para comparar a ojo. */
        const val TYPE_PAIR = 2

        val PAIR_CATEGORIES = setOf(Category.DUPLICATES, Category.SIMILAR, Category.DUPLICATE_FILES)

        fun viewType(item: JunkItem) = when {
            item.category in PAIR_CATEGORIES -> TYPE_PAIR
            item.kind == Kind.MEDIA -> TYPE_PHOTO
            else -> TYPE_ROW
        }

        /** Columnas que usa la cuadrícula para este tipo de elementos. */
        fun spanCount(item: JunkItem) = if (viewType(item) == TYPE_PHOTO) 3 else 1
    }

    override fun getItemCount() = items.size

    override fun getItemViewType(position: Int) = viewType(items[position])

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val inflater = LayoutInflater.from(parent.context)
        return when (viewType) {
            TYPE_PHOTO -> PhotoVH(ItemGridPhotoBinding.inflate(inflater, parent, false))
            TYPE_PAIR -> PairVH(ItemPairRowBinding.inflate(inflater, parent, false))
            else -> RowVH(ItemListRowBinding.inflate(inflater, parent, false))
        }
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

    }

    /** Original (se conserva) → copia (se marca), con la marca de doble verificación. */
    inner class PairVH(private val b: ItemPairRowBinding) : VH(b.root) {
        override fun bind(item: JunkItem) {
            val ctx = b.root.context
            thumbs.load(item, b.thumb)
            val original = JunkItem(item.category, item.note ?: "", item.size, uri = item.originalUri, path = item.originalPath, isVideo = item.isVideo)
            thumbs.load(original, b.originalThumb)
            b.name.text = item.name
            val similar = item.category == Category.SIMILAR
            b.verifiedBadge.text = ctx.getString(
                when {
                    similar -> R.string.badge_similar
                    item.verified -> R.string.badge_verified
                    else -> R.string.badge_hash_only
                },
            )
            b.verifiedBadge.setTextColor(androidx.core.content.ContextCompat.getColor(ctx, if (similar) R.color.danger else R.color.success))
            // La nota de galería trae solo el nombre del original; la de archivos ya viene con «Copia de».
            val note = item.note?.let { n ->
                when {
                    item.kind != Kind.MEDIA -> n
                    similar -> ctx.getString(R.string.note_similar_to, n)
                    else -> ctx.getString(R.string.note_duplicate_of, n)
                }
            }
            b.label.text = listOfNotNull(formatSize(item.size), note).joinToString(" · ")
            val folder = item.path?.let { p -> if (item.kind == Kind.FILE) folderOf(p) else p.trimEnd('/') }
            b.path.visibility = if (folder.isNullOrEmpty()) View.GONE else View.VISIBLE
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
    }

    /** Carpeta relativa al almacenamiento («Download/viejo»); la raíz se nombra. */
    private fun folderOf(path: String): String {
        val root = ScanEngine.storageRoot().absolutePath
        val parent = File(path).parent ?: return ""
        val rel = if (parent.startsWith(root)) parent.removePrefix(root).trimStart('/') else parent
        return rel.ifEmpty { thumbs.context.getString(R.string.root_folder) }
    }
}
