package com.dgonzamat.limpiador

import android.app.AppOpsManager
import android.app.usage.StorageStatsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Process
import java.util.concurrent.TimeUnit

/**
 * Apps instaladas por el usuario que no se han abierto en [UNUSED_DAYS] días, con
 * su tamaño real (app + datos + caché). Necesita «Acceso a datos de uso».
 */
class AppScanner(private val context: Context) {

    companion object {
        const val UNUSED_DAYS = 60L

        fun hasUsageAccess(context: Context): Boolean {
            val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
            return mode == AppOpsManager.MODE_ALLOWED
        }
    }

    fun scan(): List<JunkItem> {
        if (!hasUsageAccess(context)) return emptyList()
        val now = System.currentTimeMillis()
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_YEARLY, now - TimeUnit.DAYS.toMillis(365), now) ?: emptyList()
        val lastUsed = HashMap<String, Long>()
        for (s in stats) {
            val prev = lastUsed[s.packageName] ?: 0L
            if (s.lastTimeUsed > prev) lastUsed[s.packageName] = s.lastTimeUsed
        }
        val ssm = context.getSystemService(Context.STORAGE_STATS_SERVICE) as StorageStatsManager
        val pm = context.packageManager
        val out = mutableListOf<JunkItem>()
        for (app in pm.getInstalledApplications(0)) {
            if (app.flags and ApplicationInfo.FLAG_SYSTEM != 0) continue
            if (app.packageName == context.packageName) continue
            val last = lastUsed[app.packageName] ?: 0L
            val idleDays = TimeUnit.MILLISECONDS.toDays(now - last)
            if (last > 0 && idleDays < UNUSED_DAYS) continue
            val size = try {
                val st = ssm.queryStatsForPackage(app.storageUuid, app.packageName, Process.myUserHandle())
                st.appBytes + st.dataBytes + st.cacheBytes
            } catch (e: Exception) {
                0L
            }
            val note = if (last == 0L) context.getString(R.string.note_never_used)
            else context.getString(R.string.note_last_used_days, idleDays.toInt())
            out += JunkItem(
                Category.UNUSED_APPS, pm.getApplicationLabel(app).toString(), size, note,
                packageName = app.packageName, dateModified = last,
            )
        }
        return out.sortedByDescending { it.size }
    }
}
