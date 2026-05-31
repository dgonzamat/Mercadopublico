import Link from "next/link";
import { notFound } from "next/navigation";
import { cases, getPattern, TOTAL_CASES } from "@/lib/data";
import { TIER_META } from "@/lib/ui";
import { Eyebrow, H1, Body, Caption, PullQuote } from "@/lib/typography";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Caso no encontrado" };
  return { title: `${c.name} · UAP Atlas`, description: c.summary };
}

/**
 * Extract the longest quoted phrase from a body of prose, to render
 * as a pull-quote. Returns null if no suitable quote (30–240 chars).
 *
 * The corpus uses single quotes (') for technical terms ('Anomalous Aerial
 * Vehicles', 'flying disc') and double quotes (" " or curly "") for actual
 * citations. We accept both — heuristic only.
 */
function findPullQuote(text?: string): string | null {
  if (!text) return null;
  const patterns = [
    /[""]([^""]{30,240})[""]|"([^"]{30,240})"/g,
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

export default function CaseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) notFound();

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

  return (
    <article className="mx-auto max-w-3xl space-y-24 py-4 md:space-y-32">
      <Link
        href="/cases"
        className="inline-block font-mono text-xs uppercase tracking-widest text-muted hover:text-accent"
      >
        ← Volver al índice
      </Link>

      {/* ────────── ZONE A — HERO EDITORIAL ────────── */}
      <header className="space-y-8">
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Caso {String(c.num).padStart(2, "0")} de {TOTAL_CASES}
            <span className="mx-2 text-text/30">·</span>
            {c.country_name}
            <span className="mx-2 text-text/30">·</span>
            Tier {c.tier}
          </p>
        </div>

        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-4 md:gap-x-10">
          <span
            aria-hidden
            className="font-display text-6xl leading-none tabular-nums text-accent md:text-8xl"
          >
            {String(c.year_start).slice(-2)}
          </span>
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {year}
              <span className="mx-2 text-text/30">·</span>
              {c.location.place || c.country_name}
            </p>
            <H1>
              <span aria-hidden className="mr-3 text-3xl md:text-4xl">
                {c.flag}
              </span>
              <span className="sr-only">{c.country_name}.</span>
              {c.name}
            </H1>
          </div>
        </div>

        <p className="font-display text-2xl leading-snug text-text md:text-3xl">
          {c.summary}
        </p>
        {c.summary_en && (
          <p className="font-display text-lg italic leading-snug text-muted md:text-xl">
            “{c.summary_en}”
          </p>
        )}

        <div className="grid grid-cols-2 gap-px border-y-2 border-text bg-text md:grid-cols-4">
          <KeyFact label="Año" value={year} />
          <KeyFact label="Tier" value={c.tier} mono />
          <KeyFact
            label="Probabilidad"
            value={`${c.probability}%`}
            mono
          />
          <KeyFact label="Categoría" value={c.category} />
        </div>
        <Caption>{TIER_META[c.tier].description}</Caption>
      </header>

      {/* ────────── ZONE B — NARRATIVE ────────── */}
      {hasNarrative && (
        <section className="space-y-16">
          {c.whatHappened && (
            <div className="space-y-8">
              <header className="space-y-3 border-b-2 border-text pb-4">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Parte 01
                </p>
                <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                  Qué pasó
                </h2>
              </header>

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
          )}

          {c.whyMatters && (
            <div className="space-y-8">
              <header className="space-y-3 border-b-2 border-text pb-4">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Parte 02
                </p>
                <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                  Por qué importa
                </h2>
              </header>
              <p className="font-display text-xl leading-snug text-text md:text-2xl">
                {c.whyMatters}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ────────── ZONE C — APPARATUS ────────── */}
      <section className="space-y-12 border-t-2 border-text pt-12">
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Parte 03
          </p>
          <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
            La evidencia detrás
          </h2>
        </header>

        {(hasEvidence || hasSources) && (
          <div className="grid gap-12 md:grid-cols-2">
            {hasEvidence && (
              <div className="space-y-4">
                <Eyebrow>Evidencia documentada</Eyebrow>
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
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {hasSources && (
              <div className="space-y-4">
                <Eyebrow>Fuentes</Eyebrow>
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
                          <span className="text-muted"> — {s.note}</span>
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
            <Eyebrow>Patrones que exhibe ({casePatterns.length})</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {casePatterns.map((p) => (
                <Link
                  key={p.id}
                  href={`/patterns/${p.letter}`}
                  className="inline-flex min-h-[44px] items-center border-2 px-3 py-1.5 text-xs hover:bg-text hover:text-bg"
                  style={{
                    borderColor: p.color,
                  }}
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
          <Eyebrow>Ubicación</Eyebrow>
          <p className="text-sm text-text">
            {c.location.place || c.country_name}{" "}
            <span className="font-mono text-xs text-muted">
              · {c.location.lat.toFixed(2)}°, {c.location.lng.toFixed(2)}°
            </span>
          </p>
        </div>

        {!hasRichContent && (
          <Caption className="italic">
            Caso pendiente de explicación detallada — solo el resumen de arriba
            está documentado. Expandimos gradualmente los {TOTAL_CASES} casos
            del corpus.
          </Caption>
        )}
      </section>

      {/* ────────── RELATED + NEXT CASE ────────── */}
      {similar.length > 0 && (
        <section className="space-y-6 border-t-2 border-text pt-12">
          <Eyebrow>Casos relacionados</Eyebrow>
          <div className="grid gap-px bg-text sm:grid-cols-2">
            {similar.map((s) => {
              const reason = [
                s.sameCountry ? "mismo país" : null,
                s.sharedPatterns.length > 0
                  ? `${s.sharedPatterns.length} ${s.sharedPatterns.length === 1 ? "patrón" : "patrones"}`
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
                    {reason}
                  </p>
                  <p className="font-display text-xl font-medium leading-tight text-text group-hover:text-bg">
                    <span aria-hidden className="mr-2">
                      {s.caseData.flag}
                    </span>
                    {s.caseData.name}
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
              ← Caso anterior · #{prev.num}
            </span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
              {prev.flag} {prev.name}
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
              Siguiente caso · #{next.num} →
            </span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
              {next.name} {next.flag}
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
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-bg p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
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
