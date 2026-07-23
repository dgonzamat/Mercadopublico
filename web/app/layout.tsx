import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnchorExpander } from "@/components/AnchorExpander";
import { VisitorBeacon } from "@/components/VisitorBeacon";
import { CookieConsent } from "@/components/CookieConsent";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { STATS } from "@/lib/siteStats";
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

// Metadata por defecto en INGLÉS: es el idioma primario del sitio (<html lang="en">,
// locale og en_US) para maximizar el alcance global. El español vive en el espejo
// /es/ y en el toggle del cliente. (El español primario fue la decisión previa;
// se invirtió por SEO internacional.)
const TITLE = "UAP Codex — Institutional analysis of the UAP phenomenon";
const DESCRIPTION = `${STATS.years} years of institutionally documented UAP phenomena. ${STATS.cases} cases, ${STATS.patterns} patterns, ${STATS.frameworks} theoretical frameworks compared.`;
const SHORT_DESCRIPTION = `${STATS.years} years of UAP phenomena, ${STATS.cases} cases, ${STATS.patterns} patterns.`;

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
    locale: "en_US",
    alternateLocale: ["es_ES"],
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
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
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

        <SiteFooter />
        <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
