package com.dgonzamat.limpiador

import android.Manifest
import android.app.Activity
import android.app.Application
import android.content.Intent
import android.os.Looper
import android.os.storage.StorageManager
import android.provider.Settings
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import com.google.android.material.button.MaterialButton
import com.google.android.material.materialswitch.MaterialSwitch
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import org.robolectric.shadows.ShadowDialog
import java.io.File

/** Sección «Más espacio», apps sin usar y los caminos de permisos opcionales. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "es-rCL-w411dp-h891dp-xxhdpi", application = LimpiadorApp::class)
class ToolsFlowTest {

    private lateinit var storage: File

    @Before
    fun setUp() {
        FakeGallery.install()
        ScanStore.items = emptyList()
        storage = File(System.getProperty("java.io.tmpdir"), "empty-storage-" + System.nanoTime()).apply { mkdirs() }
        ScanEngine.storageRoot = { storage }
        ScanEngine.allFilesAccess = { true }
        ScanEngine.usageAccess = { AppScanner.hasUsageAccess(it) }
        ScanEngine.securityScan = { ctx, vt, p -> SecurityScanner(ctx, vt).scan(p) }
        ScanEngine.virusTotal = { null } // sin red en las pruebas
        shadowOf(ApplicationProvider.getApplicationContext<Application>())
            .grantPermissions(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO)
    }

    @After
    fun tearDown() = storage.deleteRecursively().let { }

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()
    private fun waitUntil(what: String, cond: () -> Boolean) {
        repeat(400) { idle(); if (cond()) return; Thread.sleep(25) }
        throw AssertionError("timeout esperando: $what")
    }
    private fun <T : View> Activity.v(id: Int): T = findViewById(id)
    private fun ViewGroup.children() = (0 until childCount).map { getChildAt(it) }

    @Test
    fun apps_sin_usar_cache_del_sistema_y_desinstalacion() {
        FakeApps.install(usageAccess = true)
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        scenario.onActivity { a ->
            idle()
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            waitUntil("resultados") { a.v<View>(R.id.resultsGroup).visibility == View.VISIBLE }

            // Tarjeta de apps al final, con conteo en «apps» y sin preseleccionar.
            val cards = a.v<ViewGroup>(R.id.categoryContainer).children()
            val appsCard = cards.last()
            assertEquals(a.getString(R.string.cat_unused_apps), appsCard.findViewById<TextView>(R.id.title).text.toString())
            assertEquals("2 apps · 190,0 MB", appsCard.findViewById<TextView>(R.id.stats).text.toString())
            assertTrue(!appsCard.findViewById<MaterialSwitch>(R.id.toggle).isChecked)

            // Con ambos permisos quedan la caché, el antivirus en la nube y Play Protect; la caché abre el diálogo del sistema.
            val tools = a.v<ViewGroup>(R.id.toolsContainer).children()
            assertEquals(4, tools.size)
            tools[0].findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            val cacheReq = a.nextResultRequest()
            assertNotNull(cacheReq)
            assertEquals(StorageManager.ACTION_CLEAR_APP_CACHE, cacheReq!!.intent.action)
            shadowOf(a).receiveResult(cacheReq.intent, Activity.RESULT_OK, null)
            idle()
            Screenshots.snap(a.window.decorView, "08-resultados-con-apps")

            // Incluir las apps y limpiar: el diálogo avisa de las desinstalaciones.
            appsCard.findViewById<MaterialSwitch>(R.id.toggle).performClick()
            idle()
            assertTrue(ScanStore.byCategory(Category.UNUSED_APPS).all { it.selected })
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            idle()
            val dialog = ShadowDialog.getLatestDialog() as AlertDialog
            val message = dialog.findViewById<TextView>(android.R.id.message)!!.text.toString()
            assertTrue(message, message.contains("Incluye 2 apps"))
            val selected = ScanStore.selected()
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick()

            // 1. Galería (proveedor falso) → OK.
            var req: org.robolectric.shadows.ShadowActivity.IntentForResult? = null
            waitUntil("borrado de galería") { req = a.nextResultRequest(); req != null }
            shadowOf(a).receiveResult(req!!.intent, Activity.RESULT_OK, null)
            idle()
            // 2. Apps, una por una: ACTION_DELETE con package:… y resultado.
            val pm = shadowOf(a.packageManager)
            for (pkg in listOf(FakeApps.UNUSED, FakeApps.NEVER)) {
                val del = a.nextResultRequest()
                assertNotNull("desinstalación de $pkg", del)
                assertEquals(Intent.ACTION_DELETE, del!!.intent.action)
                assertEquals("package:$pkg", del.intent.dataString)
                pm.removePackage(pkg) // el sistema la desinstaló
                shadowOf(a).receiveResult(del.intent, Activity.RESULT_OK, null)
                idle()
            }
            assertEquals(View.VISIBLE, a.v<View>(R.id.doneGroup).visibility)
            assertEquals(a.getString(R.string.done_title, formatSize(selected.sumOf { it.size })), a.v<TextView>(R.id.doneTitle).text.toString())
            assertEquals(a.resources.getQuantityString(R.plurals.done_subtitle, selected.size, selected.size), a.v<TextView>(R.id.doneSubtitle).text.toString())
        }
    }

    @Test
    fun revision_de_apps_muestra_nombre_y_abre_su_informacion() {
        FakeApps.install(usageAccess = true)
        ScanStore.items = AppScanner(ApplicationProvider.getApplicationContext()).scan()
        val intent = Intent(ApplicationProvider.getApplicationContext(), CategoryActivity::class.java)
            .putExtra(CategoryActivity.EXTRA_CATEGORY, Category.UNUSED_APPS.ordinal)
        ActivityScenario.launch<CategoryActivity>(intent).onActivity { c ->
            idle()
            val grid = c.v<androidx.recyclerview.widget.RecyclerView>(R.id.grid)
            grid.measure(
                View.MeasureSpec.makeMeasureSpec(grid.width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(grid.height, View.MeasureSpec.EXACTLY),
            )
            grid.layout(grid.left, grid.top, grid.right, grid.bottom)
            idle()
            assertEquals(2, grid.adapter!!.itemCount)
            assertEquals(c.getString(R.string.grid_hint_app), c.v<TextView>(R.id.hint).text.toString())
            val cell = grid.findViewHolderForAdapterPosition(0)!!.itemView
            assertEquals("App olvidada", cell.findViewById<TextView>(R.id.name).text.toString())
            val label = cell.findViewById<TextView>(R.id.label).text.toString()
            assertTrue(label, label.startsWith("150,0 MB · "))
            assertEquals(View.GONE, cell.findViewById<View>(R.id.path).visibility) // las apps no tienen carpeta
            Screenshots.snap(c.window.decorView, "09-revision-apps")
            cell.performLongClick()
            val info = shadowOf(c).nextStartedActivity
            assertEquals(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, info.action)
            assertEquals("package:${FakeApps.UNUSED}", info.dataString)
        }
    }

    /** Busca en la jerarquía una vista de texto que contenga [text] (el snackbar no tiene id propio). */
    private fun View.findText(text: String): TextView? = when {
        this is TextView && this.text.toString().contains(text) -> this
        this is ViewGroup -> children().firstNotNullOfOrNull { it.findText(text) }
        else -> null
    }

    @Test
    fun apps_sospechosas_primero_se_revisan_y_se_desinstalan() {
        FakeApps.install(usageAccess = false)
        // Señales inventadas sobre paquetes que sí existen (para el ícono y la desinstalación).
        val facts = listOf(
            AppFacts(FakeApps.UNUSED, "Linterna Turbo", 8_000_000, "com.google.android.packageinstaller",
                setOf(android.Manifest.permission.READ_SMS, android.Manifest.permission.SYSTEM_ALERT_WINDOW),
                accessibilityOn = true, deviceAdmin = false, notificationListener = false, hasLauncherIcon = true),
            AppFacts(FakeApps.NEVER, "Servicio de actualización", 2_000_000, null,
                setOf(android.Manifest.permission.REQUEST_INSTALL_PACKAGES),
                accessibilityOn = false, deviceAdmin = true, notificationListener = true, hasLauncherIcon = false),
            AppFacts(FakeApps.RECENT, "Gestor de claves", 30_000_000, "com.android.vending", emptySet(),
                accessibilityOn = true, deviceAdmin = false, notificationListener = false, hasLauncherIcon = true),
        )
        // Antivirus en la nube con respuestas inventadas: la administradora es malware conocido.
        val apkDir = java.nio.file.Files.createTempDirectory("apks").toFile() // fuera del almacenamiento analizado
        val adminApk = File(apkDir, "admin.apk").apply { writeBytes(ByteArray(64) { 7 }) }
        val adminHash = VirusTotal.sha256(adminApk)
        val vt = VirusTotal("clave", http = { url, _ ->
            if (url.endsWith(adminHash)) 200 to """{"data":{"attributes":{"last_analysis_stats":{"malicious":38,"suspicious":2,"undetected":24,"harmless":0}}}}"""
            else 404 to """{"error":{"code":"NotFoundError"}}"""
        }, wait = {})
        val withApks = facts.mapIndexed { i, f -> f.copy(apkPath = if (i == 1) adminApk.path else File(apkDir, "otra$i.apk").apply { writeBytes(ByteArray(8) { i.toByte() }) }.path) }
        ScanEngine.virusTotal = { vt }
        ScanEngine.securityScan = { ctx, v, p -> SecurityScanner(ctx, v) { withApks }.scan(p) }
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        scenario.onActivity { a ->
            idle()
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            waitUntil("resultados") { a.v<View>(R.id.resultsGroup).visibility == View.VISIBLE }
            // La tarjeta de seguridad va primero, apagada, y la línea «sin riesgos» no aparece.
            val cards = a.v<ViewGroup>(R.id.categoryContainer).children()
            assertEquals(a.getString(R.string.cat_suspicious), cards[0].findViewById<TextView>(R.id.title).text.toString())
            assertTrue(!cards[0].findViewById<MaterialSwitch>(R.id.toggle).isChecked)
            assertEquals(View.GONE, a.v<View>(R.id.securityClean).visibility)
            val suspicious = ScanStore.byCategory(Category.SUSPICIOUS_APPS)
            // El malware confirmado por VirusTotal va primero; la de tienda ni se consulta ni se lista.
            assertEquals(listOf(FakeApps.NEVER, FakeApps.UNUSED), suspicious.map { it.packageName })
            assertTrue(suspicious[0].note!!.startsWith("MALWARE: lo detectan 38 de 64 antivirus (VirusTotal)"))
            assertTrue(suspicious[1].note!!.endsWith("VirusTotal no conoce este archivo"))
            assertEquals(VtReport(VtStatus.OK, 2, 1), ScanStore.scope.vt)
            assertTrue(a.v<TextView>(R.id.resultsScope).text.contains("VirusTotal: 2 huellas consultadas, 1 con malware."))
            Screenshots.snap(a.window.decorView, "12-resultados-seguridad")
        }

        // Revisión: motivos en rojo y la ayuda propia de seguridad.
        val review = Intent(ApplicationProvider.getApplicationContext(), CategoryActivity::class.java)
            .putExtra(CategoryActivity.EXTRA_CATEGORY, Category.SUSPICIOUS_APPS.ordinal)
        ActivityScenario.launch<CategoryActivity>(review).onActivity { c ->
            idle()
            val grid = c.v<androidx.recyclerview.widget.RecyclerView>(R.id.grid)
            grid.measure(
                View.MeasureSpec.makeMeasureSpec(grid.width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(grid.height, View.MeasureSpec.EXACTLY),
            )
            grid.layout(grid.left, grid.top, grid.right, grid.bottom)
            idle()
            assertEquals(c.getString(R.string.grid_hint_security), c.v<TextView>(R.id.hint).text.toString())
            val first = grid.findViewHolderForAdapterPosition(0)!!.itemView
            val label = first.findViewById<TextView>(R.id.label)
            assertTrue(label.text.toString(), label.text.contains("MALWARE: lo detectan 38 de 64 antivirus"))
            assertEquals(androidx.core.content.ContextCompat.getColor(c, R.color.danger), label.currentTextColor)
            Screenshots.snap(c.window.decorView, "13-revision-seguridad")
        }

        // Limpiar solo las sospechosas: una se desinstala; la administradora no, y se ofrecen los pasos.
        val ctx = ApplicationProvider.getApplicationContext<Application>()
        val dpm = ctx.getSystemService(android.content.Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
        shadowOf(dpm).setActiveAdmin(android.content.ComponentName(FakeApps.NEVER, "${FakeApps.NEVER}.Admin"))
        scenario.onActivity { a ->
            idle()
            ScanStore.items.forEach { it.selected = it.category == Category.SUSPICIOUS_APPS }
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            idle()
            (ShadowDialog.getLatestDialog() as AlertDialog).getButton(AlertDialog.BUTTON_POSITIVE).performClick()
            val pm = shadowOf(a.packageManager)
            var del: org.robolectric.shadows.ShadowActivity.IntentForResult? = null
            waitUntil("desinstalación 1") { del = a.nextResultRequest(); del != null }
            assertEquals("package:${FakeApps.NEVER}", del!!.intent.dataString)
            shadowOf(a).receiveResult(del!!.intent, Activity.RESULT_CANCELED, null) // administradora: Android no la deja ir
            idle()
            val other = a.nextResultRequest()
            assertEquals("package:${FakeApps.UNUSED}", other!!.intent.dataString)
            pm.removePackage(FakeApps.UNUSED)
            shadowOf(a).receiveResult(other.intent, Activity.RESULT_OK, null)
            idle()
            assertEquals(View.VISIBLE, a.v<View>(R.id.doneGroup).visibility)
            // La que quedó se lista con sus pasos, empezando por quitarle el permiso de administrador.
            val left = ShadowDialog.getLatestDialog() as AlertDialog
            assertEquals(1, left.listView.adapter.count)
            assertEquals("Servicio de actualización", left.listView.adapter.getItem(0).toString())
            Screenshots.snap(left.window!!.decorView, "16-no-se-desinstalo")
            shadowOf(left.listView).performItemClick(0)
            idle()
            val steps = ShadowDialog.getLatestDialog() as AlertDialog
            assertTrue(steps !== left)
            val rows = (0 until steps.listView.adapter.count).map { steps.listView.adapter.getItem(it).toString() }
            assertEquals("1. " + a.getString(R.string.help_admin), rows[0])
            assertEquals("2. " + a.getString(R.string.help_notifications), rows[1])
            assertTrue(rows.last().endsWith(a.getString(R.string.help_safe_mode)))
            Screenshots.snap(steps.window!!.decorView, "17-como-quitarla")
            // Comandos para el computador: se muestran, se copian y se pueden enviar.
            steps.getButton(AlertDialog.BUTTON_NEUTRAL).performClick()
            idle()
            val adb = ShadowDialog.getLatestDialog() as AlertDialog
            val msg = adb.findViewById<TextView>(android.R.id.message)!!.text.toString()
            assertTrue(msg, msg.contains("adb shell pm uninstall ${FakeApps.NEVER}"))
            adb.getButton(AlertDialog.BUTTON_NEUTRAL).performClick()
            idle()
            val clip = (a.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager).primaryClip!!
            assertTrue(clip.getItemAt(0).text.contains("adb shell pm disable-user --user 0 ${FakeApps.NEVER}"))
            // El primer paso lleva a Ajustes › Seguridad, donde están las administradoras.
            shadowOf(a).clearNextStartedActivities()
            RemovalHelp.show(a, JunkItem(Category.SUSPICIOUS_APPS, "Servicio de actualización", 0, packageName = FakeApps.NEVER))
            idle()
            shadowOf((ShadowDialog.getLatestDialog() as AlertDialog).listView).performItemClick(0)
            idle()
            assertEquals(Settings.ACTION_SECURITY_SETTINGS, shadowOf(a).nextStartedActivity.action)
        }
        ScanEngine.securityScan = { ctx, vt, p -> SecurityScanner(ctx, vt).scan(p) }
        ScanEngine.virusTotal = { null } // sin red en las pruebas
    }

    @Test
    fun quien_muestra_los_anuncios_lista_la_ultima_app_en_pantalla() {
        FakeApps.install(usageAccess = true)
        val ctx = ApplicationProvider.getApplicationContext<Application>()
        val usm = shadowOf(ctx.getSystemService(android.content.Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager)
        val now = System.currentTimeMillis()
        val resumed = android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED
        usm.addEvent(FakeApps.NEVER, now - 12_000, resumed)          // el anuncio de recién
        usm.addEvent(FakeApps.NEVER, now - 400_000, resumed)
        usm.addEvent(FakeApps.RECENT, now - 600_000, resumed)
        usm.addEvent(FakeApps.SYSTEM, now - 5_000, resumed)          // del sistema: no se ofrece
        usm.addEvent(ctx.packageName, now - 1_000, resumed)          // esta misma app: tampoco
        usm.addEvent(FakeApps.UNUSED, now - 3 * 3600_000L, resumed)  // hace más de 30 min
        // Un anuncio que salió como aviso, no como pantalla: solo deja su servicio en primer plano.
        usm.addEvent(FakeApps.UNUSED, now - 90_000, android.app.usage.UsageEvents.Event.FOREGROUND_SERVICE_START)
        ScanStore.items = listOf(JunkItem(Category.TINY, "x.jpg", 10, uri = android.net.Uri.parse("content://media/external/images/media/1")))
        ActivityScenario.launch(MainActivity::class.java).onActivity { a ->
            idle()
            val card = a.v<ViewGroup>(R.id.toolsContainer).children()
                .single { it.findViewById<TextView>(R.id.title).text.toString() == a.getString(R.string.tool_ads_title) }
            card.findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            val dialog = ShadowDialog.getLatestDialog() as AlertDialog
            val list = dialog.listView
            assertEquals(3, list.adapter.count)
            val first = list.adapter.getItem(0).toString()
            assertTrue(first, first.startsWith("App nunca abierta · hace 1") && first.endsWith("2 veces"))
            val second = list.adapter.getItem(1).toString()
            assertEquals("App olvidada · hace 1 min · trabajando en segundo plano", second)
            val third = list.adapter.getItem(2).toString()
            assertTrue(third, third.startsWith("App reciente · hace 10 min"))
            Screenshots.snap(dialog.window!!.decorView, "15-quien-muestra-anuncios")
            // Tocarla muestra cómo quitarla; «Abrir su ficha» lleva a sus ajustes.
            shadowOf(list).performItemClick(0)
            idle()
            val steps = ShadowDialog.getLatestDialog() as AlertDialog
            assertEquals(a.getString(R.string.help_title, "App nunca abierta"), steps.findViewById<TextView>(androidx.appcompat.R.id.alertTitle)!!.text.toString())
            val details = (0 until steps.listView.adapter.count).first {
                steps.listView.adapter.getItem(it).toString().endsWith(a.getString(R.string.help_details))
            }
            shadowOf(steps.listView).performItemClick(details)
            idle()
            val info = shadowOf(a).nextStartedActivity
            assertEquals(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, info.action)
            assertEquals("package:${FakeApps.NEVER}", info.dataString)
        }
    }

    @Test
    fun antivirus_en_la_nube_se_activa_con_la_clave_y_lo_dice() {
        ScanStore.items = listOf(JunkItem(Category.TINY, "x.jpg", 10, uri = android.net.Uri.parse("content://media/external/images/media/1")))
        ActivityScenario.launch(MainActivity::class.java).onActivity { a ->
            idle()
            val privacy = a.v<TextView>(R.id.privacyNote)
            assertEquals(a.getString(R.string.privacy_note), privacy.text.toString())
            fun vtCard() = a.v<ViewGroup>(R.id.toolsContainer).children()
                .single { it.findViewById<TextView>(R.id.title).text.toString() == a.getString(R.string.tool_vt_title) }
            assertEquals(a.getString(R.string.tool_vt_button_on), vtCard().findViewById<MaterialButton>(R.id.button).text.toString())
            vtCard().findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            val dialog = ShadowDialog.getLatestDialog() as AlertDialog
            dialog.findViewById<TextView>(R.id.vtKeyInput)!!.text = "  abc123  "
            Screenshots.snap(dialog.window!!.decorView, "14-clave-virustotal")
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick()
            idle()
            assertEquals("abc123", ScanEngine.vtKey(a))
            assertEquals(a.getString(R.string.privacy_note_vt), a.v<TextView>(R.id.privacyNote).text.toString())
            assertEquals(a.getString(R.string.tool_vt_button_change), vtCard().findViewById<MaterialButton>(R.id.button).text.toString())
            assertEquals(a.getString(R.string.tool_vt_desc_on), vtCard().findViewById<TextView>(R.id.description).text.toString())
            // «Quitar» la borra y la nota vuelve a «nada se sube».
            vtCard().findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            (ShadowDialog.getLatestDialog() as AlertDialog).getButton(AlertDialog.BUTTON_NEUTRAL).performClick()
            idle()
            assertEquals(null, ScanEngine.vtKey(a))
            assertEquals(a.getString(R.string.privacy_note), a.v<TextView>(R.id.privacyNote).text.toString())
        }
    }

    @Test
    fun sin_permisos_opcionales_las_herramientas_llevan_a_ajustes() {
        FakeApps.install(usageAccess = false)
        ScanEngine.allFilesAccess = { false }
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        scenario.onActivity { a ->
            idle()
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            idle()
            // «Abrir ajustes» lleva al permiso de todos los archivos y marca el retorno.
            val offer = ShadowDialog.getLatestDialog() as AlertDialog
            offer.getButton(AlertDialog.BUTTON_POSITIVE).performClick()
            idle()
            val settings = shadowOf(a).nextStartedActivity
            assertEquals(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, settings.action)
            assertEquals("package:${a.packageName}", settings.dataString)
        }
        // El usuario vuelve sin haberlo concedido: la app sigue con la galería sin volver a insistir.
        scenario.moveToState(Lifecycle.State.STARTED)
        scenario.moveToState(Lifecycle.State.RESUMED)
        scenario.onActivity { a ->
            waitUntil("resultados solo galería") { a.v<View>(R.id.resultsGroup).visibility == View.VISIBLE }
            assertEquals(4, a.v<ViewGroup>(R.id.categoryContainer).childCount) // solo grupos de galería
            // Aviso destacado arriba: solo galería, con botón para activar; la línea de alcance lo dice.
            assertEquals(View.VISIBLE, a.v<View>(R.id.scopeBanner).visibility)
            assertEquals(a.getString(R.string.scope_gallery), a.v<TextView>(R.id.resultsScope).text.toString())
            val tools = a.v<ViewGroup>(R.id.toolsContainer).children()
            assertEquals(4, tools.size)
            assertEquals(a.getString(R.string.tool_usage_title), tools[0].findViewById<TextView>(R.id.title).text.toString())
            Screenshots.snap(a.window.decorView, "10-resultados-sin-permisos")
            tools[0].findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            assertEquals(Settings.ACTION_USAGE_ACCESS_SETTINGS, shadowOf(a).nextStartedActivity.action)
            a.v<MaterialButton>(R.id.scopeBannerButton).performClick()
            idle()
            assertEquals(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, shadowOf(a).nextStartedActivity.action)
        }
        // Esta vez el usuario sí activa el permiso: al volver se analiza todo sin tocar nada.
        ScanEngine.allFilesAccess = { true }
        scenario.moveToState(Lifecycle.State.STARTED)
        scenario.moveToState(Lifecycle.State.RESUMED)
        scenario.onActivity { a ->
            waitUntil("re-análisis completo") {
                a.v<View>(R.id.resultsGroup).visibility == View.VISIBLE && ScanStore.scope.allFiles
            }
            assertEquals(View.GONE, a.v<View>(R.id.scopeBanner).visibility)
            assertTrue(a.v<TextView>(R.id.resultsScope).text.contains("archivos del teléfono"))
        }
    }
}
