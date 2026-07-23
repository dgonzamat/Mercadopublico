import type { ReactNode } from "react";

/**
 * Bilingual text primitive.
 *
 * Two modes:
 *  - Sin `locale` (default, legacy): renderiza AMBOS idiomas como spans hermanos
 *    y el CSS de globals.css muestra solo el activo (vía `[data-locale]` en el
 *    html/wrapper). El sitio sirve los dos idiomas por URL — 2× texto en el DOM.
 *  - Con `locale`: renderiza UN solo idioma (sin span envoltorio ni `data-lang`,
 *    así el CSS bilingüe no lo toca y siempre se ve). Es la vía de "un idioma por
 *    URL": la raíz pasa `locale="en"`, el espejo `/es` pasa `locale="es"`, y el
 *    HTML de cada URL lleva un solo idioma (mitad de DOM, señal SEO sin diluir).
 *
 * SSG-compatible: zero runtime, pure server render.
 *
 * Usage:
 *   <T es="Hola" en="Hello" />                    // ambos (legacy)
 *   <T es="Hola" en="Hello" locale="en" />        // solo EN
 */
export function T({
  es,
  en,
  locale,
}: {
  es: ReactNode;
  en: ReactNode;
  locale?: "es" | "en";
}) {
  if (locale === "es") return <>{es}</>;
  if (locale === "en") return <>{en}</>;
  return (
    <>
      <span lang="es" data-lang="es">{es}</span>
      <span lang="en" data-lang="en">{en}</span>
    </>
  );
}
