package com.dgonzamat.limpiador

import android.app.Activity
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowActivity

/**
 * Siguiente petición real de resultado (código ≥ 0). La cola de Robolectric es compartida por
 * todas las activities y también guarda los startActivity simples (código −1): sin este filtro,
 * el «ver foto» de la revisión se colaba como si fuera la petición de borrado (fallo intermitente).
 */
fun Activity.nextResultRequest(): ShadowActivity.IntentForResult? {
    while (true) {
        val r = shadowOf(this).nextStartedActivityForResult ?: return null
        if (r.requestCode != -1) return r
    }
}
