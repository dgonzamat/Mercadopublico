import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ShareButton } from "@/components/ShareButton";
import { InstagramLink } from "@/components/InstagramLink";
import { PinterestLink } from "@/components/PinterestLink";
import { SiteHeader } from "@/components/SiteHeader";
import { LocaleLink } from "@/components/LocaleLink";
import { T } from "@/components/T";
import { AnchorExpander } from "@/components/AnchorExpander";
import { VisitorBeacon } from "@/components/VisitorBeacon";
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
        {/* Google tag (gtag.js) · Consent Mode v2. La etiqueta carga siempre
            (queda en el HTML estático → Google la detecta), pero con todo el
            almacenamiento DENEGADO por defecto: sin cookies ni datos personales
            hasta que el visitante acepta en el banner (CookieConsent hace el
            `consent update`). Si ya aceptó antes (localStorage), se concede en el
            acto. Cumple GDPR y a la vez es detectable — a diferencia del gateo
            anterior, que no ponía el tag en el HTML y Google lo marcaba ausente. */}
        {/* Raw <script> a propósito: next/script (afterInteractive) inyecta el
            tag tras hidratar y NO queda en el HTML estático, así que el detector
            de Google no lo vería. El crudo sí aparece en el HTML exportado. */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-MZHZC5ZLY5"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
try{if(localStorage.getItem('uap-ga-consent')==='granted')gtag('consent','update',{analytics_storage:'granted'});}catch(e){}
gtag('js',new Date());gtag('config','G-MZHZC5ZLY5');`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <AuthProvider>
        <AnchorExpander />
        <VisitorBeacon />
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
                  <FooterLink href="/visitantes" es="Visitantes" en="Visitors" />
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
      <LocaleLink
        href={href}
        className="inline-block min-h-[36px] py-1 text-sm text-text underline-offset-4 hover:text-accent hover:underline"
      >
        <T es={es} en={en} />
      </LocaleLink>
    </li>
  );
}
