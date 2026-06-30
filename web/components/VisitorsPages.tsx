"use client";

import Link from "next/link";
import { T } from "@/components/T";
import { pageLabel } from "@/lib/visitorsFormat";

export interface PageRow {
  path: string;
  count: number;
}

/**
 * Páginas más visitadas en el periodo. Lista presentacional (la agregación vive
 * en VisitorsPanel). Cada fila enlaza a la propia página. Solo guardamos la ruta
 * pública — sin query strings, sin datos personales.
 */
export function VisitorsPages({
  rows,
  limit = 12,
}: {
  rows: PageRow[];
  limit?: number;
}) {
  if (rows.length === 0) {
    return (
      <div className="space-y-1.5">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <T es="Páginas más visitadas" en="Most visited pages" />
        </p>
        <p className="border-2 border-text bg-panel px-4 py-4 text-sm text-muted">
          <T
            es="Aún sin datos de páginas en este periodo."
            en="No page data in this period yet."
          />
        </p>
      </div>
    );
  }

  const top = rows.slice(0, limit);
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = top[0].count || 1;

  return (
    <div className="space-y-1.5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Páginas más visitadas" en="Most visited pages" />
      </p>
      <ul className="space-y-1.5">
        {top.map((r) => {
          const pct = total ? (r.count / total) * 100 : 0;
          const barPct = (r.count / max) * 100;
          return (
            <li
              key={r.path}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-text/15 py-1.5"
            >
              <div className="min-w-0">
                <Link
                  href={r.path}
                  className="block truncate text-sm text-text hover:text-accent"
                >
                  <T
                    es={pageLabel(r.path, "es")}
                    en={pageLabel(r.path, "en")}
                  />
                </Link>
                <span
                  className="mt-1 block h-1.5 bg-accent"
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
    </div>
  );
}
