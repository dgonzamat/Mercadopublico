package com.dgonzamat.limpiador

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View
import java.io.File
import java.io.FileOutputStream

/** Guarda una vista renderizada como PNG en build/screenshots (modo gráfico nativo de Robolectric). */
object Screenshots {
    private val dir = File("build/screenshots").apply { mkdirs() }

    fun snap(view: View, name: String): File {
        val w = view.width.takeIf { it > 0 } ?: view.measuredWidth
        val h = view.height.takeIf { it > 0 } ?: view.measuredHeight
        require(w > 0 && h > 0) { "vista sin tamaño: $name (${view.width}x${view.height})" }
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        // Sin esto las casillas y los interruptores se dibujan en su estado ANTERIOR (animan el cambio).
        view.jumpDrawablesToCurrentState()
        view.draw(Canvas(bmp))
        val f = File(dir, "$name.png")
        FileOutputStream(f).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
        return f
    }
}
