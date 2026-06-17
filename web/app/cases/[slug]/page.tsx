import Link from "next/link";
import { notFound } from "next/navigation";
import { cases, getPattern, TOTAL_CASES } from "@/lib/data";
import { TIER_META } from "@/lib/ui";
import { getHypothesis } from "@/lib/hypotheses";
import { STRENGTH_WEIGHT } from "@/lib/hypothesisMapping";
import { T } from "@/components/T";
import { countryEn } from "@/lib/i18n-geo";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { ResearcherAvatar } from "@/components/ResearcherAvatar";
import { researchersForCase } from "@/lib/researcherCases";
import { EpistemicBadge } from "@/components/Badge";
import { Eyebrow, H1, Body, Caption, PullQuote } from "@/lib/typography";
import { breadcrumbJsonLd, caseJsonLd, serializeJsonLd } from "@/lib/jsonld";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.id }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Caso no encontrado" };
  const path = `/cases/${c.id}/`;
  const description = c.summary;
  return {
    title: `${c.name}`,
    description,
    alternates: {
      canonical: path,
      languages: {
        es: path,
        en: path,
        "x-default": path,
      },
    },
    openGraph: {
      type: "article",
      title: `${c.name} — ${c.year_start}${c.year_end ? `–${c.year_end}` : ""}`,
      description,
      url: path,
      locale: "es_ES",
      alternateLocale: c.whatHappened_en ? ["en_US"] : [],
      // Si el caso tiene documento primario (escaneo FOIA, foto oficial),
      // úsalo como tarjeta social: identifica el caso mejor que el OG genérico.
      images: c.primaryDocument?.url
        ? [{ url: c.primaryDocument.url, alt: c.primaryDocument.alt ?? c.name }]
        : [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.name} — UAP Codex`,
      description: c.summary,
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

export default async function CaseDetailPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
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

  const hasNarrative = Boolean(c.whatHappened || c.whyMatters);
  const hasEvidence = Boolean(c.evidence && c.evidence.length > 0);
  const hasSources = Boolean(c.sources && c.sources.length > 0);
  const hasRichContent = hasNarrative || hasEvidence || hasSources;

  const whatHappenedParas = c.whatHappened
    ? c.whatHappened.split("\n\n")
    : [];
  const pullQuote = findPullQuote(c.whatHappened);

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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(caseJsonLd(c)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { href: "/", label: "Inicio" },
              { href: "/cases/", label: "Casos" },
              { label: c.name },
            ]),
          ),
        }}
      />
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/cases", es: "Casos", en: "Cases" },
            { es: c.name, en: c.name_en ?? c.name },
          ]}
        />
        <ShareButton title={c.name} />
      </div>

      {/* ────────── ZONE A — HERO EDITORIAL ────────── */}
      <header className="space-y-8">
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T
              es={`Caso ${String(idx + 1).padStart(2, "0")} de ${TOTAL_CASES}`}
              en={`Case ${String(idx + 1).padStart(2, "0")} of ${TOTAL_CASES}`}
            />
            <span className="mx-2 text-text/30">·</span>
            <T es={c.country_name} en={countryEn(c.country_name)} />
          </p>
          {c.epistemicStatus && c.epistemicStatus !== "documented" && (
            <EpistemicBadge status={c.epistemicStatus} />
          )}
        </div>

        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-4 md:gap-x-10">
          <span
            aria-hidden
            className="font-display text-6xl leading-none tabular-nums text-accent md:text-8xl"
          >
            {String(idx + 1).padStart(2, "0")}
          </span>
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {year}
              <span className="mx-2 text-text/30">·</span>
              {c.location.place ? (
                <T
                  es={c.location.place}
                  en={c.location.place_en ?? c.location.place}
                />
              ) : (
                <T es={c.country_name} en={countryEn(c.country_name)} />
              )}
            </p>
            <H1>
              <span className="sr-only">
                <T es={c.country_name} en={countryEn(c.country_name)} />.
              </span>
              <T es={c.name} en={c.name_en ?? c.name} />
            </H1>
          </div>
        </div>

        <p className="font-display text-2xl leading-snug text-text md:text-3xl">
          <T es={c.summary} en={c.summary_en ?? c.summary} />
        </p>

        <div className="grid grid-cols-2 gap-px border-y-2 border-text bg-text md:grid-cols-4">
          <KeyFact es="Año" en="Year" value={year} />
          <KeyFact es="Tier" en="Tier" value={c.tier} mono />
          <KeyFact
            es="Probabilidad"
            en="Probability"
            value={`${c.probability}%`}
            mono
          />
          <KeyFact es="Categoría" en="Category" value={c.category} />
        </div>
        <Caption>
          <T
            es={TIER_META[c.tier].description}
            en={TIER_META[c.tier].description_en}
          />
        </Caption>
      </header>

      {/* EN-only disclaimer when no EN narrative available */}
      {hasNarrative && !c.whatHappened_en && (
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
                  <T es={`Parte ${partNo.whatHappened}`} en={`Part ${partNo.whatHappened}`} />
                </p>
                <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                  <T es="La noche en cuestión" en="The night in question" />
                </h2>
              </header>

              {/* ES paragraphs */}
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
                      {para}
                    </p>
                    {pullQuote && i === 0 && (
                      <PullQuote className="border-l-4 text-2xl md:text-3xl">
                        “{pullQuote}”
                      </PullQuote>
                    )}
                  </div>
                ))}
              </div>

              {/* EN paragraphs if available */}
              {c.whatHappened_en && (
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
                      {para}
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
                  <T es={`Parte ${partNo.whyMatters}`} en={`Part ${partNo.whyMatters}`} />
                </p>
                <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                  <T
                    es="Por qué este caso movió la aguja"
                    en="Why this case moved the needle"
                  />
                </h2>
              </header>
              <p className="font-display text-xl leading-snug text-text md:text-2xl">
                <T es={c.whyMatters} en={c.whyMatters_en ?? c.whyMatters} />
              </p>
            </div>
          )}
        </section>
      )}

      {/* ────────── ZONE C — APPARATUS ────────── */}
      <section className="space-y-12 border-t-2 border-text pt-12">
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es={`Parte ${partNo.apparatus}`} en={`Part ${partNo.apparatus}`} />
          </p>
          <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
            <T es="Lo que queda en papel" en="What's left on paper" />
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
                <T
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
                  <T es="Evidencia documentada" en="Documented evidence" />
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
                        <T es={item} en={c.evidence_en?.[i] ?? item} />
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {hasSources && (
              <div className="space-y-4">
                <Eyebrow>
                  <T es="Fuentes" en="Sources" />
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
                            — <T es={s.note} en={s.note_en ?? s.note} />
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
              <T
                es={`Patrones que exhibe (${casePatterns.length})`}
                en={`Patterns it exhibits (${casePatterns.length})`}
              />
            </Eyebrow>
            <div className="flex flex-wrap gap-2">
              {casePatterns.map((p) => (
                <Link
                  key={p.id}
                  href={`/patterns/${p.letter}`}
                  className="inline-flex min-h-[44px] items-center border-2 px-3 py-1.5 text-xs hover:bg-text hover:text-bg"
                  style={{ borderColor: p.color }}
                  title={p.description}
                >
                  <span className="font-mono">{p.id}</span>
                  <span className="ml-2">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Eyebrow>
            <T es="Ubicación" en="Location" />
          </Eyebrow>
          <p className="text-sm text-text">
            {c.location.place ? (
              <T
                es={c.location.place}
                en={c.location.place_en ?? c.location.place}
              />
            ) : (
              <T es={c.country_name} en={countryEn(c.country_name)} />
            )}{" "}
            <span className="font-mono text-xs text-muted">
              · {c.location.lat.toFixed(2)}°, {c.location.lng.toFixed(2)}°
            </span>
          </p>
        </div>

        {!hasRichContent && (
          <Caption className="italic">
            <T
              es={`Este caso aún no está expandido — solo el dato bruto. Vamos por los ${TOTAL_CASES} progresivamente.`}
              en={`This case isn't expanded yet — just the raw record. We're going through ${TOTAL_CASES} progressively.`}
            />
          </Caption>
        )}
      </section>

      {/* ────────── LO QUE ESTE CASO MOVIÓ ────────── */}
      {c.evidenceContribution && c.evidenceContribution.length > 0 && (
        <section className="space-y-6 border-t-2 border-text pt-12">
          <Eyebrow>
            <T es="Lo que este caso movió" en="What this case moved" />
          </Eyebrow>
          <Body className="text-muted">
            <T
              es={
                <>
                  Cada caso del corpus declara explícitamente a qué hipótesis
                  aporta evidencia y con qué fuerza. Estos números alimentan el
                  índice de presión que aparece junto a cada hipótesis en{" "}
                  <Link
                    href="/probabilidades"
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    probabilidades
                  </Link>
                  . Verlos por caso permite auditar de dónde viene cada nivel de
                  confianza.
                </>
              }
              en={
                <>
                  Each corpus case explicitly declares which hypothesis it
                  contributes to and with what strength. These numbers feed the
                  pressure index shown next to each hypothesis on{" "}
                  <Link
                    href="/probabilidades"
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    probabilities
                  </Link>
                  . Seeing them per case lets you audit where each confidence
                  level comes from.
                </>
              }
            />
          </Body>
          <ol className="space-y-4">
            {c.evidenceContribution.map((e, i) => {
              const h = getHypothesis(e.hypothesisId);
              const weight = STRENGTH_WEIGHT[e.strength] ?? 0;
              const sign = e.direction === "supports" ? "+" : "−";
              const arrowSym = e.direction === "supports" ? "↑" : "↓";
              const strengthLabel: Record<string, { es: string; en: string }> = {
                minimal: { es: "mínimo", en: "minimal" },
                modest: { es: "modesto", en: "modest" },
                substantial: { es: "sustancial", en: "substantial" },
                "category-breaking": {
                  es: "categoría nueva",
                  en: "category-breaking",
                },
              };
              const sLabel = strengthLabel[e.strength] ?? {
                es: e.strength,
                en: e.strength,
              };
              return (
                <li
                  key={i}
                  className="grid grid-cols-[4.25rem_1fr] gap-4 border-l-2 pl-4"
                  style={{ borderColor: h?.color ?? "var(--accent)" }}
                >
                  <span
                    className="font-display text-xl leading-none tabular-nums whitespace-nowrap"
                    style={{ color: h?.color ?? "var(--accent)" }}
                  >
                    {sign}
                    {weight}
                  </span>
                  <div className="space-y-1">
                    <p className="font-display text-lg font-medium leading-snug text-text">
                      <T
                        es={h?.label ?? e.hypothesisId}
                        en={h?.labelEn ?? e.hypothesisId}
                      />{" "}
                      <span className="text-muted">{arrowSym}</span>
                    </p>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted">
                      <T es={sLabel.es} en={sLabel.en} />
                    </p>
                    <p className="text-sm leading-relaxed text-text/80">
                      <T es={e.rationale} en={e.rationaleEn} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <Caption className="italic">
            <T
              es="Pesos (shift en log-odds): mínimo +0.005, modesto +0.02, sustancial +0.05, categoría nueva +0.15. Documentación completa en /about Cap. 5."
              en="Weights (log-odds shift): minimal +0.005, modest +0.02, substantial +0.05, category-breaking +0.15. Full documentation in /about Ch. 5."
            />
          </Caption>
        </section>
      )}

      {/* ────────── RELATED + NEXT CASE ────────── */}
      {similar.length > 0 && (
        <section className="space-y-6 border-t-2 border-text pt-12">
          <Eyebrow>
            <T es="Casos relacionados" en="Related cases" />
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
                <Link
                  key={s.caseData.id}
                  href={`/cases/${s.caseData.id}`}
                  className="group flex flex-col gap-2 bg-bg p-5 hover:bg-text hover:text-bg"
                >
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
                    <T es={reasonFor("es")} en={reasonFor("en")} />
                  </p>
                  <p className="font-display text-xl font-medium leading-tight text-text group-hover:text-bg">
                    <T
                      es={s.caseData.name}
                      en={s.caseData.name_en ?? s.caseData.name}
                    />
                  </p>
                  <p className="mt-auto font-mono text-xs tabular-nums text-muted group-hover:text-bg/60">
                    {s.caseData.year_start} · Tier {s.caseData.tier} ·{" "}
                    {s.caseData.probability}%
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ────────── INVESTIGADORES ASOCIADOS ────────── */}
      {caseResearchers.length > 0 && (
        <section className="space-y-4 border-t-2 border-text pt-12">
          <Eyebrow>
            <T
              es={`Actores asociados (${caseResearchers.length})`}
              en={`Associated actors (${caseResearchers.length})`}
            />
          </Eyebrow>
          <div className="grid gap-3 sm:grid-cols-2">
            {caseResearchers.map((r) => (
              <Link
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
                    <T es={r.section_label} en={r.section_label_en} />
                  </span>
                </span>
              </Link>
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
          <Link
            href={`/cases/${prev.id}`}
            className="group flex flex-col gap-1 bg-bg p-5 hover:bg-text hover:text-bg"
          >
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
              <T
                es={`← Caso anterior · #${prev.num}`}
                en={`← Previous case · #${prev.num}`}
              />
            </span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
              <T es={prev.name} en={prev.name_en ?? prev.name} />
            </span>
          </Link>
        ) : (
          <div className="bg-bg p-5" aria-hidden />
        )}
        {next ? (
          <Link
            href={`/cases/${next.id}`}
            className="group flex flex-col gap-1 bg-bg p-5 text-right hover:bg-text hover:text-bg"
          >
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
              <T
                es={`Siguiente caso · #${next.num} →`}
                en={`Next case · #${next.num} →`}
              />
            </span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
              <T es={next.name} en={next.name_en ?? next.name} />
            </span>
          </Link>
        ) : (
          <div className="bg-bg p-5" aria-hidden />
        )}
      </nav>
    </article>
  );
}

function KeyFact({
  es,
  en,
  value,
  mono = false,
}: {
  es: string;
  en: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-bg p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        <T es={es} en={en} />
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
