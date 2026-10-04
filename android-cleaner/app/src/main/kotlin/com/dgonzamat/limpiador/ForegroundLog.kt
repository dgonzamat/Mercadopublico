package com.dgonzamat.limpiador

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo

/**
 * Qué apps pasaron a primer plano y cuándo, según el registro de uso de Android (necesita
 * «Acceso a datos de uso»). Sirve para descubrir qué app abre anuncios a pantalla completa:
 * la pantalla del anuncio pertenece a la app que lo lanza.
 */
object ForegroundLog {
    /** [times]: pantallas que abrió; [background]: veces que arrancó un servicio con aviso fijo en la barra. */
    data class Appearance(val packageName: String, val label: String, val lastSeen: Long, val times: Int, val background: Int = 0)

    /**
     * Paquete → veces que ocurrió [type] desde [since] (ms): por defecto, pantallas abiertas.
     * Vacío sin acceso de uso.
     */
    fun counts(
        context: Context,
        since: Long,
        now: Long = System.currentTimeMillis(),
        type: Int = UsageEvents.Event.ACTIVITY_RESUMED,
    ): Map<String, Int> = events(context, since, now).filter { it.type == type }.groupingBy { it.pkg }.eachCount()

    /**
     * Apps del usuario que mostraron una pantalla o arrancaron un servicio en primer plano (el
     * aviso fijo con el nombre de la app en la barra) desde [since], la más reciente primero.
     * Los anuncios que salen como aviso, no como pantalla, solo dejan ese segundo rastro.
     * Excluye esta app, el lanzador y las apps del sistema (no se pueden desinstalar).
     */
    fun recentUserApps(context: Context, since: Long, now: Long = System.currentTimeMillis()): List<Appearance> {
        val pm = context.packageManager
        val home = try {
            pm.resolveActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0)?.activityInfo?.packageName
        } catch (e: Exception) { null }
        return events(context, since, now)
            .groupBy { it.pkg }
            .mapNotNull { (pkg, list) ->
                if (pkg == context.packageName || pkg == home) return@mapNotNull null
                val info = try { pm.getApplicationInfo(pkg, 0) } catch (e: Exception) { return@mapNotNull null }
                if (info.flags and ApplicationInfo.FLAG_SYSTEM != 0) return@mapNotNull null
                Appearance(
                    pkg, pm.getApplicationLabel(info).toString(), list.maxOf { it.time },
                    times = list.count { it.type == UsageEvents.Event.ACTIVITY_RESUMED },
                    background = list.count { it.type == UsageEvents.Event.FOREGROUND_SERVICE_START },
                )
            }
            .sortedByDescending { it.lastSeen }
    }

    private data class Ev(val pkg: String, val time: Long, val type: Int)

    private val TYPES = setOf(UsageEvents.Event.ACTIVITY_RESUMED, UsageEvents.Event.FOREGROUND_SERVICE_START)

    private fun events(context: Context, since: Long, now: Long): List<Ev> {
        if (!ScanEngine.usageAccess(context)) return emptyList()
        val out = mutableListOf<Ev>()
        try {
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val ev = usm.queryEvents(since, now) ?: return emptyList()
            val e = UsageEvents.Event()
            while (ev.hasNextEvent()) {
                ev.getNextEvent(e)
                if (e.eventType in TYPES) out += Ev(e.packageName, e.timeStamp, e.eventType)
            }
        } catch (e: Exception) {
            // sin registro no hay pista, pero el análisis sigue
        }
        return out
    }
}
