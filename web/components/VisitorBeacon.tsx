"use client";

import { useEffect } from "react";
import { VISITORS_WORKER_URL } from "@/lib/visitors";

/**
 * Beacon de tráfico por país. Llama una vez por sesión al Worker `/hit`, que
 * incrementa el contador del país del visitante (Cloudflare lo detecta por IP).
 * Sin Worker configurado, no hace nada. Render nulo.
 */
export function VisitorBeacon() {
  useEffect(() => {
    if (!VISITORS_WORKER_URL) return;

    const FLAG = "uap-visit-pinged";
    let already = false;
    try {
      already = sessionStorage.getItem(FLAG) === "1";
      if (!already) sessionStorage.setItem(FLAG, "1");
    } catch {
      // sessionStorage no disponible (modo privado): cuenta sin dedupe.
      already = false;
    }
    if (already) return;

    fetch(`${VISITORS_WORKER_URL}/hit`, {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}
