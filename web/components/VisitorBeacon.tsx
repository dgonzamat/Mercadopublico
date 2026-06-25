"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Detecta el país del visitante con una API de geo-IP gratuita (sin clave).
 * Solo se usa para obtener el código ISO-2; no guardamos la IP. Si falla,
 * devuelve "XX" (desconocido).
 */
async function detectCountry(): Promise<string> {
  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    const data: { country_code?: string } = await res.json();
    const cc = data.country_code ?? "";
    return /^[A-Za-z]{2}$/.test(cc) ? cc.toUpperCase() : "XX";
  } catch {
    return "XX";
  }
}

/**
 * Cuenta una visita por país (una vez por sesión). Detecta el país y llama a
 * la función `increment_visit` de Supabase, que hace el upsert atómico en
 * `visits_by_country`. Render nulo. Sin Supabase configurado, no hace nada.
 */
export function VisitorBeacon() {
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

    void detectCountry().then((cc) => {
      void sb.rpc("increment_visit", { cc });
    });
  }, []);

  return null;
}
