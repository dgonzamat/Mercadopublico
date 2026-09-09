package com.dgonzamat.limpiador

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.drawable.Drawable
import android.util.LruCache
import android.util.Size
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

/** Miniaturas por tipo de elemento (galería, archivo, app) con caché en memoria. */
class Thumbnails(private val context: Context, private val scope: CoroutineScope) {

    private val cache = object : LruCache<String, Bitmap>(48 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }
    private val drawables = HashMap<String, Drawable>()

    fun load(item: JunkItem, target: ImageView) {
        val key = item.uri?.toString() ?: item.packageName ?: item.path.orEmpty()
        target.tag = key
        fun full() { target.setPadding(0, 0, 0, 0); target.scaleType = ImageView.ScaleType.CENTER_CROP }
        fun inset(fraction: Float) {
            val p = (target.resources.displayMetrics.widthPixels / 3 * fraction).toInt()
            target.setPadding(p, p, p, p)
            target.scaleType = ImageView.ScaleType.FIT_CENTER
        }
        cache.get(key)?.let { full(); target.setImageBitmap(it); return }
        drawables[key]?.let { inset(0.2f); target.setImageDrawable(it); return }
        inset(0.3f)
        target.setImageResource(placeholder(item))
        scope.launch {
            val result = withContext(Dispatchers.IO) { try { render(item) } catch (e: Exception) { null } }
            if (target.tag != key) return@launch
            when (result) {
                is Bitmap -> { cache.put(key, result); full(); target.setImageBitmap(result) }
                is Drawable -> { drawables[key] = result; inset(0.2f); target.setImageDrawable(result) }
                else -> Unit
            }
        }
    }

    private fun placeholder(item: JunkItem): Int = when (item.kind) {
        Kind.APP -> R.drawable.ic_apps
        Kind.MEDIA -> if (item.isVideo) R.drawable.ic_video else R.drawable.ic_image
        Kind.FILE -> when {
            item.isDir -> R.drawable.ic_folder
            item.category == Category.APK_FILES -> R.drawable.ic_apk
            item.isVideo -> R.drawable.ic_video
            item.path?.substringAfterLast('.', "")?.lowercase() in FileScanner.IMAGE_EXT -> R.drawable.ic_image
            else -> R.drawable.ic_file
        }
    }

    private fun render(item: JunkItem): Any? {
        val pm = context.packageManager
        return when (item.kind) {
            Kind.MEDIA -> context.contentResolver.loadThumbnail(item.uri!!, Size(256, 256), null)
            Kind.APP -> pm.getApplicationIcon(item.packageName!!)
            Kind.FILE -> {
                val path = item.path ?: return null
                val ext = path.substringAfterLast('.', "").lowercase()
                when {
                    item.category == Category.APK_FILES -> {
                        val info = pm.getPackageArchiveInfo(path, 0)?.applicationInfo ?: return null
                        info.sourceDir = path
                        info.publicSourceDir = path
                        info.loadIcon(pm)
                    }
                    ext in FileScanner.IMAGE_EXT -> decodeSampled(File(path))
                    else -> null
                }
            }
        }
    }

    private fun decodeSampled(f: File): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(f.absolutePath, bounds)
        if (bounds.outWidth <= 0) return null
        var sample = 1
        while (bounds.outWidth / sample > 512 || bounds.outHeight / sample > 512) sample *= 2
        return BitmapFactory.decodeFile(f.absolutePath, BitmapFactory.Options().apply { inSampleSize = sample })
    }
}
