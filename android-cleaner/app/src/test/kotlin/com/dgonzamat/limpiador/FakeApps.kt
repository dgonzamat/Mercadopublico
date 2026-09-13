package com.dgonzamat.limpiador

import android.app.AppOpsManager
import android.app.usage.StorageStats
import android.app.usage.StorageStatsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.os.Process
import android.os.storage.StorageManager
import androidx.test.core.app.ApplicationProvider
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowUsageStatsManager
import org.robolectric.util.ReflectionHelpers
import java.util.concurrent.TimeUnit

/** Apps instaladas de prueba: una reciente, una sin abrir en 90 días, una nunca usada y una del sistema. */
object FakeApps {
    const val RECENT = "com.ejemplo.reciente"
    const val UNUSED = "com.ejemplo.olvidada"
    const val NEVER = "com.ejemplo.nunca"
    const val SYSTEM = "com.android.sistema"
    const val UNUSED_BYTES = 150L * 1024 * 1024
    const val NEVER_BYTES = 40L * 1024 * 1024

    fun install(usageAccess: Boolean = true) {
        val ctx = ApplicationProvider.getApplicationContext<Context>()
        val pm = shadowOf(ctx.packageManager)
        val now = System.currentTimeMillis()

        fun app(pkg: String, label: String, system: Boolean = false) {
            val info = PackageInfo().apply {
                packageName = pkg
                applicationInfo = ApplicationInfo().apply {
                    packageName = pkg
                    nonLocalizedLabel = label
                    flags = if (system) ApplicationInfo.FLAG_SYSTEM else 0
                    storageUuid = StorageManager.UUID_DEFAULT
                }
            }
            pm.installPackage(info)
        }
        app(RECENT, "App reciente")
        app(UNUSED, "App olvidada")
        app(NEVER, "App nunca abierta")
        app(SYSTEM, "Servicio del sistema", system = true)

        val usm = shadowOf(ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager)
        fun used(pkg: String, daysAgo: Long) = usm.addUsageStats(
            UsageStatsManager.INTERVAL_YEARLY,
            ShadowUsageStatsManager.UsageStatsBuilder.newBuilder().setPackageName(pkg)
                .setFirstTimeStamp(now - TimeUnit.DAYS.toMillis(daysAgo) - 1000)
                .setLastTimeStamp(now - TimeUnit.DAYS.toMillis(daysAgo))
                .setLastTimeUsed(now - TimeUnit.DAYS.toMillis(daysAgo)).build(),
        )
        used(RECENT, 3)
        used(UNUSED, 90)
        used(SYSTEM, 1)

        val ssm = shadowOf(ctx.getSystemService(Context.STORAGE_STATS_SERVICE) as StorageStatsManager)
        fun stats(app: Long, data: Long, cache: Long): StorageStats {
            val s = ReflectionHelpers.callConstructor(StorageStats::class.java)
            ReflectionHelpers.setField(s, "codeBytes", app)
            ReflectionHelpers.setField(s, "dataBytes", data)
            ReflectionHelpers.setField(s, "cacheBytes", cache)
            return s
        }
        ssm.addStorageStats(StorageManager.UUID_DEFAULT, UNUSED, Process.myUserHandle(), stats(100L * 1024 * 1024, 40L * 1024 * 1024, 10L * 1024 * 1024))
        ssm.addStorageStats(StorageManager.UUID_DEFAULT, NEVER, Process.myUserHandle(), stats(NEVER_BYTES, 0, 0))

        val ops = shadowOf(ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager)
        ops.setMode(
            AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName,
            if (usageAccess) AppOpsManager.MODE_ALLOWED else AppOpsManager.MODE_ERRORED,
        )
    }
}
