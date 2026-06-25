"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Detecta el país del visitante con una API de geo-IP gratuita (sin clave),
 * con un timeout duro: si la red es lenta o el servicio no responde, no se
 * cuelga — devuelve "XX" (desconocido) y la visita se cuenta igual. Solo se
 * usa para obtener el código ISO-2; no guardamos la IP.
 */
async function detectCountry(): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch("https://ipwho.is/", {
      cache: "no-store",
      signal: controller.signal,
    });
    const data: { country_code?: string } = await res.json();
    const cc = data.country_code ?? "";
    return /^[A-Za-z]{2}$/.test(cc) ? cc.toUpperCase() : "XX";
  } catch {
    return "XX";
  } finally {
    clearTimeout(timer);
  }
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
    if (!sb || !pathname) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    void sb.rpc("increment_page", { p: pathname });
  }, [pathname]);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;

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
