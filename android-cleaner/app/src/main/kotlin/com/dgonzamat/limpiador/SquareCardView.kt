package com.dgonzamat.limpiador

import android.content.Context
import android.util.AttributeSet
import com.google.android.material.card.MaterialCardView

/** Tarjeta cuadrada para la cuadrícula de fotos (alto = ancho). */
class SquareCardView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : MaterialCardView(context, attrs) {
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, widthMeasureSpec)
    }
}
