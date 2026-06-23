"use client";

import { useRef } from "react";
import type { UAPCase } from "@/lib/types";
import { groupAggregate2D } from "@/lib/explorer/aggregate";
import {
  AGG_LABEL,
  getDimension,
  getMeasure,
  pickLabel,
  type Locale,
} from "@/lib/explorer/fields";
import type { HeatmapConfig } from "@/lib/explorer/visuals";
import { exportNodePng } from "@/lib/explorer/exportImage";
import { CardActions } from "./KpiCard";

// Interpola entre el `panel` (claro) y el `accent` (rojo) según intensidad.
function cellColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "transparent";
  const t = value / max; // 0..1
  // bg #f7f2e8 → accent #c41e3a
  const r = Math.round(247 + (196 - 247) * t);
  const g = Math.round(242 + (30 - 242) * t);
  const b = Math.round(232 + (58 - 232) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function HeatmapCard({
  config,
  rows,
  locale,
  onEdit,
  onRemove,
}: {
  config: HeatmapConfig;
  rows: UAPCase[];
  locale: Locale;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const dimX = getDimension(config.dimensionX);
  const dimY = getDimension(config.dimensionY);
  const meas = getMeasure(config.measure);
  const { xLabels, yLabels, matrix, max } = groupAggregate2D(
    rows,
    config.dimensionX,
    config.dimensionY,
    config.measure,
    config.agg,
    { topNX: config.topNX, topNY: config.topNY },
  );

  return (
    <article ref={ref} className="group relative flex min-w-0 flex-col gap-3 border border-border bg-panel p-5">
      <CardActions
        onEdit={onEdit}
        onRemove={onRemove}
        onExport={() => ref.current && exportNodePng(ref.current, `${pickLabel(config.title, locale)}.png`)}
        locale={locale}
      />
      <div>
        <p className="font-display text-lg font-medium leading-tight text-text">
          {pickLabel(config.title, locale)}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {dimY ? pickLabel(dimY.label, locale) : config.dimensionY} ×{" "}
          {dimX ? pickLabel(dimX.label, locale) : config.dimensionX} ·{" "}
          {meas ? pickLabel(meas.label, locale) : config.measure} (
          {pickLabel(AGG_LABEL[config.agg], locale)})
        </p>
      </div>

      {yLabels.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-muted">
          {locale === "en" ? "No data for current filters" : "Sin datos para los filtros actuales"}
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-panel" />
                {xLabels.map((x) => (
                  <th
                    key={x}
                    className="px-1 py-1 text-center font-mono text-[10px] font-normal text-muted"
                  >
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yLabels.map((y, yi) => (
                <tr key={y}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-[120px] truncate bg-panel py-1 pr-2 text-right font-normal text-text"
                    title={y}
                  >
                    {y}
                  </th>
                  {xLabels.map((x, xi) => {
                    const v = matrix[yi][xi];
                    return (
                      <td
                        key={x}
                        className="h-7 min-w-7 border border-bg/40 text-center tabular-nums"
                        style={{ backgroundColor: cellColor(v, max), color: v / max > 0.55 ? "#f7f2e8" : "#1a1a1a" }}
                        title={`${y} · ${x}: ${v}`}
                      >
                        {v > 0 ? v : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
