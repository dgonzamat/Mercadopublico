import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { MobileNav } from "@/components/MobileNav";
import { LocaleToggle } from "@/components/LocaleToggle";
import { T } from "@/components/T";
import { TOTAL_CASES } from "@/lib/data";
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

export const metadata: Metadata = {
  title: "UAP Atlas — Institutional analysis",
  description: `79 years of UAP phenomenon documented institutionally. ${TOTAL_CASES} cases, 18 patterns, 11 frameworks compared.`,
  openGraph: {
    title: "UAP Atlas — Institutional analysis",
    description: `79 years of UAP phenomenon, ${TOTAL_CASES} cases, 18 patterns.`,
    type: "website",
  },
};

const SECONDARY_NAV: Array<{ href: string; es: string; en: string }> = [
  { href: "/cases", es: "Casos", en: "Cases" },
  { href: "/atlas", es: "Atlas", en: "Atlas" },
  { href: "/about", es: "Metodología", en: "Method" },
  { href: "/resumen", es: "Resumen", en: "Summary" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans">
        <header className="sticky top-0 z-50 border-b-4 border-text bg-bg">
          <nav
            aria-label="Navegación principal"
            className="mx-auto flex max-w-6xl items-stretch justify-between gap-0 px-4 sm:px-6"
          >
            <Link
              href="/"
              className="group flex items-center gap-3 py-5 text-text"
              aria-label="UAP Atlas"
            >
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center bg-accent text-bg transition group-hover:rotate-180"
              >
                <span className="font-mono text-sm leading-none">▲</span>
              </span>
              <span className="font-display text-2xl font-medium leading-none tracking-tight md:text-3xl">
                UAP
                <span className="ml-1 italic text-accent">Atlas</span>
              </span>
            </Link>

            <div className="hidden items-stretch sm:flex">
              {SECONDARY_NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center border-l border-text/15 px-4 font-display text-base font-medium text-text hover:bg-text hover:text-bg md:text-lg"
                >
                  <T es={l.es} en={l.en} />
                </Link>
              ))}
              <Link
                href="/probabilidades"
                className="inline-flex items-center gap-2 border-l-4 border-text bg-accent px-6 font-display text-base font-medium text-bg hover:bg-text md:text-lg"
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
                  <FooterLink
                    href="/cases"
                    es="Casos"
                    en="Cases"
                  />
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
                  <FooterLink
                    href="/patterns"
                    es="Patrones"
                    en="Patterns"
                  />
                  <FooterLink
                    href="/researchers"
                    es="Ecosistema"
                    en="Ecosystem"
                  />
                  <FooterLink
                    href="/frameworks"
                    es="Frameworks"
                    en="Frameworks"
                  />
                  <FooterLink
                    href="/about"
                    es="Metodología"
                    en="Method"
                  />
                </ul>
              </nav>
            </div>

            <p className="border-t border-text/15 pt-6 font-mono text-xs uppercase tracking-widest text-muted">
              <T
                es="Colección open source · "
                en="Open source collection · "
              />
              <a
                href="https://github.com/dgonzamat/uap-atlas"
                className="text-text hover:text-accent hover:underline"
              >
                github
              </a>
              <T
                es=" · análisis institucional"
                en=" · institutional analysis"
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
