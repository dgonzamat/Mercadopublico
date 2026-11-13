"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShareButton } from "@/components/ShareButton";
import { InstagramLink } from "@/components/InstagramLink";
import { PinterestLink } from "@/components/PinterestLink";
import { LocaleLink, chromeLocale } from "@/components/LocaleLink";
import { T } from "@/components/T";
import { BUILD_VERSION } from "@/lib/version";
import { Eyebrow } from "@/lib/typography";

/**
 * Footer del sitio. Client component para servir UN idioma por URL en el chrome
 * (igual que los cuerpos de página): `chromeLocale(usePathname())` fija el idioma
 * según la ruta y se propaga a cada <T>. En rutas sin espejo `locale` queda
 * `undefined` → bilingüe (esos cuerpos también lo son). Se extrajo de app/layout
 * (server) porque el layout no conoce la ruta hija; usePathname sí, y resuelve en
 * el prerender del static export.
 */
export function SiteFooter() {
  const locale = chromeLocale(usePathname());
  return (
    <footer className="mt-16 border-t-2 border-text bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">
        <div className="grid gap-10 md:grid-cols-[2fr_3fr]">
          <div className="space-y-3">
            {/* Rótulos con Eyebrow, como el resto del sitio desde oct 2026 (no en mayúsculas). */}
            <Eyebrow>
              <T es="El proyecto" en="The project" locale={locale} />
            </Eyebrow>
            <p className="font-display text-2xl leading-snug text-text md:text-3xl">
              <T
                locale={locale}
                es={
                  <>
                    Un{" "}
                    <span className="italic text-accent">
                      cuaderno de investigación
                    </span>{" "}
                    abierto sobre UAP institucionales,
                    <br />
                    1947–2026.
                  </>
                }
                en={
                  <>
                    An{" "}
                    <span className="italic text-accent">
                      open research notebook
                    </span>{" "}
                    on institutional UAP cases,
                    <br />
                    1947–2026.
                  </>
                }
              />
            </p>
            <div className="flex items-center gap-3 pt-2">
              <ShareButton title="UAP Codex" locale={locale} />
              <InstagramLink tone="light" locale={locale} />
              <PinterestLink tone="light" locale={locale} />
            </div>
          </div>

          {/* Tres columnas de un solo tipo cada una (decisión del dueño, 13 nov 2026):
              antes «Atlas» tenía 4 enlaces y «More» 10, mezclando contenido con
              páginas del proyecto. El mapa se llama «Atlas», como en el menú de arriba.
              aria-label en el idioma de la URL (sin espejo: inglés). */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterColumn label={{ es: "Explorar", en: "Explore" }} locale={locale}>
              <FooterLink href="/cases" es="Casos" en="Cases" locale={locale} />
              <FooterLink href="/atlas" es="Atlas" en="Atlas" locale={locale} />
              <FooterLink href="/probabilidades" es="Probabilidades" en="Probabilities" locale={locale} />
              <FooterLink href="/cobertura" es="Cobertura" en="Coverage" locale={locale} />
              <FooterLink href="/releases" es="Releases PURSUE" en="PURSUE releases" locale={locale} />
            </FooterColumn>
            <FooterColumn label={{ es: "Contexto", en: "Context" }} locale={locale}>
              <FooterLink href="/researchers" es="Actores" en="Actors" locale={locale} />
              <FooterLink href="/entities" es="Entidades" en="Entities" locale={locale} />
              <FooterLink href="/frameworks" es="Marcos teóricos" en="Frameworks" locale={locale} />
              <FooterLink href="/fuentes" es="Fuentes (bibliografía)" en="Sources (bibliography)" locale={locale} />
            </FooterColumn>
            <FooterColumn label={{ es: "Proyecto", en: "Project" }} locale={locale}>
              <FooterLink href="/resumen" es="Resumen 10 min" en="10-min summary" locale={locale} />
              <FooterLink href="/about" es="Metodología" en="Method" locale={locale} />
              <FooterLink href="/blog" es="Blog" en="Blog" locale={locale} />
              <FooterLink href="/contact" es="Contacto" en="Contact" locale={locale} />
              <FooterLink href="/visitantes" es="Visitantes" en="Visitors" locale={locale} />
            </FooterColumn>
          </div>
        </div>

        <p
          className="border-t border-text/15 pt-6 font-mono text-xs text-muted"
          title={locale === "es" ? "Versión desplegada (número de PR mergeado)" : "Deployed version (merged PR number)"}
        >
          <T
            es="UAP Codex · análisis institucional · 1947–2026"
            en="UAP Codex · institutional analysis · 1947–2026"
            locale={locale}
          />{" "}
          · {BUILD_VERSION}
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  locale,
  children,
}: {
  label: { es: string; en: string };
  locale?: "es" | "en";
  children: ReactNode;
}) {
  return (
    <nav aria-label={locale === "es" ? `Pie de página: ${label.es.toLowerCase()}` : `Footer: ${label.en.toLowerCase()}`} className="space-y-2">
      <Eyebrow>
        <T es={label.es} en={label.en} locale={locale} />
      </Eyebrow>
      <ul className="space-y-1">{children}</ul>
    </nav>
  );
}

function FooterLink({
  href,
  es,
  en,
  locale,
}: {
  href: string;
  es: string;
  en: string;
  locale?: "es" | "en";
}) {
  return (
    <li>
      <LocaleLink
        href={href}
        className="inline-block min-h-[36px] py-1 text-sm text-text underline-offset-4 hover:text-accent hover:underline"
      >
        <T es={es} en={en} locale={locale} />
      </LocaleLink>
    </li>
  );
}
