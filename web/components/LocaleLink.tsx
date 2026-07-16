"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Secciones con espejo inglés indexable (/en/…). Solo estas rutas se prefijan
 * con /en cuando el visitante está en el árbol inglés; las demás (atlas,
 * laboratorio, contact, fuentes, visitantes, acceso) NO tienen página /en/, así
 * que sus links se quedan en ES para no romper (evita /en/atlas → 404).
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

/**
 * Devuelve el href apropiado para el locale actual: si estamos en /en/ y el
 * destino es una ruta interna con espejo inglés, lo prefija con /en; en
 * cualquier otro caso lo deja igual. Puro (testeable), sin hooks.
 */
export function localizeHref(href: string, pathname: string | null): string {
  const onEn = pathname === "/en" || (pathname?.startsWith("/en/") ?? false);
  if (!onEn) return href;
  if (!href.startsWith("/") || href.startsWith("/en/") || href === "/en") {
    return href;
  }
  if (!MIRRORED.has(topSegment(href))) return href;
  return href === "/" ? "/en/" : `/en${href}`;
}

/**
 * <Link> consciente del locale: en el árbol /en/ apunta a la versión inglesa
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
