import type { ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { cases, getPattern, TOTAL_CASES } from "@/lib/data";
import { CATEGORY_META, TIER_META } from "@/lib/ui";
import { posteriorFor } from "@/lib/meceModel";
import { CasePosterior } from "@/components/MeceChart";
import { T } from "@/components/T";
import { countryEn } from "@/lib/i18n-geo";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { ResearcherAvatar } from "@/components/ResearcherAvatar";
import { researchersForCase } from "@/lib/researcherCases";
import { EpistemicBadge } from "@/components/Badge";
import PdfDoc from "@/components/PdfDoc";
import DvidsVideo from "@/components/DvidsVideo";
import { Eyebrow, H1, Body, Caption, PullQuote } from "@/lib/typography";
import { caseJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { linkCaseRefs } from "@/lib/caseRefs";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.id }));
}

// Mapa slug → nombre para el title/aria-label de las referencias cruzadas
// "[[slug]]" que linkCaseRefs enlaza en la prosa. Se construye una vez a nivel de
// módulo desde el corpus ya importado (server component), así el helper se
// mantiene data-free y sin coste por render.
const NAME_BY_SLUG = new Map(cases.map((c) => [c.id, c.name_en ?? c.name]));

// Grafo INVERSO de citas: para cada caso, qué otros casos lo citan en su prosa vía
// el markup "[[slug]]" (el mismo que linkCaseRefs enlaza hacia adelante). El grafo
// era unidireccional —ibas de A→B por la cita, pero en B no sabías que A lo cita—;
// esto cierra el bucle. Se construye una vez a nivel de módulo escaneando el corpus
// (server component), sin coste por render.
const BACKLINKS = (() => {
  const REF = /\[\[([a-z0-9-]+)\]\]/g;
  const map = new Map<string, Set<string>>();
  for (const c of cases) {
    const prose = [
      c.summary, c.summary_en, c.whatHappened, c.whatHappened_en,
      c.whyMatters, c.whyMatters_en, ...(c.evidence ?? []), ...(c.evidence_en ?? []),
    ].filter(Boolean).join("\n");
    for (const m of prose.matchAll(REF)) {
      const target = m[1];
      if (target === c.id) continue; // no auto-citas
      if (!map.has(target)) map.set(target, new Set());
      map.get(target)!.add(c.id);
    }
  }
  return map;
})();

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Case not found" };
  const path = `/cases/${c.id}/`;
  // Ruta INGLESA: solo campos _en. Antes usaba `seoDescription`/`seoTitle`, que
  // están en español, y los servía tal cual a la SERP anglófona.
  const description = c.seoDescription_en ?? c.summary_en ?? c.summary;
  return {
    // `seoTitle_en` (cuando existe) reemplaza el título completo, sin el sufijo
    // "· UAP Codex" del template, para controlar la longitud del snippet y
    // poner las keywords de la query primero. Si no, se usa el name + template.
    title: c.seoTitle_en ? { absolute: c.seoTitle_en } : `${c.name_en ?? c.name}`,
    description,
    alternates: {
      canonical: path,
      languages: {
        en: path,
        es: `/es${path}`,
        "x-default": path,
      },
    },
    openGraph: {
      type: "article",
      title: `${c.name_en ?? c.name} — ${c.year_start}${c.year_end ? `–${c.year_end}` : ""}`,
      description,
      url: path,
      locale: "en_US",
      alternateLocale: ["es_ES"],
      // Si el caso tiene documento primario (escaneo FOIA, foto oficial),
      // úsalo como tarjeta social: identifica el caso mejor que el OG genérico.
      images: c.primaryDocument?.url
        ? [{ url: c.primaryDocument.url, alt: c.primaryDocument.alt ?? c.name }]
        : [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.name_en ?? c.name} — UAP Codex`,
      description: c.summary_en ?? c.summary,
      images: c.primaryDocument?.url ? [c.primaryDocument.url] : ["/og.png"],
    },
  };
}

/**
 * Extract the longest quoted phrase from a body of prose, to render
 * as a pull-quote. Returns null if no suitable quote (30–240 chars).
 *
 * The corpus uses single quotes (') for technical terms ('Anomalous Aerial
 * Vehicles', 'flying disc') and double quotes (" " or curly “”) for actual
 * citations. We accept both — heuristic only.
 */
function findPullQuote(text?: string): string | null {
  if (!text) return null;
  const patterns = [
    /[“”]([^“”]{30,240})[“”]|"([^"]{30,240})"/g,
    /''([^']{30,240})''|'([^']{30,240})'/g,
  ];
  const all: string[] = [];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const q = m[1] ?? m[2];
      if (q) all.push(q);
    }
  }
  if (all.length === 0) return null;
  all.sort((a, b) => b.length - a.length);
  return all[0];
}

export async function CaseDetailPage(
  props: {
    params: Promise<{ slug: string }>;
    locale?: "es" | "en";
  }
) {
  const params = await props.params;
  const locale = props.locale ?? "en";
  const c = cases.find((x) => x.id === params.slug);
  if (!c) notFound();

  const caseResearchers = researchersForCase(c.id);
  const sortedByNum = [...cases].sort((a, b) => a.num - b.num);
  const idx = sortedByNum.findIndex((x) => x.id === c.id);
  const prev = idx > 0 ? sortedByNum[idx - 1] : null;
  const next = idx < sortedByNum.length - 1 ? sortedByNum[idx + 1] : null;

  const year = c.year_end
    ? `${c.year_start}–${c.year_end}`
    : c.year_start.toString();

  const casePatterns = c.patterns
    .map((id) => getPattern(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const similar = cases
    .filter((x) => x.id !== c.id)
    .map((x) => {
      const sharedPatterns = x.patterns.filter((p) => c.patterns.includes(p));
      const sameCountry = x.country === c.country;
      return {
        caseData: x,
        sharedPatterns,
        sameCountry,
        score: (sameCountry ? 1 : 0) + sharedPatterns.length * 2,
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Backlinks: casos que CITAN a éste en su prosa (grafo inverso de [[slug]]).
  // Distinto de `similar` (heurístico por patrones/país): esto es cita explícita.
  const backlinks = [...(BACKLINKS.get(c.id) ?? [])]
    .map((id) => cases.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.year_start - a.year_start);

  // Para el CTA de un caso SIN expandir: el primer similar que sí lo esté.
  // `similar` ordena por patrones/país, no por contenido, así que su primer
  // elemento puede ser otro caso sin expandir — y un botón que promete «caso
  // similar expandido» llevando a otro callejón sin salida es peor que no
  // ofrecer salida: rompe la confianza en la navegación.
  const similarExpandido = similar.find(
    (s) => Boolean(s.caseData.whatHappened || s.caseData.whyMatters),
  );

  const hasNarrative = Boolean(c.whatHappened || c.whyMatters);
  const hasEvidence = Boolean(c.evidence && c.evidence.length > 0);
  const hasSources = Boolean(c.sources && c.sources.length > 0);
  const hasRichContent = hasNarrative || hasEvidence || hasSources;

  // VISOR · todo el video embebido; los PDF/imagen, con tope.
  //
  // Cada visor de PDF ocupa 60-80vh, así que los casos agregadores se volvían
  // inusables: `dow-centcom-2020` (39 PDF + 15 video) medía ~30 pantallas de
  // scroll en móvil, casi todas páginas redactadas en negro, y montaba 39
  // visores react-pdf que descargan su PDF. Los que pasan del tope van a un
  // índice compacto en un <details> nativo (sin JS, funciona igual en el
  // export estático): cada documento conserva su enlace directo, pero deja de
  // ser un muro.
  //
  // El tope NO aplica al video, a propósito. Es el asset más escaso del corpus
  // y la evidencia que la gente viene a ver; mandarlo al índice de texto lo
  // vuelve invisible, que es justo el problema que este bloque resuelve. Lo
  // que sobra no es "documentos" sino visores gigantes de páginas tachadas.
  // El sort es estable, así que el orden autoral del JSON se conserva.
  const INLINE_NONVIDEO_MAX = 4;
  const docsAll = c.documents ?? [];
  const docsVideo = docsAll.filter((d) => d.type === "video");
  const docsOther = docsAll.filter((d) => d.type !== "video");
  const docsInline = [...docsVideo, ...docsOther.slice(0, INLINE_NONVIDEO_MAX)];
  const docsRest = docsOther.slice(INLINE_NONVIDEO_MAX);

  const whatHappenedParas = c.whatHappened
    ? c.whatHappened.split("\n\n")
    : [];
  const pullQuote = findPullQuote(c.whatHappened);

  // «La noche en cuestión» asume incidente puntual; los expedientes y los
  // casos que abarcan años piden otro encabezado.
  const whTitle =
    c.category === "document"
      ? { es: "El expediente en cuestión", en: "The file in question" }
      : c.year_end && c.year_end > c.year_start
        ? { es: "Los años en cuestión", en: "The years in question" }
        : { es: "La noche en cuestión", en: "The night in question" };

  // whyMatters es prosa multi-párrafo en ~80% del corpus: se divide por \n\n
  // igual que whatHappened. El display font solo aguanta textos cortos; sobre
  // ~800 chars se baja a la tipografía de lectura del cuerpo.
  const whyMattersLong = (c.whyMatters?.length ?? 0) > 800;
  const wmClass = whyMattersLong
    ? "text-lg leading-relaxed text-text md:text-xl"
    : "font-display text-xl leading-snug text-text md:text-2xl";

  // El summary es el LEDE (display prominente), pero ~46% de los casos lo tienen
  // largo y en text-3xl se vuelve un muro que ocupa media primera pantalla. Es el
  // MISMO problema que whyMatters ya resolvía con un guard de longitud — olvidado
  // en el summary, que además se renderiza aún más grande. Dos umbrales (por el
  // idioma más largo, el DOM sirve ES+EN): >800 chars → cuerpo legible (idéntico a
  // whyMattersLong, para el ~10% extremo que ni a text-2xl deja de saturar);
  // 500-800 → un paso menor de display (conserva la voz de lede); corto → display
  // prominente.
  const summaryLen =
    Math.max((c.summary ?? "").length, (c.summary_en ?? "").length);
  const summaryClass =
    summaryLen > 800
      ? "text-lg leading-relaxed text-text md:text-xl"
      : summaryLen > 500
        ? "font-display text-xl leading-snug text-text md:text-2xl"
        : "font-display text-2xl leading-snug text-text md:text-3xl";

  // CD-2 · numeración de partes secuencial y honesta. Antes "Parte 01/02/03"
  // estaban hard-codeadas: un caso sin `whatHappened` saltaba a "Parte 02" o
  // empezaba en "Parte 03". Ahora el contador solo cuenta las partes presentes
  // (el aparato documental "Lo que queda en papel" siempre existe).
  const partNo: Record<string, string> = {};
  let _pc = 0;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (c.whatHappened) partNo.whatHappened = pad(++_pc);
  if (c.whyMatters) partNo.whyMatters = pad(++_pc);
  partNo.apparatus = pad(++_pc);

  return (
    <article className="mx-auto max-w-3xl space-y-24 py-4 md:space-y-32">
      <script
        type="application/ld+json"
        // Per-case Schema.org Article+Event+Place graph for rich snippets
        // (article cards in SERPs) and knowledge-graph entity linking on
        // the case's geographic location.
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(caseJsonLd(c, locale)),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { href: "/", label: locale === "es" ? "Inicio" : "Home" },
          { href: "/cases/", label: locale === "es" ? "Casos" : "Cases" },
          { label: locale === "es" ? c.name : c.name_en ?? c.name },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          locale={locale}
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/cases", es: "Casos", en: "Cases" },
            { es: c.name, en: c.name_en ?? c.name },
          ]}
        />
        <ShareButton title={c.name} locale={locale} />
      </div>

      {/* ────────── ZONE A — HERO EDITORIAL ────────── */}
      <header className="space-y-8">
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T locale={locale}
              es={`Caso Nº ${String(c.num).padStart(2, "0")}`}
              en={`Case No. ${String(c.num).padStart(2, "0")}`}
            />
            <span className="mx-2 text-text/30">·</span>
            <T locale={locale} es={c.country_name} en={countryEn(c.country_name)} />
          </p>
          {c.epistemicStatus && c.epistemicStatus !== "documented" && (
            <EpistemicBadge status={c.epistemicStatus} locale={locale} />
          )}
        </div>

        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-4 md:gap-x-10">
          <span
            aria-hidden
            className="font-display text-6xl leading-none tabular-nums text-accent md:text-8xl"
          >
            {String(c.num).padStart(2, "0")}
          </span>
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {year}
              <span className="mx-2 text-text/30">·</span>
              {c.location.place ? (
                <T locale={locale}
                  es={c.location.place}
                  en={c.location.place_en ?? c.location.place}
                />
              ) : (
                <T locale={locale} es={c.country_name} en={countryEn(c.country_name)} />
              )}
            </p>
            <H1>
              <span className="sr-only">
                <T locale={locale} es={c.country_name} en={countryEn(c.country_name)} />.
              </span>
              <T locale={locale} es={c.name} en={c.name_en ?? c.name} />
            </H1>
          </div>
        </div>

        <p className={summaryClass}>
          <T locale={locale}
            es={linkCaseRefs(c.summary, NAME_BY_SLUG)}
            en={linkCaseRefs(c.summary_en ?? c.summary, NAME_BY_SLUG)}
          />
        </p>

        <div className="grid grid-cols-2 gap-px border-y-2 border-text bg-text md:grid-cols-4">
          <KeyFact locale={locale} es="Año" en="Year" value={year} />
          <KeyFact locale={locale} es="Tier" en="Tier" value={c.tier} mono />
          <KeyFact
            locale={locale}
            es="Probabilidad"
            en="Probability"
            value={`${c.probability}%`}
            mono
          />
          <KeyFact
            locale={locale}
            es="Categoría"
            en="Category"
            value={
              <T locale={locale}
                es={CATEGORY_META[c.category]?.label ?? c.category}
                en={CATEGORY_META[c.category]?.label_en ?? c.category}
              />
            }
          />
        </div>
        <Caption>
          <T locale={locale}
            es={`${TIER_META[c.tier].description}. Tres ejes independientes: el «tier» mide la fuerza de la evidencia; la «probabilidad» estima cuán genuinamente inexplicado está el caso —un fenómeno natural puede seguir sin explicación, así que no equivale a «no-prosaico»—; y la partición de explicaciones (abajo) dice qué fue más plausiblemente. Por eso un caso bien documentado puede tener como causa más plausible un posible fraude, y un Tier B no es, por eso, un fraude.`}
            en={`${TIER_META[c.tier].description_en}. Three independent axes: the «tier» measures the strength of the evidence; the «probability» estimates how genuinely unexplained the case is —a natural phenomenon can remain unexplained, so it does not equal «non-prosaic»—; and the partition of explanations (below) says what it most plausibly was. So a well-documented case can have a possible hoax as its most plausible cause, and a Tier B is not, for that reason, a hoax.`}
          />
        </Caption>
      </header>

      {/* ────────── ZONE A2 — DOCUMENTO PRIMARIO DESTACADO ────────── */}
      {/* Para casos cuya búsqueda dominante tiene intención "descargar el
          PDF": se ofrece el documento arriba del fold para satisfacer esa
          intención y reducir el rebote (pogo-sticking) hacia el SERP. */}
      {c.featuredDoc && (
        <a
          href={c.featuredDoc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block border-2 border-accent bg-panel p-6 no-underline transition-colors hover:bg-accent/5 md:p-8"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            <T locale={locale} es="Documento primario · PDF" en="Primary source · PDF" />
          </p>
          <p className="mt-3 flex items-start gap-3 font-display text-xl font-medium leading-snug text-text md:text-2xl">
            <span aria-hidden className="shrink-0 text-accent">
              ↓
            </span>
            <span className="underline decoration-accent/40 underline-offset-4 group-hover:decoration-accent">
              <T locale={locale}
                es={c.featuredDoc.label}
                en={c.featuredDoc.label_en ?? c.featuredDoc.label}
              />
            </span>
          </p>
          {c.featuredDoc.note && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              <T locale={locale}
                es={c.featuredDoc.note}
                en={c.featuredDoc.note_en ?? c.featuredDoc.note}
              />
            </p>
          )}
        </a>
      )}

      {/* ────────── ZONE A3 — VISOR DE DOCUMENTOS PRIMARIOS ────────── */}
      {/* Documentos auto-hospedados (PDF/imagen) embebidos inline. Same-origin
          porque war.gov bloquea el framing/fetch de terceros; fallbackUrl deja
          siempre el original oficial accesible. Los PDF se renderizan con un
          visor cliente (PdfDoc → react-pdf, dynamic ssr:false) que funciona
          también en móvil; las imágenes siguen como <img> server.

          El VIDEO va primero y solo se embeben los primeros
          INLINE_DOCS_MAX; el resto va a un índice compacto. Ver el comentario
          donde se calculan docsInline/docsRest. */}
      {c.documents && c.documents.length > 0 && (
        <section className="space-y-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            <T locale={locale}
              es="Documentos primarios · visor"
              en="Primary documents · viewer"
            />
          </p>
          {docsInline
            .map((doc, i) => (
              <figure key={i} className="space-y-2">
                {doc.type === "pdf" ? (
                  <PdfDoc src={doc.src} fallbackUrl={doc.fallbackUrl} />
                ) : doc.type === "video" ? (
                  <DvidsVideo src={doc.src} title={doc.title_en ?? doc.title} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.src}
                    alt={doc.title}
                    loading="lazy"
                    className="w-full border border-text/15 bg-surface-2"
                  />
                )}
                <figcaption className="space-y-1">
                  <p className="text-sm leading-snug text-text">
                    <T locale={locale} es={doc.title} en={doc.title_en ?? doc.title} />
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    {[doc.source, doc.license].filter(Boolean).join(" · ")}
                    {doc.fallbackUrl && (
                      <>
                        {doc.source || doc.license ? " · " : ""}
                        <a
                          href={doc.fallbackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                        >
                          <T locale={locale} es="abrir original" en="open original" />
                        </a>
                      </>
                    )}
                  </p>
                </figcaption>
              </figure>
            ))}

          {/* Índice compacto del resto. <details> nativo: sin JS, así que
              funciona igual en el export estático y en móvil. Cada documento
              conserva su enlace directo, que es lo que un agregador necesita
              — un índice de 39 entradas se recorre; 39 visores de 80vh no. */}
          {docsRest.length > 0 && (
            <details className="border border-border bg-panel/50 p-4">
              <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-text marker:text-accent">
                <T
                  locale={locale}
                  es={`Ver los otros ${docsRest.length} documentos`}
                  en={`Show the other ${docsRest.length} documents`}
                />
              </summary>
              <ul className="mt-4 space-y-3 border-t border-border pt-4">
                {docsRest.map((doc, i) => (
                  <li key={i} className="space-y-1">
                    <p className="text-sm leading-snug text-text">
                      <T locale={locale} es={doc.title} en={doc.title_en ?? doc.title} />
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                      {[doc.source, doc.license].filter(Boolean).join(" · ")}
                      {" · "}
                      <a
                        href={doc.fallbackUrl ?? doc.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                      >
                        <T locale={locale} es="abrir documento" en="open document" />
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {/* EN-only disclaimer when no EN narrative available */}
      {hasNarrative && !c.whatHappened_en && locale === "en" && (
        <div lang="en" data-lang="en" className="border-2 border-text bg-panel p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Translation note
          </p>
          <p className="mt-2 text-sm text-text">
            The detailed narrative below is in Spanish. English translation
            pending for this specific case.
          </p>
        </div>
      )}

      {/* ────────── ZONE B — NARRATIVE ────────── */}
      {hasNarrative && (
        <section className="space-y-16">
          {c.whatHappened && (
            <div className="space-y-8">
              <header className="space-y-3 border-b-2 border-text pb-4">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  <T locale={locale} es={`Parte ${partNo.whatHappened}`} en={`Part ${partNo.whatHappened}`} />
                </p>
                <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                  <T locale={locale} es={whTitle.es} en={whTitle.en} />
                </h2>
              </header>

              {/* ES paragraphs */}
              {locale === "es" && (
              <div lang="es" data-lang="es" className="space-y-8">
                {whatHappenedParas.map((para, i) => (
                  <div key={i} className="space-y-8">
                    <p
                      className={
                        i === 0
                          ? "text-lg leading-relaxed text-text first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:font-display first-letter:text-7xl first-letter:font-medium first-letter:leading-[0.85] first-letter:text-accent md:text-xl md:first-letter:text-8xl"
                          : "text-lg leading-relaxed text-text md:text-xl"
                      }
                    >
                      {linkCaseRefs(para, NAME_BY_SLUG)}
                    </p>
                    {pullQuote && i === 0 && (
                      <PullQuote className="border-l-4 text-2xl md:text-3xl">
                        “{pullQuote}”
                      </PullQuote>
                    )}
                  </div>
                ))}
              </div>
              )}

              {/* EN paragraphs if available */}
              {locale === "en" && c.whatHappened_en && (
                <div lang="en" data-lang="en" className="space-y-8">
                  {c.whatHappened_en.split("\n\n").map((para, i) => (
                    <p
                      key={i}
                      className={
                        i === 0
                          ? "text-lg leading-relaxed text-text first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:font-display first-letter:text-7xl first-letter:font-medium first-letter:leading-[0.85] first-letter:text-accent md:text-xl md:first-letter:text-8xl"
                          : "text-lg leading-relaxed text-text md:text-xl"
                      }
                    >
                      {linkCaseRefs(para, NAME_BY_SLUG)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {c.whyMatters && (
            <div className="space-y-8">
              <header className="space-y-3 border-b-2 border-text pb-4">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  <T locale={locale} es={`Parte ${partNo.whyMatters}`} en={`Part ${partNo.whyMatters}`} />
                </p>
                <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                  <T locale={locale}
                    es="Por qué este caso movió la aguja"
                    en="Why this case moved the needle"
                  />
                </h2>
              </header>
              {locale === "es" && (
              <div lang="es" data-lang="es" className="space-y-6">
                {c.whyMatters.split("\n\n").map((para, i) => (
                  <p key={i} className={wmClass}>
                    {linkCaseRefs(para, NAME_BY_SLUG)}
                  </p>
                ))}
              </div>
              )}
              {locale === "en" && (
              <div lang="en" data-lang="en" className="space-y-6">
                {(c.whyMatters_en ?? c.whyMatters).split("\n\n").map((para, i) => (
                  <p key={i} className={wmClass}>
                    {linkCaseRefs(para, NAME_BY_SLUG)}
                  </p>
                ))}
              </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ────────── ZONE C — APPARATUS ────────── */}
      <section className="space-y-12 border-t-2 border-text pt-12">
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T locale={locale} es={`Parte ${partNo.apparatus}`} en={`Part ${partNo.apparatus}`} />
          </p>
          <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
            <T locale={locale} es="Lo que queda en papel" en="What's left on paper" />
          </h2>
        </header>

        {c.primaryDocument && (
          <figure className="space-y-3 border-l-2 border-accent/40 pl-5">
            <a
              href={c.primaryDocument.href ?? c.primaryDocument.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full max-w-md transition hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.primaryDocument.url}
                alt={c.primaryDocument.alt}
                className="w-full border border-text/15 bg-surface-2"
                loading="lazy"
              />
            </a>
            <figcaption className="max-w-md space-y-1">
              <p className="text-sm leading-snug text-text">
                <T locale={locale}
                  es={c.primaryDocument.caption}
                  en={c.primaryDocument.caption_en ?? c.primaryDocument.caption}
                />
              </p>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                {c.primaryDocument.source} · {c.primaryDocument.license}
              </p>
            </figcaption>
          </figure>
        )}

        {(hasEvidence || hasSources) && (
          <div className="grid gap-12 md:grid-cols-2">
            {hasEvidence && (
              <div className="space-y-4">
                <Eyebrow>
                  <T locale={locale} es="Evidencia documentada" en="Documented evidence" />
                </Eyebrow>
                <ol className="space-y-3">
                  {c.evidence!.map((item, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[2rem_1fr] gap-3 text-base leading-relaxed text-text"
                    >
                      <span
                        aria-hidden
                        className="font-display text-xl tabular-nums leading-none text-accent"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <T locale={locale}
                          es={linkCaseRefs(item, NAME_BY_SLUG)}
                          en={linkCaseRefs(c.evidence_en?.[i] ?? item, NAME_BY_SLUG)}
                        />
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {hasSources && (
              <div className="space-y-4">
                <Eyebrow>
                  <T locale={locale} es="Fuentes" en="Sources" />
                </Eyebrow>
                <ol className="space-y-3">
                  {c.sources!.map((s, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-relaxed"
                    >
                      <span
                        aria-hidden
                        className="font-mono text-xs tabular-nums text-muted"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text underline decoration-text/30 underline-offset-4 hover:text-accent hover:decoration-accent"
                          >
                            {s.name} <span aria-hidden>↗</span>
                          </a>
                        ) : (
                          <span className="text-text">{s.name}</span>
                        )}
                        {s.note && (
                          <span className="text-muted">
                            {" "}
                            — <T locale={locale} es={s.note} en={s.note_en ?? s.note} />
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {casePatterns.length > 0 && (
          <div className="space-y-4">
            <Eyebrow>
              <T locale={locale}
                es={`Patrones que exhibe (${casePatterns.length})`}
                en={`Patterns it exhibits (${casePatterns.length})`}
              />
            </Eyebrow>
            <div className="flex flex-wrap gap-2">
              {casePatterns.map((p) => (
                <LocaleLink
                  key={p.id}
                  href={`/patterns/${p.letter}`}
                  className="inline-flex min-h-[44px] items-center border-2 px-3 py-1.5 text-xs hover:bg-text hover:text-bg"
                  style={{ borderColor: p.color }}
                  title={p.description_en ?? p.description}
                >
                  <span className="font-mono">{p.id}</span>
                  <span className="ml-2">
                    <T locale={locale} es={p.name} en={p.name_en} />
                  </span>
                </LocaleLink>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Eyebrow>
            <T locale={locale} es="Ubicación" en="Location" />
          </Eyebrow>
          <p className="text-sm text-text">
            {c.location.place ? (
              <T locale={locale}
                es={c.location.place}
                en={c.location.place_en ?? c.location.place}
              />
            ) : (
              <T locale={locale} es={c.country_name} en={countryEn(c.country_name)} />
            )}{" "}
            <span className="font-mono text-xs text-muted">
              · {c.location.lat.toFixed(2)}°, {c.location.lng.toFixed(2)}°
            </span>
          </p>
        </div>

        {!hasRichContent && (
          <div className="space-y-6 border-l-2 border-accent/40 bg-panel p-6">
            <Caption className="italic">
              <T locale={locale}
                es={`Este caso aún no está expandido — solo el dato bruto. Vamos por los ${TOTAL_CASES} progresivamente.`}
                en={`This case isn't expanded yet — just the raw record. We're going through ${TOTAL_CASES} progressively.`}
              />
            </Caption>
            <div className="flex flex-wrap gap-3">
              <LocaleLink
                href="/cases"
                className="inline-flex min-h-[44px] items-center border-2 border-text bg-bg px-4 py-2 font-mono text-sm uppercase tracking-wide text-text transition-colors hover:bg-text hover:text-bg"
              >
                <T locale={locale}
                  es="← Ver todos los casos"
                  en="← See all cases"
                />
              </LocaleLink>
              {similarExpandido && (
                <LocaleLink
                  href={`/cases/${similarExpandido.caseData.id}`}
                  className="inline-flex min-h-[44px] items-center border-2 border-accent bg-bg px-4 py-2 font-mono text-sm uppercase tracking-wide text-accent transition-colors hover:bg-accent hover:text-bg"
                >
                  <T locale={locale}
                    es={`Caso similar expandido →`}
                    en={`Expanded similar case →`}
                  />
                </LocaleLink>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ────────── DISTRIBUCIÓN DE EXPLICACIONES (MECE) ────────── */}
      {c.category !== "document" && (
        <section className="space-y-6 border-t-2 border-text pt-12">
          <Eyebrow>
            <T locale={locale} es="Distribución de explicaciones" en="Distribution of explanations" />
          </Eyebrow>
          <Body className="text-muted">
            <T locale={locale}
              es={
                <>
                  Este caso se clasifica entre las hipótesis del modelo: la
                  barra reparte el 100% según cuánto pesa cada explicación (la
                  incertidumbre se reparte entre las hipótesis que el caso
                  apoya). Sumadas en todo el corpus producen la{" "}
                  <LocaleLink href="/probabilidades" className="text-accent underline-offset-4 hover:underline">
                    partición comparable
                  </LocaleLink>
                  . Es una pregunta distinta de la{" "}
                  <em>Probabilidad</em> de arriba: aquella estima qué tan
                  probable es que el caso sea un fenómeno genuinamente no
                  explicado; esta reparte <em>cuál</em> sería la explicación.
                </>
              }
              en={
                <>
                  This case is classified among the model&apos;s hypotheses:
                  the bar splits 100% by how much each explanation weighs (the
                  uncertainty is spread across the hypotheses the case
                  supports). Summed across the corpus they produce the{" "}
                  <LocaleLink href="/probabilidades" className="text-accent underline-offset-4 hover:underline">
                    comparable partition
                  </LocaleLink>
                  . It is a different question from the{" "}
                  <em>Probability</em> above: that one estimates how likely the
                  case is a genuinely unexplained phenomenon; this one splits{" "}
                  <em>which</em> the explanation would be.
                </>
              }
            />
          </Body>
          <CasePosterior posterior={posteriorFor(c)} mundanoType={c.mundanoType} misidSubtype={c.misidSubtype} locale={locale} />
          <Caption className="italic">
            <T locale={locale}
              es="Juicio analítico estructurado, no frecuencia calibrada. Clasificación forzada: la masa que la evidencia no permite asignar se reparte entre las hipótesis que el caso sí apoya."
              en="Structured analytical judgment, not a calibrated frequency. Forced classification: the mass the evidence cannot assign is spread across the hypotheses the case does support."
            />
          </Caption>
        </section>
      )}

      {/* ────────── BACKLINKS (casos que citan a éste) ────────── */}
      {backlinks.length > 0 && (
        <section className="space-y-6 border-t-2 border-text pt-12">
          <Eyebrow>
            <T locale={locale}
              es={`Citado por ${backlinks.length} ${backlinks.length === 1 ? "caso" : "casos"}`}
              en={`Referenced by ${backlinks.length} ${backlinks.length === 1 ? "case" : "cases"}`}
            />
          </Eyebrow>
          <ul className="grid gap-px bg-text sm:grid-cols-2">
            {backlinks.map((b) => (
              <li key={b.id} className="flex">
                <LocaleLink
                  href={`/cases/${b.id}`}
                  className="group flex w-full flex-col gap-1 bg-bg p-4 hover:bg-text hover:text-bg"
                >
                  <p className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
                    <T locale={locale} es={b.name} en={b.name_en ?? b.name} />
                  </p>
                  <p className="mt-auto font-mono text-xs tabular-nums text-muted group-hover:text-bg/60">
                    {b.year_start} · Tier {b.tier}
                  </p>
                </LocaleLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ────────── RELATED + NEXT CASE ────────── */}
      {similar.length > 0 && (
        <section className="space-y-6 border-t-2 border-text pt-12">
          <Eyebrow>
            <T locale={locale} es="Casos relacionados" en="Related cases" />
          </Eyebrow>
          <div className="grid gap-px bg-text sm:grid-cols-2">
            {similar.map((s) => {
              const reasonFor = (lang: "es" | "en") =>
                [
                  s.sameCountry
                    ? lang === "es"
                      ? "mismo país"
                      : "same country"
                    : null,
                  s.sharedPatterns.length > 0
                    ? lang === "es"
                      ? `${s.sharedPatterns.length} ${s.sharedPatterns.length === 1 ? "patrón" : "patrones"}`
                      : `${s.sharedPatterns.length} ${s.sharedPatterns.length === 1 ? "pattern" : "patterns"}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
              return (
                <LocaleLink
                  key={s.caseData.id}
                  href={`/cases/${s.caseData.id}`}
                  className="group flex flex-col gap-2 bg-bg p-5 hover:bg-text hover:text-bg"
                >
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
                    <T locale={locale} es={reasonFor("es")} en={reasonFor("en")} />
                  </p>
                  <p className="font-display text-xl font-medium leading-tight text-text group-hover:text-bg">
                    <T locale={locale}
                      es={s.caseData.name}
                      en={s.caseData.name_en ?? s.caseData.name}
                    />
                  </p>
                  <p className="mt-auto font-mono text-xs tabular-nums text-muted group-hover:text-bg/60">
                    {s.caseData.year_start} · Tier {s.caseData.tier} ·{" "}
                    {s.caseData.probability}%
                  </p>
                </LocaleLink>
              );
            })}
          </div>
        </section>
      )}

      {/* ────────── INVESTIGADORES ASOCIADOS ────────── */}
      {caseResearchers.length > 0 && (
        <section className="space-y-4 border-t-2 border-text pt-12">
          <Eyebrow>
            <T locale={locale}
              es={`Actores asociados (${caseResearchers.length})`}
              en={`Associated actors (${caseResearchers.length})`}
            />
          </Eyebrow>
          <div className="grid gap-3 sm:grid-cols-2">
            {caseResearchers.map((r) => (
              <LocaleLink
                key={r.id}
                href={`/researchers/${r.id}`}
                className="flex items-center gap-3 border border-border bg-panel p-3 transition hover:border-accent/50"
              >
                <ResearcherAvatar researcher={r} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text">
                    {r.name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    <T locale={locale} es={r.section_label} en={r.section_label_en} />
                  </span>
                </span>
              </LocaleLink>
            ))}
          </div>
        </section>
      )}

      {/* ────────── PREV / NEXT NAVIGATION ────────── */}
      <nav
        aria-label="Navegación entre casos"
        className="grid grid-cols-2 gap-px border-y-2 border-text bg-text"
      >
        {prev ? (
          <LocaleLink
            href={`/cases/${prev.id}`}
            className="group flex flex-col gap-1 bg-bg p-5 hover:bg-text hover:text-bg"
          >
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
              <T locale={locale}
                es={`← Caso anterior · #${prev.num}`}
                en={`← Previous case · #${prev.num}`}
              />
            </span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
              <T locale={locale} es={prev.name} en={prev.name_en ?? prev.name} />
            </span>
          </LocaleLink>
        ) : (
          <div className="bg-bg p-5" aria-hidden />
        )}
        {next ? (
          <LocaleLink
            href={`/cases/${next.id}`}
            className="group flex flex-col gap-1 bg-bg p-5 text-right hover:bg-text hover:text-bg"
          >
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
              <T locale={locale}
                es={`Siguiente caso · #${next.num} →`}
                en={`Next case · #${next.num} →`}
              />
            </span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
              <T locale={locale} es={next.name} en={next.name_en ?? next.name} />
            </span>
          </LocaleLink>
        ) : (
          <div className="bg-bg p-5" aria-hidden />
        )}
      </nav>
    </article>
  );
}

export default CaseDetailPage;

function KeyFact({
  es,
  en,
  value,
  mono = false,
  locale,
}: {
  es: string;
  en: string;
  value: ReactNode;
  mono?: boolean;
  locale: "es" | "en";
}) {
  return (
    <div className="bg-bg p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        <T locale={locale} es={es} en={en} />
      </p>
      <p
        className={`mt-1 ${
          mono
            ? "font-mono text-2xl font-semibold tabular-nums text-text"
            : "font-display text-2xl font-medium leading-tight text-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
