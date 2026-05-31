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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans">
        <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="font-mono text-sm tracking-tight text-text"
            >
              <span className="text-accent">▲</span> UAP Atlas
            </Link>
            <div className="hidden gap-5 text-sm text-muted sm:flex">
              <Link href="/cases" className="hover:text-text">
                Casos
              </Link>
              <Link href="/probabilidades" className="hover:text-text">
                Probabilidades
              </Link>
              <Link href="/atlas" className="hover:text-text">
                Atlas
              </Link>
              <Link href="/about" className="hover:text-text">
                Metodología
              </Link>
              <Link href="/resumen" className="hover:text-text">
                Resumen
              </Link>
            </div>
            <MobileNav />
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-border py-8 text-center text-xs text-muted">
          <nav
            aria-label="Enlaces secundarios"
            className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2"
          >
            <Link href="/patterns" className="hover:text-text">
              Patrones
            </Link>
            <Link href="/researchers" className="hover:text-text">
              Ecosistema
            </Link>
            <Link href="/frameworks" className="hover:text-text">
              Frameworks
            </Link>
          </nav>
          <p>
            UAP Atlas · análisis institucional · corpus open source ·{" "}
            <a
              href="https://github.com/dgonzamat/mercadopublico"
              className="text-accent hover:underline"
            >
              github
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
