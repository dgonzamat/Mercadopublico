import Link from "next/link";
import { notFound } from "next/navigation";
import { cases, getPattern } from "@/lib/data";

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

  const tierColor = c.tier === "S" ? "tierS" : c.tier === "A" ? "tierA" : "tierB";
  const year = c.year_end ? `${c.year_start}–${c.year_end}` : c.year_start.toString();

  const casePatterns = c.patterns.map((id) => getPattern(id)).filter((p): p is NonNullable<typeof p> => p !== undefined);

  const similar = cases
    .filter((x) => x.id !== c.id)
    .map((x) => ({
      caseData: x,
      score: (x.country === c.country ? 1 : 0) + x.patterns.filter((p) => c.patterns.includes(p)).length * 2,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/cases" className="text-sm text-muted hover:text-accent">← Volver a casos</Link>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Caso #{c.num} · {year} · {c.country_name}</p>
        <h1 className="mt-2 text-3xl font-bold text-text"><span aria-hidden className="mr-2">{c.flag}</span>{c.name}</h1>
        <div className="mt-4 flex items-center gap-3">
          <div className={`rounded-md border border-${tierColor}/40 bg-${tierColor}/10 px-3 py-1`}>
            <span className={`font-mono text-xs uppercase text-${tierColor}`}>Tier {c.tier}</span>
          </div>
          <div className="rounded-md border border-border bg-panel px-3 py-1">
            <span className="font-mono text-sm font-bold text-text">{c.probability}%</span>
            <span className="ml-2 text-xs text-muted">probabilidad</span>
          </div>
        </div>
      </header>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Resumen</h2>
        <p className="mt-2 text-text">{c.summary}</p>
        {c.summary_en && (<p className="mt-2 text-sm italic text-muted">{c.summary_en}</p>)}
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Ubicación</h2>
        <p className="mt-2 text-text">{c.location.place || c.country_name}</p>
        <p className="font-mono text-xs text-muted">{c.location.lat.toFixed(2)}°, {c.location.lng.toFixed(2)}°</p>
      </section>

      {casePatterns.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Patrones que exhibe</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {casePatterns.map((p) => (
              <Link key={p.id} href={`/patterns/${p.letter}`} className="rounded border border-border bg-panel px-3 py-1.5 text-xs transition hover:border-accent/50" style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}>
                <span className="font-mono text-accent">{p.id}</span> <span className="text-text">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Casos relacionados</h2>
          <div className="mt-3 grid gap-2">
            {similar.map((s) => (
              <Link key={s.caseData.id} href={`/cases/${s.caseData.id}`} className="flex items-center justify-between rounded border border-border bg-panel px-3 py-2 text-sm transition hover:border-accent/50">
                <span>
                  <span className="mr-2">{s.caseData.flag}</span>
                  <span className="text-text">{s.caseData.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted">{s.caseData.year_start}</span>
                </span>
                <span className="font-mono text-xs text-muted">Tier {s.caseData.tier} · {s.caseData.probability}%</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
