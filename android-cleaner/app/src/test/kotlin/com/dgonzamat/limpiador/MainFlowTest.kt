package com.dgonzamat.limpiador

import android.Manifest
import android.app.Activity
import androidx.appcompat.app.AlertDialog
import android.app.Application
import android.content.Intent
import android.os.Looper
import android.view.View
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import com.google.android.material.button.MaterialButton
import com.google.android.material.materialswitch.MaterialSwitch
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
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

/** Flujo completo: bienvenida → análisis → resultados → revisión → limpieza → listo. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "es-rCL-w411dp-h891dp-xxhdpi", application = LimpiadorApp::class)
class MainFlowTest {

    private lateinit var storage: java.io.File

    @Before
    fun setUp() {
        FakeGallery.install()
        ScanStore.items = emptyList()
        storage = FakeStorage.build()
        ScanEngine.storageRoot = { storage }
        ScanEngine.allFilesAccess = { true }
        ScanEngine.usageAccess = { false }
        val app = ApplicationProvider.getApplicationContext<Application>()
        shadowOf(app).grantPermissions(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO)
    }

    @org.junit.After
    fun tearDown() {
        storage.deleteRecursively()
    }

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()

    /** Bombea el looper principal hasta que [cond] se cumpla (el escaneo corre en Dispatchers.IO). */
    private fun waitUntil(what: String, cond: () -> Boolean) {
        repeat(400) {
            idle()
            if (cond()) return
            Thread.sleep(25)
        }
        throw AssertionError("timeout esperando: $what")
    }

    private fun <T : View> Activity.v(id: Int): T = findViewById(id)

    @Test
    fun flujo_completo_con_capturas() {
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        scenario.onActivity { a ->
            idle()
            // 1. Bienvenida
            assertEquals(View.VISIBLE, a.v<View>(R.id.welcomeGroup).visibility)
            assertEquals(View.GONE, a.v<View>(R.id.resultsGroup).visibility)
            val primary = a.v<MaterialButton>(R.id.primaryButton)
            assertEquals(a.getString(R.string.analyze), primary.text.toString())
            // Robolectric no informa espacio en disco (StatFs = 0): la tarjeta se oculta en vez de mostrar "0 B".
            assertEquals(View.GONE, a.v<View>(R.id.storageCard).visibility)
            Screenshots.snap(a.window.decorView, "01-inicio")

            // 2. Analizar: la galería falsa queda bloqueada hasta que abramos la compuerta.
            FakeMediaProvider.gate = java.util.concurrent.CountDownLatch(1)
            primary.performClick()
            idle()
            assertEquals(View.VISIBLE, a.v<View>(R.id.scanningGroup).visibility)
            assertEquals(View.GONE, a.v<View>(R.id.welcomeGroup).visibility)
            assertEquals(View.INVISIBLE, a.v<View>(R.id.bottomBar).visibility)
            // Fases visibles: galería (en curso) y archivos (pendiente); apps no, sin acceso de uso.
            val phases = a.v<android.view.ViewGroup>(R.id.scanPhases)
            assertEquals(View.VISIBLE, phases.visibility)
            assertEquals(2, phases.childCount)
            assertEquals(a.getString(R.string.phase_gallery), phases.getChildAt(0).findViewById<TextView>(R.id.phaseText).text.toString())
            assertEquals(a.getString(R.string.phase_files), phases.getChildAt(1).findViewById<TextView>(R.id.phaseText).text.toString())
            assertEquals(View.VISIBLE, phases.getChildAt(0).findViewById<View>(R.id.phaseSpinner).visibility)
            assertEquals(View.GONE, phases.getChildAt(1).findViewById<View>(R.id.phaseSpinner).visibility)
            Screenshots.snap(a.window.decorView, "02-analizando")
            FakeMediaProvider.gate!!.countDown()
        }

        scenario.onActivity { a ->
            waitUntil("resultados") { a.v<View>(R.id.resultsGroup).visibility == View.VISIBLE }
            // 3. Resultados: 4 tarjetas, título con el total, botón Limpiar con lo preseleccionado.
            val container = a.v<android.view.ViewGroup>(R.id.categoryContainer)
            assertEquals(9, container.childCount)
            val all = ScanStore.items
            assertEquals(16, all.size)
            val primary = a.v<MaterialButton>(R.id.primaryButton)
            assertTrue(primary.isEnabled)
            val preselected = all.filter { it.selected }.sumOf { it.size }
            assertEquals(a.getString(R.string.clean_now, formatSize(preselected)), primary.text.toString())
            // El título dice lo MARCADO (la misma cifra que el botón); el total encontrado va en el subtítulo.
            assertEquals(a.getString(R.string.results_title, formatSize(preselected)), a.v<TextView>(R.id.resultsTitle).text.toString())
            assertTrue(a.v<TextView>(R.id.resultsSubtitle).text.contains(formatSize(all.sumOf { it.size })))
            // Grupos buscados sin hallazgos: se nombran (similares no encontró nada; apps no se buscó).
            val empty = a.v<TextView>(R.id.emptyGroups)
            assertEquals(View.VISIBLE, empty.visibility)
            assertTrue(empty.text.contains(a.getString(R.string.cat_similar)))
            assertFalse(empty.text.contains(a.getString(R.string.cat_unused_apps)))

            // El interruptor de "Videos pesados" arranca apagado; el de capturas, encendido.
            val cards = (0 until container.childCount).map { container.getChildAt(it) }
            val titles = cards.map { it.findViewById<TextView>(R.id.title).text.toString() }
            assertEquals(
                listOf(
                    R.string.cat_screenshots, R.string.cat_duplicates, R.string.cat_dup_files, R.string.cat_tiny, R.string.cat_residue,
                    R.string.cat_apk, R.string.cat_large_videos, R.string.cat_large_files, R.string.cat_old_downloads,
                ).map(a::getString),
                titles,
            )
            // Herramientas: caché del sistema (hay acceso a archivos) y activar acceso de uso (no lo hay).
            val tools = a.v<android.view.ViewGroup>(R.id.toolsContainer)
            assertEquals(2, tools.childCount)
            assertEquals(a.getString(R.string.tool_cache_title), tools.getChildAt(0).findViewById<TextView>(R.id.title).text.toString())
            assertEquals(a.getString(R.string.tool_usage_title), tools.getChildAt(1).findViewById<TextView>(R.id.title).text.toString())
            assertEquals("1 archivo · 59 KB", cards[1].findViewById<TextView>(R.id.stats).text.toString())
            assertEquals("2 archivos · 879 KB", cards[0].findViewById<TextView>(R.id.stats).text.toString())
            assertTrue(a.v<TextView>(R.id.resultsSubtitle).text.startsWith("Encontramos 16 elementos"))
            assertTrue(cards[0].findViewById<MaterialSwitch>(R.id.toggle).isChecked)
            assertFalse(cards[6].findViewById<MaterialSwitch>(R.id.toggle).isChecked) // Videos pesados
            Screenshots.snap(a.window.decorView, "03-resultados")

            // Apagar capturas: el botón baja de tamaño y la tarjeta muestra el estado.
            cards[0].findViewById<MaterialSwitch>(R.id.toggle).performClick()
            idle()
            assertTrue(ScanStore.byCategory(Category.SCREENSHOTS).none { it.selected })
            val sinCapturas = all.filter { it.selected }.sumOf { it.size }
            assertEquals(a.getString(R.string.clean_now, formatSize(sinCapturas)), primary.text.toString())
            assertEquals(a.getString(R.string.results_title, formatSize(sinCapturas)), a.v<TextView>(R.id.resultsTitle).text.toString())
            cards[0].findViewById<MaterialSwitch>(R.id.toggle).performClick()
            idle()
            assertTrue(ScanStore.byCategory(Category.SCREENSHOTS).all { it.selected })

            // 4. Tocar la tarjeta abre la revisión de esa categoría.
            cards[0].performClick()
            idle()
            val next = shadowOf(a).nextStartedActivity
            assertNotNull(next)
            assertEquals(CategoryActivity::class.java.name, next.component?.className)
            assertEquals(Category.SCREENSHOTS.ordinal, next.getIntExtra(CategoryActivity.EXTRA_CATEGORY, -1))
        }

        // Revisión en cuadrícula (Activity aparte).
        val catIntent = Intent(ApplicationProvider.getApplicationContext(), CategoryActivity::class.java)
            .putExtra(CategoryActivity.EXTRA_CATEGORY, Category.SCREENSHOTS.ordinal)
        ActivityScenario.launch<CategoryActivity>(catIntent).onActivity { c ->
            idle()
            val grid = c.v<androidx.recyclerview.widget.RecyclerView>(R.id.grid)
            grid.measure(
                View.MeasureSpec.makeMeasureSpec(grid.width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(grid.height, View.MeasureSpec.EXACTLY),
            )
            grid.layout(grid.left, grid.top, grid.right, grid.bottom)
            idle()
            assertEquals(2, grid.adapter!!.itemCount)
            assertEquals(3, (grid.layoutManager as androidx.recyclerview.widget.GridLayoutManager).spanCount) // fotos: cuadrícula
            val summary = c.v<TextView>(R.id.selectionSummary)
            assertEquals(c.getString(R.string.selection_summary, 2, 2, formatSize(900_000)), summary.text.toString())
            assertEquals(c.getString(R.string.select_none), c.v<MaterialButton>(R.id.selectAllButton).text.toString())
            Screenshots.snap(c.window.decorView, "04-revision-capturas")

            // Desmarcar una celda con un toque.
            val cell = grid.findViewHolderForAdapterPosition(0)!!.itemView
            cell.performClick()
            idle()
            assertEquals(c.getString(R.string.selection_summary, 1, 2, formatSize(400_000)), summary.text.toString())
            assertEquals(c.getString(R.string.select_all), c.v<MaterialButton>(R.id.selectAllButton).text.toString())
            Screenshots.snap(c.window.decorView, "05-revision-una-desmarcada")

            // "Todos" vuelve a marcar; mantener presionado abre el visor del sistema.
            c.v<MaterialButton>(R.id.selectAllButton).performClick()
            idle()
            assertTrue(ScanStore.byCategory(Category.SCREENSHOTS).all { it.selected })
            cell.performLongClick()
            val view = shadowOf(c).nextStartedActivity
            assertEquals(Intent.ACTION_VIEW, view.action)
            assertEquals("image/*", view.type)
        }

        // Revisión de una categoría de archivos: etiqueta con nombre y nota, pulsación larga muestra info.
        val resIntent = Intent(ApplicationProvider.getApplicationContext(), CategoryActivity::class.java)
            .putExtra(CategoryActivity.EXTRA_CATEGORY, Category.RESIDUE.ordinal)
        ActivityScenario.launch<CategoryActivity>(resIntent).onActivity { c ->
            idle()
            val grid = c.v<androidx.recyclerview.widget.RecyclerView>(R.id.grid)
            grid.measure(
                View.MeasureSpec.makeMeasureSpec(grid.width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(grid.height, View.MeasureSpec.EXACTLY),
            )
            grid.layout(grid.left, grid.top, grid.right, grid.bottom)
            idle()
            assertEquals(5, grid.adapter!!.itemCount)
            assertEquals(c.getString(R.string.grid_hint_file), c.v<TextView>(R.id.hint).text.toString())
            // Archivos en filas (1 columna): nombre, tamaño · motivo y carpeta legibles sin truncar.
            assertEquals(1, (grid.layoutManager as androidx.recyclerview.widget.GridLayoutManager).spanCount)
            val first = grid.findViewHolderForAdapterPosition(0)!!.itemView
            assertEquals(".thumbnails", first.findViewById<TextView>(R.id.name).text.toString())
            assertTrue(first.findViewById<TextView>(R.id.label).text.contains(c.getString(R.string.note_cache_dir)))
            assertEquals(View.VISIBLE, first.findViewById<View>(R.id.path).visibility)
            assertTrue(first.findViewById<com.google.android.material.checkbox.MaterialCheckBox>(R.id.check).isChecked)
            Screenshots.snap(c.window.decorView, "05b-revision-residuos")
            first.performLongClick()
            idle()
            val info = ShadowDialog.getLatestDialog()
            assertNotNull(info)
            assertTrue(info.isShowing)
            info.dismiss()
        }

        // 5. Limpiar: diálogo de la app → petición al sistema → resultado OK → pantalla Listo.
        scenario.onActivity { a ->
            idle()
            val primary = a.v<MaterialButton>(R.id.primaryButton)
            primary.performClick()
            idle()
            val dialog = ShadowDialog.getLatestDialog()
            assertNotNull("diálogo de confirmación", dialog)
            assertTrue(dialog.isShowing)
            val selectedBefore = ScanStore.selected()
            val bytesBefore = selectedBefore.sumOf { it.size }
            val files = selectedBefore.filter { it.kind == Kind.FILE }
            assertTrue(files.isNotEmpty() && files.all { java.io.File(it.path!!).exists() })
            (dialog as AlertDialog).getButton(AlertDialog.BUTTON_POSITIVE).performClick()
            // 1. Los archivos se borran del disco de inmediato (en IO)…
            var req: org.robolectric.shadows.ShadowActivity.IntentForResult? = null
            waitUntil("petición de borrado al sistema") { req = shadowOf(a).nextStartedActivityForResult; req != null }
            assertTrue(files.none { java.io.File(it.path!!).exists() })
            // …2. y la galería pasa por el sistema (PendingIntent del proveedor falso).
            shadowOf(a).receiveResult(req!!.intent, Activity.RESULT_OK, null)
            idle()
            assertEquals(View.VISIBLE, a.v<View>(R.id.doneGroup).visibility)
            assertEquals(a.getString(R.string.done_title, formatSize(bytesBefore)), a.v<TextView>(R.id.doneTitle).text.toString())
            assertEquals(a.resources.getQuantityString(R.plurals.done_subtitle, selectedBefore.size, selectedBefore.size), a.v<TextView>(R.id.doneSubtitle).text.toString())
            assertEquals(a.getString(R.string.scan_again), primary.text.toString())
            Screenshots.snap(a.window.decorView, "06-listo")
        }
    }

    @Test
    fun desmarcar_un_grupo_en_el_inicio_lo_excluye_del_analisis() {
        ActivityScenario.launch(MainActivity::class.java).onActivity { a ->
            idle()
            val rows = a.v<android.view.ViewGroup>(R.id.welcomeGroups)
            assertEquals(Category.entries.size, rows.childCount)
            val heavyVideos = rows.getChildAt(Category.LARGE_VIDEOS.ordinal)
            assertTrue(heavyVideos.findViewById<com.google.android.material.checkbox.MaterialCheckBox>(R.id.check).isChecked)
            heavyVideos.performClick() // la fila entera es la casilla
            idle()
            assertFalse(heavyVideos.findViewById<com.google.android.material.checkbox.MaterialCheckBox>(R.id.check).isChecked)
            Screenshots.snap(a.window.decorView, "01b-inicio-grupo-desmarcado")

            a.v<MaterialButton>(R.id.primaryButton).performClick()
            waitUntil("resultados") { a.v<View>(R.id.resultsGroup).visibility == View.VISIBLE }
            assertEquals(8, a.v<android.view.ViewGroup>(R.id.categoryContainer).childCount)
            assertTrue(ScanStore.items.none { it.category == Category.LARGE_VIDEOS })
            // La elección se recuerda para la próxima vez.
            assertFalse(a.getSharedPreferences("limpiador", 0).getBoolean("scan_LARGE_VIDEOS", true))
        }
    }

    @Test
    fun cancelar_el_analisis_vuelve_al_inicio_sin_resultados() {
        ActivityScenario.launch(MainActivity::class.java).onActivity { a ->
            idle()
            FakeMediaProvider.gate = java.util.concurrent.CountDownLatch(1)
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            idle()
            assertEquals(View.VISIBLE, a.v<View>(R.id.scanningGroup).visibility)
            a.v<MaterialButton>(R.id.cancelScanButton).performClick()
            idle()
            assertEquals(View.VISIBLE, a.v<View>(R.id.welcomeGroup).visibility)
            assertEquals(a.getString(R.string.analyze), a.v<MaterialButton>(R.id.primaryButton).text.toString())
            FakeMediaProvider.gate!!.countDown()
            // El análisis cancelado no debe aparecer después ni mostrar un error.
            repeat(20) { idle(); Thread.sleep(25) }
            assertEquals(View.VISIBLE, a.v<View>(R.id.welcomeGroup).visibility)
            assertEquals(View.GONE, a.v<View>(R.id.resultsGroup).visibility)
            assertTrue(ScanStore.items.isEmpty())
        }
    }

    @Test
    fun sin_permiso_muestra_aviso_y_no_escanea() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        shadowOf(app).denyPermissions(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO)
        ScanEngine.allFilesAccess = { false }
        ActivityScenario.launch(MainActivity::class.java).onActivity { a ->
            idle()
            a.v<MaterialButton>(R.id.primaryButton).performClick()
            idle()
            // Sin «todos los archivos» primero se ofrece activarlo; el usuario elige solo la galería.
            val offer = ShadowDialog.getLatestDialog() as AlertDialog
            assertTrue(offer.isShowing)
            offer.getButton(AlertDialog.BUTTON_NEGATIVE).performClick()
            idle()
            // Se pidió el permiso de fotos al sistema; simulamos que el usuario lo niega.
            val req = shadowOf(a).nextStartedActivityForResult
            assertNotNull(req)
            shadowOf(a).receiveResult(req.intent, Activity.RESULT_CANCELED, null)
            idle()
            assertEquals(View.VISIBLE, a.v<View>(R.id.welcomeGroup).visibility)
            val hint = a.v<View>(R.id.permissionHint)
            assertEquals(View.VISIBLE, hint.visibility)
            // El aviso va arriba de la lista de grupos, no debajo (donde quedaba fuera de pantalla).
            assertTrue(hint.top < a.v<View>(R.id.welcomeGroups).top)
            assertEquals(View.GONE, a.v<View>(R.id.scanningGroup).visibility)
            Screenshots.snap(a.window.decorView, "07-sin-permiso")
        }
    }
}
