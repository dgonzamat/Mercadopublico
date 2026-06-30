import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Dispara una RPC de telemetría en modo "fire-and-forget" de forma SEGURA.
 *
 * Footgun que esto previene: en supabase-js v2, `sb.rpc(...)` devuelve un
 * builder PEREZOSO (PromiseLike). La petición HTTP solo se envía cuando se
 * encadena `.then()`/`await`. Un `void sb.rpc(...)` suelto se queda sin enviar
 * y falla en silencio — fue exactamente el bug por el que el conteo de páginas
 * nunca se registraba mientras el de país (que sí hacía `await`) sí lo hacía.
 *
 * Esta función SIEMPRE encadena `.then()` (así el builder se ejecuta) y, en
 * desarrollo, hace visible cualquier error en consola en vez de tragárselo.
 * Úsala para toda RPC de telemetría cuyo resultado no necesitamos esperar.
 */
export function fireRpc(
  sb: SupabaseClient,
  fn: string,
  args?: Record<string, unknown>,
): void {
  void sb.rpc(fn, args).then(
    ({ error }) => {
      if (error && process.env.NODE_ENV !== "production") {
        console.warn(`[beacon] rpc ${fn} respondió error:`, error.message);
      }
    },
    (e) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[beacon] rpc ${fn} lanzó excepción:`, e);
      }
    },
  );
}
