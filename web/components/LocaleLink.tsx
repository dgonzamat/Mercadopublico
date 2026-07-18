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

/**
 * Devuelve el href apropiado para el locale actual: si estamos en /en/ y el
 * destino es una ruta interna con espejo inglés, lo prefija con /en; en
 * cualquier otro caso lo deja igual. Puro (testeable), sin hooks.
 */
export function localizeHref(href: string, pathname: string | null): string {
  const onEs = pathname === "/es" || (pathname?.startsWith("/es/") ?? false);
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
