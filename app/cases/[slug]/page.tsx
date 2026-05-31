import Link from "next/link";
import { notFound } from "next/navigation";
import { cases, getPattern, TOTAL_CASES } from "@/lib/data";
import { TIER_META } from "@/lib/ui";
import { TierBadge, CategoryBadge } from "@/components/Badge";
import { Eyebrow, H1, Lede, Body, Caption } from "@/lib/typography";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Caso no encontrado" };
  return { title: `${c.name} · UAP Atlas`, description: c.summary };
}

export default function CaseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) notFound();

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
    .slice(0, 5);

  const hasNarrative = Boolean(c.whatHappened || c.whyMatters);
  const hasEvidence = Boolean(c.evidence && c.evidence.length > 0);
  const hasSources = Boolean(c.sources && c.sources.length > 0);
  const hasRichContent = hasNarrative || hasEvidence || hasSources;

  return (
    <article className="mx-auto max-w-3xl space-y-12 py-4">
      <Link
        href="/cases"
        className="inline-block text-sm text-muted hover:text-accent"
      >
        ← Volver a casos
      </Link>

      {/* ──────────────────────── ZONE A — IDENTIFICATION ──────────────────────── */}
      <header className="rounded-lg border border-border bg-surface-2 p-6 md:p-8">
        <div className="space-y-4">
          <Eyebrow>
            Caso #{c.num} · {year} · {c.country_name}
          </Eyebrow>
          <H1>
            <span aria-hidden className="mr-3">
              {c.flag}
            </span>
            <span className="sr-only">{c.country_name}.</span>
            {c.name}
          </H1>
          <Lede className="text-text">{c.summary}</Lede>
          {c.summary_en && (
            <p className="text-sm italic text-muted">{c.summary_en}</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <TierBadge tier={c.tier} />
          <CategoryBadge category={c.category} />
          <div className="ml-auto flex items-baseline gap-2 font-mono">
            <span className="text-2xl font-semibold tabular-nums text-text">
              {c.probability}
            </span>
            <span className="text-sm text-muted">% probabilidad</span>
          </div>
        </div>

        <Caption className="mt-3">{TIER_META[c.tier].description}</Caption>
      </header>

      {/* ──────────────────────── ZONE B — NARRATIVE ───────────────────────────── */}
      {hasNarrative && (
        <section className="space-y-8">
          {c.whatHappened && (
            <div className="space-y-4">
              <Eyebrow>Qué pasó</Eyebrow>
              <div className="space-y-4">
                {c.whatHappened.split("\n\n").map((para, i) => (
                  <Body key={i}>{para}</Body>
                ))}
              </div>
            </div>
          )}

          {c.whyMatters && (
            <div className="space-y-4">
              <Eyebrow>Por qué importa</Eyebrow>
              <Body>{c.whyMatters}</Body>
            </div>
          )}
        </section>
      )}

      {/* ──────────────────────── ZONE C — APPARATUS ───────────────────────────── */}
      <section className="space-y-10 border-t border-border pt-10">
        {(hasEvidence || hasSources) && (
          <div className="grid gap-10 md:grid-cols-2">
            {hasEvidence && (
              <div className="space-y-3">
                <Eyebrow>Evidencia documentada</Eyebrow>
                <ol className="space-y-2">
                  {c.evidence!.map((item, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm text-text"
                    >
                      <span
                        aria-hidden
                        className="font-mono text-xs tabular-nums text-muted"
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
              <div className="space-y-3">
                <Eyebrow>Fuentes</Eyebrow>
                <ol className="space-y-2">
                  {c.sources!.map((s, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm"
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
                            className="text-accent hover:underline"
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
          <div className="space-y-3">
            <Eyebrow>Patrones que exhibe ({casePatterns.length})</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {casePatterns.map((p) => (
                <Link
                  key={p.id}
                  href={`/patterns/${p.letter}`}
                  className="inline-flex min-h-[44px] items-center rounded border border-border bg-panel px-3 py-1.5 text-xs transition hover:border-accent/50"
                  style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
                  title={p.description}
                >
                  <span className="font-mono text-accent">{p.id}</span>{" "}
                  <span className="ml-2 text-text">{p.name}</span>
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

      {/* ──────────────────────── RELATED CASES ────────────────────────────────── */}
      {similar.length > 0 && (
        <section className="space-y-3 border-t border-border pt-10">
          <Eyebrow>Casos relacionados</Eyebrow>
          <div className="grid gap-2">
            {similar.map((s) => {
              const reason = [
                s.sameCountry ? "mismo país" : null,
                s.sharedPatterns.length > 0
                  ? `${s.sharedPatterns.length} ${s.sharedPatterns.length === 1 ? "patrón" : "patrones"} en común`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={s.caseData.id}
                  href={`/cases/${s.caseData.id}`}
                  className="block rounded border border-border bg-panel px-4 py-3 text-sm transition hover:border-accent/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      <span aria-hidden className="mr-2">
                        {s.caseData.flag}
                      </span>
                      <span className="sr-only">
                        {s.caseData.country_name}.
                      </span>
                      <span className="text-text">{s.caseData.name}</span>
                      <span className="ml-2 font-mono text-xs tabular-nums text-muted">
                        {s.caseData.year_start}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {s.caseData.tier} · {s.caseData.probability}%
                    </span>
                  </div>
                  {reason && (
                    <p className="mt-1 text-xs text-muted">→ {reason}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
