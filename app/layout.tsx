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
        <header className="sticky top-0 z-50 border-b-2 border-text bg-bg/95 backdrop-blur">
          <nav
            aria-label="Navegación principal"
            className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
          >
            <Link
              href="/"
              className="group flex items-baseline gap-2 text-text"
              aria-label="UAP Atlas — inicio"
            >
              <span
                aria-hidden
                className="font-mono text-base leading-none text-accent transition group-hover:rotate-180"
              >
                ▲
              </span>
              <span className="font-display text-xl font-medium tracking-tight md:text-2xl">
                UAP <span className="italic text-accent">Atlas</span>
              </span>
            </Link>

            <div className="hidden items-center gap-7 sm:flex">
              {SECONDARY_NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-text underline-offset-8 hover:text-accent hover:underline"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/probabilidades"
                className="inline-flex min-h-[40px] items-center rounded-none bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:bg-text"
              >
                Ver probabilidades →
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
              Corpus open source ·{" "}
              <a
                href="https://github.com/dgonzamat/mercadopublico"
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
