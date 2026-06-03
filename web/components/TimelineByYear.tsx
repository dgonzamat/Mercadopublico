import { cases } from "@/lib/data";

/**
 * 79-year timeline of the corpus. Each year is a vertical line; height
 * proportional to number of cases that year. Visual stand-alone — no
 * labels per year, just decade ticks. Reads as a fingerprint of the
 * institutional record.
 */
export function TimelineByYear() {
  const YEAR_MIN = 1947;
  const YEAR_MAX = 2026;
  const span = YEAR_MAX - YEAR_MIN;

  const counts = new Map<number, number>();
  for (const c of cases) {
    counts.set(c.year_start, (counts.get(c.year_start) ?? 0) + 1);
  }
  const maxCount = Math.max(...Array.from(counts.values()));

  const decades = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
  const totalForDecade = (start: number) =>
    cases.filter((c) => c.year_start >= start && c.year_start < start + 10)
      .length;

  return (
    <figure className="space-y-6">
      <figcaption className="grid grid-cols-2 items-end gap-4">
        <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
          Corpus por año · {YEAR_MIN}–{YEAR_MAX}
        </p>
        <p className="text-right font-mono text-xs uppercase tracking-widest text-bg/60">
          {cases.length} casos · {span} años
        </p>
      </figcaption>

      <svg
        viewBox={`0 0 ${span + 1} 100`}
        preserveAspectRatio="none"
        className="h-48 w-full md:h-64"
        role="img"
        aria-label={`Distribución temporal de ${cases.length} casos UAP entre ${YEAR_MIN} y ${YEAR_MAX}`}
      >
        {Array.from({ length: span + 1 }, (_, i) => {
          const year = YEAR_MIN + i;
          const count = counts.get(year) ?? 0;
          if (count === 0) return null;
          const height = (count / maxCount) * 90;
          return (
            <rect
              key={year}
              x={i}
              y={100 - height}
              width={0.7}
              height={height}
              fill="#f7f2e8"
            />
          );
        })}
        {/* Baseline */}
        <rect x={0} y={99.5} width={span + 1} height={0.5} fill="#f7f2e8" opacity={0.3} />
      </svg>

      <div className="grid grid-cols-4 gap-x-4 gap-y-3 border-t border-bg/20 pt-4 md:grid-cols-8">
        {decades.map((d) => (
          <div key={d} className="space-y-0.5">
            <p className="font-display text-2xl tabular-nums leading-none text-bg md:text-3xl">
              {totalForDecade(d)}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bg/60">
              {d}s
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}
