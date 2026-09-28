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
    data class Appearance(val packageName: String, val label: String, val lastSeen: Long, val times: Int)

    /** Paquete → veces que mostró una pantalla desde [since] (ms). Vacío sin acceso de uso. */
    fun counts(context: Context, since: Long, now: Long = System.currentTimeMillis()): Map<String, Int> =
        events(context, since, now).groupingBy { it.first }.eachCount()

    /**
     * Apps del usuario que mostraron una pantalla desde [since], la más reciente primero.
     * Excluye esta app, el lanzador y las apps del sistema (no se pueden desinstalar).
     */
    fun recentUserApps(context: Context, since: Long, now: Long = System.currentTimeMillis()): List<Appearance> {
        val pm = context.packageManager
        val home = try {
            pm.resolveActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0)?.activityInfo?.packageName
        } catch (e: Exception) { null }
        return events(context, since, now)
            .groupBy { it.first }
            .mapNotNull { (pkg, list) ->
                if (pkg == context.packageName || pkg == home) return@mapNotNull null
                val info = try { pm.getApplicationInfo(pkg, 0) } catch (e: Exception) { return@mapNotNull null }
                if (info.flags and ApplicationInfo.FLAG_SYSTEM != 0) return@mapNotNull null
                Appearance(pkg, pm.getApplicationLabel(info).toString(), list.maxOf { it.second }, list.size)
            }
            .sortedByDescending { it.lastSeen }
    }

    private fun events(context: Context, since: Long, now: Long): List<Pair<String, Long>> {
        if (!ScanEngine.usageAccess(context)) return emptyList()
        val out = mutableListOf<Pair<String, Long>>()
        try {
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val ev = usm.queryEvents(since, now) ?: return emptyList()
            val e = UsageEvents.Event()
            while (ev.hasNextEvent()) {
                ev.getNextEvent(e)
                if (e.eventType == UsageEvents.Event.ACTIVITY_RESUMED) out += e.packageName to e.timeStamp
            }
        } catch (e: Exception) {
            // sin registro no hay pista, pero el análisis sigue
        }
        return out
    }
}
