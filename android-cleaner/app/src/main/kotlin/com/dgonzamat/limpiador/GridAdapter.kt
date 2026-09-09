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
            val f = item.file
            thumbs.load(f.uri, b.thumb, if (f.isVideo) R.drawable.ic_video else R.drawable.ic_image)
            b.label.text = when (item.category) {
                Category.DUPLICATES -> b.root.context.getString(R.string.note_duplicate_of, item.note)
                Category.TINY -> item.note?.let { "$it · ${formatSize(f.size)}" } ?: formatSize(f.size)
                else -> formatSize(f.size)
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
