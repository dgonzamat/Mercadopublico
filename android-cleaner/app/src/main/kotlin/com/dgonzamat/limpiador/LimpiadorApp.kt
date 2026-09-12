package com.dgonzamat.limpiador

import android.app.Application
import com.google.android.material.color.DynamicColors

class LimpiadorApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Material You: en Android 12+ la app toma los colores del fondo de pantalla.
        DynamicColors.applyToActivitiesIfAvailable(this)
    }
}
