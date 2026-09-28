package com.dgonzamat.limpiador

import android.Manifest
import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-rCL")
class SecurityScannerTest {

    private val ctx: Context get() = ApplicationProvider.getApplicationContext()

    private fun facts(
        pkg: String = "com.ejemplo.x",
        installer: String? = "com.android.vending",
        permissions: Set<String> = emptySet(),
        accessibility: Boolean = false,
        admin: Boolean = false,
        listener: Boolean = false,
        launcher: Boolean = true,
        label: String = pkg,
        size: Long = 1000,
    ) = AppFacts(pkg, label, size, installer, permissions, accessibility, admin, listener, launcher)

    @Test
    fun reglas_de_riesgo() {
        // App de tienda normal, o con permisos amplios comunes (mensajería): no se lista.
        assertNull(RiskRules.assess(facts()))
        assertNull(RiskRules.assess(facts(permissions = setOf(Manifest.permission.READ_CONTACTS, Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA))))
        // Gestor de contraseñas de tienda con accesibilidad: tampoco.
        assertNull(RiskRules.assess(facts(accessibility = true)))
        // De tienda pero con accesibilidad Y administrador: se lista.
        assertNotNull(RiskRules.assess(facts(accessibility = true, admin = true)))

        // Fuera de tienda (o instalador desconocido) sin más señales fuertes: no alcanza el mínimo.
        assertNull(RiskRules.assess(facts(installer = "com.google.android.packageinstaller", launcher = false)))
        assertNull(RiskRules.assess(facts(installer = null)))
        // Fuera de tienda + lee SMS: riesgo medio.
        val sms = RiskRules.assess(facts(installer = null, permissions = setOf(Manifest.permission.RECEIVE_SMS)))!!
        assertFalse(sms.high)
        assertEquals(listOf(RiskSignal.SIDELOADED, RiskSignal.SMS), sms.signals)
        // Fuera de tienda + controla la pantalla: riesgo alto.
        val troyano = RiskRules.assess(facts(installer = null, accessibility = true))!!
        assertTrue(troyano.high)
        // El combo de espionaje necesita al menos tres de los permisos sensibles.
        val spy = setOf(Manifest.permission.READ_CALL_LOG, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.RECORD_AUDIO)
        assertTrue(RiskSignal.SPY in RiskRules.signals(facts(permissions = spy)))
        assertFalse(RiskSignal.SPY in RiskRules.signals(facts(permissions = spy.drop(1).toSet())))
        // Tiendas conocidas no suman «no viene de una tienda».
        for (store in RiskRules.TRUSTED_STORES) assertFalse(RiskSignal.SIDELOADED in RiskRules.signals(facts(installer = store)))
    }

    @Test
    fun el_escaner_arma_motivos_legibles_y_nada_se_marca_solo() {
        val items = SecurityScanner(ctx) {
            listOf(
                facts("com.a", label = "Lee SMS", installer = null, permissions = setOf(Manifest.permission.READ_SMS), size = 5000),
                facts("com.b", label = "Linterna", installer = null, accessibility = true, size = 10),
                facts("com.c", label = "Normal"),
                facts("com.d", label = "Actualizador", installer = null, admin = true, launcher = false),
            )
        }.scan()
        // Primero las de riesgo alto (por puntaje), después las de riesgo medio.
        assertEquals(listOf("com.d", "com.b", "com.a"), items.map { it.packageName })
        assertTrue(items.all { it.category == Category.SUSPICIOUS_APPS && it.kind == Kind.APP && !it.selected })
        assertEquals("Riesgo alto: no viene de una tienda, controla la pantalla (accesibilidad activa)", items[1].note)
        assertEquals("Riesgo medio: no viene de una tienda, puede leer tus SMS", items[2].note)
        assertTrue(items[0].deviceAdmin)
        assertFalse(items[1].deviceAdmin)
    }

    @Test
    fun lee_las_apps_reales_sin_listar_sistema_ni_la_propia() {
        FakeApps.install(usageAccess = false)
        val facts = SecurityScanner.collectFacts(ctx)
        assertEquals(setOf(FakeApps.RECENT, FakeApps.UNUSED, FakeApps.NEVER), facts.map { it.packageName }.toSet())
        // Sin permisos peligrosos ni controles activos: nada sospechoso.
        assertTrue(SecurityScanner(ctx).scan().isEmpty())
    }
}
