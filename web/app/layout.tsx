import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { ShareButton } from "@/components/ShareButton";
import { SiteHeader } from "@/components/SiteHeader";
import { T } from "@/components/T";
import { AnchorExpander } from "@/components/AnchorExpander";
import { CookieConsent } from "@/components/CookieConsent";
import { STATS } from "@/lib/siteStats";
import { BUILD_VERSION } from "@/lib/version";
import { SITE_URL } from "@/lib/site";
import { serializeJsonLd, websiteJsonLd } from "@/lib/jsonld";
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

// Metadata por defecto en español: es el idioma base del sitio (<html lang="es">,
// locale og es_ES). El inglés vive en el toggle del cliente, no en lo que
// indexan los buscadores.
const TITLE = "UAP Codex — Análisis institucional del fenómeno UAP";
const DESCRIPTION = `${STATS.years} años de fenómeno UAP documentado institucionalmente. ${STATS.cases} casos, ${STATS.patterns} patrones, ${STATS.frameworks} marcos teóricos comparados.`;
const SHORT_DESCRIPTION = `${STATS.years} años de fenómeno UAP, ${STATS.cases} casos, ${STATS.patterns} patrones.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · UAP Codex" },
  description: DESCRIPTION,
  applicationName: "UAP Codex",
  authors: [{ name: "UAP Codex" }],
  openGraph: {
    type: "website",
    siteName: "UAP Codex",
    title: TITLE,
    description: SHORT_DESCRIPTION,
    url: "/",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    images: [{ url: "/og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SHORT_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#c41e3a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="UAP Codex · Blog"
          href="/feed.xml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd()) }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <AnchorExpander />
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t-2 border-text bg-panel">
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
                <div className="flex items-center gap-3 pt-2">
                  <ShareButton title="UAP Codex" />
                  <a
                    href="https://www.instagram.com/uapcodex2026"
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label="UAP Codex en Instagram (@uapcodex2026)"
                    title="Instagram · @uapcodex2026"
                    className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-muted transition-colors hover:text-accent"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                  <a
                    href="https://www.pinterest.com/uapcodex2026"
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label="UAP Codex en Pinterest (@uapcodex2026)"
                    title="Pinterest · @uapcodex2026"
                    className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-muted transition-colors hover:text-accent"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.394-1.72-4.068-4.177-4.068-2.845 0-4.515 2.134-4.515 4.34 0 .859.331 1.781.744 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                    </svg>
                  </a>
                </div>
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
                    es="Actores"
                    en="Actors"
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

            <p
              className="border-t border-text/15 pt-6 font-mono text-xs uppercase tracking-widest text-muted"
              title="Versión desplegada (número de PR mergeado)"
            >
              <T
                es="UAP Codex · análisis institucional · 1947–2026"
                en="UAP Codex · institutional analysis · 1947–2026"
              />{" "}
              · {BUILD_VERSION}
            </p>
          </div>
        </footer>
        <CookieConsent />
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
