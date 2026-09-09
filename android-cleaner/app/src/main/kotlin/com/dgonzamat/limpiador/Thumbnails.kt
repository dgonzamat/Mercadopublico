package com.dgonzamat.limpiador

import android.content.ContentResolver
import android.graphics.Bitmap
import android.net.Uri
import android.util.LruCache
import android.util.Size
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Carga miniaturas de MediaStore con caché en memoria. */
class Thumbnails(private val resolver: ContentResolver, private val scope: CoroutineScope) {

    private val cache = object : LruCache<Uri, Bitmap>(48 * 1024 * 1024) {
        override fun sizeOf(key: Uri, value: Bitmap) = value.byteCount
    }

    fun load(uri: Uri, target: ImageView, placeholder: Int) {
        target.tag = uri
        cache.get(uri)?.let { target.setImageBitmap(it); return }
        target.setImageResource(placeholder)
        scope.launch {
            val bmp = withContext(Dispatchers.IO) {
                try { resolver.loadThumbnail(uri, Size(256, 256), null) } catch (e: Exception) { null }
            } ?: return@launch
            cache.put(uri, bmp)
            if (target.tag == uri) target.setImageBitmap(bmp)
        }
    }
}
