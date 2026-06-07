"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "@/components/T";

/**
 * Links secundarios del header desktop, con estado "página activa".
 * Client component (necesita usePathname) — extraído del layout (server)
 * solo por eso. Marca aria-current y resalta el link de la ruta actual,
 * incluyendo páginas de detalle (/cases/nimitz resalta "Casos").
 */
const NAV: Array<{ href: string; es: string; en: string }> = [
  { href: "/cases", es: "Casos", en: "Cases" },
  { href: "/atlas", es: "Atlas", en: "Atlas" },
  { href: "/researchers", es: "Actores", en: "Actors" },
  { href: "/blog", es: "Blog", en: "Blog" },
  { href: "/about", es: "Metodología", en: "Method" },
];

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((l) => {
        const active =
          pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center border-l border-text/15 px-3 font-display text-base font-medium hover:bg-text hover:text-bg ${
              active ? "text-accent" : "text-text"
            }`}
          >
            <T es={l.es} en={l.en} />
          </Link>
        );
      })}
    </>
  );
}
