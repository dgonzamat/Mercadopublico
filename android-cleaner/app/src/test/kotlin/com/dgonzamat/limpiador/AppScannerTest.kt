package com.dgonzamat.limpiador

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class AppScannerTest {

    private val ctx: Context get() = ApplicationProvider.getApplicationContext()

    @Test
    fun detecta_apps_sin_usar_con_su_tamano() {
        FakeApps.install(usageAccess = true)
        assertTrue(AppScanner.hasUsageAccess(ctx))
        val items = AppScanner(ctx).scan()

        assertEquals(listOf(FakeApps.UNUSED, FakeApps.NEVER), items.map { it.packageName })
        assertTrue(items.all { it.category == Category.UNUSED_APPS && it.kind == Kind.APP && !it.selected })

        val olvidada = items[0]
        assertEquals("App olvidada", olvidada.name)
        assertEquals(FakeApps.UNUSED_BYTES, olvidada.size)               // app + datos + caché
        assertEquals(ctx.getString(R.string.note_last_used_days, 90), olvidada.note)

        val nunca = items[1]
        assertEquals(FakeApps.NEVER_BYTES, nunca.size)
        assertEquals(ctx.getString(R.string.note_never_used), nunca.note)
        // La reciente, la del sistema y la propia app no aparecen.
        assertTrue(items.none { it.packageName == FakeApps.RECENT || it.packageName == FakeApps.SYSTEM || it.packageName == ctx.packageName })
    }

    @Test
    fun sin_acceso_de_uso_no_lista_nada() {
        FakeApps.install(usageAccess = false)
        assertFalse(AppScanner.hasUsageAccess(ctx))
        assertTrue(AppScanner(ctx).scan().isEmpty())
    }
}
