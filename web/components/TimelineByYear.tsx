import { cases } from "@/lib/data";
import { T } from "@/components/T";

/**
 * Distribución del corpus por década. Cada década es una barra con su
 * conteo encima; los antecedentes anteriores a 1940 van juntos en la
 * primera columna («‹1940», como en /cobertura), así que las barras
 * suman el total de incidentes.
 *
 * RD-3 · Las décadas de los cuatro hitos que narra el copy (1947 · 1973 ·
 * 2004 · 2026) van en accent-bright; el párrafo de arriba hace de leyenda.
 * (Antes era una barra por año; el dueño pidió verla por década, oct 2026.)
 */

// CC-1 · #ee6075 = accent-bright (5.4:1 sobre #1a1a1a), igual que la clase
// text-accent-bright; las barras usan las clases de Tailwind.
const PEAK_YEARS = [1947, 1973, 2004, 2026];

// Solo incidentes: los casos-documento son evidencia, no sucesos.
const incidents = cases.filter((c) => c.category !== "document");

const FIRST_DECADE = 1940;

export function TimelineByYear({ locale }: { locale: "es" | "en" }) {
  const lastDecade = Math.floor(
    Math.max(...incidents.map((c) => c.year_start)) / 10,
  ) * 10;

  // `short` es la etiqueta móvil (dos cifras): a 360 px diez columnas no
  // caben con el año completo.
  const buckets: Array<{ key: string; label: string; short: string; count: number; peak: boolean }> = [
    {
      key: "pre",
      label: `‹${FIRST_DECADE}`,
      short: `‹${String(FIRST_DECADE).slice(2)}`,
      count: incidents.filter((c) => c.year_start < FIRST_DECADE).length,
      peak: false,
    },
  ];
  for (let d = FIRST_DECADE; d <= lastDecade; d += 10) {
    buckets.push({
      key: String(d),
      label: `${d}s`,
      short: `${String(d).slice(2)}s`,
      count: incidents.filter((c) => c.year_start >= d && c.year_start < d + 10)
        .length,
      peak: PEAK_YEARS.some((y) => y >= d && y < d + 10),
    });
  }
  const maxCount = Math.max(...buckets.map((b) => b.count));

  return (
    <figure className="space-y-6">
      <figcaption className="grid grid-cols-2 items-end gap-4">
        <p className="font-mono text-xs text-bg/60">
          <T es="Casos por década" en="Cases per decade" locale={locale} />
        </p>
        <p className="text-right font-mono text-xs text-bg/60">
          {incidents.length} <T es="casos" en="cases" locale={locale} />
        </p>
      </figcaption>

      <ol
        className="flex h-56 items-end gap-1.5 border-b border-bg/30 md:h-72 md:gap-3"
        aria-label={
          locale === "es"
            ? `Distribución de ${incidents.length} casos UAP por década: ${buckets.map((b) => `${b.label}, ${b.count}`).join("; ")}.`
            : `Distribution of ${incidents.length} UAP cases by decade: ${buckets.map((b) => `${b.label}, ${b.count}`).join("; ")}.`
        }
      >
        {buckets.map((b) => (
          <li
            key={b.key}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <span
              className={`font-display text-base tabular-nums leading-none md:text-2xl ${b.peak ? "text-accent-bright" : "text-bg"}`}
            >
              {b.count}
            </span>
            <span
              aria-hidden
              className={`block w-full ${b.peak ? "bg-accent-bright" : "bg-bg"}`}
              style={{ height: `${(b.count / maxCount) * 80}%` }}
            />
          </li>
        ))}
      </ol>
      <div className="-mt-4 flex gap-1.5 md:gap-3" aria-hidden>
        {buckets.map((b) => (
          <span
            key={b.key}
            className="min-w-0 flex-1 text-center font-mono text-[10px] text-bg/60 md:text-xs"
          >
            <span className="md:hidden">{b.short}</span>
            <span className="hidden md:inline">{b.label}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}
