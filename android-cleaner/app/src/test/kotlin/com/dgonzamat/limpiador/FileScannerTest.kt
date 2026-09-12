package com.dgonzamat.limpiador

import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.io.RandomAccessFile
import java.util.concurrent.TimeUnit

/** Arma un almacenamiento de prueba en un directorio temporal. */
object FakeStorage {
    fun build(): File {
        val root = createTempDirRoot()
        val now = System.currentTimeMillis()
        val d60 = now - TimeUnit.DAYS.toMillis(60)
        fun file(rel: String, size: Int = 10, mtime: Long = now) = File(root, rel).apply {
            parentFile!!.mkdirs()
            writeBytes(ByteArray(size))
            setLastModified(mtime)
        }
        file("Download/informe-viejo.pdf", mtime = d60)          // descarga antigua
        file("Download/foto-vieja.jpg", mtime = d60)              // descarga antigua (imagen también cuenta)
        file("Download/reciente.pdf")                             // normal
        file("Download/instalador.apk")                           // APK
        file("DCIM/Camera/IMG_1.jpg", size = 100)                 // normal
        file("DCIM/.thumbnails/1.jpg", size = 300)                // carpeta de caché (entera)
        file("DCIM/.thumbnails/2.jpg", size = 200)
        file("Documents/notas.log")                               // temporal
        file("Documents/vacio.txt", size = 0)                     // 0 bytes
        file("Android/data/com.x/cache/junk.tmp")                 // inaccesible: se salta
        file("Android/media/com.whatsapp/WhatsApp/Media/.Statuses/s.jpg", size = 50) // caché de WhatsApp
        File(root, "Pictures/Vacia").mkdirs()                    // carpeta vacía
        File(root, "Pictures").mkdirs()                           // estándar: aunque solo tenga Vacia, no se propone
        File(root, "Movies").mkdirs()                             // estándar vacía: no se propone
        RandomAccessFile(File(root, "Documents/respaldo.zip").also { it.parentFile!!.mkdirs() }, "rw").use {
            it.setLength(FileScanner.LARGE_MIN_BYTES + 1)         // archivo grande (sparse)
        }
        RandomAccessFile(File(root, "Movies/pelicula.mp4"), "rw").use { it.setLength(FileScanner.LARGE_MIN_BYTES + 1) } // video: lo cubre la galería
        // Documentos repetidos: el mismo contrato guardado dos veces (se conserva el más antiguo) y un
        // «falso repetido» del mismo tamaño pero distinto contenido, que las etapas de hash descartan.
        val contrato = ByteArray(20_000) { (it % 251).toByte() }
        File(root, "Documents/contrato.pdf").apply { writeBytes(contrato); setLastModified(d60) }
        File(root, "Download/contrato (1).pdf").apply { writeBytes(contrato); setLastModified(now) }
        File(root, "Documents/otro.pdf").apply { writeBytes(contrato.copyOf().also { it[0] = 9 }); setLastModified(now) }
        return root
    }

    private fun createTempDirRoot(): File = File(System.getProperty("java.io.tmpdir"), "fake-storage-" + System.nanoTime()).apply { mkdirs() }
}

@RunWith(RobolectricTestRunner::class)
class FileScannerTest {

    @Test
    fun clasifica_el_almacenamiento_de_prueba() {
        val root = FakeStorage.build()
        try {
            val items = kotlinx.coroutines.runBlocking { FileScanner(root).scan() }
            fun names(cat: Category) = items.filter { it.category == cat }.map { it.name }.toSet()

            assertEquals(setOf(".thumbnails", ".Statuses", "notas.log", "vacio.txt", "Vacia"), names(Category.RESIDUE))
            assertEquals(setOf("instalador.apk"), names(Category.APK_FILES))
            assertEquals(setOf("informe-viejo.pdf", "foto-vieja.jpg"), names(Category.OLD_DOWNLOADS))
            assertEquals(setOf("respaldo.zip"), names(Category.LARGE_FILES))
            assertEquals(setOf("contrato (1).pdf"), names(Category.DUPLICATE_FILES))
            assertEquals(10, items.size)
            // El repetido apunta al original más antiguo y viene preseleccionado.
            val dup = items.single { it.category == Category.DUPLICATE_FILES }
            assertEquals("Copia de contrato.pdf", dup.note)
            assertTrue(dup.selected)
            assertTrue(dup.verified) // doble verificación byte a byte
            assertTrue(dup.originalPath!!.endsWith("Documents/contrato.pdf"))
            assertTrue(DuplicateCheck.stillIdentical(dup, ApplicationProvider.getApplicationContext<android.content.Context>().contentResolver))
            // Si el original cambia, la doble verificación previa al borrado lo detecta.
            File(dup.originalPath!!).writeBytes(ByteArray(20_000) { 7 })
            assertFalse(DuplicateCheck.stillIdentical(dup, ApplicationProvider.getApplicationContext<android.content.Context>().contentResolver))
            // Sin buscar repetidos, el resto no cambia.
            val sinDup = kotlinx.coroutines.runBlocking { FileScanner(root, findDuplicates = false).scan() }
            assertEquals(9, sinDup.size)

            // La carpeta de caché suma el tamaño de su contenido y no se lista archivo por archivo.
            val thumbs = items.single { it.name == ".thumbnails" }
            assertTrue(thumbs.isDir)
            assertEquals(500L, thumbs.size)
            assertTrue(items.none { it.name == "1.jpg" })
            // Android/data no se recorre.
            assertTrue(items.none { it.name == "junk.tmp" })
            // Los residuos y APK vienen preseleccionados; las revisiones no.
            assertTrue(items.filter { it.category == Category.RESIDUE || it.category == Category.APK_FILES }.all { it.selected })
            assertTrue(items.filter { it.category == Category.OLD_DOWNLOADS || it.category == Category.LARGE_FILES }.none { it.selected })
            // Todos son FILE y apuntan a rutas absolutas existentes.
            assertTrue(items.all { it.kind == Kind.FILE && File(it.path!!).exists() })
        } finally {
            root.deleteRecursively()
        }
    }
}
