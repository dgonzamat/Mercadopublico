import { SITE_URL } from "./site";
import { countryEn } from "./i18n-geo";
import type { UAPCase, Post, Researcher } from "./types";
import { STATS } from "./siteStats";

/**
 * Schema.org JSON-LD helpers.
 *
 * Injected as <script type="application/ld+json"> in the layout (site-wide)
 * and per case page. Enables Google rich snippets (article cards,
 * knowledge-graph entity recognition) and helps the corpus be legible to
 * LLM crawlers as structured data, not just prose.
 *
 * Cases are emitted as `Article` (editorial content about a historical
 * event), NOT as `Event` — `Event` triggers Google's commercial-event
 * validator that demands `organizer`, `performer`, `offers`, none of which
 * apply to a historical case.
 */

/**
 * Serializa un objeto JSON-LD para inyectarlo en <script type="application/ld+json">.
 * Escapa `<` como secuencia unicode (\\u003c): si algún campo del corpus llegara a contener
 * "</script>" o "<!--", no puede cerrar el tag ni abrir comentario HTML
 * (el JSON resultante sigue siendo válido). Usar SIEMPRE este helper en vez
 * de JSON.stringify directo dentro de dangerouslySetInnerHTML.
 */
export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * BreadcrumbList para las páginas de detalle. Refleja el componente
 * <Breadcrumb> visible; los labels van en español (idioma base del sitio).
 * El último ítem (página actual) se incluye sin `item` propio — Google lo
 * acepta y evita duplicar la URL canónica.
 */
export function breadcrumbJsonLd(
  items: { href?: string; label: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: `${SITE_URL}${it.href}` } : {}),
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "UAP Codex",
    alternateName: "UAP Codex — Institutional analysis",
    url: SITE_URL,
    description: `${STATS.years} años de fenómeno UAP documentado institucionalmente. ${STATS.cases} casos en ${STATS.countries} países, con un modelo de probabilidad comparable (MECE).`,
    inLanguage: ["es", "en"],
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "UAP Codex",
      url: SITE_URL,
    },
  };
}

/**
 * `locale` es OBLIGATORIO en los helpers que emiten texto del corpus.
 *
 * El corpus es bilingüe y sus campos vienen en pares (`name`/`name_en`,
 * `summary`/`summary_en`, `bio_short`/`bio_short_en`), pero estos helpers los
 * consumían CRUDOS — así que la ruta raíz, que es la INGLESA, publicaba
 * `headline` y `description` en español a los rich results, y su `url`/`@id`
 * apuntaban siempre a la variante EN aunque el consumidor fuera `/es`. Es el
 * mismo anti-pattern de «campo con par bilingüe consumido crudo» que ya se
 * corrigió en el render y en `generateMetadata`; los datos estructurados eran
 * la tercera superficie y nadie la miraba (jul 2026).
 *
 * Al ser un parámetro requerido, `tsc` fuerza que toda call-site lo threadee —
 * misma red de completitud que usa el threading de `<T locale>`.
 */
export type JsonLdLocale = "es" | "en";

/** Prefijo de ruta del espejo: `/es` en español, raíz en inglés. */
const localePrefix = (locale: JsonLdLocale) => (locale === "es" ? "/es" : "");

export function caseJsonLd(c: UAPCase, locale: JsonLdLocale) {
  const url = `${SITE_URL}${localePrefix(locale)}/cases/${c.id}/`;
  // Article needs a year-anchored date. We don't track a real publish date
  // per case, so we anchor on year_start (the historical year of the case)
  // and treat the current build time as dateModified. Google accepts that
  // and warnings on missing datePublished/dateModified go away.
  const datePublished = `${c.year_start}-01-01`;
  const dateModified = new Date().toISOString().slice(0, 10);
  // Use the case's primary document image when available; otherwise the
  // site-wide OG default. Either satisfies Google's "image" requirement.
  const image = c.primaryDocument?.url
    ? [c.primaryDocument.url]
    : [`${SITE_URL}/og.png`];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: locale === "es" ? c.name : c.name_en ?? c.name,
        description: locale === "es" ? c.summary : c.summary_en ?? c.summary,
        articleSection: "UAP institutional cases",
        inLanguage: c.whatHappened_en ? ["es", "en"] : ["es"],
        url,
        datePublished,
        dateModified,
        image,
        author: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#org`,
          name: "UAP Codex",
          url: SITE_URL,
        },
        publisher: { "@id": `${SITE_URL}/#org` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
        contentLocation: {
          "@type": "Place",
          name:
            c.location.place ||
            (locale === "es" ? c.country_name : countryEn(c.country_name)),
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

export function postJsonLd(p: Post, locale: JsonLdLocale) {
  const url = `${SITE_URL}${localePrefix(locale)}/blog/${p.id}/`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    headline: locale === "es" ? p.title : p.title_en ?? p.title,
    description: locale === "es" ? p.summary : p.summary_en ?? p.summary,
    inLanguage: p.body_en ? ["es", "en"] : ["es"],
    url,
    datePublished: p.date,
    dateModified: p.date,
    image: [`${SITE_URL}/og.png`],
    ...(p.tags && p.tags.length > 0 ? { keywords: p.tags.join(", ") } : {}),
    author: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "UAP Codex",
      url: SITE_URL,
    },
    publisher: { "@id": `${SITE_URL}/#org` },
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function researcherJsonLd(r: Researcher, locale: JsonLdLocale) {
  const url = `${SITE_URL}${localePrefix(locale)}/researchers/${r.id}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    // `name` es un nombre propio: no se traduce (0/91 tienen `name_en`).
    name: r.name,
    description:
      locale === "es" ? r.bio_short : r.bio_short_en ?? r.bio_short,
    url,
    ...(r.photo ? { image: r.photo } : {}),
    ...(r.credentials ? { jobTitle: r.credentials } : {}),
    ...(r.born ? { birthDate: String(r.born) } : {}),
    ...(r.death ? { deathDate: String(r.death) } : {}),
    subjectOf: { "@id": `${SITE_URL}/#website` },
  };
}

/**
 * Dataset para el corpus completo (emitido en /cases/, la página canónica del
 * archivo). Complementa al CollectionPage: `Dataset` es el schema.org que
 * habilita elegibilidad en **Google Dataset Search** —un canal de descubrimiento
 * aparte del índice web, natural para un corpus de investigación—. Describe la
 * cobertura temporal/geográfica, la técnica de medición (juicio analítico
 * estructurado + modelo MECE) y las variables por caso, y expone una
 * distribución machine-readable real (`search-index.json`, desplegado y estable).
 * `@id` estable para que Google lo dedupe entre /cases/ y su espejo /es/cases/.
 * Se omite `license` a propósito: el corpus no declara una licencia de datos de
 * sitio (solo licencias por-imagen), y no se inventa una.
 */
export function corpusDatasetJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE_URL}/cases/#dataset`,
    name: `UAP Codex — Institutional UAP case corpus (${STATS.startYear}–${STATS.endYear})`,
    description: `A structured corpus of ${STATS.cases} institutional UAP cases across ${STATS.countries} countries (${STATS.startYear}–${STATS.endYear}), each with an evidence tier and a comparable per-case probability distribution over six mutually exclusive, exhaustive narratives (MECE model).`,
    url: `${SITE_URL}/cases/`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: ["en", "es"],
    keywords: [
      "UAP",
      "UFO",
      "unidentified anomalous phenomena",
      "institutional cases",
      "declassified documents",
      "MECE probability",
      "evidence tier",
    ],
    creator: { "@id": `${SITE_URL}/#org` },
    temporalCoverage: `${STATS.startYear}/${STATS.endYear}`,
    measurementTechnique:
      "Structured analytic judgment (ICD-203); comparable MECE probability model",
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "tier",
        description: "Evidence tier (S/A/B) by strength of institutional documentation",
      },
      {
        "@type": "PropertyValue",
        name: "probability",
        description: "Per-case heterogeneity probability (0–100)",
      },
      {
        "@type": "PropertyValue",
        name: "posterior",
        description: "MECE distribution over six mutually exclusive narratives, summing to 1",
      },
      {
        "@type": "PropertyValue",
        name: "country",
        description: "ISO country code of the incident location",
      },
      {
        "@type": "PropertyValue",
        name: "year_start",
        description: "Year the incident began",
      },
    ],
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE_URL}/search-index.json`,
    },
  };
}

/**
 * CollectionPage + ItemList para el índice /cases/. Anuncia la colección
 * completa como lista ordenada de casos (nombre + URL) — para rich results de
 * colección y para que crawlers/LLM lean el corpus como un conjunto
 * estructurado, no solo una página de enlaces. Ligado al WebSite vía isPartOf.
 */
export function casesCollectionJsonLd(
  cases: UAPCase[],
  locale: JsonLdLocale,
) {
  const base = `${SITE_URL}${localePrefix(locale)}/cases/`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${base}#collection`,
    name:
      locale === "es" ? "Casos UAP institucionales" : "Institutional UAP cases",
    url: base,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: ["es", "en"],
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: cases.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: cases.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${base}${c.id}/`,
        name: locale === "es" ? c.name : c.name_en ?? c.name,
      })),
    },
  };
}
