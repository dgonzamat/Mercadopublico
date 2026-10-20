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
    /**
     * [times]: pantallas que abrió; [background]: veces que arrancó un servicio con aviso fijo en
     * la barra; [hidden]: no tiene ícono en el lanzador, así que el usuario no pudo abrirla.
     */
    data class Appearance(
        val packageName: String, val label: String, val lastSeen: Long, val times: Int,
        val background: Int = 0, val hidden: Boolean = false,
    )

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
        val launchable = try {
            pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0)
                .map { it.activityInfo.packageName }.toSet()
        } catch (e: Exception) { null }
        return events(context, since, now)
            .filter { it.type != UsageEvents.Event.ACTIVITY_PAUSED }
            .groupBy { it.pkg }
            .mapNotNull { (pkg, list) ->
                if (pkg == context.packageName || pkg == home) return@mapNotNull null
                val info = try { pm.getApplicationInfo(pkg, 0) } catch (e: Exception) { return@mapNotNull null }
                if (info.flags and ApplicationInfo.FLAG_SYSTEM != 0) return@mapNotNull null
                Appearance(
                    pkg, pm.getApplicationLabel(info).toString(), list.maxOf { it.time },
                    times = list.count { it.type == UsageEvents.Event.ACTIVITY_RESUMED },
                    background = list.count { it.type == UsageEvents.Event.FOREGROUND_SERVICE_START },
                    hidden = launchable != null && pkg !in launchable,
                )
            }
            .sortedByDescending { it.lastSeen }
    }

    /**
     * Paquete → tiempo en pantalla (ms) desde [since]: de cada pantalla abierta hasta que se
     * pausa o la reemplaza otra app (solo una está en primer plano a la vez). Una que sigue
     * abierta cuenta hasta [now]. Es el mismo dato que «Tiempo de uso» de Android, por app.
     */
    fun screenTime(context: Context, since: Long, now: Long = System.currentTimeMillis()): Map<String, Long> {
        val total = HashMap<String, Long>()
        var open: Pair<String, Long>? = null
        fun close(at: Long) {
            open?.let { (pkg, start) -> total[pkg] = (total[pkg] ?: 0L) + (at - start).coerceAtLeast(0) }
            open = null
        }
        for (e in events(context, since, now).sortedBy { it.time }) when (e.type) {
            UsageEvents.Event.ACTIVITY_RESUMED -> if (open?.first != e.pkg) { close(e.time); open = e.pkg to e.time }
            UsageEvents.Event.ACTIVITY_PAUSED -> if (open?.first == e.pkg) close(e.time)
        }
        close(now)
        return total
    }

    /**
     * Paquete → promedio diario de tiempo en pantalla (ms) en los 7 días anteriores a las
     * últimas 24 h, según las estadísticas diarias de Android (se guardan más tiempo que el
     * registro de eventos). Vacío sin acceso de uso.
     */
    fun dailyBaseline(context: Context, now: Long = System.currentTimeMillis()): Map<String, Long> {
        if (!ScanEngine.usageAccess(context)) return emptyMap()
        return try {
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 8 * DAY_MS, now - DAY_MS)
                .orEmpty()
                .groupBy { it.packageName }
                .mapValues { (_, days) -> days.sumOf { it.totalTimeInForeground } / 7 }
        } catch (e: Exception) {
            emptyMap()
        }
    }

    const val DAY_MS = 24 * 3600_000L

    private data class Ev(val pkg: String, val time: Long, val type: Int)

    private val TYPES = setOf(
        UsageEvents.Event.ACTIVITY_RESUMED, UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.FOREGROUND_SERVICE_START,
    )

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
