"use client";

import { T } from "@/components/T";
import { flagEmoji, countryName } from "@/lib/visitorsFormat";

export interface VisitorRow {
  country: string;
  count: number;
}

/**
 * Tabla presentacional de visitas por país. Recibe las filas YA agregadas para
 * el periodo elegido (la lógica de datos vive en VisitorsPanel).
 */
export function VisitorsTable({
  rows,
  total,
}: {
  rows: VisitorRow[];
  total: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded border border-border bg-panel px-4 py-6 text-sm text-muted">
        <T
          es="Sin visitas en este periodo."
          en="No visits in this period."
        />
      </p>
    );
  }

  const max = rows[0].count || 1;

  return (
    <ul className="space-y-1.5">
      {rows.map((r) => {
        const pct = total ? (r.count / total) * 100 : 0;
        const barPct = (r.count / max) * 100;
        return (
          <li
            key={r.country}
            className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-border/60 py-1.5"
          >
            <span className="text-xl leading-none" aria-hidden>
              {flagEmoji(r.country)}
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm text-text">
                <T
                  es={countryName(r.country, "es")}
                  en={countryName(r.country, "en")}
                />
              </span>
              <span
                className="mt-1 block h-1 rounded bg-accent"
                style={{ width: `${Math.max(barPct, 2)}%` }}
                aria-hidden
              />
            </div>
            <span className="whitespace-nowrap text-right font-mono text-xs text-muted">
              <span className="text-text">{r.count.toLocaleString()}</span>{" "}
              {pct.toFixed(1)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}
