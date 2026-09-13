package com.dgonzamat.limpiador

import android.content.ContentResolver
import java.io.File
import java.io.InputStream

/**
 * Doble verificación de repetidos. El hash ya dice «iguales»; esto lo confirma
 * byte a byte contra el original, y se repite justo antes de borrar por si el
 * original cambió o desapareció desde el análisis.
 */
object DuplicateCheck {

    /** true solo si ambos flujos se abren y son idénticos byte a byte. */
    fun identical(openA: () -> InputStream?, openB: () -> InputStream?): Boolean = try {
        val a = openA() ?: return false
        val b = openB() ?: run { a.close(); return false }
        a.use { ia ->
            b.use { ib ->
                val ba = ByteArray(64 * 1024)
                val bb = ByteArray(64 * 1024)
                while (true) {
                    val na = ia.readFully(ba)
                    val nb = ib.readFully(bb)
                    if (na != nb) return false
                    if (na == 0) return true
                    for (i in 0 until na) if (ba[i] != bb[i]) return false
                }
                @Suppress("UNREACHABLE_CODE")
                false
            }
        }
    } catch (e: Exception) {
        false
    }

    /** Vuelve a comparar un repetido con su original. true si sigue siendo copia exacta. */
    fun stillIdentical(item: JunkItem, resolver: ContentResolver): Boolean = when {
        item.originalUri != null && item.uri != null ->
            identical({ resolver.openInputStream(item.uri) }, { resolver.openInputStream(item.originalUri) })
        item.originalPath != null && item.path != null -> {
            val a = File(item.path)
            val b = File(item.originalPath)
            a.isFile && b.isFile && a.length() == b.length() && identical({ a.inputStream() }, { b.inputStream() })
        }
        else -> false
    }

    /** Llena el buffer lo más posible (read() puede devolver menos aunque queden bytes). */
    private fun InputStream.readFully(buf: ByteArray): Int {
        var off = 0
        while (off < buf.size) {
            val n = read(buf, off, buf.size - off)
            if (n <= 0) break
            off += n
        }
        return off
    }
}
