import { cases, TOTAL_CASES } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { CategoryNav } from "@/components/CategoryNav";
import { CorpusStats } from "@/components/CorpusStats";
import { RegionFilter } from "@/components/RegionFilter";
import { regionOf, type Region } from "@/lib/regions";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { EpistemicBadge } from "@/components/Badge";

export const metadata = {
  title: "Casos UAP institucionales (1947–2026)",
  description: `${TOTAL_CASES} casos UAP institucionales documentados entre 1947 y 2026 — archivo cronológico con nivel de evidencia y fuentes primarias.`,

  alternates: { canonical: "/cases/" },
};

const ERAS: Array<{ start: number; end: number; es: string; en: string }> = [
  {
    start: 1946,
    end: 1959,
    es: "La primera oleada",
    en: "The first wave",
  },
  {
    start: 1960,
    end: 1979,
    es: "La Guerra Fría sospecha de todo",
    en: "The Cold War suspects everything",
  },
  {
    start: 1980,
    end: 1995,
    es: "Reagan habla en la ONU",
    en: "Reagan speaks at the UN",
  },
  {
    start: 1996,
    end: 2016,
    es: "Pre-divulgación: filtraciones, libros, demandas",
    en: "Pre-disclosure: leaks, books, lawsuits",
  },
  {
    start: 2017,
    end: 2030,
    es: "Divulgación: Nimitz, Grusch, PURSUE",
    en: "Disclosure: Nimitz, Grusch, PURSUE",
  },
];

export default function CasesPage() {
  // Períodos del más nuevo al más antiguo; dentro de cada uno, por probabilidad (mayor primero).
  const eras = ERAS.map((era) => ({
    era,
    eraCases: cases
      .filter((c) => c.year_start >= era.start && c.year_start <= era.end)
      .sort((a, b) => b.probability - a.probability),
  }))
    .filter(({ eraCases }) => eraCases.length > 0)
    .reverse();

  const regionCounts: Partial<Record<Region, number>> = {};
  for (const c of cases) {
    const r = regionOf(c.country);
    if (r) regionCounts[r] = (regionCounts[r] ?? 0) + 1;
  }

  return (
    <div className="space-y-12 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="El archivo · 1947–2026" en="The archive · 1947–2026" />
        </Eyebrow>
        <H1>
          <T
            es={`Los ${TOTAL_CASES} que sobrevivieron`}
            en={`The ${TOTAL_CASES} that survived`}
          />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es="Cada caso superó tres filtros: tuvo testigos institucionales, dejó rastro documental, y nadie pudo descartarlo con explicación convencional. Del período más reciente al más antiguo; dentro de cada uno, por solidez de la evidencia."
            en="Each case survived three filters: institutional witnesses, documented paper trail, and no one could dismiss it with a conventional explanation. From the most recent period to the oldest; within each, by strength of evidence."
          />
        </Lede>
      </header>

      <CategoryNav
        label={{ es: "Saltar a una era", en: "Jump to an era" }}
        items={eras.map(({ era, eraCases }) => ({
          anchor: `era-${era.start}`,
          es: `${era.start}–${era.end}`,
          en: `${era.start}–${era.end}`,
          count: eraCases.length,
        }))}
      />

      <details className="group border-y border-text/15 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest text-muted hover:text-accent">
          <span>
            <T
              es="Estadísticas del corpus · distribución por era, patrones, países"
              en="Corpus statistics · distribution by era, patterns, countries"
            />
          </span>
          <span
            aria-hidden
            className="inline-block text-accent transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <div className="mt-6">
          <CorpusStats />
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="font-mono uppercase tracking-widest text-muted/70">
          <T es="Sin marca = documentado." en="No marker = documented." />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <EpistemicBadge status="developing" compact />
          <T es="reciente / en curso" en="recent / in progress" />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <EpistemicBadge status="projected" compact />
          <T es="proyectado / especulativo" en="projected / speculative" />
        </span>
      </div>

      <RegionFilter counts={regionCounts} total={cases.length}>
        <div className="space-y-8 pt-2">
          {eras.map(({ era, eraCases }) => {
            return (
              <section
                key={`${era.start}-${era.end}`}
                id={`era-${era.start}`}
                data-group
                className="scroll-mt-20"
              >
                <h2 className="sticky top-14 z-10 -mx-4 bg-bg/95 px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted backdrop-blur">
                  <span className="text-text">
                    {era.start}–{era.end}
                  </span>{" "}
                  ·{" "}
                  <T es={era.es} en={era.en} />{" "}
                  <span className="text-muted">
                    ·{" "}
                    <T
                      es={`${eraCases.length} casos`}
                      en={`${eraCases.length} cases`}
                    />
                  </span>
                </h2>
                <div>
                  {eraCases.map((c) => (
                    <div
                      key={c.id}
                      data-region={regionOf(c.country) ?? "otro"}
                      className="contents"
                    >
                      <CaseRow caseData={c} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </RegionFilter>
    </div>
  );
}
