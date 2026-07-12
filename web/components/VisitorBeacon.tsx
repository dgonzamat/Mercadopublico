"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { fireRpc } from "@/lib/supabase/track";

/**
 * ¿Es un bot / crawler / cliente automatizado? Googlebot y similares ejecutan
 * JS y dispararían el beacon, inflando el conteo (p. ej. "visita desde EE.UU." =
 * Googlebot). Se detectan por:
 *   1. `navigator.webdriver` (automatización declarada).
 *   2. User-agent conocido de crawler.
 *   3. Señales de entorno que un navegador humano real no da: UA vacío,
 *      `navigator.languages` vacío, `hardwareConcurrency === 0` — típicas de
 *      clientes headless/monitores con UA "normal" que el filtro por UA no pilla
 *      (fue el patrón de las visitas fantasma desde un solo origen, jul 2026).
 * Conservador a propósito: solo señales de FP casi nulo (no se usa WebGL
 * software ni `window.chrome`, que descartarían VMs o webviews de apps reales).
 */
function isBot(): boolean {
  try {
    const nav = navigator;
    if (nav.webdriver) return true;

    const ua = nav.userAgent || "";
    if (!ua) return true; // cliente sin UA → no es un navegador humano
    if (
      /bot|crawl|spider|slurp|mediapartners|adsbot|bingpreview|facebookexternalhit|embedly|quora|pinterest|read-aloud|headless|phantom|puppeteer|playwright|lighthouse|chrome-lighthouse|gptbot|claudebot|ccbot|petalbot|yandex|baidu|monitor|uptime|pingdom|statuscake|datadog|http-client|python-requests|axios|curl|wget|okhttp|go-http/i.test(
        ua,
      )
    ) {
      return true;
    }

    // Tells de headless con UA "normal":
    if (nav.languages && nav.languages.length === 0) return true;
    if (
      typeof nav.hardwareConcurrency === "number" &&
      nav.hardwareConcurrency === 0
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Opt-out del DUEÑO (no público, sin banner): excluye las visitas propias del
 * conteo. Se activa una vez por dispositivo visitando `?notrack=1` (y se
 * revierte con `?notrack=0`); la marca persiste en localStorage. Al leerla,
 * primero sincroniza el parámetro de URL → localStorage, así la propia visita
 * que activa el opt-out ya no se cuenta. Además se auto-activa al iniciar
 * sesión con una cuenta exenta (`is_tracking_exempt`, ver efecto de
 * suscriptor), y el server-side (migración 0005) excluye esas cuentas aunque
 * este flag local no exista.
 */
const NOTRACK_KEY = "uap-notrack";
function ownerOptedOut(): boolean {
  try {
    const p = new URLSearchParams(window.location.search).get("notrack");
    if (p === "1") localStorage.setItem(NOTRACK_KEY, "1");
    else if (p === "0") localStorage.removeItem(NOTRACK_KEY);
    return localStorage.getItem(NOTRACK_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Marca de IP de datacenter (sessionStorage, por sesión). La pone el flujo de
 * visita cuando la geo-IP revela que el origen es un hosting (AWS, Alibaba,
 * OVH…): un humano real casi nunca navega desde una IP de datacenter, así que
 * es la señal que sí pilla a un crawler con Chrome "de verdad" — el patrón de
 * las visitas diarias constantes desde Singapur (jul 2026) que el filtro de UA
 * y el gate de engagement no detectaban. Una vez marcada, los pageviews de la
 * sesión tampoco cuentan.
 */
const DC_KEY = "uap-dc";
function dcFlagged(): boolean {
  try {
    return sessionStorage.getItem(DC_KEY) === "1";
  } catch {
    return false;
  }
}
function flagDc(): void {
  try {
    sessionStorage.setItem(DC_KEY, "1");
  } catch {
    // sessionStorage no disponible: nada que persistir.
  }
}

/**
 * Orgs/ISPs de hosting-datacenter. Deliberadamente NO incluye Cloudflare,
 * Fastly ni Akamai: son el egress de iCloud Private Relay y de VPNs de
 * consumidor — bloquearlos descartaría Safaris humanos reales.
 */
const HOSTING_RE =
  /amazon|\baws\b|google cloud|google llc|azure|microsoft corporation|alibaba|aliyun|tencent|huawei cloud|oracle|\bovh\b|hetzner|digital ?ocean|linode|vultr|choopa|contabo|scaleway|leaseweb|m247|colocrossing|colocation|hostinger|hosting|\bvps\b|server|data ?cent(?:er|re)/i;

/** No contar: bots/crawlers, IP de datacenter u opt-out del dueño (`?notrack=1`). */
function skipTracking(): boolean {
  return isBot() || ownerOptedOut() || dcFlagged();
}

/**
 * Rutas meta excluidas del conteo de pageviews: `/visitantes` es el propio
 * panel de estadísticas, visto sobre todo por el dueño revisando las cifras, así
 * que se auto-inflaba (era la #2 en pageviews, casi todo ruido interno). El
 * opt-out `?notrack=1` cubre al dueño en general; esto además evita que el panel
 * de stats se cuente a sí mismo aunque lo mire un visitante externo. Solo aplica
 * al conteo de PÁGINA — la visita por país (una vez por sesión) sí cuenta, para
 * no perder a un visitante real que aterrice aquí.
 */
const UNTRACKED_PATHS = new Set(["/visitantes", "/visitantes/"]);

/**
 * Gate de engagement para el conteo de VISITA por país. Llama a `onEngaged` solo
 * cuando la visita muestra señales humanas: la página está visible Y o bien
 * lleva ≥ DWELL_MS visible, o bien hubo una interacción (puntero/tecla/scroll/
 * touch). Un monitor o scraper que carga y se va sin interactuar —el patrón de
 * las visitas fantasma desde un solo origen (jul 2026)— nunca cumple, así que su
 * visita no se cuenta. Tampoco dispara en prerender ni en pestañas de fondo que
 * nunca se muestran. Devuelve un `cancel` para limpiar al desmontar.
 *
 * Solo gatea la VISITA (una por dispositivo cada 24 h), no el pageview por
 * navegación — gatear cada pageview con dwell descartaría lectores que hojean
 * rápido.
 */
const ENGAGE_DWELL_MS = 2500;
function whenEngaged(onEngaged: () => void): () => void {
  let done = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const isPrerender = "prerendering" in document &&
    (document as { prerendering?: boolean }).prerendering === true;

  const cleanupFns: Array<() => void> = [];
  const cleanup = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    for (const fn of cleanupFns) fn();
    cleanupFns.length = 0;
  };
  const fire = () => {
    if (done) return;
    done = true;
    cleanup();
    onEngaged();
  };
  const startDwell = () => {
    if (done || timer) return;
    timer = setTimeout(fire, ENGAGE_DWELL_MS);
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") startDwell();
    else if (timer) {
      clearTimeout(timer); // pausa el dwell si la pestaña se oculta
      timer = null;
    }
  };

  for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) {
    window.addEventListener(ev, fire, { once: true, passive: true });
    cleanupFns.push(() => window.removeEventListener(ev, fire));
  }
  document.addEventListener("visibilitychange", onVisibility);
  cleanupFns.push(() =>
    document.removeEventListener("visibilitychange", onVisibility),
  );
  if (!isPrerender && document.visibilityState === "visible") startDwell();

  return cleanup;
}

/**
 * Proveedores de geo-IP gratuitos (sin clave, con CORS). Se prueban en orden:
 * un solo servicio falla a menudo (timeout, rate-limit, bloqueado por adblock)
 * y deja la visita como "XX"; con varios fallbacks muchas menos quedan sin país.
 * Además del ISO-2, `org` extrae la organización/ISP del origen para el filtro
 * de datacenter (`HOSTING_RE`). Solo se usan esos dos strings; nunca guardamos
 * la IP.
 */
type GeoPick = (j: Record<string, unknown>) => unknown;
type GeoProvider = { url: string; pick: GeoPick; org: GeoPick };
const GEO_PROVIDERS: GeoProvider[] = [
  {
    url: "https://ipwho.is/",
    pick: (j) => j.country_code,
    org: (j) => {
      const c = j.connection as Record<string, unknown> | undefined;
      return c ? `${c.org ?? ""} ${c.isp ?? ""}` : "";
    },
  },
  {
    // geo.json en vez de country.json: mismo servicio, pero incluye la org.
    url: "https://get.geojs.io/v1/ip/geo.json",
    pick: (j) => j.country_code,
    org: (j) => `${j.organization_name ?? ""} ${j.organization ?? ""}`,
  },
  { url: "https://ipapi.co/json/", pick: (j) => j.country_code, org: (j) => j.org },
];

type Geo = { cc: string; hosted: boolean };

async function fetchGeo(p: GeoProvider, signal: AbortSignal): Promise<Geo | null> {
  const res = await fetch(p.url, { cache: "no-store", signal });
  const data = (await res.json()) as Record<string, unknown>;
  const raw = p.pick(data);
  const cc = typeof raw === "string" ? raw : "";
  if (!/^[A-Za-z]{2}$/.test(cc)) return null;
  const orgRaw = p.org(data);
  const org = typeof orgRaw === "string" ? orgRaw : "";
  return { cc: cc.toUpperCase(), hosted: HOSTING_RE.test(org) };
}

/**
 * Detecta país + señal de datacenter probando los proveedores en cadena, cada
 * uno con timeout duro. Si todos fallan, devuelve "XX" sin señal de hosting y
 * la visita se cuenta igual (fallar abierto: mejor un posible bot contado que
 * perder visitantes reales cuando la geo-IP está caída).
 */
async function detectGeo(): Promise<Geo> {
  for (const p of GEO_PROVIDERS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    try {
      const geo = await fetchGeo(p, controller.signal);
      if (geo) return geo;
    } catch {
      // probar el siguiente proveedor
    } finally {
      clearTimeout(timer);
    }
  }
  return { cc: "XX", hosted: false };
}

/**
 * Dedup de la visita por dispositivo con TTL de 24 h (localStorage). Antes era
 * `sessionStorage` (moría al cerrar la pestaña), así que la misma persona
 * contaba una "visita" por cada pestaña/sesión del día y el contador medía
 * sesiones, no visitantes. Con el TTL el número pasa a ser ~visitantes únicos
 * diarios. Si localStorage no está disponible (modo privado estricto), cae al
 * dedup por sesión de siempre.
 */
const VISIT_TTL_MS = 24 * 60 * 60 * 1000;
const VISIT_AT_KEY = "uap-visit-at";
const VISIT_SESSION_FLAG = "uap-visit-pinged";
function visitAlreadyCounted(): boolean {
  try {
    const at = Number(localStorage.getItem(VISIT_AT_KEY) ?? "0");
    if (Number.isFinite(at) && at > 0 && Date.now() - at < VISIT_TTL_MS) {
      return true;
    }
  } catch {
    // localStorage no disponible: decide el flag de sesión.
  }
  try {
    return sessionStorage.getItem(VISIT_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}
function markVisitCounted(): void {
  try {
    localStorage.setItem(VISIT_AT_KEY, String(Date.now()));
  } catch {
    // localStorage no disponible: queda el flag de sesión.
  }
  try {
    sessionStorage.setItem(VISIT_SESSION_FLAG, "1");
  } catch {
    // sessionStorage no disponible: nada que persistir.
  }
}
function unmarkVisitCounted(): void {
  try {
    localStorage.removeItem(VISIT_AT_KEY);
  } catch {
    // localStorage no disponible: nada que limpiar.
  }
  try {
    sessionStorage.removeItem(VISIT_SESSION_FLAG);
  } catch {
    // sessionStorage no disponible: nada que limpiar.
  }
}

/**
 * Cuenta una visita por país (una por dispositivo cada 24 h). Detecta país +
 * señal de datacenter (con timeout, nunca bloquea) y llama a la función
 * `increment_visit` de Supabase, que aplica el gate server-side (UA, dedup por
 * IP, exención del dueño — migración 0005) y hace el upsert atómico en
 * `visits_by_country`. El conteo se dispara aunque la geo-IP falle (cuenta
 * como "XX"). Render nulo. Sin Supabase configurado, no hace nada.
 */
export function VisitorBeacon() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  // Conteo de página: una vez por navegación (cada cambio de ruta). A diferencia
  // del país, NO se deduplica por sesión — queremos pageviews. El ref evita
  // doble disparo para la misma ruta (re-render / StrictMode en dev).
  useEffect(() => {
    const sb = supabase;
    if (!sb || !pathname || skipTracking() || UNTRACKED_PATHS.has(pathname))
      return;
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
      // Exención del dueño: si esta cuenta está en `tracking_exempt` (server),
      // activa el opt-out local. Así cualquier dispositivo donde el dueño
      // inicie sesión queda excluido sin tener que visitar `?notrack=1` — y el
      // server-side (migración 0005) lo excluye igual aunque este flag se
      // pierda.
      const { data: exempt } = await sb.rpc("is_tracking_exempt");
      if (exempt === true) {
        try {
          localStorage.setItem(NOTRACK_KEY, "1");
        } catch {
          // localStorage no disponible: el server-side sigue cubriendo.
        }
      }
    };

    void mark();
    const { data: sub } = sb.auth.onAuthStateChange(() => void mark());
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb || skipTracking()) return;
    if (visitAlreadyCounted()) return; // ya contada en las últimas 24 h

    // Solo cuenta cuando la visita se muestra humana (visible + dwell o
    // interacción). La marca se pone al COMPROMETERSE a contar, no antes: así
    // una carga sin engagement no bloquea que una recarga con engagement cuente.
    const cancel = whenEngaged(() => {
      markVisitCounted();
      void (async () => {
        const { cc, hosted } = await detectGeo();
        if (hosted) {
          // IP de datacenter: no cuenta la visita y los pageviews restantes de
          // la sesión quedan silenciados vía skipTracking().
          flagDc();
          return;
        }
        const { error } = await sb.rpc("increment_visit", { cc });
        if (error) {
          // Reintento defensivo: si falló (p. ej. red intermitente), se
          // desmarca para que un reload lo reintente.
          unmarkVisitCounted();
        }
      })();
    });
    return cancel;
  }, []);

  return null;
}
