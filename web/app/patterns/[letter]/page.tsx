import { notFound } from "next/navigation";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { patterns, getCasesByPattern } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { PrevNext } from "@/components/PrevNext";
import { T } from "@/components/T";
import { Eyebrow, H1 } from "@/lib/typography";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export function generateStaticParams() {
  return patterns.map((p) => ({ letter: p.letter }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ letter: string }>;
  }
) {
  const params = await props.params;
  const p = patterns.find((x) => x.letter === params.letter);
  if (!p) return { title: "Patrón no encontrado" };
  return {
    ...pageMeta({
      title: `${p.id} ${p.name}`,
      description: p.description,
      path: `/patterns/${p.letter}/`,
    }),
    alternates: {
      canonical: `/patterns/${p.letter}/`,
      languages: hreflangFor(`/patterns/${p.letter}/`),
    },
  };
}

export default async function PatternDetailPage(
  props: {
    params: Promise<{ letter: string }>;
  }
) {
  const params = await props.params;
  const p = patterns.find((x) => x.letter === params.letter);
  if (!p) notFound();
  const patternCases = getCasesByPattern(p.id);

  // Orden secuencial = orden del array (igual que el índice /patterns).
  const idx = patterns.findIndex((x) => x.letter === p.letter);
  const prev = idx > 0 ? patterns[idx - 1] : null;
  const next = idx < patterns.length - 1 ? patterns[idx + 1] : null;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <BreadcrumbJsonLd
        items={[
          { href: "/", label: "Inicio" },
          { href: "/patterns/", label: "Patrones" },
          { label: `${p.id} ${p.name}` },
        ]}
      />
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

      {/* U-1 · header con primitivas (antes h1 en sans bold, fuera del sistema).
          El acento de color del patrón se conserva en el borde izquierdo. */}
      <header className="space-y-2">
        <Eyebrow>
          <T es={`Patrón ${p.id}`} en={`Pattern ${p.id}`} />
        </Eyebrow>
        <div style={{ borderLeftColor: p.color, borderLeftWidth: 4, paddingLeft: 12 }}>
          <H1>
            <T es={p.name} en={p.name_en} />
          </H1>
        </div>
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
