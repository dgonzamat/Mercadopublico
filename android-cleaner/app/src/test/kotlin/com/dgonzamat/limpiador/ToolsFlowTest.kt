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
        ScanEngine.securityScan = { SecurityScanner(it).scan() }
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

            // Con ambos permisos quedan la caché y Play Protect; el botón de caché abre el diálogo del sistema.
            val tools = a.v<ViewGroup>(R.id.toolsContainer).children()
            assertEquals(2, tools.size)
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
        ScanEngine.securityScan = { SecurityScanner(it) { facts }.scan() }
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
            assertEquals(listOf(FakeApps.UNUSED, FakeApps.NEVER), suspicious.map { it.packageName }) // la de tienda no
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
            assertTrue(label.text.toString(), label.text.contains("Riesgo alto: no viene de una tienda, controla la pantalla"))
            assertEquals(androidx.core.content.ContextCompat.getColor(c, R.color.danger), label.currentTextColor)
            Screenshots.snap(c.window.decorView, "13-revision-seguridad")
        }

        // Limpiar solo las sospechosas: una se desinstala; la administradora no, y se avisa cómo seguir.
        scenario.onActivity { a ->
            idle()
            ScanStore.items.forEach { it.selected = it.category == Category.SUSPICIOUS_APPS }
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            idle()
            (ShadowDialog.getLatestDialog() as AlertDialog).getButton(AlertDialog.BUTTON_POSITIVE).performClick()
            val pm = shadowOf(a.packageManager)
            var del: org.robolectric.shadows.ShadowActivity.IntentForResult? = null
            waitUntil("desinstalación 1") { del = a.nextResultRequest(); del != null }
            assertEquals("package:${FakeApps.UNUSED}", del!!.intent.dataString)
            pm.removePackage(FakeApps.UNUSED)
            shadowOf(a).receiveResult(del!!.intent, Activity.RESULT_OK, null)
            idle()
            val admin = a.nextResultRequest()
            assertEquals("package:${FakeApps.NEVER}", admin!!.intent.dataString)
            shadowOf(a).receiveResult(admin.intent, Activity.RESULT_CANCELED, null) // Android no la deja ir
            idle()
            assertEquals(View.VISIBLE, a.v<View>(R.id.doneGroup).visibility)
            assertNotNull(a.window.decorView.findText(a.getString(R.string.admin_blocks_uninstall, "Servicio de actualización")))
        }
        ScanEngine.securityScan = { SecurityScanner(it).scan() }
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
            assertEquals(2, tools.size)
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
