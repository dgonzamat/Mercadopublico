import { cases, TOTAL_CASES } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";

export const metadata = {
  title: "Casos · UAP Atlas",
  description: `${TOTAL_CASES} casos institucionales documentados 1947-2026`,
};

export default function CasesPage() {
  const sorted = [...cases].sort((a, b) => a.year_start - b.year_start);
  const eras = [
    { label: "Era inicial (1947-1959)", start: 1947, end: 1959 },
    { label: "Era Cold War (1960-1979)", start: 1960, end: 1979 },
    { label: "Reagan / fin Cold War (1980-1995)", start: 1980, end: 1995 },
    { label: "Pre-disclosure (1996-2016)", start: 1996, end: 2016 },
    { label: "Era disclosure (2017-presente)", start: 2017, end: 2030 },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-text">Casos institucionales</h1>
        <p className="mt-2 text-muted">
          {cases.length} records (1947–2026). Ordenados cronológicamente.
          Probabilidad = confianza de que "es algo real no convencional" según
          análisis Bayesiano. No suman 100%.
        </p>
      </header>

      {eras.map((era) => {
        const eraCases = sorted.filter(
          (c) => c.year_start >= era.start && c.year_start <= era.end
        );
        if (eraCases.length === 0) return null;
        return (
          <section key={era.label}>
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
              {era.label} · {eraCases.length} casos
            </h2>
            <div className="mt-2">
              {eraCases.map((c) => (
                <CaseRow key={c.id} caseData={c} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
