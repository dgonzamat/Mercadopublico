"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { fireRpc } from "@/lib/supabase/track";

/**
 * ¿Es un bot / crawler? Googlebot y similares ejecutan JS y dispararían el
 * beacon, inflando el conteo (p. ej. "visita desde EE.UU." = Googlebot). Se
 * detectan por user-agent y por `navigator.webdriver` (automatización).
 */
function isBot(): boolean {
  try {
    if (navigator.webdriver) return true;
    const ua = navigator.userAgent || "";
    return /bot|crawl|spider|slurp|mediapartners|adsbot|bingpreview|facebookexternalhit|embedly|quora|pinterest|read-aloud|headless|phantom|puppeteer|playwright|lighthouse|chrome-lighthouse|gptbot|claudebot|ccbot|petalbot|yandex|baidu/i.test(
      ua,
    );
  } catch {
    return false;
  }
}

/** No contar: solo bots/crawlers (el sitio es público; no hay opt-out propio). */
function skipTracking(): boolean {
  return isBot();
}

/**
 * Proveedores de geo-IP gratuitos (sin clave, con CORS). Se prueban en orden:
 * un solo servicio falla a menudo (timeout, rate-limit, bloqueado por adblock)
 * y deja la visita como "XX"; con varios fallbacks muchas menos quedan sin país.
 * Solo se usa el código ISO-2; nunca guardamos la IP.
 */
type GeoPick = (j: Record<string, unknown>) => unknown;
const GEO_PROVIDERS: { url: string; pick: GeoPick }[] = [
  { url: "https://ipwho.is/", pick: (j) => j.country_code },
  { url: "https://get.geojs.io/v1/ip/country.json", pick: (j) => j.country },
  { url: "https://ipapi.co/json/", pick: (j) => j.country_code },
];

async function fetchCountry(
  url: string,
  pick: GeoPick,
  signal: AbortSignal,
): Promise<string | null> {
  const res = await fetch(url, { cache: "no-store", signal });
  const data = (await res.json()) as Record<string, unknown>;
  const raw = pick(data);
  const cc = typeof raw === "string" ? raw : "";
  return /^[A-Za-z]{2}$/.test(cc) ? cc.toUpperCase() : null;
}

/**
 * Detecta el país probando los proveedores en cadena, cada uno con un timeout
 * duro de 2.5s. Si todos fallan, devuelve "XX" y la visita se cuenta igual.
 */
async function detectCountry(): Promise<string> {
  for (const p of GEO_PROVIDERS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    try {
      const cc = await fetchCountry(p.url, p.pick, controller.signal);
      if (cc) return cc;
    } catch {
      // probar el siguiente proveedor
    } finally {
      clearTimeout(timer);
    }
  }
  return "XX";
}

/**
 * Cuenta una visita por país (una vez por sesión). Detecta el país (con
 * timeout, nunca bloquea) y llama a la función `increment_visit` de Supabase,
 * que hace el upsert atómico en `visits_by_country`. El conteo se dispara
 * siempre, aunque la geo-IP falle (cuenta como "XX"). Render nulo. Sin
 * Supabase configurado, no hace nada.
 */
export function VisitorBeacon() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  // Conteo de página: una vez por navegación (cada cambio de ruta). A diferencia
  // del país, NO se deduplica por sesión — queremos pageviews. El ref evita
  // doble disparo para la misma ruta (re-render / StrictMode en dev).
  useEffect(() => {
    const sb = supabase;
    if (!sb || !pathname || skipTracking()) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    // `fireRpc` ejecuta el builder perezoso de supabase-js (ver lib/supabase/track):
    // un `void sb.rpc(...)` suelto no enviaba la petición y el conteo de páginas
    // se perdía en silencio.
    fireRpc(sb, "increment_page", { p: pathname });
  }, [pathname]);

  // Suscriptor activo: si el visitante tiene sesión (usuario autenticado), lo
  // marca como activo hoy una vez por sesión. No-op si es anónimo; reacciona a
  // un login posterior (alguien que navega y luego entra a /laboratorio).
  useEffect(() => {
    const sb = supabase;
    if (!sb || skipTracking()) return;
    const FLAG = "uap-sub-seen";
    let done = false;

    const mark = async () => {
      if (done) return;
      try {
        if (sessionStorage.getItem(FLAG) === "1") {
          done = true;
          return;
        }
      } catch {
        // sessionStorage no disponible: seguimos, peor caso recontamos.
      }
      const { data } = await sb.auth.getSession();
      if (!data.session) return; // aún no es suscriptor
      done = true;
      try {
        sessionStorage.setItem(FLAG, "1");
      } catch {
        // sessionStorage no disponible: nada que persistir.
      }
      await sb.rpc("mark_subscriber_seen");
    };

    void mark();
    const { data: sub } = sb.auth.onAuthStateChange(() => void mark());
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb || skipTracking()) return;

    const FLAG = "uap-visit-pinged";
    let already = false;
    try {
      already = sessionStorage.getItem(FLAG) === "1";
      if (!already) sessionStorage.setItem(FLAG, "1");
    } catch {
      already = false; // sessionStorage no disponible (modo privado)
    }
    if (already) return;

    void (async () => {
      const cc = await detectCountry();
      const { error } = await sb.rpc("increment_visit", { cc });
      if (error) {
        // Reintento defensivo: si falló (p. ej. red intermitente), no se
        // marca la sesión como contada para que un reload lo reintente.
        try {
          sessionStorage.removeItem(FLAG);
        } catch {
          // sessionStorage no disponible: nada que limpiar.
        }
      }
    })();
  }, []);

  return null;
}
