package com.dgonzamat.limpiador

import android.Manifest
import android.app.Application
import android.app.Notification
import android.app.NotificationManager
import android.app.job.JobScheduler
import android.content.Context
import android.content.Intent
import android.os.Looper
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import com.google.android.material.button.MaterialButton
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowDialog

/** Vigilancia en segundo plano: qué avisa, cuándo no repite, cómo se programa y adónde lleva el aviso. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-rCL-w411dp-h891dp-xxhdpi", application = LimpiadorApp::class)
class WatchdogTest {
    private val ctx: Context get() = ApplicationProvider.getApplicationContext()

    @Before
    fun setUp() {
        ScanStore.items = emptyList()
        ScanEngine.usageAccess = { AppScanner.hasUsageAccess(it) }
        ScanEngine.allFilesAccess = { true }
    }

    private fun app(pkg: String, label: String, installer: String? = "com.android.vending", launcher: Boolean = true,
                    permissions: Set<String> = emptySet(), screens: Int = 0) =
        AppFacts(pkg, label, 1000, installer, permissions, false, false, false, launcher, screensLastDay = screens)

    /** El caso real que motivó la vigilancia: «System App», sin ícono, instalada fuera de una tienda. */
    private val impostor = app("com.fake.system", "System App", installer = "com.google.android.packageinstaller", launcher = false)
    private val whatsapp = app("com.whatsapp", "WhatsApp")
    private val fakeCleaner = app("com.flare.cleaner", "Flare Cleaner", permissions = setOf(Manifest.permission.SYSTEM_ALERT_WINDOW))

    private fun notifications(): List<Notification> =
        shadowOf(ctx.getSystemService(NotificationManager::class.java)).allNotifications

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()

    @Test
    fun decide_avisa_lo_urgente_y_lo_recien_instalado() {
        // Primera revisión: nada es «recién instalado», pero lo urgente se avisa igual.
        assertEquals(listOf("com.fake.system"), Watchdog.decide(listOf(impostor, whatsapp, fakeCleaner), null, emptySet()).map { it.first.packageName })
        // Después, una app nueva que parece adware se avisa; una normal, no.
        val known = setOf("com.whatsapp")
        assertEquals(listOf("com.flare.cleaner"), Watchdog.decide(listOf(whatsapp, fakeCleaner, app("com.new.ok", "Notas")), known, emptySet()).map { it.first.packageName })
        // Lo ya avisado no se repite.
        assertTrue(Watchdog.decide(listOf(impostor), null, setOf("com.fake.system")).isEmpty())
        // Una app oculta que abrió pantallas (anuncios) es urgente aunque no sea nueva.
        val popper = app("com.ads", "Utilidades", launcher = false, screens = 5)
        assertEquals(listOf("com.ads"), Watchdog.decide(listOf(popper), setOf("com.ads"), emptySet()).map { it.first.packageName })
    }

    @Test
    fun run_notifica_una_sola_vez_y_recuerda_lo_instalado() {
        shadowOf(ctx as Application).grantPermissions(Manifest.permission.POST_NOTIFICATIONS)
        val first = Watchdog.run(ctx, listOf(impostor, whatsapp))
        assertEquals(listOf("com.fake.system"), first.map { it.facts.packageName })
        assertFalse(first.single().newInstall)
        val n = notifications().single()
        assertEquals("«System App» parece adware", n.extras.getString(Notification.EXTRA_TITLE))
        val text = n.extras.getCharSequence(Notification.EXTRA_TEXT).toString()
        assertTrue(text, text.startsWith("No viene de una tienda") && text.contains("se hace pasar por parte del teléfono"))
        // Segunda revisión sin cambios: silencio.
        assertTrue(Watchdog.run(ctx, listOf(impostor, whatsapp)).isEmpty())
        // Aparece un limpiador falso: se avisa como recién instalado.
        val third = Watchdog.run(ctx, listOf(impostor, whatsapp, fakeCleaner))
        assertTrue(third.single().newInstall)
        assertEquals(2, notifications().size)
        assertTrue(notifications().any { it.extras.getString(Notification.EXTRA_TITLE) == "Se instaló «Flare Cleaner», que parece adware" })
    }

    @Test
    fun sin_permiso_de_avisos_decide_pero_no_notifica() {
        assertEquals(1, Watchdog.run(ctx, listOf(impostor)).size)
        assertTrue(notifications().isEmpty())
    }

    @Test
    fun se_programa_cada_15_minutos_y_sobrevive_reinicios() {
        val js = shadowOf(ctx.getSystemService(JobScheduler::class.java))
        Watchdog.setEnabled(ctx, true)
        val job = js.getPendingJob(Watchdog.JOB_ID)!!
        assertEquals(Watchdog.PERIOD_MS, job.intervalMillis)
        assertTrue(job.isPersisted)
        assertTrue(Watchdog.isEnabled(ctx))
        Watchdog.setEnabled(ctx, false)
        assertEquals(null, js.getPendingJob(Watchdog.JOB_ID))
        assertFalse(Watchdog.isEnabled(ctx))
    }

    @Test
    fun la_tarjeta_activa_y_desactiva_la_vigilancia() {
        shadowOf(ctx as Application).grantPermissions(Manifest.permission.POST_NOTIFICATIONS)
        ScanStore.items = listOf(JunkItem(Category.TINY, "x.jpg", 10, uri = android.net.Uri.parse("content://media/external/images/media/1")))
        ActivityScenario.launch(MainActivity::class.java).onActivity { a ->
            idle()
            fun card() = a.findViewById<ViewGroup>(R.id.toolsContainer).let { c -> (0 until c.childCount).map { c.getChildAt(it) } }
                .single { it.findViewById<TextView>(R.id.title).text.toString() == a.getString(R.string.tool_watch_title) }
            assertEquals(a.getString(R.string.tool_watch_button_on), card().findViewById<MaterialButton>(R.id.button).text.toString())
            card().findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            assertTrue(Watchdog.isEnabled(a))
            assertEquals(a.getString(R.string.tool_watch_button_off), card().findViewById<MaterialButton>(R.id.button).text.toString())
            assertEquals(a.getString(R.string.tool_watch_desc_on), card().findViewById<TextView>(R.id.description).text.toString())
            card().findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            assertFalse(Watchdog.isEnabled(a))
        }
    }

    @Test
    fun tocar_el_aviso_muestra_como_quitar_la_app() {
        FakeApps.install(usageAccess = false)
        val intent = Intent(ctx, MainActivity::class.java).putExtra(Watchdog.EXTRA_PACKAGE, FakeApps.NEVER)
        ActivityScenario.launch<MainActivity>(intent).onActivity { a ->
            idle()
            val d = ShadowDialog.getLatestDialog() as AlertDialog
            assertEquals(a.getString(R.string.help_title, "App nunca abierta"),
                d.findViewById<TextView>(androidx.appcompat.R.id.alertTitle)!!.text.toString())
        }
    }
}
