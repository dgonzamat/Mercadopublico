"use client";

import { useState } from "react";
import { T } from "@/components/T";

export type DonutDatum = {
  key: string;
  color: string;
  count: number;
  label: string;
  labelEn: string;
  /** Ancla/URL de la hipótesis; si está, el segmento y la fila son enlaces. */
  href?: string;
};

const share = (x: number) => (x * 100).toFixed(1);

/**
 * Donut interactivo (componente cliente). El hover/focus sobre un segmento o
 * una fila de la leyenda resalta ambos (estado compartido) y el centro del
 * donut muestra el detalle de esa hipótesis. Sin interacción, el centro
 * muestra el total. El render del servidor (estado inicial) deja el donut
 * completo y el total — la interactividad es progresiva.
 */
export function MeceDonut({ rows, N }: { rows: DonutDatum[]; N: number }) {
  const [active, setActive] = useState<string | null>(null);

  const size = 240;
  const stroke = 38;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const gap = 1.5;
  const c = size / 2;

  // Offset acumulado por segmento, precomputado (sin mutar en el render).
  const offsets = rows.reduce<number[]>((acc, row, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (rows[i - 1].count / N) * C);
    return acc;
  }, []);

  const activeRow = rows.find((x) => x.key === active) ?? null;
  const clear = () => setActive(null);

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
      {/* Donut */}
      <div className="relative h-60 w-60 shrink-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-60 w-60 -rotate-90"
          role="img"
          aria-label={rows.map((rw) => `${rw.label} ${share(rw.count / N)}%`).join(", ")}
        >
          {rows.map((row, i) => {
            const frac = row.count / N;
            const len = Math.max(frac * C - gap, 0.5);
            const isActive = active === row.key;
            const dim = active !== null && !isActive;
            const circle = (
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={row.color}
                strokeWidth={isActive ? stroke + 7 : stroke}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offsets[i]}
                className="cursor-pointer transition-all duration-150"
                style={{ opacity: dim ? 0.35 : 1 }}
                onMouseEnter={() => setActive(row.key)}
                onMouseLeave={clear}
              >
                <title>{`${row.label}: ${share(frac)}%`}</title>
              </circle>
            );
            return row.href ? (
              <a
                key={row.key}
                href={row.href}
                aria-label={`${row.label}: ${share(frac)}%`}
                onFocus={() => setActive(row.key)}
                onBlur={clear}
              >
                {circle}
              </a>
            ) : (
              <g key={row.key}>{circle}</g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {activeRow ? (
            <>
              <span className="font-mono text-3xl font-semibold tabular-nums" style={{ color: activeRow.color }}>
                {share(activeRow.count / N)}%
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase leading-tight tracking-wider text-muted">
                <T es={activeRow.label} en={activeRow.labelEn} />
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-4xl font-semibold tabular-nums text-text">{N}</span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                <T es="casos" en="cases" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Leyenda — sincronizada con el donut */}
      <ol className="w-full flex-1 space-y-0.5">
        {rows.map((row, i) => {
          const isActive = active === row.key;
          const dim = active !== null && !isActive;
          const inner = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: row.color }} aria-hidden />
                <span className={`uppercase tracking-wider ${i === 0 || isActive ? "font-semibold text-text" : "text-text"}`}>
                  <T es={row.label} en={row.labelEn} />
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-muted">
                <span className={i === 0 || isActive ? "text-text" : ""}>{share(row.count / N)}%</span>
                {" · "}
                {row.count.toFixed(1)} <T es="casos" en="cases" />
              </span>
            </>
          );
          const rowClass = `flex items-baseline justify-between gap-3 rounded-sm px-2 py-1 transition-colors ${
            isActive ? "bg-border/40" : dim ? "opacity-50" : ""
          }`;
          return (
            <li key={row.key} className="-mx-2 font-mono text-xs" onMouseEnter={() => setActive(row.key)} onMouseLeave={clear}>
              {row.href ? (
                <a href={row.href} className={`${rowClass} hover:bg-border/40`} onFocus={() => setActive(row.key)} onBlur={clear}>
                  {inner}
                </a>
              ) : (
                <div className={rowClass}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
