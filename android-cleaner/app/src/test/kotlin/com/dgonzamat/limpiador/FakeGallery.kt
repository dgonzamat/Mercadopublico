package com.dgonzamat.limpiador

import android.content.ContentProvider
import android.content.ContentUris
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import androidx.test.core.app.ApplicationProvider
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import java.io.ByteArrayInputStream

/** Un archivo de la galería de prueba. */
data class FakeFile(
    val id: Long,
    val name: String,
    val size: Long,
    val width: Int,
    val height: Int,
    val date: Long,
    val path: String,
    val video: Boolean = false,
    val bytes: ByteArray? = null,
)

/**
 * Galería de prueba: 2 fotos normales, 2 capturas, 1 duplicado exacto (y un
 * "falso duplicado" del mismo tamaño pero distinto contenido), 1 miniatura,
 * 1 archivo vacío, 1 video normal y 1 video pesado.
 */
object FakeGallery {
    val FILES = listOf(
        FakeFile(1, "IMG_0001.jpg", 3_000_000, 4000, 3000, 1000, "DCIM/Camera/"),
        FakeFile(2, "IMG_0002.jpg", 2_500_000, 4000, 3000, 1001, "Pictures/"),
        FakeFile(3, "Screenshot_20260901-101010.png", 500_000, 1080, 2400, 1002, "Pictures/Screenshots/"),
        FakeFile(4, "Screenshot_20260902-111111.png", 400_000, 1080, 2400, 1003, "DCIM/Screenshots/"),
        FakeFile(5, "IMG_0003.jpg", 60_000, 800, 600, 1004, "Pictures/", bytes = ByteArray(60_000) { 'A'.code.toByte() }),
        FakeFile(6, "IMG_0003 (1).jpg", 60_000, 800, 600, 1005, "Download/", bytes = ByteArray(60_000) { 'A'.code.toByte() }),
        FakeFile(7, "IMG_0004.jpg", 60_000, 800, 600, 1006, "Pictures/", bytes = ByteArray(60_000) { 'B'.code.toByte() }),
        FakeFile(8, "thumb_cache.jpg", 5000, 120, 120, 1007, "Pictures/thumbs/"),
        FakeFile(9, "empty.jpg", 0, 0, 0, 1008, "Pictures/"),
        FakeFile(10, "VID_0001.mp4", 30_000_000, 1920, 1080, 1009, "DCIM/Camera/", video = true),
        FakeFile(11, "VID_big.mp4", 350L * 1024 * 1024, 3840, 2160, 1010, "DCIM/Camera/", video = true),
    )

    val EXPECTED_SCREENSHOTS = setOf(3L, 4L)
    val EXPECTED_DUPLICATES = setOf(6L)
    val EXPECTED_TINY = setOf(8L, 9L)
    val EXPECTED_LARGE = setOf(11L)

    fun uriOf(f: FakeFile): Uri = ContentUris.withAppendedId(
        if (f.video) MediaStore.Video.Media.EXTERNAL_CONTENT_URI else MediaStore.Images.Media.EXTERNAL_CONTENT_URI, f.id,
    )

    /** Registra el proveedor falso bajo la autoridad `media` y los bytes de los archivos hasheables. */
    fun install() {
        Robolectric.buildContentProvider(FakeMediaProvider::class.java).create(MediaStore.AUTHORITY)
        val resolver = ApplicationProvider.getApplicationContext<android.content.Context>().contentResolver
        for (f in FILES) {
            f.bytes?.let { shadowOf(resolver).registerInputStream(uriOf(f), ByteArrayInputStream(it)) }
        }
    }
}

class FakeMediaProvider : ContentProvider() {
    companion object {
        /** Si está puesta, `query` espera a que el test la abra (para observar la pantalla "Analizando"). */
        @Volatile var gate: java.util.concurrent.CountDownLatch? = null
    }

    override fun onCreate() = true

    override fun query(uri: Uri, projection: Array<String>?, selection: String?, args: Array<String>?, sort: String?): Cursor {
        gate?.await(10, java.util.concurrent.TimeUnit.SECONDS)
        val video = uri.path?.contains("/video/") == true
        val cols = projection ?: arrayOf(MediaStore.MediaColumns._ID)
        val c = MatrixCursor(cols)
        for (f in FakeGallery.FILES.filter { it.video == video }) {
            c.addRow(cols.map { col ->
                when (col) {
                    MediaStore.MediaColumns._ID -> f.id
                    MediaStore.MediaColumns.DISPLAY_NAME -> f.name
                    MediaStore.MediaColumns.SIZE -> f.size
                    MediaStore.MediaColumns.WIDTH -> f.width
                    MediaStore.MediaColumns.HEIGHT -> f.height
                    MediaStore.MediaColumns.DATE_MODIFIED -> f.date
                    MediaStore.MediaColumns.RELATIVE_PATH -> f.path
                    else -> null
                }
            })
        }
        return c
    }

    /** Simula MediaStore.createDeleteRequest: devuelve un PendingIntent cualquiera. */
    override fun call(method: String, arg: String?, extras: Bundle?): Bundle {
        val ctx = context!!
        val pi = android.app.PendingIntent.getActivity(
            ctx, 0, android.content.Intent("com.dgonzamat.limpiador.FAKE_DELETE"),
            android.app.PendingIntent.FLAG_IMMUTABLE,
        )
        return Bundle().apply { putParcelable("result", pi) /* MediaStore.EXTRA_RESULT, oculto en el SDK */ }
    }

    override fun getType(uri: Uri): String? = null
    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, args: Array<String>?) = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, args: Array<String>?) = 0
}
