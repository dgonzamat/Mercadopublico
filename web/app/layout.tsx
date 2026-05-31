import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { MobileNav } from "@/components/MobileNav";
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
  title: "UAP Atlas — Análisis institucional",
  description: `79 años del fenómeno UAP documentados institucionalmente. ${TOTAL_CASES} casos, 18 patrones, 11 frameworks comparados.`,
  openGraph: {
    title: "UAP Atlas — Análisis institucional",
    description: `79 años de fenómeno UAP, ${TOTAL_CASES} casos, 18 patrones.`,
    type: "website",
  },
};

const SECONDARY_NAV = [
  { href: "/cases", label: "Casos" },
  { href: "/atlas", label: "Atlas" },
  { href: "/about", label: "Metodología" },
  { href: "/resumen", label: "Resumen" },
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
              aria-label="UAP Atlas — inicio"
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
                  {l.label}
                </Link>
              ))}
              <Link
                href="/probabilidades"
                className="inline-flex items-center gap-2 border-l-4 border-text bg-accent px-6 font-display text-base font-medium text-bg hover:bg-text md:text-lg"
              >
                Ver probabilidades
                <span aria-hidden>→</span>
              </Link>
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
                  El proyecto
                </p>
                <p className="font-display text-2xl leading-snug text-text md:text-3xl">
                  Un{" "}
                  <span className="italic text-accent">
                    cuaderno de investigación
                  </span>{" "}
                  abierto sobre UAP institucionales,
                  <br />
                  1947–2026.
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
                  <FooterLink href="/cases" label="Casos" />
                  <FooterLink href="/probabilidades" label="Probabilidades" />
                  <FooterLink href="/atlas" label="Mapa" />
                  <FooterLink href="/resumen" label="Resumen 10 min" />
                </ul>
              </nav>

              <nav
                aria-label="Más recursos"
                className="space-y-2"
              >
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Más
                </p>
                <ul className="space-y-1">
                  <FooterLink href="/patterns" label="Patrones" />
                  <FooterLink href="/researchers" label="Ecosistema" />
                  <FooterLink href="/frameworks" label="Frameworks" />
                  <FooterLink href="/about" label="Metodología" />
                </ul>
              </nav>
            </div>

            <p className="border-t border-text/15 pt-6 font-mono text-xs uppercase tracking-widest text-muted">
              Colección open source ·{" "}
              <a
                href="https://github.com/dgonzamat/uap-atlas"
                className="text-text hover:text-accent hover:underline"
              >
                github
              </a>{" "}
              · análisis institucional
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="inline-block min-h-[36px] py-1 text-sm text-text underline-offset-4 hover:text-accent hover:underline"
      >
        {label}
      </Link>
    </li>
  );
}
