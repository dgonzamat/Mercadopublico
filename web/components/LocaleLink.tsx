"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Secciones con espejo español indexable (/es/…). Solo estas rutas se prefijan
 * con /es cuando el visitante está en el árbol español; las demás (atlas,
 * laboratorio, contact, fuentes, visitantes, acceso) NO tienen página /en/, así
 * que sus links se quedan en la raíz (inglés) para no romper (evita /es/atlas → 404).
 * "" = home ("/").
 */
const MIRRORED = new Set([
  "",
  "cases",
  "blog",
  "patterns",
  "researchers",
  "about",
  "probabilidades",
  "resumen",
  "cobertura",
  "frameworks",
  "releases",
]);

function topSegment(href: string): string {
  const clean = href.split("?")[0].split("#")[0];
  return clean.replace(/^\//, "").split("/")[0];
}

/** ¿Estamos en una ruta del árbol español (/es o /es/…)? */
export function isEsRoute(pathname: string | null): boolean {
  return pathname === "/es" || (pathname?.startsWith("/es/") ?? false);
}

/**
 * Idioma que el CHROME (header/footer) debe renderizar en esta URL, para casar
 * con el cuerpo:
 *   · /es/…            → "es"
 *   · raíz con espejo  → "en"  (esas páginas sirven solo inglés)
 *   · sin espejo / SSR → undefined  → el chrome cae a bilingüe (los cuerpos de
 *                        esas rutas también lo son, y el fallback de prerender
 *                        sin pathname nunca filtra un idioma equivocado)
 * `usePathname` SÍ resuelve la ruta en el prerender del static export (los
 * LocaleLink del footer ya salen con /es incrustado), así que el HTML estático
 * queda mono-idioma sin depender de la hidratación. Pura, testeable.
 */
export function chromeLocale(pathname: string | null): "es" | "en" | undefined {
  if (!pathname) return undefined;
  if (isEsRoute(pathname)) return "es";
  return mirrorHref(pathname) !== null ? "en" : undefined;
}

/**
 * URL de la MISMA página en el otro idioma, o `null` si la ruta no tiene espejo.
 * Root ↔ /es solo para las secciones en MIRRORED (las que sirven un idioma por
 * URL). Las rutas sin espejo (atlas, contact, …) devuelven null → el toggle cae
 * al flip-CSS legacy (siguen siendo bilingües en una sola URL). Pura, testeable.
 */
export function mirrorHref(pathname: string | null): string | null {
  if (!pathname) return null;
  const onEs = isEsRoute(pathname);
  if (onEs) {
    // /es/… → raíz inglesa; /es → /
    const rest = pathname.slice(3); // "/es/patterns" → "/patterns", "/es" → ""
    return rest === "" ? "/" : rest;
  }
  // raíz → /es solo si la sección tiene espejo
  if (!MIRRORED.has(topSegment(pathname))) return null;
  return pathname === "/" ? "/es" : `/es${pathname}`;
}

/**
 * Devuelve el href apropiado para el locale actual: si estamos en /en/ y el
 * destino es una ruta interna con espejo inglés, lo prefija con /en; en
 * cualquier otro caso lo deja igual. Puro (testeable), sin hooks.
 */
export function localizeHref(href: string, pathname: string | null): string {
  const onEs = isEsRoute(pathname);
  if (!onEs) return href;
  if (!href.startsWith("/") || href.startsWith("/es/") || href === "/es") {
    return href;
  }
  if (!MIRRORED.has(topSegment(href))) return href;
  return href === "/" ? "/es/" : `/es${href}`;
}

/**
 * <Link> consciente del locale: en el árbol /es/ apunta a la versión española
 * de la ruta (cuando existe). Drop-in de next/link para la nav del chrome.
 */
export function LocaleLink({
  href,
  ...rest
}: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const resolved =
    typeof href === "string" ? localizeHref(href, pathname) : href;
  return <Link href={resolved} {...rest} />;
}
