"use client";

import { T } from "@/components/T";
import { fmtDay, fmtNum } from "@/lib/visitorsFormat";
import { CONTINENT_NAME, CONTINENT_GLYPH, type Continent } from "@/lib/continents";

export interface DayTotal {
  day: string; // YYYY-MM-DD
  count: number;
}

export interface RegionTotal {
  key: Continent | "XX";
  count: number;
}

export interface VisitorsStatsData {
  total: number;
  countries: number;
  avgPerDay: number;
  peak: DayTotal | null;
  dailyTotals: DayTotal[]; // ascendente por día
  byContinent: RegionTotal[]; // descendente por count
}

function Card({
  label,
  value,
  sub,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="border-2 border-text bg-panel px-3 py-3">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-text">{value}</p>
      {sub && (
        <p className="mt-0.5 font-mono text-xs uppercase tracking-widest text-muted">
          {sub}
        </p>
      )}
    </div>
  );
}

/**
 * Estadísticas derivadas (sin tracking extra): tarjetas de totales, tendencia
 * diaria y desglose por continente. Todo se recalcula según el periodo elegido
 * en VisitorsPanel, que pasa los agregados ya listos.
 */
export function VisitorsStats({ data }: { data: VisitorsStatsData }) {
  const { total, countries, avgPerDay, peak, dailyTotals, byContinent } = data;
  const maxDay = dailyTotals.reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const regionMax = byContinent.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <div className="space-y-5">
      {/* Tarjetas de totales */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Con el dedup por dispositivo (24 h) + por IP (server, migración
            0005), la métrica es ~visitantes únicos diarios, no sesiones. */}
        <Card
          label={<T es="Visitantes" en="Visitors" />}
          value={<T es={fmtNum(total, "es")} en={fmtNum(total, "en")} />}
        />
        <Card
          label={<T es="Países" en="Countries" />}
          value={<T es={fmtNum(countries, "es")} en={fmtNum(countries, "en")} />}
        />
        <Card
          label={<T es="Promedio/día" en="Avg/day" />}
          value={
            <T
              es={fmtNum(avgPerDay, "es", { maximumFractionDigits: 1 })}
              en={fmtNum(avgPerDay, "en", { maximumFractionDigits: 1 })}
            />
          }
        />
        <Card
          label={<T es="Día más activo" en="Busiest day" />}
          value={
            peak ? (
              <T es={fmtNum(peak.count, "es")} en={fmtNum(peak.count, "en")} />
            ) : (
              "—"
            )
          }
          sub={
            peak ? (
              <T es={fmtDay(peak.day, "es")} en={fmtDay(peak.day, "en")} />
            ) : undefined
          }
        />
      </div>

      {/* Tendencia diaria */}
      {dailyTotals.length >= 2 && (
        <div className="border-2 border-text bg-panel px-3 py-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Tendencia diaria" en="Daily trend" />
          </p>
          <div
            className="flex h-20 items-end gap-[2px]"
            role="img"
            aria-label={`Tendencia diaria de visitas · ${dailyTotals.length} días · pico ${maxDay}`}
          >
            {dailyTotals.map((d) => (
              <div
                key={d.day}
                className="flex-1 bg-accent/70"
                style={{ height: `${Math.max((d.count / maxDay) * 100, 3)}%` }}
                title={`${fmtDay(d.day, "es")} · ${d.count}`}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-xs uppercase tracking-widest text-muted">
            <T
              es={fmtDay(dailyTotals[0].day, "es")}
              en={fmtDay(dailyTotals[0].day, "en")}
            />
            <T
              es={fmtDay(dailyTotals[dailyTotals.length - 1].day, "es")}
              en={fmtDay(dailyTotals[dailyTotals.length - 1].day, "en")}
            />
          </div>
        </div>
      )}

      {/* Desglose por continente */}
      {byContinent.length > 1 && (
        <div className="space-y-1.5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Por continente" en="By continent" />
          </p>
          <ul className="space-y-1.5">
            {byContinent.map((r) => {
              const name =
                r.key === "XX"
                  ? { es: "Desconocido", en: "Unknown" }
                  : CONTINENT_NAME[r.key];
              const glyph = r.key === "XX" ? "🏳️" : CONTINENT_GLYPH[r.key];
              const pct = total ? (r.count / total) * 100 : 0;
              const barPct = (r.count / regionMax) * 100;
              return (
                <li
                  key={r.key}
                  className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 border-b border-text/15 py-1.5"
                >
                  <span className="text-base leading-none" aria-hidden>
                    {glyph}
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-sm text-text">
                      <T es={name.es} en={name.en} />
                    </span>
                    <span
                      className="mt-1 block h-1.5 bg-accent"
                      style={{ width: `${Math.max(barPct, 2)}%` }}
                      aria-hidden
                    />
                  </div>
                  <span className="whitespace-nowrap text-right font-mono text-xs text-muted">
                    <span className="text-text">
                      <T es={fmtNum(r.count, "es")} en={fmtNum(r.count, "en")} />
                    </span>{" "}
                    {pct.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
