import { cases } from "@/lib/data";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  title: "Cobertura del corpus · país × década",
  description: `Matriz de cobertura de los ${STATS.cases} casos institucionales UAP por país y década — dónde el corpus es denso y dónde está flaco.`,
  alternates: { canonical: "/cobertura/" },
};

// Columnas: todo lo anterior a 1940 se agrupa (décadas muy ralas: 1560s, 1800s…),
// luego una columna por década 1940s…2020s. `0` es el bucket "‹1940".
const COLS = [0, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;
const decadeOf = (year: number): number => (year < 1940 ? 0 : Math.floor(year / 10) * 10);
const colLabel = (d: number): string => (d === 0 ? "‹1940" : `${d}s`);

type Row = {
  code: string;
  name: string;
  flag: string;
  total: number;
  byDecade: Record<number, number>;
};

export default function CoberturaPage() {
  // Agrega por código de país (coincide con STATS.countries); el label toma el
  // primer segmento del country_name (antes de " · ") para limpiar sufijos.
  const map = new Map<string, Row>();
  for (const c of cases) {
    let row = map.get(c.country);
    if (!row) {
      row = { code: c.country, name: c.country_name.split(" · ")[0], flag: c.flag, total: 0, byDecade: {} };
      map.set(c.country, row);
    }
    const d = decadeOf(c.year_start);
    row.byDecade[d] = (row.byDecade[d] ?? 0) + 1;
    row.total += 1;
  }
  const rows = [...map.values()].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name),
  );

  const maxCell = Math.max(1, ...rows.flatMap((r) => Object.values(r.byDecade)));
  const colTotals: Record<number, number> = {};
  for (const r of rows) {
    for (const d of COLS) colTotals[d] = (colTotals[d] ?? 0) + (r.byDecade[d] ?? 0);
  }
  const singletons = rows.filter((r) => r.total === 1).length;

  // Tinte de intensidad: acento (#c41e3a) con opacidad escalada al conteo,
  // acotada a 0.60 para que el número siga legible sobre el crema.
  const cellStyle = (n: number): { backgroundColor: string } | undefined =>
    n === 0 ? undefined : { backgroundColor: `rgba(196,30,58,${(0.1 + 0.5 * (n / maxCell)).toFixed(3)})` };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Cobertura · país × década" en="Coverage · country × decade" />
        </Eyebrow>
        <H1>
          <T
            es={`${STATS.countries} países a lo largo de ${STATS.years} años`}
            en={`${STATS.countries} countries across ${STATS.years} years`}
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={`Dónde el corpus de ${STATS.cases} casos es denso y dónde está flaco. ${singletons} países aparecen con un solo caso — la cola larga marca la próxima deuda de contenido.`}
            en={`Where the ${STATS.cases}-case corpus is dense and where it is thin. ${singletons} countries appear with a single case — the long tail marks the next content backlog.`}
          />
        </Lede>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 bg-bg px-2 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                <T es="País" en="Country" />
              </th>
              {COLS.map((d) => (
                <th key={d} className="px-2 py-2 text-center font-mono text-[10px] text-muted">
                  {colLabel(d)}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted">
                <T es="Total" en="Total" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-border/50">
                <th
                  scope="row"
                  className="sticky left-0 bg-bg px-2 py-1.5 text-left font-normal text-text"
                >
                  <span className="mr-1.5">{r.flag}</span>
                  {r.name}
                </th>
                {COLS.map((d) => {
                  const n = r.byDecade[d] ?? 0;
                  return (
                    <td
                      key={d}
                      className="px-2 py-1.5 text-center font-mono text-xs tabular-nums text-text"
                      style={cellStyle(n)}
                    >
                      {n || ""}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-center font-mono text-xs font-medium tabular-nums text-text">
                  {r.total}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <th className="sticky left-0 bg-bg px-2 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <T es="Total" en="Total" />
              </th>
              {COLS.map((d) => (
                <td key={d} className="px-2 py-2 text-center font-mono text-xs tabular-nums text-muted">
                  {colTotals[d] || ""}
                </td>
              ))}
              <td className="px-2 py-2 text-center font-mono text-xs font-medium tabular-nums text-accent">
                {STATS.cases}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="font-mono text-[10px] text-muted">
        <T
          es="Intensidad del color ∝ nº de casos en esa celda. Casos-documento incluidos; agrupados por país y década de inicio."
          en="Color intensity ∝ number of cases in that cell. Document cases included; grouped by country and start decade."
        />
      </p>
    </div>
  );
}
