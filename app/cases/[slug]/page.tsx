import Link from "next/link";
import { notFound } from "next/navigation";
import { cases, getPattern, TOTAL_CASES } from "@/lib/data";
import { TIER_META } from "@/lib/ui";
import { TierBadge, CategoryBadge } from "@/components/Badge";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Caso no encontrado" };
  return { title: `${c.name} · UAP Atlas`, description: c.summary };
}

export default function CaseDetailPage({ params }: { params: { slug: string } }) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) notFound();

  const year = c.year_end ? `${c.year_start}–${c.year_end}` : c.year_start.toString();

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

  const hasRichContent = Boolean(
    c.whatHappened || c.whyMatters || (c.evidence && c.evidence.length > 0) || (c.sources && c.sources.length > 0),
  );

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/cases" className="text-sm text-muted hover:text-accent">
        ← Volver a casos
      </Link>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Caso #{c.num} · {year} · {c.country_name}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-text">
          <span aria-hidden className="mr-2">{c.flag}</span>
          {c.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <TierBadge tier={c.tier} />
          <div className="rounded-md border border-border bg-panel px-3 py-1">
            <span className="font-mono text-sm font-bold text-text">{c.probability}%</span>
            <span className="ml-2 text-xs text-muted">probabilidad</span>
          </div>
          <CategoryBadge category={c.category} />
        </div>

        <p className="mt-3 text-xs text-muted">{TIER_META[c.tier].description}</p>
      </header>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Resumen</h2>
        <p className="mt-2 text-text">{c.summary}</p>
        {c.summary_en && (<p className="mt-2 text-sm italic text-muted">{c.summary_en}</p>)}
      </section>

      {c.whatHappened && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Qué pasó</h2>
          <div className="mt-2 space-y-3 text-text">
            {c.whatHappened.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {c.whyMatters && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Por qué importa</h2>
          <p className="mt-2 text-text">{c.whyMatters}</p>
        </section>
      )}

      {c.evidence && c.evidence.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Evidencia documentada</h2>
          <ul className="mt-2 space-y-2">
            {c.evidence.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text">
                <span aria-hidden className="mt-0.5 font-mono text-accent">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Ubicación</h2>
        <p className="mt-2 text-text">{c.location.place || c.country_name}</p>
        <p className="font-mono text-xs text-muted">
          {c.location.lat.toFixed(2)}°, {c.location.lng.toFixed(2)}°
        </p>
      </section>

      {casePatterns.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            Patrones que exhibe
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {casePatterns.map((p) => (
              <Link
                key={p.id}
                href={`/patterns/${p.letter}`}
                className="inline-flex min-h-[44px] items-center rounded border border-border bg-panel px-3 py-1.5 text-xs transition hover:border-accent/50"
                style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
                title={p.description}
              >
                <span className="font-mono text-accent">{p.id}</span>{" "}
                <span className="text-text">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {c.sources && c.sources.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Fuentes</h2>
          <ul className="mt-2 space-y-2">
            {c.sources.map((s, i) => (
              <li key={i} className="text-sm">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {s.name}
                  </a>
                ) : (
                  <span className="text-text">{s.name}</span>
                )}
                {s.note && <span className="ml-1 text-muted"> — {s.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasRichContent && (
        <section className="rounded-md border border-border bg-panel p-4 text-sm text-muted">
          <p>
            <strong className="text-text">⏳ Caso pendiente de explicación detallada.</strong>{" "}
            Este caso aún no tiene narrativa, evidencia ni fuentes documentadas — solo el resumen
            de arriba. Estamos expandiendo gradualmente los {TOTAL_CASES} casos del corpus.
          </p>
        </section>
      )}

      {similar.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            Casos relacionados
          </h2>
          <div className="mt-3 grid gap-2">
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
                  className="block rounded border border-border bg-panel px-3 py-2 text-sm transition hover:border-accent/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      <span aria-hidden className="mr-2">{s.caseData.flag}</span>
                      <span className="text-text">{s.caseData.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted">
                        {s.caseData.year_start}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      Tier {s.caseData.tier} · {s.caseData.probability}%
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
