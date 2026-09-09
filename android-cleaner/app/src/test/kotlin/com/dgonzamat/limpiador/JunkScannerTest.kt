package com.dgonzamat.limpiador

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class JunkScannerTest {

    @Before
    fun setUp() = FakeGallery.install()

    @Test
    fun clasifica_la_galeria_de_prueba() = runBlocking {
        val resolver = ApplicationProvider.getApplicationContext<Context>().contentResolver
        val progress = mutableListOf<ScanProgress>()
        val items = JunkScanner(resolver).scan { progress += it }

        fun ids(cat: Category) = items.filter { it.category == cat }.map { it.uri!!.lastPathSegment!!.toLong() }.toSet()

        assertEquals(FakeGallery.EXPECTED_SCREENSHOTS, ids(Category.SCREENSHOTS))
        assertEquals(FakeGallery.EXPECTED_DUPLICATES, ids(Category.DUPLICATES))
        assertEquals(FakeGallery.EXPECTED_TINY, ids(Category.TINY))
        assertEquals(FakeGallery.EXPECTED_LARGE, ids(Category.LARGE_VIDEOS))
        assertEquals(6, items.size)

        // El duplicado apunta al original más antiguo y el falso duplicado (mismo tamaño, otro contenido) queda fuera.
        val dup = items.single { it.category == Category.DUPLICATES }
        assertEquals("IMG_0003.jpg", dup.note)
        assertTrue(items.none { it.name == "IMG_0004.jpg" })

        // Preselección: todo menos los videos pesados.
        assertTrue(items.filter { it.category != Category.LARGE_VIDEOS }.all { it.selected })
        assertTrue(items.filter { it.category == Category.LARGE_VIDEOS }.none { it.selected })

        // Progreso: primero Reading, luego Found con el total real.
        assertEquals(ScanProgress.Reading, progress.first())
        assertEquals(ScanProgress.Found(11), progress[1])
    }

    @Test
    fun formatSize_es_legible() {
        assertEquals("512 B", formatSize(512))
        assertEquals("20 KB", formatSize(20 * 1024))
        assertEquals("1.5 MB", formatSize(1536 * 1024))
        assertEquals("2.00 GB", formatSize(2L * 1024 * 1024 * 1024))
    }
}
