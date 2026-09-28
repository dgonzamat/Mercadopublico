package com.dgonzamat.limpiador

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

@RunWith(RobolectricTestRunner::class)
class VirusTotalTest {

    private fun file(b: Byte) = File.createTempFile("vtapk", ".apk").apply { writeBytes(ByteArray(16) { b }); deleteOnExit() }

    @Test
    fun interpreta_las_respuestas_de_la_api() {
        val found = VirusTotal.parse(200, """{"data":{"attributes":{"last_analysis_stats":{"malicious":5,"suspicious":1,"undetected":60,"harmless":0,"timeout":2,"type-unsupported":4,"failure":0}}}}""")
        assertEquals(VtVerdict.Found(5, 1, 72), found)
        assertEquals(VtVerdict.Unknown, VirusTotal.parse(404, """{"error":{"code":"NotFoundError"}}"""))
        for ((code, status) in listOf(401 to VtStatus.BAD_KEY, 403 to VtStatus.BAD_KEY, 429 to VtStatus.QUOTA, 500 to VtStatus.OFFLINE)) {
            val e = runCatching { VirusTotal.parse(code, "{}") }.exceptionOrNull() as VirusTotal.VtError
            assertEquals(status, e.status)
        }
    }

    @Test
    fun huella_sha256_del_archivo() {
        val f = File.createTempFile("vtapk", ".txt").apply { writeText("abc"); deleteOnExit() }
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", VirusTotal.sha256(f))
    }

    @Test
    fun respeta_la_cuota_espera_entre_consultas_y_tiene_tope() = runBlocking {
        var now = 1_000_000L
        val waits = mutableListOf<Long>()
        val urls = mutableListOf<String>()
        val vt = VirusTotal("k", http = { url, key -> assertEquals("k", key); urls += url; 404 to "{}" },
            wait = { waits += it; now += it }, clock = { now })
        repeat(VirusTotal.MAX_LOOKUPS + 3) { vt.check(file(it.toByte())) }
        assertEquals(VirusTotal.MAX_LOOKUPS, urls.size)
        assertEquals(VirusTotal.MAX_LOOKUPS - 1, waits.size)           // la primera no espera
        assertEquals(VirusTotal.MIN_INTERVAL_MS, waits.first())
        assertEquals(VtStatus.LIMITED, vt.status)
        assertEquals(true, urls.first().startsWith(VirusTotal.API))
    }

    @Test
    fun tras_una_clave_rechazada_no_insiste() = runBlocking {
        var calls = 0
        val vt = VirusTotal("mala", http = { _, _ -> calls++; 401 to """{"error":{"code":"WrongCredentialsError"}}""" }, wait = {})
        assertNull(vt.check(file(1)))
        assertNull(vt.check(file(2)))
        assertEquals(1, calls)
        assertEquals(VtReport(VtStatus.BAD_KEY, 0, 0), vt.report())
    }

    @Test
    fun sin_red_queda_en_offline() = runBlocking {
        val vt = VirusTotal("k", http = { _, _ -> throw java.io.IOException("sin red") }, wait = {})
        assertNull(vt.check(file(1)))
        assertEquals(VtStatus.OFFLINE, vt.status)
    }
}
