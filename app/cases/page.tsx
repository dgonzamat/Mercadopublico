import { cases, TOTAL_CASES } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  title: "Casos · UAP Atlas",
  description: `${TOTAL_CASES} casos institucionales documentados 1947-2026`,
};

const ERAS = [
  { label: "Era inicial", start: 1947, end: 1959 },
  { label: "Era Cold War", start: 1960, end: 1979 },
  { label: "Reagan / fin Cold War", start: 1980, end: 1995 },
  { label: "Pre-disclosure", start: 1996, end: 2016 },
  { label: "Era disclosure", start: 2017, end: 2030 },
];

export default function CasesPage() {
  const sorted = [...cases].sort((a, b) => a.year_start - b.year_start);

  return (
    <div className="space-y-12 py-8">
      <header className="space-y-4">
        <Eyebrow>Índice · {TOTAL_CASES} records</Eyebrow>
        <H1>Casos institucionales</H1>
        <Lede className="max-w-3xl text-muted">
          {TOTAL_CASES} casos documentados (1947–2026) ordenados
          cronológicamente. Probabilidad = confianza de que "es algo real no
          convencional" según análisis Bayesiano. No suman 100%.
        </Lede>
      </header>

      <div className="space-y-8">
        {ERAS.map((era) => {
          const eraCases = sorted.filter(
            (c) => c.year_start >= era.start && c.year_start <= era.end,
          );
          if (eraCases.length === 0) return null;
          return (
            <section key={era.label}>
              <h2 className="sticky top-14 z-10 -mx-4 bg-bg/95 px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted backdrop-blur">
                {era.label}{" "}
                <span className="text-text">
                  · {era.start}–{era.end}
                </span>{" "}
                <span className="text-muted">· {eraCases.length} casos</span>
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
