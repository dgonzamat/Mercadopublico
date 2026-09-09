package com.dgonzamat.limpiador

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.dgonzamat.limpiador.databinding.ItemGridPhotoBinding

class GridAdapter(
    private val items: List<JunkItem>,
    private val thumbs: Thumbnails,
    private val onToggle: () -> Unit,
    private val onOpen: (JunkItem) -> Unit,
) : RecyclerView.Adapter<GridAdapter.VH>() {

    override fun getItemCount() = items.size

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemGridPhotoBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])

    inner class VH(private val b: ItemGridPhotoBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(item: JunkItem) {
            thumbs.load(item, b.thumb)
            val ctx = b.root.context
            b.label.text = when (item.kind) {
                Kind.MEDIA -> when (item.category) {
                    Category.DUPLICATES -> ctx.getString(R.string.note_duplicate_of, item.note)
                    Category.TINY -> item.note?.let { "$it · ${formatSize(item.size)}" } ?: formatSize(item.size)
                    else -> formatSize(item.size)
                }
                Kind.FILE, Kind.APP -> {
                    val second = listOfNotNull(if (item.size == 0L && item.note != null) null else formatSize(item.size), item.note).joinToString(" · ")
                    "${item.name}\n$second"
                }
            }
            render(item)
            b.card.setOnClickListener {
                item.selected = !item.selected
                render(item)
                onToggle()
            }
            b.card.setOnLongClickListener { onOpen(item); true }
        }

        private fun render(item: JunkItem) {
            b.card.isChecked = item.selected
            b.card.strokeWidth = if (item.selected) dp(3) else 0
            b.thumb.alpha = if (item.selected) 1f else 0.55f
        }

        private fun dp(v: Int) = (v * b.root.resources.displayMetrics.density).toInt()
    }
}
