package com.dgonzamat.limpiador

import android.Manifest
import android.content.Context
import java.io.File
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import kotlinx.coroutines.runBlocking
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-rCL")
class SecurityScannerTest {

    private val ctx: Context get() = ApplicationProvider.getApplicationContext()

    /** ScanEngine es un objeto compartido entre clases de prueba: dejar el acceso de uso real. */
    @org.junit.Before
    fun setUp() {
        ScanEngine.usageAccess = { AppScanner.hasUsageAccess(it) }
    }

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
        apkPath: String? = null,
    ) = AppFacts(pkg, label, size, installer, permissions, accessibility, admin, listener, launcher, apkPath)

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
        // Limpiadores falsos de Google Play: nombre de limpiador + dibujar encima, ocultar ícono o leer notificaciones.
        val fakeCleaner = RiskRules.assess(facts(label = "Super Cleaner - Phone Booster", permissions = setOf(Manifest.permission.SYSTEM_ALERT_WINDOW)))!!
        assertTrue(RiskSignal.CLEANER in fakeCleaner.signals)
        assertNotNull(RiskRules.assess(facts(pkg = "com.fast.junkclean", label = "Limpieza", launcher = false)))
        assertNotNull(RiskRules.assess(facts(label = "Limpiador de RAM", listener = true)))
        // Un limpiador de tienda sin nada más no se lista, ni una app normal con overlay (burbujas de chat).
        assertNull(RiskRules.assess(facts(label = "Files Cleaner")))
        assertNull(RiskRules.assess(facts(label = "Mensajería", permissions = setOf(Manifest.permission.SYSTEM_ALERT_WINDOW))))
        // App de tienda sin ícono que dibuja encima: patrón de adware.
        assertNotNull(RiskRules.assess(facts(label = "Servicio", launcher = false, permissions = setOf(Manifest.permission.SYSTEM_ALERT_WINDOW))))
        // Palabras cortas solo como palabra: «Ramen» o «Program» no son «ram».
        assertFalse(RiskRules.looksLikeCleaner("Ramen Recipes", "com.cook.ramen"))
        assertFalse(RiskRules.looksLikeCleaner("Program Guide", "tv.program"))
        assertTrue(RiskRules.looksLikeCleaner("RAM Booster", "com.x"))
        // Adware que bloquea la pantalla: sin ícono pero apareció en pantalla. Alto aunque venga de una tienda.
        val popup = RiskRules.assess(facts(launcher = false).copy(screensLastDay = 9))!!
        assertTrue(popup.high)
        assertTrue(RiskSignal.POPS_UP in popup.signals)
        // Con ícono, aparecer en pantalla es lo normal.
        assertNull(RiskRules.assess(facts().copy(screensLastDay = 50)))
        // Tiendas conocidas no suman «no viene de una tienda».
        for (store in RiskRules.TRUSTED_STORES) assertFalse(RiskSignal.SIDELOADED in RiskRules.signals(facts(installer = store)))
    }

    @Test
    fun el_escaner_arma_motivos_legibles_y_nada_se_marca_solo() = runBlocking {
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
    fun virustotal_confirma_malware_aunque_no_haya_senales_y_no_consulta_las_de_tienda() = runBlocking {
        val dir = java.nio.file.Files.createTempDirectory("apks").toFile()
        fun apk(name: String, b: Byte) = File(dir, name).apply { writeBytes(ByteArray(32) { b }) }.path
        val troyano = apk("t.apk", 1); val limpia = apk("l.apk", 2); val tienda = apk("s.apk", 3)
        val consultadas = mutableListOf<String>()
        val vt = VirusTotal("k", http = { url, _ ->
            consultadas += url.substringAfterLast('/')
            when (url.substringAfterLast('/')) {
                VirusTotal.sha256(File(troyano)) -> 200 to """{"data":{"attributes":{"last_analysis_stats":{"malicious":12,"undetected":50}}}}"""
                VirusTotal.sha256(File(limpia)) -> 200 to """{"data":{"attributes":{"last_analysis_stats":{"malicious":0,"harmless":10,"undetected":55}}}}"""
                else -> 404 to "{}"
            }
        }, wait = {})
        val items = SecurityScanner(ctx, vt) {
            listOf(
                facts("com.troyano", label = "Juego gratis", installer = null, apkPath = troyano),      // sin señales: solo VirusTotal lo delata
                facts("com.sms", label = "Lee SMS", installer = null, permissions = setOf(Manifest.permission.READ_SMS), apkPath = limpia),
                facts("com.tienda", label = "De tienda", apkPath = tienda),
            )
        }.scan()
        assertEquals(listOf("com.troyano", "com.sms"), items.map { it.packageName })
        assertEquals("MALWARE: lo detectan 12 de 62 antivirus (VirusTotal)", items[0].note)
        assertEquals("Riesgo medio: no viene de una tienda, puede leer tus SMS · VirusTotal: ninguno de 65 antivirus lo detecta", items[1].note)
        assertEquals(2, consultadas.size) // la app de tienda no se consulta
        assertFalse(items[0].selected)    // ni siquiera el malware se marca solo: decide el usuario
        assertEquals(VtReport(VtStatus.OK, 2, 1), vt.report())
    }

    @Test
    fun el_adware_que_aparece_sin_icono_se_explica_con_el_conteo() = runBlocking {
        val items = SecurityScanner(ctx) { listOf(facts("com.ads", label = "Servicio", launcher = false).copy(screensLastDay = 7)) }.scan()
        assertEquals("Riesgo alto: no tiene ícono, pero apareció en pantalla 7 veces en 24 h (anuncios a pantalla completa), no tiene ícono visible", items.single().note)
    }

    @Test
    fun cuenta_las_pantallas_de_cada_app_en_el_registro_de_uso() {
        FakeApps.install(usageAccess = true)
        val usm = org.robolectric.Shadows.shadowOf(ctx.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager)
        val now = System.currentTimeMillis()
        repeat(3) { usm.addEvent(FakeApps.NEVER, now - (it + 1) * 60_000L, android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) }
        usm.addEvent(FakeApps.NEVER, now - 2 * 86_400_000L, android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) // fuera de las 24 h
        val facts = SecurityScanner.collectFacts(ctx).associateBy { it.packageName }
        assertEquals(3, facts.getValue(FakeApps.NEVER).screensLastDay)
        assertEquals(0, facts.getValue(FakeApps.RECENT).screensLastDay)
        // Sin ícono y apareciendo en pantalla: sale como adware aunque no tenga nada más.
        val items = runBlocking { SecurityScanner(ctx).scan() }
        assertEquals(listOf(FakeApps.NEVER), items.map { it.packageName })
    }

    @Test
    fun lee_las_apps_reales_sin_listar_sistema_ni_la_propia() {
        FakeApps.install(usageAccess = false)
        val facts = SecurityScanner.collectFacts(ctx)
        assertEquals(setOf(FakeApps.RECENT, FakeApps.UNUSED, FakeApps.NEVER), facts.map { it.packageName }.toSet())
        // Sin permisos peligrosos ni controles activos: nada sospechoso.
        assertTrue(runBlocking { SecurityScanner(ctx).scan() }.isEmpty())
    }
}
