import { cases } from "@/lib/data";

/**
 * 79-year timeline of the corpus. Each year is a vertical line; height
 * proportional to number of cases that year. Decade ticks below.
 *
 * RD-3 · Los cuatro picos que el copy narra (1947 · 1973 · 2004 · 2026)
 * se anotan directamente sobre el gráfico: barra en accent-bright +
 * etiqueta mono con marcador ▲ (ID-2). El gráfico pasa de decorativo
 * a autoexplicativo.
 */

// CC-1 · #ee6075 = accent-bright (5.4:1 sobre #1a1a1a). El fill de SVG
// no puede leer tokens de Tailwind, así que va el hex con nombre.
const ACCENT_BRIGHT = "#ee6075";

const PEAKS: Array<{ year: number; label: string }> = [
  { year: 1947, label: "Roswell" },
  { year: 1973, label: "Pascagoula" },
  { year: 2004, label: "Nimitz" },
  { year: 2026, label: "PURSUE" },
];

export function TimelineByYear() {
  const YEAR_MIN = 1947;
  const YEAR_MAX = 2026;
  const span = YEAR_MAX - YEAR_MIN;

  const counts = new Map<number, number>();
  for (const c of cases) {
    counts.set(c.year_start, (counts.get(c.year_start) ?? 0) + 1);
  }
  const maxCount = Math.max(...Array.from(counts.values()));
  const peakYears = new Set(PEAKS.map((p) => p.year));

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

      <div>
        {/* Etiquetas de picos — HTML posicionado (el SVG está estirado
            con preserveAspectRatio="none"; texto dentro se deformaría). */}
        <div className="relative h-10" aria-hidden>
          {PEAKS.map((p, i) => {
            const pct = ((p.year - YEAR_MIN) / span) * 100;
            const align =
              i === 0
                ? "translate-x-0 items-start"
                : i === PEAKS.length - 1
                  ? "-translate-x-full items-end"
                  : "-translate-x-1/2 items-center";
            return (
              <div
                key={p.year}
                style={{ left: `${pct}%` }}
                className={`absolute bottom-0 flex transform flex-col gap-1 ${align}`}
              >
                <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-accent-bright">
                  {p.year} {p.label}
                </span>
                <span className="text-[9px] leading-none text-accent-bright">
                  ▲
                </span>
              </div>
            );
          })}
        </div>

        <svg
          viewBox={`0 0 ${span + 1} 100`}
          preserveAspectRatio="none"
          className="h-48 w-full md:h-64"
          role="img"
          aria-label={`Distribución temporal de ${cases.length} casos UAP entre ${YEAR_MIN} y ${YEAR_MAX}. Picos en 1947 (Roswell), 1973 (Pascagoula), 2004 (Nimitz) y 2026 (PURSUE).`}
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
                fill={peakYears.has(year) ? ACCENT_BRIGHT : "#f7f2e8"}
              />
            );
          })}
          {/* Baseline */}
          <rect x={0} y={99.5} width={span + 1} height={0.5} fill="#f7f2e8" opacity={0.3} />
        </svg>
      </div>

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
