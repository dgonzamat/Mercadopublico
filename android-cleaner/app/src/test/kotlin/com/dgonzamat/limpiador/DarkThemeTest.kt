package com.dgonzamat.limpiador

import android.Manifest
import android.app.Application
import android.os.Looper
import android.view.View
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/** Resultados en tema oscuro: se renderiza sin fallar y con el tema nocturno aplicado. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "es-rCL-w411dp-h891dp-night-xxhdpi", application = LimpiadorApp::class)
class DarkThemeTest {

    private lateinit var storage: File

    @Before
    fun setUp() {
        FakeGallery.install()
        storage = FakeStorage.build()
        ScanEngine.storageRoot = { storage }
        ScanEngine.allFilesAccess = { true }
        ScanEngine.usageAccess = { false }
        shadowOf(ApplicationProvider.getApplicationContext<Application>())
            .grantPermissions(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO)
        // Resultados precalculados: la Activity arranca directo en esa pantalla.
        ScanStore.items = runBlocking { ScanEngine.scan(ApplicationProvider.getApplicationContext()) {} }.items
    }

    @After
    fun tearDown() = storage.deleteRecursively().let { }

    @Test
    fun resultados_en_oscuro() {
        ActivityScenario.launch(MainActivity::class.java).onActivity { a ->
            shadowOf(Looper.getMainLooper()).idle()
            assertEquals(View.VISIBLE, a.findViewById<View>(R.id.resultsGroup).visibility)
            val night = a.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK
            assertEquals(android.content.res.Configuration.UI_MODE_NIGHT_YES, night)
            Screenshots.snap(a.window.decorView, "11-resultados-oscuro")
        }
    }
}
