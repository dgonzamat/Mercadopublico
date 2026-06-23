import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { ShareButton } from "@/components/ShareButton";
import { InstagramLink } from "@/components/InstagramLink";
import { PinterestLink } from "@/components/PinterestLink";
import { SiteHeader } from "@/components/SiteHeader";
import { T } from "@/components/T";
import { AnchorExpander } from "@/components/AnchorExpander";
import { CookieConsent } from "@/components/CookieConsent";
import { AuthProvider } from "@/components/auth/AuthProvider";
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
        {/* Cloudflare Web Analytics — sin cookies ni datos personales, así que
            no requiere el banner de consentimiento (a diferencia de GA4) y se
            carga en todas las páginas. Mide visitas reales de todas las fuentes.
            El token es público por diseño (va en el cliente). */}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "7bd682d9ce32465087e80f899114d2a8"}'
        />
      </head>
      <body className="min-h-screen font-sans">
        <AuthProvider>
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
                  <InstagramLink tone="light" />
                  <PinterestLink tone="light" />
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
        </AuthProvider>
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
