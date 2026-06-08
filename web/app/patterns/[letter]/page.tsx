import { notFound } from "next/navigation";
import { patterns, getCasesByPattern } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { PrevNext } from "@/components/PrevNext";
import { T } from "@/components/T";

export function generateStaticParams() {
  return patterns.map((p) => ({ letter: p.letter }));
}

export function generateMetadata({
  params,
}: {
  params: { letter: string };
}) {
  const p = patterns.find((x) => x.letter === params.letter);
  if (!p) return { title: "Patrón no encontrado" };
  return { title: `${p.id} ${p.name}`, description: p.description };
}

export default function PatternDetailPage({
  params,
}: {
  params: { letter: string };
}) {
  const p = patterns.find((x) => x.letter === params.letter);
  if (!p) notFound();
  const patternCases = getCasesByPattern(p.id);

  // Orden secuencial = orden del array (igual que el índice /patterns).
  const idx = patterns.findIndex((x) => x.letter === p.letter);
  const prev = idx > 0 ? patterns[idx - 1] : null;
  const next = idx < patterns.length - 1 ? patterns[idx + 1] : null;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/patterns", es: "Patrones", en: "Patterns" },
            { es: `${p.id} ${p.name}`, en: `${p.id} ${p.name_en}` },
          ]}
        />
        <ShareButton title={`${p.id} ${p.name}`} />
      </div>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <T es={`Patrón ${p.id}`} en={`Pattern ${p.id}`} />
        </p>
        <h1
          className="mt-2 text-3xl font-bold text-text"
          style={{ borderLeftColor: p.color, borderLeftWidth: 4, paddingLeft: 12 }}
        >
          <T es={p.name} en={p.name_en} />
        </h1>
      </header>

      <section>
        <p className="text-text">
          <T es={p.description} en={p.description_en} />
        </p>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es={`Casos que exhiben este patrón (${patternCases.length})`}
            en={`Cases exhibiting this pattern (${patternCases.length})`}
          />
        </h2>
        <div className="mt-2">
          {patternCases.length === 0 ? (
            <p className="text-muted">
              <T
                es="Patrón estructural/meta — sin casos individuales en este corpus."
                en="Structural/meta pattern — no individual cases in this corpus."
              />
            </p>
          ) : (
            patternCases.map((c) => <CaseRow key={c.id} caseData={c} />)
          )}
        </div>
      </section>

      <PrevNext
        label="Navegación entre patrones"
        prev={
          prev
            ? {
                href: `/patterns/${prev.letter}`,
                es: "← Anterior",
                en: "← Previous",
                title: (
                  <T
                    es={`${prev.id} ${prev.name}`}
                    en={`${prev.id} ${prev.name_en}`}
                  />
                ),
              }
            : null
        }
        next={
          next
            ? {
                href: `/patterns/${next.letter}`,
                es: "Siguiente →",
                en: "Next →",
                title: (
                  <T
                    es={`${next.id} ${next.name}`}
                    en={`${next.id} ${next.name_en}`}
                  />
                ),
              }
            : null
        }
      />
    </article>
  );
}
