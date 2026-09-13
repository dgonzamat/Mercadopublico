package com.dgonzamat.limpiador

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream

/** La comparación byte a byte que respalda al hash. */
class DuplicateCheckTest {

    private fun stream(bytes: ByteArray) = { ByteArrayInputStream(bytes) }

    @Test
    fun iguales_distintos_y_de_largo_distinto() {
        val a = ByteArray(200_000) { (it % 7).toByte() }
        assertTrue(DuplicateCheck.identical(stream(a), stream(a.copyOf())))
        assertFalse(DuplicateCheck.identical(stream(a), stream(a.copyOf().also { it[199_999] = 99 }))) // último byte
        assertFalse(DuplicateCheck.identical(stream(a), stream(a.copyOf(199_999))))                 // uno más corto
        assertTrue(DuplicateCheck.identical(stream(ByteArray(0)), stream(ByteArray(0))))
        assertFalse(DuplicateCheck.identical({ null }, stream(a)))                                    // no se pudo abrir
    }
}
