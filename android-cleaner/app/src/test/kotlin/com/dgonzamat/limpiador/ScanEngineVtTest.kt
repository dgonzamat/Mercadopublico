package com.dgonzamat.limpiador

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

/** Instaladores APK descargados: se consultan en VirusTotal, se anotan y el malware va primero. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-rCL")
class ScanEngineVtTest {
    private val ctx: Context = ApplicationProvider.getApplicationContext()
    private val saved = listOf(ScanEngine.storageRoot, ScanEngine.allFilesAccess, ScanEngine.usageAccess, ScanEngine.virusTotal)
    private val savedDispatcher = ScanEngine.uiDispatcher
    private lateinit var root: File

    @Before fun setUp() {
        root = java.nio.file.Files.createTempDirectory("apk-storage").toFile()
        ScanEngine.storageRoot = { root }
        ScanEngine.allFilesAccess = { true }
        ScanEngine.usageAccess = { false }
        ScanEngine.uiDispatcher = Dispatchers.Unconfined
    }

    @Suppress("UNCHECKED_CAST")
    @After fun tearDown() {
        ScanEngine.storageRoot = saved[0] as () -> File
        ScanEngine.allFilesAccess = saved[1] as (Context) -> Boolean
        ScanEngine.usageAccess = saved[2] as (Context) -> Boolean
        ScanEngine.virusTotal = saved[3] as (Context) -> VirusTotal?
        ScanEngine.uiDispatcher = savedDispatcher
        root.deleteRecursively()
    }

    private fun apk(name: String, size: Int, fill: Byte) =
        File(root, "Download/$name").apply { parentFile!!.mkdirs(); writeBytes(ByteArray(size) { fill }) }

    @Test
    fun el_apk_con_malware_se_anota_y_va_primero() = runBlocking {
        val bad = apk("juego-gratis.apk", 1_000, 1)
        apk("limpio.apk", 5_000, 2)
        apk("desconocido.apk", 3_000, 3)
        val badHash = VirusTotal.sha256(bad)
        val cleanHash = VirusTotal.sha256(File(root, "Download/limpio.apk"))
        val asked = mutableListOf<String>()
        ScanEngine.virusTotal = {
            VirusTotal("clave", http = { url, _ ->
                asked += url
                when {
                    url.endsWith(badHash) -> 200 to """{"data":{"attributes":{"last_analysis_stats":{"malicious":12,"suspicious":0,"undetected":50,"harmless":0}}}}"""
                    url.endsWith(cleanHash) -> 200 to """{"data":{"attributes":{"last_analysis_stats":{"malicious":0,"suspicious":0,"undetected":60,"harmless":2}}}}"""
                    else -> 404 to """{"error":{"code":"NotFoundError"}}"""
                }
            }, wait = {})
        }
        val progress = mutableListOf<ScanProgress>()
        val result = ScanEngine.scan(ctx, setOf(Category.APK_FILES)) { progress += it }

        val apks = result.items.filter { it.category == Category.APK_FILES }
        assertEquals(3, asked.size)
        // El malware sube al primer lugar aunque sea el más chico; el resto sigue por tamaño.
        assertEquals(listOf("juego-gratis.apk", "limpio.apk", "desconocido.apk"), apks.map { File(it.path!!).name })
        assertEquals(1012, apks[0].risk)
        assertTrue(apks[0].selected)
        assertTrue(apks[0].note!!, apks[0].note!!.startsWith("MALWARE: lo detectan 12 de 62 antivirus (VirusTotal)"))
        assertTrue(apks[1].note!!, apks[1].note!!.startsWith("VirusTotal: ninguno de 62 antivirus lo detecta"))
        assertTrue(apks[2].note!!, apks[2].note!!.startsWith("VirusTotal no conoce este archivo"))
        assertEquals(VtReport(VtStatus.OK, 3, 1), result.scope.vt)
        assertEquals(ScanProgress.Antivirus(3), progress.last { it is ScanProgress.Antivirus })
    }

    @Test
    fun sin_clave_no_se_consulta_nada() = runBlocking {
        apk("juego-gratis.apk", 1_000, 1)
        ScanEngine.virusTotal = { null }
        val result = ScanEngine.scan(ctx, setOf(Category.APK_FILES)) {}
        val apk = result.items.single { it.category == Category.APK_FILES }
        assertEquals(0, apk.risk)
        assertTrue(apk.note.isNullOrEmpty() || !apk.note!!.contains("VirusTotal"))
        assertEquals(VtReport(), result.scope.vt)
    }
}
