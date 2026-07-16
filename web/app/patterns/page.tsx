import { patterns, cases } from "@/lib/data";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  ...pageMeta({
    title: "Patrones recurrentes del fenómeno",
    description: `${STATS.patterns} patrones recurrentes (8a–8r) identificados a lo largo del corpus de casos UAP institucionales.`,
    path: "/patterns/",
  }),
  alternates: {
    canonical: "/patterns/",
    languages: hreflangFor("/patterns/"),
  },
};

export default function PatternsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="El catálogo · 8a–8r" en="The catalog · 8a–8r" />
        </Eyebrow>
        <H1>
          <T
            es={`${STATS.patterns} patrones que aparecen una y otra vez`}
            en={`${STATS.patterns} patterns that show up again and again`}
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={`${STATS.patterns} patrones identificados a través de convergencia entre casos independientes. No se diseñaron a priori — emergieron tras acumulación de evidencia.`}
            en={`${STATS.patterns} patterns identified through convergence across independent cases. They were not designed a priori — they emerged after accumulation of evidence.`}
          />
        </Lede>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {patterns.map((p) => {
          const count = cases.filter((c) => c.patterns.includes(p.id)).length;
          return (
            <a
              key={p.id}
              href={`/patterns/${p.letter}`}
              className="border border-border bg-panel p-4 transition hover:border-accent/50"
              style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-accent">{p.id}</p>
                  <h2 className="mt-1 text-base font-medium text-text">
                    {p.name}
                  </h2>
                </div>
                <span className="bg-bg px-2 py-0.5 font-mono text-[10px] text-muted">
                  <T es={`${count} casos`} en={`${count} cases`} />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">{p.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
