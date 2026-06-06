import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { MobileNav } from "@/components/MobileNav";
import { HeaderNav } from "@/components/HeaderNav";
import { LocaleToggle } from "@/components/LocaleToggle";
import { SiteSearch } from "@/components/SiteSearch";
import { T } from "@/components/T";
import { AnchorExpander } from "@/components/AnchorExpander";
import { STATS } from "@/lib/siteStats";
import { BUILD_VERSION } from "@/lib/version";
import { SITE_URL } from "@/lib/site";
import { websiteJsonLd } from "@/lib/jsonld";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const TITLE = "UAP Codex — Institutional analysis";
const DESCRIPTION = `${STATS.years} years of UAP phenomenon documented institutionally. ${STATS.cases} cases, ${STATS.patterns} patterns, ${STATS.frameworks} frameworks compared.`;
const SHORT_DESCRIPTION = `${STATS.years} years of UAP phenomenon, ${STATS.cases} cases, ${STATS.patterns} patterns.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · UAP Codex" },
  description: DESCRIPTION,
  applicationName: "UAP Codex",
  authors: [{ name: "UAP Codex" }],
  alternates: {
    canonical: "/",
    languages: {
      es: "/",
      en: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "UAP Codex",
    title: TITLE,
    description: SHORT_DESCRIPTION,
    url: "/",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SHORT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <AnchorExpander />
        <header className="sticky top-0 z-50 border-b-4 border-text bg-bg">
          <nav
            aria-label="Navegación principal"
            className="mx-auto flex max-w-6xl items-stretch justify-between gap-0 px-4 sm:px-6"
          >
            <Link
              href="/"
              className="group flex items-center gap-3 py-5 text-text"
              aria-label="UAP Codex"
            >
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center bg-accent text-bg transition group-hover:rotate-180"
              >
                <span className="font-mono text-sm leading-none">▲</span>
              </span>
              <span className="relative font-display text-2xl font-medium leading-none tracking-tight md:text-3xl">
                UAP
                <span className="ml-1 italic text-accent">Codex</span>
                <span
                  className="pointer-events-none absolute -top-1 right-0 font-mono text-[9px] font-normal not-italic leading-none text-muted"
                  title="Versión desplegada (número de PR mergeado)"
                >
                  {BUILD_VERSION}
                </span>
              </span>
            </Link>

            <div className="hidden items-stretch gap-3 sm:flex">
              <div className="flex items-center">
                <SiteSearch />
              </div>
              <HeaderNav />
              <Link
                href="/probabilidades"
                className="inline-flex items-center gap-2 border-l-4 border-text bg-accent px-4 font-display text-base font-medium text-bg hover:bg-text"
              >
                <T es="Ver probabilidades" en="See probabilities" />
                <span aria-hidden>→</span>
              </Link>
              <LocaleToggle />
            </div>

            <MobileNav />
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="mt-32 border-t-2 border-text bg-panel">
          <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">
            <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  <T es="El proyecto" en="The project" />
                </p>
                <p className="font-display text-2xl leading-snug text-text md:text-3xl">
                  <T
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
              </div>

              <nav
                aria-label="Navegación principal del pie"
                className="space-y-2"
              >
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Atlas
                </p>
                <ul className="space-y-1">
                  <FooterLink href="/cases" es="Casos" en="Cases" />
                  <FooterLink
                    href="/probabilidades"
                    es="Probabilidades"
                    en="Probabilities"
                  />
                  <FooterLink href="/atlas" es="Mapa" en="Map" />
                  <FooterLink
                    href="/resumen"
                    es="Resumen 10 min"
                    en="10-min summary"
                  />
                </ul>
              </nav>

              <nav aria-label="Más recursos" className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  <T es="Más" en="More" />
                </p>
                <ul className="space-y-1">
                  <FooterLink href="/blog" es="Blog" en="Blog" />
                  <FooterLink href="/patterns" es="Patrones" en="Patterns" />
                  <FooterLink
                    href="/researchers"
                    es="Investigadores"
                    en="Researchers"
                  />
                  <FooterLink
                    href="/frameworks"
                    es="Marcos teóricos"
                    en="Frameworks"
                  />
                  <FooterLink href="/about" es="Metodología" en="Method" />
                  <FooterLink href="/contact" es="Contacto" en="Contact" />
                  <FooterLink
                    href="/fuentes"
                    es="Fuentes (bibliografía)"
                    en="Sources (bibliography)"
                  />
                </ul>
              </nav>
            </div>

            <p className="border-t border-text/15 pt-6 font-mono text-xs uppercase tracking-widest text-muted">
              <T
                es="UAP Codex · análisis institucional · 1947–2026"
                en="UAP Codex · institutional analysis · 1947–2026"
              />
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function FooterLink({
  href,
  es,
  en,
}: {
  href: string;
  es: string;
  en: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="inline-block min-h-[36px] py-1 text-sm text-text underline-offset-4 hover:text-accent hover:underline"
      >
        <T es={es} en={en} />
      </Link>
    </li>
  );
}
