import { SITE_URL } from "./site";
import type { UAPCase } from "./types";
import { STATS } from "./siteStats";

/**
 * Schema.org JSON-LD helpers.
 *
 * Injected as <script type="application/ld+json"> in the layout (site-wide)
 * and per case page. Enables Google rich snippets (article cards, event
 * results, knowledge-graph entity recognition) and helps the corpus be
 * legible to LLM crawlers as structured data, not just prose.
 */

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "UAP Codex",
    alternateName: "UAP Codex — Institutional analysis",
    url: SITE_URL,
    description: `${STATS.years} years of UAP phenomenon documented institutionally. ${STATS.cases} cases across ${STATS.countries} countries, calibrated under ICD-203.`,
    inLanguage: ["es", "en"],
    publisher: {
      "@type": "Organization",
      name: "UAP Codex",
      url: SITE_URL,
    },
  };
}

export function caseJsonLd(c: UAPCase) {
  const url = `${SITE_URL}/cases/${c.id}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: c.name,
        description: c.summary,
        articleSection: "UAP institutional cases",
        inLanguage: c.whatHappened_en ? ["es", "en"] : ["es"],
        url,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: {
          "@type": "Event",
          name: c.name,
          startDate: String(c.year_start),
          ...(c.year_end ? { endDate: String(c.year_end) } : {}),
          location: {
            "@type": "Place",
            name: c.location.place || c.country_name,
            address: {
              "@type": "PostalAddress",
              addressCountry: c.country,
              addressLocality: c.location.place || undefined,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: c.location.lat,
              longitude: c.location.lng,
            },
          },
        },
        ...(c.sources && c.sources.length > 0
          ? {
              citation: c.sources.map((s) => ({
                "@type": "CreativeWork",
                name: s.name,
                ...(s.url ? { url: s.url } : {}),
              })),
            }
          : {}),
      },
    ],
  };
}
