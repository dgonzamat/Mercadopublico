package com.dgonzamat.limpiador

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Vigilancia en segundo plano (opcional). Cada ~15 minutos revisa las apps instaladas con las
 * mismas reglas que el análisis ([RiskRules]) y avisa con una notificación cuando:
 * - se instaló una app nueva que parece adware o malware, o
 * - una app se hace pasar por el sistema, o no tiene ícono y aun así abrió pantallas (anuncios).
 *
 * Sin root no puede impedir una instalación ni detener otra app: lo que gana es tiempo. El
 * adware de este tipo llega en cadena (un anuncio instala un «limpiador», que muestra más
 * anuncios, que instalan otro) y avisar en la primera instalación evita que se apodere del teléfono.
 */
object Watchdog {
    const val PREF_ON = "watch_on"
    private const val PREF_KNOWN = "watch_known"
    private const val PREF_ALERTED = "watch_alerted"
    const val JOB_ID = 4711
    const val CHANNEL = "watch"
    const val EXTRA_PACKAGE = "watch_package"
    const val PERIOD_MS = 15 * 60_000L

    data class Alert(val facts: AppFacts, val reasons: String, val newInstall: Boolean)

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("limpiador", Context.MODE_PRIVATE)

    fun isEnabled(ctx: Context) = prefs(ctx).getBoolean(PREF_ON, false)

    fun setEnabled(ctx: Context, on: Boolean) {
        prefs(ctx).edit().putBoolean(PREF_ON, on).apply()
        val js = ctx.getSystemService(JobScheduler::class.java) ?: return
        if (on) {
            js.schedule(
                JobInfo.Builder(JOB_ID, ComponentName(ctx, WatchJob::class.java))
                    .setPeriodic(PERIOD_MS)
                    .setPersisted(true) // sigue después de reiniciar el teléfono
                    .build(),
            )
        } else {
            js.cancel(JOB_ID)
        }
    }

    /**
     * Qué avisar, sin Android. [known]: paquetes vistos en la revisión anterior (null en la
     * primera, cuando nada cuenta como «recién instalado»). [alerted]: ya avisados, no se repiten.
     */
    fun decide(facts: List<AppFacts>, known: Set<String>?, alerted: Set<String>): List<Pair<AppFacts, RiskAssessment>> {
        val baitApps = facts.count { RiskRules.looksLikeCleaner(it.label, it.packageName) }
        return facts.mapNotNull { f ->
            if (f.packageName in alerted) return@mapNotNull null
            val a = RiskRules.assess(f, baitApps) ?: return@mapNotNull null
            val isNew = known != null && f.packageName !in known
            val urgent = RiskSignal.POPS_UP in a.signals || RiskSignal.IMPERSONATES in a.signals
            if (isNew || urgent) f to a else null
        }
    }

    /** Una revisión completa: decide, notifica y recuerda lo visto. Devuelve los avisos. */
    fun run(ctx: Context, facts: List<AppFacts> = SecurityScanner.collectFacts(ctx)): List<Alert> {
        val p = prefs(ctx)
        val known = p.getStringSet(PREF_KNOWN, null)
        val alerted = p.getStringSet(PREF_ALERTED, emptySet()) ?: emptySet()
        val baitApps = facts.count { RiskRules.looksLikeCleaner(it.label, it.packageName) }
        val alerts = decide(facts, known, alerted).map { (f, a) ->
            Alert(f, SecurityScanner.reasons(ctx, f, a.signals, baitApps), known != null && f.packageName !in known)
        }
        alerts.forEach { notify(ctx, it) }
        val installed = facts.map { it.packageName }.toSet()
        p.edit()
            .putStringSet(PREF_KNOWN, installed)
            // Una app desinstalada y vuelta a instalar se vuelve a avisar.
            .putStringSet(PREF_ALERTED, alerted.intersect(installed) + alerts.map { it.facts.packageName })
            .apply()
        return alerts
    }

    private fun notify(ctx: Context, alert: Alert) {
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL, ctx.getString(R.string.watch_channel), NotificationManager.IMPORTANCE_HIGH),
        )
        val pkg = alert.facts.packageName
        val open = PendingIntent.getActivity(
            ctx, pkg.hashCode(),
            Intent(ctx, MainActivity::class.java).putExtra(EXTRA_PACKAGE, pkg)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val title = ctx.getString(if (alert.newInstall) R.string.watch_new_title else R.string.watch_alert_title, alert.facts.label)
        val text = alert.reasons.replaceFirstChar { it.uppercase() }
        NotificationManagerCompat.from(ctx).notify(
            pkg.hashCode(),
            NotificationCompat.Builder(ctx, CHANNEL)
                .setSmallIcon(R.drawable.ic_shield)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text + "\n" + ctx.getString(R.string.watch_tap)))
                .setContentIntent(open)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build(),
        )
    }
}

/** Trabajo periódico de [Watchdog]: corre fuera del hilo principal y termina solo. */
class WatchJob : JobService() {
    override fun onStartJob(params: JobParameters): Boolean {
        Thread {
            try {
                if (Watchdog.isEnabled(applicationContext)) Watchdog.run(applicationContext)
            } catch (e: Exception) {
                // una revisión fallida no detiene las siguientes
            } finally {
                jobFinished(params, false)
            }
        }.start()
        return true
    }

    override fun onStopJob(params: JobParameters) = true
}
