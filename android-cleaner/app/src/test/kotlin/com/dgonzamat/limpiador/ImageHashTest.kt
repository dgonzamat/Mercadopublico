package com.dgonzamat.limpiador

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ImageHashTest {

    private fun gradient(w: Int, h: Int, from: Int, to: Int, horizontal: Boolean): Bitmap {
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val shader = if (horizontal) LinearGradient(0f, 0f, w.toFloat(), 0f, from, to, Shader.TileMode.CLAMP)
        else LinearGradient(0f, 0f, 0f, h.toFloat(), from, to, Shader.TileMode.CLAMP)
        Canvas(bmp).drawRect(0f, 0f, w.toFloat(), h.toFloat(), Paint().apply { setShader(shader) })
        return bmp
    }

    @Test
    fun misma_foto_en_distinto_tamano_da_la_misma_huella() {
        val big = gradient(400, 300, Color.BLACK, Color.WHITE, horizontal = true)
        val small = gradient(120, 90, Color.BLACK, Color.WHITE, horizontal = true)
        assertEquals(0, ImageHash.hamming(ImageHash.dHash(big), ImageHash.dHash(small)))
    }

    @Test
    fun una_foto_ligeramente_distinta_queda_cerca_y_una_distinta_lejos() {
        // Claro→oscuro: cada píxel es más claro que su vecino derecho (todos los bits en 1).
        val base = gradient(400, 300, Color.WHITE, Color.BLACK, horizontal = true)
        val retouched = gradient(400, 300, Color.WHITE, Color.BLACK, horizontal = true).also {
            Canvas(it).drawCircle(60f, 60f, 25f, Paint().apply { color = Color.BLACK })
        }
        // Oscuro→claro: el patrón opuesto (todos los bits en 0), distancia máxima.
        val other = gradient(400, 300, Color.BLACK, Color.WHITE, horizontal = true)
        val h0 = ImageHash.dHash(base)
        assertTrue(ImageHash.hamming(h0, ImageHash.dHash(retouched)) <= ImageHash.SIMILAR_MAX_DISTANCE)
        assertTrue(ImageHash.hamming(h0, ImageHash.dHash(other)) > ImageHash.SIMILAR_MAX_DISTANCE)
    }
}
