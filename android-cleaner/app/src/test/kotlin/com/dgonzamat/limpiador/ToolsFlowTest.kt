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

            // Con ambos permisos solo queda la herramienta de caché; su botón abre el diálogo del sistema.
            val tools = a.v<ViewGroup>(R.id.toolsContainer).children()
            assertEquals(1, tools.size)
            tools[0].findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            val cacheReq = shadowOf(a).nextStartedActivityForResult
            assertNotNull(cacheReq)
            assertEquals(StorageManager.ACTION_CLEAR_APP_CACHE, cacheReq.intent.action)
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
            waitUntil("borrado de galería") { req = shadowOf(a).nextStartedActivityForResult; req != null }
            shadowOf(a).receiveResult(req!!.intent, Activity.RESULT_OK, null)
            idle()
            // 2. Apps, una por una: ACTION_DELETE con package:… y resultado.
            val pm = shadowOf(a.packageManager)
            for (pkg in listOf(FakeApps.UNUSED, FakeApps.NEVER)) {
                val del = shadowOf(a).nextStartedActivityForResult
                assertNotNull("desinstalación de $pkg", del)
                assertEquals(Intent.ACTION_DELETE, del.intent.action)
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
            val label = cell.findViewById<TextView>(R.id.label).text.toString()
            assertTrue(label, label.startsWith("App olvidada\n150,0 MB · "))
            Screenshots.snap(c.window.decorView, "09-revision-apps")
            cell.performLongClick()
            val info = shadowOf(c).nextStartedActivity
            assertEquals(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, info.action)
            assertEquals("package:${FakeApps.UNUSED}", info.dataString)
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
            val tools = a.v<ViewGroup>(R.id.toolsContainer).children()
            assertEquals(2, tools.size)
            assertEquals(a.getString(R.string.tool_allfiles_title), tools[0].findViewById<TextView>(R.id.title).text.toString())
            assertEquals(a.getString(R.string.tool_usage_title), tools[1].findViewById<TextView>(R.id.title).text.toString())
            Screenshots.snap(a.window.decorView, "10-resultados-sin-permisos")
            tools[1].findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            assertEquals(Settings.ACTION_USAGE_ACCESS_SETTINGS, shadowOf(a).nextStartedActivity.action)
            tools[0].findViewById<MaterialButton>(R.id.button).performClick()
            idle()
            assertEquals(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, shadowOf(a).nextStartedActivity.action)
        }
    }
}
