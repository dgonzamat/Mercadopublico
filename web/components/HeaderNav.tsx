"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "@/components/T";
import { localizeHref, chromeLocale } from "@/components/LocaleLink";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Links secundarios del header desktop, con estado "página activa".
 * Client component (necesita usePathname) — extraído del layout (server)
 * solo por eso. Marca aria-current y resalta el link de la ruta actual,
 * incluyendo páginas de detalle (/cases/nimitz resalta "Casos").
 *
 * El Laboratorio (reporting) NO va como ítem fijo: solo aparece — y
 * destacado — cuando hay sesión, para no mandar a los anónimos contra el
 * muro de login. Los anónimos llegan vía los CTA contextuales en /cases y
 * /probabilidades.
 */
const NAV: Array<{ href: string; es: string; en: string }> = [
  { href: "/cases", es: "Casos", en: "Cases" },
  { href: "/atlas", es: "Atlas", en: "Atlas" },
  { href: "/researchers", es: "Actores", en: "Actors" },
  // NA-1 · la puerta de entrada para el visitante nuevo, visible en desktop
  { href: "/resumen", es: "Resumen", en: "Summary" },
  { href: "/blog", es: "Blog", en: "Blog" },
  { href: "/releases", es: "PURSUE 2026", en: "PURSUE 2026" },
];

export function HeaderNav({ dark = false }: { dark?: boolean } = {}) {
  const pathname = usePathname();
  const locale = chromeLocale(pathname);
  const { user } = useAuth();
  // El href efectivo depende del locale (en /en/ apunta a /en/…). El estado
  // "activo" se compara contra ese href localizado para resaltar bien en /en/.
  const hrefFor = (href: string) => localizeHref(href, pathname);
  const isActive = (href: string) => {
    const h = hrefFor(href);
    return pathname === h || pathname.startsWith(`${h}/`);
  };

  const linkClass = (active: boolean) =>
    `inline-flex items-center border-l px-3 font-display text-base font-medium ${
      dark
        ? `border-bg/15 hover:bg-bg hover:text-text ${active ? "text-accent-bright" : "text-bg/85"}`
        : `border-text/15 hover:bg-text hover:text-bg ${active ? "text-accent" : "text-text"}`
    }`;

  return (
    <>
      {NAV.map((l) => (
        <Link
          key={l.href}
          href={hrefFor(l.href)}
          aria-current={isActive(l.href) ? "page" : undefined}
          className={linkClass(isActive(l.href))}
        >
          <T es={l.es} en={l.en} locale={locale} />
        </Link>
      ))}

      {/* Laboratorio · solo con sesión, siempre en acento (atajo destacado) */}
      {user && (
        <Link
          href="/laboratorio"
          aria-current={isActive("/laboratorio") ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 border-l px-3 font-display text-base font-medium ${
            dark
              ? "border-bg/15 text-accent-bright hover:bg-bg hover:text-text"
              : "border-text/15 text-accent hover:bg-text hover:text-bg"
          }`}
        >
          <span aria-hidden>◆</span>
          <T es="Laboratorio" en="Data Lab" locale={locale} />
        </Link>
      )}
    </>
  );
}
