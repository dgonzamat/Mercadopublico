"use client";

import { useEffect } from "react";

/**
 * Redirección cliente para las URLs viejas del espejo inglés (/en/…). Tras la
 * inversión a inglés-primario (jul 2026), esas rutas viven en la raíz. Es UN
 * solo client component reusable (no infla el techo de 45): quita el prefijo
 * /en del pathname y reemplaza. Va junto al `canonical`→raíz que declara la
 * página server, que es quien preserva el equity SEO (Google consolida).
 */
export default function EnRedirect() {
  useEffect(() => {
    const p = window.location.pathname;
    const target = p.replace(/^\/en(?=\/|$)/, "") || "/";
    window.location.replace(target + window.location.search + window.location.hash);
  }, []);
  return null;
}
