package com.dgonzamat.limpiador

import android.graphics.Bitmap

/**
 * Huella perceptual «dHash» de 64 bits: reduce la imagen a 9×8 en escala de grises y
 * guarda si cada píxel es más claro que su vecino de la derecha. Dos fotos casi iguales
 * (ráfaga, recompresión) dan huellas a pocos bits de distancia; fotos distintas, a ~32.
 */
object ImageHash {
    const val SIMILAR_MAX_DISTANCE = 10
    /** Umbral para fotos que NO son de la misma ráfaga: casi idénticas (recompresión, copia en otra carpeta). */
    const val NEAR_DUPLICATE_MAX_DISTANCE = 4

    fun dHash(source: Bitmap): Long {
        val small = Bitmap.createScaledBitmap(source, 9, 8, true)
        var hash = 0L
        for (y in 0 until 8) {
            for (x in 0 until 8) {
                val left = gray(small.getPixel(x, y))
                val right = gray(small.getPixel(x + 1, y))
                hash = (hash shl 1) or (if (left > right) 1L else 0L)
            }
        }
        if (small !== source) small.recycle()
        return hash
    }

    fun hamming(a: Long, b: Long): Int = java.lang.Long.bitCount(a xor b)

    private fun gray(argb: Int): Int {
        val r = (argb shr 16) and 0xFF
        val g = (argb shr 8) and 0xFF
        val b = argb and 0xFF
        return (r * 299 + g * 587 + b * 114) / 1000
    }
}
