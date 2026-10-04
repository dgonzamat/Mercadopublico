package com.dgonzamat.limpiador

import android.accessibilityservice.AccessibilityServiceInfo
import android.app.admin.DevicePolicyManager
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import android.widget.Toast
import com.google.android.material.dialog.MaterialAlertDialogBuilder

/**
 * Qué hacer con una app que no se deja desinstalar. Una app sin root no puede quitar a otra,
 * pero sí llevar al usuario, en orden, a cada ajuste que la retiene:
 * 1. Su permiso de administrador del dispositivo (Android no desinstala una administradora activa).
 * 2. Su accesibilidad (con ella puede cerrar la pantalla de desinstalación apenas se abre).
 * 3. Sus avisos (deja de mostrar anuncios mientras tanto).
 * 4. Su ficha en Ajustes (Forzar detención → Desinstalar) y un nuevo intento.
 * Si nada de eso basta: modo seguro o comandos ADB desde el computador.
 */
object RemovalHelp {

    enum class Action(val textRes: Int) {
        ADMIN(R.string.help_admin),
        ACCESSIBILITY(R.string.help_accessibility),
        NOTIFICATIONS(R.string.help_notifications),
        DETAILS(R.string.help_details),
        RETRY(R.string.help_retry),
        SAFE_MODE(R.string.help_safe_mode),
    }

    /** Las acciones que aplican hoy a [pkg], en el orden en que conviene hacerlas. */
    fun actions(ctx: Context, pkg: String): List<Action> = buildList {
        if (isAdmin(ctx, pkg)) add(Action.ADMIN)
        if (hasAccessibility(ctx, pkg)) add(Action.ACCESSIBILITY)
        add(Action.NOTIFICATIONS)
        add(Action.DETAILS)
        add(Action.RETRY)
        add(Action.SAFE_MODE)
    }

    fun isAdmin(ctx: Context, pkg: String): Boolean = try {
        (ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager)
            .activeAdmins?.any { it.packageName == pkg } == true
    } catch (e: Exception) { false }

    fun hasAccessibility(ctx: Context, pkg: String): Boolean = try {
        (ctx.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager)
            .getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
            .any { it.resolveInfo?.serviceInfo?.packageName == pkg }
    } catch (e: Exception) { false }

    /**
     * Comandos para pegar en el computador con el teléfono conectado (depuración USB activa).
     * `pm uninstall` desinstala la app; si Android lo rechaza (p. ej. sigue siendo
     * administradora), `pm disable-user` al menos la deja sin poder ejecutarse.
     */
    fun adbCommands(ctx: Context, apps: List<JunkItem>): String = buildString {
        appendLine(ctx.getString(R.string.adb_header))
        apps.forEach { app ->
            appendLine("# ${app.name}")
            appendLine("adb shell pm uninstall ${app.packageName}")
            appendLine("adb shell pm disable-user --user 0 ${app.packageName}")
        }
    }.trimEnd()

    fun intentFor(action: Action, pkg: String): Intent? = when (action) {
        // Android no tiene un acceso público directo a la lista de administradores: Ajustes › Seguridad la contiene.
        Action.ADMIN -> Intent(Settings.ACTION_SECURITY_SETTINGS)
        Action.ACCESSIBILITY -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        Action.NOTIFICATIONS -> Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkg)
        Action.DETAILS -> Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$pkg"))
        Action.RETRY -> Intent(Intent.ACTION_DELETE, Uri.parse("package:$pkg"))
        Action.SAFE_MODE -> null
    }

    /** Lista de apps que siguen instaladas; tocar una abre sus pasos. */
    fun showList(ctx: Context, apps: List<JunkItem>) {
        if (apps.isEmpty()) return
        MaterialAlertDialogBuilder(ctx)
            .setTitle(ctx.resources.getQuantityString(R.plurals.help_list_title, apps.size, apps.size))
            .setItems(apps.map { it.name }.toTypedArray()) { _, i -> show(ctx, apps[i], apps) }
            .setNeutralButton(R.string.help_copy_adb) { _, _ -> copyAdb(ctx, apps) }
            .setNegativeButton(R.string.help_close, null)
            .show()
    }

    /** Pasos para quitar [app]. [all]: las apps cuyos comandos ADB se copian (por defecto, solo esta). */
    fun show(ctx: Context, app: JunkItem, all: List<JunkItem> = listOf(app)) {
        val pkg = app.packageName ?: return
        val actions = actions(ctx, pkg)
        val rows = actions.mapIndexed { i, a -> "${i + 1}. " + ctx.getString(a.textRes) }.toTypedArray()
        MaterialAlertDialogBuilder(ctx)
            .setTitle(ctx.getString(R.string.help_title, app.name))
            .setItems(rows) { _, i -> run(ctx, actions[i], pkg) }
            .setNeutralButton(R.string.help_copy_adb) { _, _ -> copyAdb(ctx, all) }
            .setNegativeButton(R.string.help_close, null)
            .show()
    }

    private fun run(ctx: Context, action: Action, pkg: String) {
        val intent = intentFor(action, pkg)
        if (intent == null) {
            MaterialAlertDialogBuilder(ctx)
                .setTitle(R.string.help_safe_mode)
                .setMessage(R.string.help_safe_mode_steps)
                .setPositiveButton(android.R.string.ok, null)
                .show()
            return
        }
        try {
            ctx.startActivity(intent)
        } catch (e: Exception) {
            try {
                ctx.startActivity(Intent(Settings.ACTION_SETTINGS))
            } catch (e2: Exception) {
                Toast.makeText(ctx, R.string.open_failed, Toast.LENGTH_SHORT).show()
            }
        }
    }

    /**
     * Muestra los comandos. Los comandos se escriben en el computador, no en el teléfono, así que
     * además de copiarlos se pueden compartir (correo, WhatsApp) para abrirlos allá.
     */
    private fun copyAdb(ctx: Context, apps: List<JunkItem>) {
        val text = adbCommands(ctx, apps)
        MaterialAlertDialogBuilder(ctx)
            .setTitle(R.string.help_copy_adb)
            .setMessage(ctx.getString(R.string.adb_intro) + "\n\n" + text)
            .setPositiveButton(R.string.adb_share) { _, _ ->
                val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
                try { ctx.startActivity(Intent.createChooser(send, ctx.getString(R.string.adb_share))) } catch (e: Exception) { }
            }
            .setNeutralButton(R.string.adb_copy) { _, _ ->
                val cm = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                cm.setPrimaryClip(ClipData.newPlainText("adb", text))
                Toast.makeText(ctx, R.string.adb_copied, Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton(R.string.help_close, null)
            .show()
    }
}
