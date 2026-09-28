package com.dgonzamat.limpiador

import kotlinx.coroutines.delay
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/** Veredicto de VirusTotal para una huella. */
sealed class VtVerdict {
    /** El archivo ya fue analizado: cuántos motores lo marcan como malicioso, de cuántos. */
    data class Found(val malicious: Int, val suspicious: Int, val engines: Int) : VtVerdict()
    /** VirusTotal nunca vio ese archivo (no es lo mismo que «limpio»). */
    object Unknown : VtVerdict()
}

/** Estado de las consultas del último análisis, para decirlo en pantalla. */
enum class VtStatus { OFF, OK, LIMITED, BAD_KEY, QUOTA, OFFLINE }

data class VtReport(val status: VtStatus = VtStatus.OFF, val checked: Int = 0, val detected: Int = 0)

/**
 * Antivirus en la nube: consulta la huella SHA-256 de un archivo en VirusTotal, que la
 * compara con los resultados de sus motores antivirus. Solo sale la huella, nunca el archivo.
 *
 * La API pública gratuita permite 4 consultas por minuto y 500 por día (condiciones de
 * VirusTotal; pueden cambiar). Por eso se espera [MIN_INTERVAL_MS] entre consultas y se
 * consultan como máximo [MAX_LOOKUPS] huellas por análisis.
 */
class VirusTotal(
    private val apiKey: String,
    private val http: (url: String, apiKey: String) -> Pair<Int, String> = ::defaultGet,
    private val wait: suspend (Long) -> Unit = { delay(it) },
    private val clock: () -> Long = System::currentTimeMillis,
) {
    companion object {
        const val MIN_INTERVAL_MS = 15_000L
        const val MAX_LOOKUPS = 20
        const val API = "https://www.virustotal.com/api/v3/files/"

        fun sha256(file: File): String {
            val md = MessageDigest.getInstance("SHA-256")
            file.inputStream().use { input ->
                val buf = ByteArray(256 * 1024)
                while (true) {
                    val n = input.read(buf)
                    if (n <= 0) break
                    md.update(buf, 0, n)
                }
            }
            return md.digest().joinToString("") { "%02x".format(it) }
        }

        fun defaultGet(url: String, apiKey: String): Pair<Int, String> {
            val c = URL(url).openConnection() as HttpURLConnection
            return try {
                c.connectTimeout = 15_000
                c.readTimeout = 20_000
                c.setRequestProperty("x-apikey", apiKey)
                c.setRequestProperty("accept", "application/json")
                val code = c.responseCode
                val stream = if (code in 200..299) c.inputStream else c.errorStream
                code to (stream?.bufferedReader()?.use { it.readText() } ?: "")
            } finally {
                c.disconnect()
            }
        }

        /** Interpreta la respuesta de /api/v3/files/{sha256}. */
        fun parse(code: Int, body: String): VtVerdict = when (code) {
            200 -> {
                val stats = JSONObject(body).getJSONObject("data").getJSONObject("attributes")
                    .getJSONObject("last_analysis_stats")
                val engines = stats.keys().asSequence().sumOf { stats.optInt(it) }
                VtVerdict.Found(stats.optInt("malicious"), stats.optInt("suspicious"), engines)
            }
            404 -> VtVerdict.Unknown
            401, 403 -> throw VtError(VtStatus.BAD_KEY)
            429 -> throw VtError(VtStatus.QUOTA)
            else -> throw VtError(VtStatus.OFFLINE)
        }
    }

    class VtError(val status: VtStatus) : Exception(status.name)

    var status = VtStatus.OK
        private set
    var checked = 0
        private set
    var detected = 0
        private set
    private var lastCall = 0L

    fun report() = VtReport(status, checked, detected)

    /**
     * Veredicto para [file], o null si no se consultó: tras un error (clave, cuota, red) no se
     * insiste, y pasado el tope por análisis el estado queda en [VtStatus.LIMITED].
     */
    suspend fun check(file: File): VtVerdict? {
        if (status != VtStatus.OK && status != VtStatus.LIMITED) return null
        if (checked >= MAX_LOOKUPS) {
            status = VtStatus.LIMITED
            return null
        }
        val hash = try { sha256(file) } catch (e: Exception) { return null }
        val since = clock() - lastCall
        if (lastCall > 0 && since < MIN_INTERVAL_MS) wait(MIN_INTERVAL_MS - since)
        lastCall = clock()
        return try {
            val (code, body) = http(API + hash, apiKey)
            parse(code, body).also { v ->
                checked++
                if (v is VtVerdict.Found && v.malicious > 0) detected++
            }
        } catch (e: VtError) {
            status = e.status
            null
        } catch (e: Exception) {
            status = VtStatus.OFFLINE
            null
        }
    }
}
