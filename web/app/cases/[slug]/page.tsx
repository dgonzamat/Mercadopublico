import { LocaleLink } from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { cases, getEntityMorphology } from "@/lib/data";
import { CATEGORY_META, DOC_TIER_META, TIER_META } from "@/lib/ui";
import { posteriorFor } from "@/lib/meceModel";
import { PROSAIC_CLASSES, prosaicKey, objectDetailDef, shortLabel } from "@/lib/meceClasses";
import { CasePosterior } from "@/components/MeceChart";
import { T } from "@/components/T";
import { countryEn } from "@/lib/i18n-geo";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { ResearcherAvatar } from "@/components/ResearcherAvatar";
import { researchersForCase } from "@/lib/researcherCases";
import { DocumentsViewer } from "@/components/DocumentsViewer";
import { caseVisuals } from "@/lib/caseVisuals";
import { splitLead } from "@/lib/splitLead";
import { Eyebrow, H1, Caption } from "@/lib/typography";
import { caseJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { linkCaseRefs } from "@/lib/caseRefs";
import { CASE_ALIASES, aliasCanonical, aliasHref } from "@/lib/caseAliases";

export function generateStaticParams() {
  return [...cases.map((c) => c.id), ...Object.keys(CASE_ALIASES)].map((slug) => ({ slug }));
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
  const alias = CASE_ALIASES[params.slug];
  if (alias) return { title: "Case moved", alternates: { canonical: aliasCanonical(alias) }, robots: { index: false, follow: true } };
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


export async function CaseDetailPage(
  props: {
    params: Promise<{ slug: string }>;
    locale?: "es" | "en";
  }
) {
  const params = await props.params;
  const locale = props.locale ?? "en";
  const alias = CASE_ALIASES[params.slug];
  if (alias) {
    // Ficha fusionada: la ruta relativa conserva el basePath y el prefijo /es.
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <meta httpEquiv="refresh" content={`0; url=${aliasHref(alias)}`} />
        <a href={aliasHref(alias)} className="text-accent underline">
          <T es="Esta ficha se integró en otra página. Ir a la página vigente." en="This entry was folded into another page. Go to the current page." locale={locale} />
        </a>
      </div>
    );
  }
  const c = cases.find((x) => x.id === params.slug);
  if (!c) notFound();

  const caseResearchers = researchersForCase(c.id);
  // Un documento cuelga de lo que respalda: su miga lleva al primer caso que
  // documenta si es uno solo o, si no, al actor que respalda.
  const docParentCase = c.category === "document" && c.relatedCases?.length === 1 ? cases.find((x) => x.id === c.relatedCases?.[0]) : undefined;
  const docParentActor = c.category === "document" && !docParentCase ? caseResearchers[0] : undefined;
  const crumbParent = docParentCase
    ? { href: `/cases/${docParentCase.id}`, es: docParentCase.name.split(" · ")[0], en: (docParentCase.name_en ?? docParentCase.name).split(" · ")[0] }
    : docParentActor
      ? { href: `/researchers/${docParentActor.id}`, es: docParentActor.name, en: docParentActor.name }
      : c.category === "document"
        // Un documento que respalda varios casos y ningún actor no cuelga de
        // ninguno, y la lista de /cases ya no lo incluye: la miga va directa.
        ? null
        : { href: "/cases", es: "Casos", en: "Cases" };
  // «Caso anterior / siguiente» recorre solo sucesos: un documento no es un caso.
  const sortedByNum = cases.filter((x) => x.category !== "document").sort((a, b) => a.num - b.num);
  const idx = sortedByNum.findIndex((x) => x.id === c.id);
  const prev = idx > 0 ? sortedByNum[idx - 1] : null;
  const next = idx < sortedByNum.length - 1 ? sortedByNum[idx + 1] : null;

  const year = c.year_end
    ? `${c.year_start}–${c.year_end}`
    : c.year_start.toString();

  const caseEntityForms = (c.entityMorphology ?? [])
    .map((slug) => getEntityMorphology(slug))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);

  // Relacionados por lo que la ficha sí afirma: la misma explicación
  // ordinaria (y el mismo objeto, si se precisa), el mismo país y una época
  // cercana. Compartir un patrón genérico (8h, 8e) enlazaba Núremberg 1561
  // con Campeche 2004; ya no cuenta.
  const myKey = c.mundanoType ? prosaicKey(c.mundanoType, c.misidSubtype) : undefined;
  const similar = cases
    .filter((x) => x.id !== c.id && x.category !== "document")
    .map((x) => {
      const xKey = x.mundanoType ? prosaicKey(x.mundanoType, x.misidSubtype) : undefined;
      const sameClass = Boolean(myKey && xKey === myKey && myKey !== "sin_propuesta");
      const sameObject = sameClass && Boolean(c.objectDetail && x.objectDetail === c.objectDetail);
      const sameCountry = x.country === c.country;
      const nearYear = Math.abs(x.year_start - c.year_start) <= 10;
      return {
        caseData: x,
        sameClass,
        sameObject,
        sameCountry,
        nearYear,
        score: (sameObject ? 2 : 0) + (sameClass ? 2 : 0) + (sameCountry ? 2 : 0) + (nearYear ? 1 : 0),
      };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score || Math.abs(a.caseData.year_start - c.year_start) - Math.abs(b.caseData.year_start - c.year_start))
    .slice(0, 4);

  // Backlinks: casos que CITAN a éste en su prosa (grafo inverso de [[slug]]).
  // Distinto de `similar` (heurístico por patrones/país): esto es cita explícita.
  const backlinks = [...(BACKLINKS.get(c.id) ?? [])]
    .map((id) => cases.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.year_start - a.year_start);

  // Documentos ↔ casos: un documento declara en `relatedCases` los incidentes de
  // los que es evidencia; la ficha del incidente lo lista en sentido inverso.
  const documentedCases = (c.relatedCases ?? [])
    .map((id) => cases.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const supportingDocs = cases.filter(
    (d) => d.category === "document" && d.relatedCases?.includes(c.id),
  );
  const isLinkedDoc = c.category === "document" && documentedCases.length > 0;

  // Para el CTA de un caso SIN expandir: el primer similar que sí lo esté.
  // `similar` ordena por patrones/país, no por contenido, así que su primer
  // elemento puede ser otro caso sin expandir — y un botón que promete «caso
  // similar expandido» llevando a otro callejón sin salida es peor que no
  // ofrecer salida: rompe la confianza en la navegación.
  const similarExpandido = similar.find(
    (s) => Boolean(s.caseData.whatHappened || s.caseData.whyMatters),
  );

  const hasNarrative = Boolean(c.whatHappened || c.whyMatters);
  const visuals = caseVisuals(c);
  const hasEvidence = Boolean(c.evidence && c.evidence.length > 0);
  const hasSources = Boolean(c.sources && c.sources.length > 0);
  const hasRichContent = hasNarrative || hasEvidence || hasSources;


  const whatHappenedParas = c.whatHappened
    ? c.whatHappened.split("\n\n")
    : [];

  // Antes decía «La noche en cuestión» en todo caso de un solo año, y muchos
  // ocurrieron de día (Kenneth Arnold, Kilimanjaro): el rótulo afirmaba algo
  // falso. Un rótulo neutro vale para todos (oct 2026).
  const whTitle = { es: "Qué pasó", en: "What happened" };

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
        ? "font-display text-lg leading-snug text-text md:text-2xl"
        : "font-display text-xl leading-snug text-text md:text-3xl";

  return (
    <article className="mx-auto max-w-3xl space-y-16 py-4 md:space-y-32">
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
          ...(crumbParent ? [{ href: `${crumbParent.href}/`, label: locale === "es" ? crumbParent.es : crumbParent.en }] : []),
          { label: locale === "es" ? c.name : c.name_en ?? c.name },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          locale={locale}
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            ...(crumbParent ? [crumbParent] : []),
            { es: c.name, en: c.name_en ?? c.name },
          ]}
        />
        <ShareButton title={c.name} locale={locale} />
      </div>

      {/* ────────── ZONE A — HERO EDITORIAL ────────── */}
      <header className="space-y-8">
        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-4 md:gap-x-10">
          {/* El número es de caso: un documento no lo muestra. */}
          <span
            aria-hidden
            className="font-display text-4xl leading-none tabular-nums text-accent md:text-8xl"
          >
            {c.category === "document" ? "" : String(c.num).padStart(2, "0")}
          </span>
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted">
              {c.flag && <span aria-hidden className="mr-2 tracking-normal">{c.flag}</span>}
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

        {/* Resúmenes de hasta 1.500 caracteres en letra grande empujaban todo
            fuera de la pantalla: se muestra la entrada y el resto se pliega. */}
        {(() => {
          const sum = splitLead(locale === "es" ? c.summary : c.summary_en ?? c.summary, 450);
          return (
            <div className="space-y-3">
              <p className={summaryClass}>{linkCaseRefs(sum.lead, NAME_BY_SLUG)}</p>
              {sum.rest && (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-accent">
                    <T locale={locale} es="Seguir leyendo el resumen" en="Read the rest of the summary" />
                  </summary>
                  <p className="mt-2 text-lg leading-relaxed text-text">{linkCaseRefs(sum.rest, NAME_BY_SLUG)}</p>
                </details>
              )}
            </div>
          );
        })()}

        {/* Una sola línea de cifras: año, lugar y país ya están sobre el título,
            y la categoría solo se dice cuando no es un incidente. El reparto
            completo va una sola vez, en el bloque «Qué fue» de abajo. */}
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y-2 border-text py-3 font-mono text-sm text-text">
          <span>
            Tier <strong className="font-semibold">{c.tier}</strong>
            {!isLinkedDoc && c.category !== "document" && (
              <span className="font-sans text-muted"> · <T locale={locale} es={TIER_META[c.tier].plain} en={TIER_META[c.tier].plain_en} /></span>
            )}
          </span>
          {isLinkedDoc ? (
            <span>
              <T locale={locale}
                es={`Documenta ${documentedCases.length} ${documentedCases.length === 1 ? "caso" : "casos"}`}
                en={`Documents ${documentedCases.length} ${documentedCases.length === 1 ? "case" : "cases"}`}
              />
            </span>
          ) : null}
          {c.category !== "incident" && (
            <span className="text-muted">
              <T locale={locale}
                es={CATEGORY_META[c.category]?.label ?? c.category}
                en={CATEGORY_META[c.category]?.label_en ?? c.category}
              />
            </span>
          )}
          {!isLinkedDoc && (
            <LocaleLink href="/about#tiers" className="ml-auto font-sans text-xs text-accent underline-offset-4 hover:underline">
              <T locale={locale} es="¿Qué significan? →" en="What do they mean? →" />
            </LocaleLink>
          )}
        </p>
        {!isLinkedDoc && c.category !== "document" && (
          <Caption>
            <T locale={locale} es={`${TIER_META[c.tier].description}.`} en={`${TIER_META[c.tier].description_en}.`} />
          </Caption>
        )}
        {isLinkedDoc && (
        <Caption>
          <T locale={locale}
            es={`${DOC_TIER_META[c.tier].description}. Es evidencia de los casos que documenta, listados abajo.`}
            en={`${DOC_TIER_META[c.tier].description_en}. It is evidence for the cases it documents, listed below.`}
          />
        </Caption>
        )}
        {!isLinkedDoc && c.category !== "document" && (
          <section className="space-y-4">
            <Eyebrow>
              <T locale={locale} es="Qué fue" en="What it was" />
            </Eyebrow>
            <CasePosterior posterior={posteriorFor(c)} mundanoType={c.mundanoType} misidSubtype={c.misidSubtype} objectDetail={c.objectDetail} locale={locale} />
            <ClassBasis c={c} locale={locale} />
          </section>
        )}
      </header>

      {/* Bloque 4 · la prueba del caso: lo que registró el suceso (vídeo del
          sensor, foto o dibujo del objeto), hasta dos, antes del relato. */}
      <DocumentsViewer
        docs={visuals.top}
        locale={locale}
        heading={{ es: "Registro del suceso", en: "Record of the event" }}
      />

      {/* EN-only disclaimer when no EN narrative available */}
      {hasNarrative && !c.whatHappened_en && locale === "en" && (
        <div lang="en" data-lang="en" className="border-2 border-text bg-panel p-5">
          <p className="text-sm font-semibold text-accent">
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
                <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                  <T locale={locale}
                    es="Por qué importa"
                    en="Why it matters"
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
          <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
            <T locale={locale} es="Documentos y fuentes" en="Documents and sources" />
          </h2>
        </header>

        {/* Bloque 6 · el papeleo, después del relato: antes iba entre la
            cabecera y el relato y empujaba el primer párrafo a casi 3 pantallas
            en la ficha típica (9,6 en Skinwalker; medido en las 397, oct 2026). */}
        <DocumentsViewer docs={visuals.paper} locale={locale} />

        {(hasEvidence || hasSources) && (
          <div className="grid gap-12 md:grid-cols-2">
            {hasEvidence && (
              <div className="space-y-4">
                <Eyebrow>
                  <T locale={locale} es="Evidencia documentada" en="Documented evidence" />
                </Eyebrow>
                {(() => {
                  // Más de 6 ítems (hasta 15 en algunas fichas) se leían como un
                  // muro: los 5 primeros a la vista, el resto plegado.
                  const renderItem = (item: string, i: number) => (
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
                  );
                  const ev = c.evidence!;
                  const head = ev.length > 6 ? ev.slice(0, 5) : ev;
                  const tail = ev.length > 6 ? ev.slice(5) : [];
                  return (
                    <>
                      <ol className="space-y-3">{head.map((item, i) => renderItem(item, i))}</ol>
                      {tail.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-accent">
                            <T locale={locale} es={`Ver ${tail.length} hechos más`} en={`Show ${tail.length} more facts`} />
                          </summary>
                          <ol className="mt-3 space-y-3">{tail.map((item, k) => renderItem(item, k + 5))}</ol>
                        </details>
                      )}
                    </>
                  );
                })()}
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
                            <T locale={locale} es={s.name} en={s.name_en ?? s.name} />{" "}
                            <span aria-hidden>↗</span>
                          </a>
                        ) : (
                          <span className="text-text">
                            <T locale={locale} es={s.name} en={s.name_en ?? s.name} />
                          </span>
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

        {caseEntityForms.length > 0 && (
          <div className="space-y-4">
            <Eyebrow>
              <T locale={locale}
                es={`Fisionomía de la entidad (${caseEntityForms.length})`}
                en={`Entity form (${caseEntityForms.length})`}
              />
            </Eyebrow>
            <div className="flex flex-wrap gap-2">
              {caseEntityForms.map((f) => (
                <LocaleLink
                  key={f.slug}
                  href={`/entities/${f.slug}`}
                  className="inline-flex min-h-[44px] items-center border-2 px-3 py-1.5 text-xs hover:bg-text hover:text-bg"
                  style={{ borderColor: f.color }}
                  title={f.description_en ?? f.description}
                >
                  <span className="font-mono">{f.slug}</span>
                  <span className="ml-2">
                    <T locale={locale} es={f.name} en={f.name_en} />
                  </span>
                </LocaleLink>
              ))}
            </div>
          </div>
        )}

        {!hasRichContent && (
          <div className="space-y-6 border-l-2 border-accent/40 bg-panel p-6">
            <Caption className="italic">
              <T locale={locale}
                es="Esta ficha todavía no tiene descripción."
                en="This record has no description yet."
              />
            </Caption>
            <div className="flex flex-wrap gap-3">
              <LocaleLink
                href="/cases"
                className="inline-flex min-h-[44px] items-center border-2 border-text bg-bg px-4 py-2 font-mono text-sm text-text transition-colors hover:bg-text hover:text-bg"
              >
                <T locale={locale}
                  es="← Ver todos los casos"
                  en="← See all cases"
                />
              </LocaleLink>
              {similarExpandido && (
                <LocaleLink
                  href={`/cases/${similarExpandido.caseData.id}`}
                  className="inline-flex min-h-[44px] items-center border-2 border-accent bg-bg px-4 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent hover:text-bg"
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

        {/* Bloque 7 · contexto: el lugar, el avión, una persona, un monumento.
            Ayuda a situar, pero no es del suceso, así que va al final. */}
        <DocumentsViewer
          docs={visuals.context}
          locale={locale}
          heading={{ es: "Contexto (no son imágenes del suceso)", en: "Context (not images of the event)" }}
        />
      </section>

      {/* ────────── DOCUMENTOS ↔ CASOS ────────── */}
      {(documentedCases.length > 0 || supportingDocs.length > 0) && (
        <section className="space-y-6 border-t-2 border-text pt-12">
          <Eyebrow>
            {documentedCases.length > 0 ? (
              <T locale={locale} es="Casos que documenta" en="Cases it documents" />
            ) : (
              <T locale={locale} es="Documentos que lo respaldan" en="Documents that back it" />
            )}
          </Eyebrow>
          <ul className="grid gap-px bg-text sm:grid-cols-2">
            {(documentedCases.length > 0 ? documentedCases : supportingDocs).map((d) => (
              <li key={d.id} className="flex">
                <LocaleLink
                  href={`/cases/${d.id}`}
                  className="group flex w-full flex-col gap-1 bg-bg p-4 hover:bg-text hover:text-bg"
                >
                  <p className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
                    <T locale={locale} es={d.name} en={d.name_en ?? d.name} />
                  </p>
                  <p className="mt-auto font-mono text-xs tabular-nums text-muted group-hover:text-bg/60">
                    {d.category === "document" ? (
                      <T locale={locale} es={`${d.year_start} · Documento · Tier ${d.tier}`} en={`${d.year_start} · Document · Tier ${d.tier}`} />
                    ) : (
                      `${d.year_start} · Tier ${d.tier}`
                    )}
                  </p>
                </LocaleLink>
              </li>
            ))}
          </ul>
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
                  s.sameObject
                    ? (lang === "es" ? "mismo objeto" : "same object")
                    : s.sameClass ? (lang === "es" ? "misma explicación" : "same explanation") : null,
                  s.sameCountry ? (lang === "es" ? "mismo país" : "same country") : null,
                  s.nearYear ? (lang === "es" ? "misma época" : "same period") : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
              return (
                <LocaleLink
                  key={s.caseData.id}
                  href={`/cases/${s.caseData.id}`}
                  className="group flex flex-col gap-2 bg-bg p-5 hover:bg-text hover:text-bg"
                >
                  <p className="font-mono text-[11px] text-muted group-hover:text-bg/60">
                    <T locale={locale} es={reasonFor("es")} en={reasonFor("en")} />
                  </p>
                  <p className="font-display text-xl font-medium leading-tight text-text group-hover:text-bg">
                    <T locale={locale}
                      es={s.caseData.name}
                      en={s.caseData.name_en ?? s.caseData.name}
                    />
                  </p>
                  <p className="mt-auto font-mono text-xs tabular-nums text-muted group-hover:text-bg/60">
                    {s.caseData.year_start} · Tier {s.caseData.tier}
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

      {/* ────────── PREV / NEXT NAVIGATION (solo sucesos) ────────── */}
      {c.category !== "document" && (
      <nav
        aria-label="Navegación entre casos"
        className="grid grid-cols-2 gap-px border-y-2 border-text bg-text"
      >
        {prev ? (
          <LocaleLink
            href={`/cases/${prev.id}`}
            className="group flex flex-col gap-1 bg-bg p-5 hover:bg-text hover:text-bg"
          >
            <span className="font-mono text-[11px] text-muted group-hover:text-bg/60">
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
            <span className="font-mono text-[11px] text-muted group-hover:text-bg/60">
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
      )}
    </article>
  );
}

export default CaseDetailPage;

/** Qué fue más plausiblemente, en términos prosaicos, y por qué: la clase
 *  (mundanoType + misidSubtype + objectDetail) y la frase de la fuente que la
 *  fija (`classBasis`). Sin la frase, lo dice: la clase aún no se contrastó. */
function ClassBasis({ c, locale }: { c: (typeof cases)[number]; locale: "es" | "en" }) {
  if (!c.mundanoType && !c.classBasis) return null;
  const pk = c.mundanoType ? prosaicKey(c.mundanoType, c.misidSubtype) : undefined;
  const cls = pk ? PROSAIC_CLASSES.find((k) => k.key === pk) : undefined;
  const detail = pk ? objectDetailDef(pk, c.objectDetail) : undefined;
  const b = c.classBasis;
  // El rótulo de la fuente tiene par inglés: el sitio es inglés-primario.
  const src = b ? (locale === "es" ? b.source : b.source_en ?? b.source) : "";
  // La clase prosaica cubre solo la parte mundana del reparto: cuando otra
  // narrativa pesa más (Roswell), la cita no puede leerse como veredicto.
  const post = posteriorFor(c);
  const [topId] = (Object.entries(post) as [string, number][]).sort((x, y) => y[1] - x[1])[0];
  const mundaneLeads = topId === "mundano_natural";
  // La barra y la leyenda de arriba ya dicen qué pesa más y cuánto; aquí solo
  // va el porqué, citado de la fuente. Cuando lo mundano no es lo más
  // probable, se aclara a qué parte del reparto se refiere la cita.
  const label = cls ? (detail ? { es: `${cls.label} · ${shortLabel(detail.label)}`, en: `${cls.labelEn} · ${shortLabel(detail.labelEn)}` } : { es: cls.label, en: cls.labelEn }) : undefined;
  // La etiqueta no mete la clase dentro de una frase: con «sin_propuesta»
  // salía «sería causa ordinaria probable, sin identificar» / «it would be
  // likely ordinary, unidentified», agramatical en los dos idiomas (oct 2026).
  const why = mundaneLeads || !label
    ? { es: "Por qué: ", en: "Why: " }
    : pk === "sin_propuesta"
      ? { es: "Si fue algo ordinario, por qué no se sabe qué: ", en: "If it was ordinary, why no specific cause is named: " }
      : { es: `Si fue algo ordinario, lo más probable es: ${label.es.toLowerCase()}. Por qué: `, en: `If it was ordinary, the likeliest cause is: ${label.en.toLowerCase()}. Why: ` };
  const es = b ? splitOriginal(b.es) : undefined;
  const en = b ? splitOriginal(b.en) : undefined;
  return (
    <div className="space-y-2 border-l-2 border-text pl-4">
      {b ? (
        <div className="text-sm text-text">
          <span className="font-semibold">
            <T locale={locale} es={why.es} en={why.en} />
          </span>
          {(() => {
            const w = splitLead((locale === "es" ? es! : en!).text, 200);
            return (
              <>
                {w.lead}{" "}
                {w.rest && (
                  <details className="mt-1 inline">
                    <summary className="inline cursor-pointer text-accent">
                      <T locale={locale} es="Leer el porqué completo" en="Read the full reasoning" />
                    </summary>
                    <span className="mt-1 block">{w.rest}</span>
                  </details>
                )}{" "}
              </>
            );
          })()}
          <span className="text-muted">
            (
            {b.url ? (
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-4 hover:underline">
                {src} ↗
              </a>
            ) : (
              src
            )}
            )
          </span>
          {(locale === "es" ? es : en)?.original && (
            <details className="mt-2 text-xs text-muted">
              <summary className="cursor-pointer text-accent">
                <T locale={locale} es="Cita en el idioma original" en="Quote in the original language" />
              </summary>
              <span className="mt-1 block">{(locale === "es" ? es : en)!.original}</span>
            </details>
          )}
        </div>
      ) : (
        <p className="text-sm italic text-muted">
          <T
            locale={locale}
            es="Por qué: pendiente. Esta clase todavía no se ha contrastado con la fuente que la fijaría."
            en="Why: pending. This class has not yet been checked against the source that would pin it."
          />
        </p>
      )}
    </div>
  );
}

/** Separa la cita en el idioma original («Original en alemán: «…»» /
 *  «German original: «…»») del resto del porqué: se pliega para que el
 *  bloque no lea la misma frase dos veces. */
function splitOriginal(t: string): { text: string; original?: string } {
  const m = t.match(/\s*(?:Original en [a-záéíóú]+|[A-Z][a-z]+ original):\s*(«[^»]*»(?:[;,]\s*«[^»]*»)*)\.?/);
  if (!m || m.index === undefined) return { text: t };
  return { text: (t.slice(0, m.index) + " " + t.slice(m.index + m[0].length)).replace(/\s+/g, " ").trim(), original: m[1] };
}
