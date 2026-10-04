package com.dgonzamat.limpiador

import android.Manifest
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.admin.DevicePolicyManager
import android.app.usage.UsageEvents
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
    /** APK instalado (legible por cualquier app): se usa para su huella en VirusTotal. */
    val apkPath: String? = null,
    /** Veces que mostró una pantalla en las últimas 24 h (registro de uso; 0 si no hay acceso). */
    val screensLastDay: Int = 0,
    /** Veces que arrancó un servicio en primer plano (aviso fijo en la barra) en las últimas 24 h. */
    val backgroundLastDay: Int = 0,
)

/** Señales de riesgo. Son las que usan troyanos bancarios y stalkerware; ninguna prueba por sí sola que una app sea maliciosa. */
enum class RiskSignal(val weight: Int, val textRes: Int) {
    SIDELOADED(2, R.string.reason_sideloaded),
    /** No tiene ícono, así que el usuario no pudo abrirla, y aun así mostró pantallas: anuncios a pantalla completa. */
    POPS_UP(4, R.string.reason_pops_up),
    /** Se presenta como limpiador, acelerador, recuperador de fotos, galería o lector: disfraces frecuentes del adware. */
    CLEANER(1, R.string.reason_cleaner),
    /** Hay varias apps de ese mismo tipo instaladas: el adware de utilidades se instala en cadena. */
    SWARM(2, R.string.reason_swarm),
    ACCESSIBILITY(3, R.string.reason_accessibility),
    DEVICE_ADMIN(3, R.string.reason_admin),
    SMS(2, R.string.reason_sms),
    SPY(2, R.string.reason_spy),
    NOTIFICATIONS(1, R.string.reason_notifications),
    HIDDEN(1, R.string.reason_hidden),
    INSTALLS_APPS(1, R.string.reason_installs),
    OVERLAY(1, R.string.reason_overlay),
    /** Puede abrir avisos a pantalla completa (permiso pensado para alarmas y llamadas). */
    FULL_SCREEN(1, R.string.reason_full_screen),
    /** Trabajó en segundo plano con un aviso fijo en la barra durante las últimas 24 h. */
    BACKGROUND(1, R.string.reason_background),
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

    /**
     * Palabras con las que se presenta el adware de utilidades: limpiadores, aceleradores,
     * recuperadores de fotos, galerías y lectores de documentos falsos. Solo suman con otra señal:
     * un limpiador o una galería legítimos sin overlay, sin ícono oculto, sin trabajo en segundo
     * plano y sin hermanas del mismo tipo no se listan.
     */
    private val CLEANER_WORDS = listOf(
        "clean", "cleaner", "limpia", "booster", "boost", "acelera", "optimiz", "speed", "junk",
        "basura", "cooler", "cpu", "ram", "battery", "bateria", "batería", "virus", "antivirus", "security master",
        "phone master", "phonemaster",
        "recover", "recuper", "restore", "restaur", "gallery", "galer", "pdf", "reader", "lector",
    )

    /** Desde cuántas apps del mismo tipo instaladas a la vez se considera una cadena de adware. */
    const val SWARM_MIN = 4

    fun looksLikeCleaner(label: String, pkg: String): Boolean {
        val text = (label + " " + pkg).lowercase()
        return CLEANER_WORDS.any { w ->
            if (w.length <= 4) Regex("(^|[^a-z])" + Regex.escape(w) + "([^a-z]|$)").containsMatchIn(text) else w in text
        }
    }

    private val SMS = setOf(Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS)
    private val SPY = setOf(
        Manifest.permission.READ_CONTACTS, Manifest.permission.READ_CALL_LOG,
        Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CAMERA,
    )

    /** Mínimo para listar una app que no viene de una tienda: «no viene de una tienda» + 2 puntos más. */
    const val SIDELOADED_MIN_SCORE = 4
    const val HIGH_SCORE = 6

    /** [baitApps]: cuántas apps instaladas parecen utilidades cebo (incluida esta). */
    fun signals(f: AppFacts, baitApps: Int = 0): List<RiskSignal> = buildList {
        val bait = looksLikeCleaner(f.label, f.packageName)
        if (f.installer !in TRUSTED_STORES) add(RiskSignal.SIDELOADED)
        if (bait) add(RiskSignal.CLEANER)
        if (bait && baitApps >= SWARM_MIN) add(RiskSignal.SWARM)
        if (!f.hasLauncherIcon && f.screensLastDay > 0) add(RiskSignal.POPS_UP)
        if (f.accessibilityOn) add(RiskSignal.ACCESSIBILITY)
        if (f.deviceAdmin) add(RiskSignal.DEVICE_ADMIN)
        if (f.permissions.any { it in SMS }) add(RiskSignal.SMS)
        if (f.permissions.count { it in SPY } >= 3) add(RiskSignal.SPY)
        if (f.notificationListener) add(RiskSignal.NOTIFICATIONS)
        if (!f.hasLauncherIcon) add(RiskSignal.HIDDEN)
        if (Manifest.permission.REQUEST_INSTALL_PACKAGES in f.permissions) add(RiskSignal.INSTALLS_APPS)
        if (Manifest.permission.SYSTEM_ALERT_WINDOW in f.permissions) add(RiskSignal.OVERLAY)
        if (Manifest.permission.USE_FULL_SCREEN_INTENT in f.permissions) add(RiskSignal.FULL_SCREEN)
        if (f.backgroundLastDay > 0) add(RiskSignal.BACKGROUND)
    }

    /**
     * null si la app no se lista. Las apps de tienda con permisos amplios son comunes (mensajería,
     * gestores de contraseñas), así que una app de tienda solo se lista si:
     * - combina accesibilidad y administrador, o
     * - oculta su ícono y además dibuja encima, controla el teléfono o instala apps (patrón del adware), o
     * - se presenta como utilidad cebo (limpiador, recuperador de fotos, galería, lector) y además
     *   dibuja encima, abre avisos a pantalla completa, oculta su ícono, controla el teléfono, lee
     *   notificaciones, instala apps, trabaja en segundo plano o tiene varias hermanas del mismo
     *   tipo instaladas (el adware de utilidades de las tiendas).
     */
    fun assess(f: AppFacts, baitApps: Int = 0): RiskAssessment? {
        val s = signals(f, baitApps)
        val score = s.sumOf { it.weight }
        val sideloaded = RiskSignal.SIDELOADED in s
        val control = RiskSignal.ACCESSIBILITY in s || RiskSignal.DEVICE_ADMIN in s
        val adwareMoves = RiskSignal.OVERLAY in s || control || RiskSignal.INSTALLS_APPS in s || RiskSignal.FULL_SCREEN in s
        val listed = if (sideloaded) score >= SIDELOADED_MIN_SCORE
        else RiskSignal.POPS_UP in s ||
            (RiskSignal.ACCESSIBILITY in s && RiskSignal.DEVICE_ADMIN in s) ||
            (RiskSignal.HIDDEN in s && adwareMoves) ||
            (RiskSignal.CLEANER in s && (adwareMoves || RiskSignal.HIDDEN in s || RiskSignal.NOTIFICATIONS in s ||
                RiskSignal.BACKGROUND in s || RiskSignal.SWARM in s))
        if (!listed) return null
        val high = score >= HIGH_SCORE || (sideloaded && control) || RiskSignal.POPS_UP in s
        return RiskAssessment(high, score, s)
    }
}

/**
 * Antivirus de apps instaladas por el usuario, en dos capas:
 * 1. Señales de riesgo ([RiskRules]), sin conexión.
 * 2. Con [vt] (clave de VirusTotal del usuario), la huella de cada app instalada fuera de una
 *    tienda, y de las de tienda que ya salieron sospechosas, se compara con malware conocido.
 * Nada se marca solo: desinstalar es decisión del usuario.
 */
class SecurityScanner(
    private val context: Context,
    private val vt: VirusTotal? = null,
    private val facts: () -> List<AppFacts> = { collectFacts(context) },
) {

    suspend fun scan(onLookup: suspend (Int) -> Unit = {}): List<JunkItem> {
        val list = facts()
        val baitApps = list.count { RiskRules.looksLikeCleaner(it.label, it.packageName) }
        val all = list.map { it to RiskRules.assess(it, baitApps) }
        // Antivirus en la nube: primero las de más riesgo, por si se agota el tope de consultas.
        val verdicts = HashMap<String, VtVerdict>()
        if (vt != null) {
            all.filter { (f, a) -> (f.installer !in RiskRules.TRUSTED_STORES || a != null) && f.apkPath != null }
                .sortedByDescending { (_, a) -> a?.score ?: 0 }
                .forEach { (f, _) ->
                    vt.check(File(f.apkPath!!))?.let { verdicts[f.packageName] = it }
                    onLookup(vt.checked)
                }
        }
        return all.mapNotNull { (f, a) ->
            val v = verdicts[f.packageName]
            val malware = v is VtVerdict.Found && v.malicious > 0
            if (a == null && !malware) return@mapNotNull null
            val reasons = a?.signals?.joinToString(", ") {
                when (it) {
                    RiskSignal.POPS_UP -> context.resources.getQuantityString(R.plurals.reason_pops_up_n, f.screensLastDay, f.screensLastDay)
                    RiskSignal.SWARM -> context.getString(R.string.reason_swarm_n, baitApps)
                    else -> context.getString(it.textRes)
                }
            }
            val note = when {
                malware -> listOfNotNull(malwareNote(context, v as VtVerdict.Found), reasons?.replaceFirstChar { it.uppercase() }).joinToString(". ")
                else -> {
                    val level = context.getString(if (a!!.high) R.string.risk_high else R.string.risk_medium)
                    "$level: $reasons" + (v?.let { " · " + verdictNote(context, it) } ?: "")
                }
            }
            val risk = when {
                malware -> 1000 + (v as VtVerdict.Found).malicious
                else -> a!!.score + if (a.high) 100 else 0
            }
            JunkItem(
                Category.SUSPICIOUS_APPS, f.label, f.size, note,
                packageName = f.packageName, risk = risk, deviceAdmin = f.deviceAdmin,
            )
        }.sortedWith(compareByDescending<JunkItem> { it.risk }.thenByDescending { it.size })
    }

    companion object {
        fun malwareNote(ctx: Context, v: VtVerdict.Found) = ctx.getString(R.string.vt_malware, v.malicious, v.engines)

        /** Qué dijo VirusTotal cuando no hubo detección (limpio o nunca visto). */
        fun verdictNote(ctx: Context, v: VtVerdict): String = when (v) {
            is VtVerdict.Found -> if (v.malicious > 0) malwareNote(ctx, v) else ctx.getString(R.string.vt_clean, v.engines)
            VtVerdict.Unknown -> ctx.getString(R.string.vt_unknown)
        }

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
            val dayAgo = System.currentTimeMillis() - 24 * 3600_000L
            val screens = ForegroundLog.counts(context, dayAgo)
            val background = ForegroundLog.counts(context, dayAgo, type = UsageEvents.Event.FOREGROUND_SERVICE_START)
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
                        apkPath = app.sourceDir,
                        screensLastDay = screens[p.packageName] ?: 0,
                        backgroundLastDay = background[p.packageName] ?: 0,
                    )
                } catch (e: Exception) {
                    null // una app que no se deja leer no detiene el análisis
                }
            }
        }
    }
}
