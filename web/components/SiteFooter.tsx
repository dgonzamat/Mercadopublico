"use client";

import { usePathname } from "next/navigation";
import { ShareButton } from "@/components/ShareButton";
import { InstagramLink } from "@/components/InstagramLink";
import { PinterestLink } from "@/components/PinterestLink";
import { LocaleLink, chromeLocale } from "@/components/LocaleLink";
import { T } from "@/components/T";
import { BUILD_VERSION } from "@/lib/version";

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
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              <T es="El proyecto" en="The project" locale={locale} />
            </p>
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
              <InstagramLink tone="light" />
              <PinterestLink tone="light" />
            </div>
          </div>

          <nav aria-label="Navegación principal del pie" className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Atlas
            </p>
            <ul className="space-y-1">
              <FooterLink href="/cases" es="Casos" en="Cases" locale={locale} />
              <FooterLink
                href="/probabilidades"
                es="Probabilidades"
                en="Probabilities"
                locale={locale}
              />
              <FooterLink href="/atlas" es="Mapa" en="Map" locale={locale} />
              <FooterLink
                href="/resumen"
                es="Resumen 10 min"
                en="10-min summary"
                locale={locale}
              />
            </ul>
          </nav>

          <nav aria-label="Más recursos" className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              <T es="Más" en="More" locale={locale} />
            </p>
            <ul className="space-y-1">
              <FooterLink href="/blog" es="Blog" en="Blog" locale={locale} />
              <FooterLink href="/patterns" es="Patrones" en="Patterns" locale={locale} />
              <FooterLink href="/researchers" es="Actores" en="Actors" locale={locale} />
              <FooterLink
                href="/frameworks"
                es="Marcos teóricos"
                en="Frameworks"
                locale={locale}
              />
              <FooterLink href="/entities" es="Entidades" en="Entities" locale={locale} />
              <FooterLink href="/about" es="Metodología" en="Method" locale={locale} />
              <FooterLink href="/contact" es="Contacto" en="Contact" locale={locale} />
              <FooterLink href="/visitantes" es="Visitantes" en="Visitors" locale={locale} />
              <FooterLink
                href="/calidad"
                es="Calidad del corpus"
                en="Corpus quality"
                locale={locale}
              />
              <FooterLink href="/cobertura" es="Cobertura" en="Coverage" locale={locale} />
              <FooterLink
                href="/fuentes"
                es="Fuentes (bibliografía)"
                en="Sources (bibliography)"
                locale={locale}
              />
              <FooterLink
                href="/releases"
                es="Releases PURSUE"
                en="PURSUE releases"
                locale={locale}
              />
            </ul>
          </nav>
        </div>

        <p
          className="border-t border-text/15 pt-6 font-mono text-xs uppercase tracking-widest text-muted"
          title="Versión desplegada (número de PR mergeado)"
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
