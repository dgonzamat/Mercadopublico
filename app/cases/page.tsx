import { cases, TOTAL_CASES } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { CorpusStats } from "@/components/CorpusStats";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  title: "Casos · UAP Atlas",
  description: `${TOTAL_CASES} institutional cases documented 1947-2026`,
};

const ERAS: Array<{ start: number; end: number; es: string; en: string }> = [
  {
    start: 1947,
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
    es: "Pre-disclosure: filtraciones, libros, demandas",
    en: "Pre-disclosure: leaks, books, lawsuits",
  },
  {
    start: 2017,
    end: 2030,
    es: "Disclosure: Nimitz, Grusch, PURSUE",
    en: "Disclosure: Nimitz, Grusch, PURSUE",
  },
];

export default function CasesPage() {
  const sorted = [...cases].sort((a, b) => a.year_start - b.year_start);

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
            es="Cada caso superó tres filtros: tuvo testigos institucionales, dejó rastro documental, y nadie pudo descartarlo con explicación convencional. Ordenados cronológicamente — el orden importa, los picos hablan."
            en="Each case survived three filters: institutional witnesses, documented paper trail, and no one could dismiss it with a conventional explanation. Ordered chronologically — the order matters, the peaks speak."
          />
        </Lede>
      </header>

      <CorpusStats />

      <div className="space-y-8 pt-8">
        {ERAS.map((era) => {
          const eraCases = sorted.filter(
            (c) => c.year_start >= era.start && c.year_start <= era.end,
          );
          if (eraCases.length === 0) return null;
          return (
            <section key={`${era.start}-${era.end}`}>
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
                  <CaseRow key={c.id} caseData={c} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
