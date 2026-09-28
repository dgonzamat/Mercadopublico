package com.dgonzamat.limpiador

import android.Manifest
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.view.accessibility.AccessibilityManager
import androidx.core.app.NotificationManagerCompat
import java.io.File

/**
 * Lo que se sabe de una app instalada sin root: de dónde vino, qué permisos pide y qué
 * controles del sistema tiene activos. No incluye el contenido de la app: Android no deja
 * que otra app lo inspeccione.
 */
data class AppFacts(
    val packageName: String,
    val label: String,
    val size: Long,
    /** Paquete que la instaló (tienda o instalador de archivos); null si Android no lo informa. */
    val installer: String?,
    val permissions: Set<String>,
    val accessibilityOn: Boolean,
    val deviceAdmin: Boolean,
    val notificationListener: Boolean,
    val hasLauncherIcon: Boolean,
)

/** Señales de riesgo. Son las que usan troyanos bancarios y stalkerware; ninguna prueba por sí sola que una app sea maliciosa. */
enum class RiskSignal(val weight: Int, val textRes: Int) {
    SIDELOADED(2, R.string.reason_sideloaded),
    ACCESSIBILITY(3, R.string.reason_accessibility),
    DEVICE_ADMIN(3, R.string.reason_admin),
    SMS(2, R.string.reason_sms),
    SPY(2, R.string.reason_spy),
    NOTIFICATIONS(1, R.string.reason_notifications),
    HIDDEN(1, R.string.reason_hidden),
    INSTALLS_APPS(1, R.string.reason_installs),
    OVERLAY(1, R.string.reason_overlay),
}

data class RiskAssessment(val high: Boolean, val score: Int, val signals: List<RiskSignal>)

/** Reglas de riesgo, sin Android: se prueban con datos inventados. */
object RiskRules {
    /**
     * Tiendas con revisión de apps. No estoy seguro de que la lista cubra todas las tiendas
     * de fabricante: una tienda que falte aquí solo suma la señal «no viene de una tienda».
     */
    val TRUSTED_STORES = setOf(
        "com.android.vending",            // Google Play
        "com.sec.android.app.samsungapps", // Galaxy Store
        "com.huawei.appmarket",           // AppGallery
        "com.amazon.venezia",             // Amazon Appstore
        "com.xiaomi.mipicks",             // Xiaomi GetApps
        "com.xiaomi.market",              // Xiaomi GetApps (nombre anterior)
        "org.fdroid.fdroid",              // F-Droid
    )

    private val SMS = setOf(Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS)
    private val SPY = setOf(
        Manifest.permission.READ_CONTACTS, Manifest.permission.READ_CALL_LOG,
        Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CAMERA,
    )

    /** Mínimo para listar una app que no viene de una tienda: «no viene de una tienda» + 2 puntos más. */
    const val SIDELOADED_MIN_SCORE = 4
    const val HIGH_SCORE = 6

    fun signals(f: AppFacts): List<RiskSignal> = buildList {
        if (f.installer !in TRUSTED_STORES) add(RiskSignal.SIDELOADED)
        if (f.accessibilityOn) add(RiskSignal.ACCESSIBILITY)
        if (f.deviceAdmin) add(RiskSignal.DEVICE_ADMIN)
        if (f.permissions.any { it in SMS }) add(RiskSignal.SMS)
        if (f.permissions.count { it in SPY } >= 3) add(RiskSignal.SPY)
        if (f.notificationListener) add(RiskSignal.NOTIFICATIONS)
        if (!f.hasLauncherIcon) add(RiskSignal.HIDDEN)
        if (Manifest.permission.REQUEST_INSTALL_PACKAGES in f.permissions) add(RiskSignal.INSTALLS_APPS)
        if (Manifest.permission.SYSTEM_ALERT_WINDOW in f.permissions) add(RiskSignal.OVERLAY)
    }

    /**
     * null si la app no se lista. Las apps de tienda con permisos amplios son comunes (mensajería,
     * gestores de contraseñas), así que solo se listan si combinan accesibilidad y administrador.
     */
    fun assess(f: AppFacts): RiskAssessment? {
        val s = signals(f)
        val score = s.sumOf { it.weight }
        val sideloaded = RiskSignal.SIDELOADED in s
        val control = RiskSignal.ACCESSIBILITY in s || RiskSignal.DEVICE_ADMIN in s
        val listed = if (sideloaded) score >= SIDELOADED_MIN_SCORE
        else RiskSignal.ACCESSIBILITY in s && RiskSignal.DEVICE_ADMIN in s
        if (!listed) return null
        val high = score >= HIGH_SCORE || (sideloaded && control)
        return RiskAssessment(high, score, s)
    }
}

/**
 * Apps sospechosas instaladas por el usuario. No es un antivirus con base de firmas: no sabe
 * si una app es malware conocido, solo si reúne señales de riesgo. Nada se marca solo.
 */
class SecurityScanner(
    private val context: Context,
    private val facts: () -> List<AppFacts> = { collectFacts(context) },
) {

    fun scan(): List<JunkItem> = facts().mapNotNull { f ->
        val a = RiskRules.assess(f) ?: return@mapNotNull null
        val level = context.getString(if (a.high) R.string.risk_high else R.string.risk_medium)
        val reasons = a.signals.joinToString(", ") { context.getString(it.textRes) }
        JunkItem(
            Category.SUSPICIOUS_APPS, f.label, f.size, "$level: $reasons",
            packageName = f.packageName, risk = a.score + if (a.high) 100 else 0, deviceAdmin = f.deviceAdmin,
        )
    }.sortedWith(compareByDescending<JunkItem> { it.risk }.thenByDescending { it.size })

    companion object {
        /** Lee de Android lo que se puede saber de cada app instalada por el usuario. */
        @Suppress("DEPRECATION")
        fun collectFacts(context: Context): List<AppFacts> {
            val pm = context.packageManager
            val accessibility = try {
                (context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager)
                    .getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
                    .mapNotNull { it.resolveInfo?.serviceInfo?.packageName }.toSet()
            } catch (e: Exception) { emptySet() }
            val admins = try {
                (context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager)
                    .activeAdmins?.map { it.packageName }?.toSet() ?: emptySet()
            } catch (e: Exception) { emptySet() }
            val listeners = try { NotificationManagerCompat.getEnabledListenerPackages(context) } catch (e: Exception) { emptySet() }
            val launchable = try {
                pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0)
                    .map { it.activityInfo.packageName }.toSet()
            } catch (e: Exception) { emptySet() }

            return pm.getInstalledPackages(PackageManager.GET_PERMISSIONS).mapNotNull { p ->
                val app = p.applicationInfo ?: return@mapNotNull null
                if (app.flags and ApplicationInfo.FLAG_SYSTEM != 0) return@mapNotNull null
                if (p.packageName == context.packageName) return@mapNotNull null
                try {
                    val installer = try { pm.getInstallSourceInfo(p.packageName).installingPackageName } catch (e: Exception) { null }
                    AppFacts(
                        packageName = p.packageName,
                        label = pm.getApplicationLabel(app).toString(),
                        size = app.sourceDir?.let { File(it).length() } ?: 0L,
                        installer = installer,
                        permissions = p.requestedPermissions?.toSet() ?: emptySet(),
                        accessibilityOn = p.packageName in accessibility,
                        deviceAdmin = p.packageName in admins,
                        notificationListener = p.packageName in listeners,
                        hasLauncherIcon = p.packageName in launchable,
                    )
                } catch (e: Exception) {
                    null // una app que no se deja leer no detiene el análisis
                }
            }
        }
    }
}
