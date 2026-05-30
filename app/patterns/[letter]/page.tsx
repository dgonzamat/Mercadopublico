import { notFound } from "next/navigation";
import { patterns, getCasesByPattern } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";

export function generateStaticParams() {
  return patterns.map((p) => ({ letter: p.letter }));
}

export function generateMetadata({ params }: { params: { letter: string } }) {
  const p = patterns.find((x) => x.letter === params.letter);
  if (!p) return { title: "Patrón no encontrado" };
  return { title: `${p.id} ${p.name} · UAP Atlas`, description: p.description };
}

export default function PatternDetailPage({ params }: { params: { letter: string } }) {
  const p = patterns.find((x) => x.letter === params.letter);
  if (!p) notFound();
  const patternCases = getCasesByPattern(p.id);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <a href="/patterns" className="text-sm text-muted hover:text-accent">← Volver a patrones</a>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Patrón {p.id}</p>
        <h1 className="mt-2 text-3xl font-bold text-text" style={{ borderLeftColor: p.color, borderLeftWidth: 4, paddingLeft: 12 }}>{p.name}</h1>
      </header>

      <section>
        <p className="text-text">{p.description}</p>
        <p className="mt-2 text-sm italic text-muted">{p.description_en}</p>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Casos que exhiben este patrón ({patternCases.length})</h2>
        <div className="mt-2">
          {patternCases.length === 0 ? (
            <p className="text-muted">Patrón estructural/meta — sin casos individuales en este corpus.</p>
          ) : (
            patternCases.map((c) => <CaseRow key={c.id} caseData={c} />)
          )}
        </div>
      </section>
    </article>
  );
}
