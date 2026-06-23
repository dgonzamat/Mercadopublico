"use client";

import { useRef } from "react";
import type { UAPCase } from "@/lib/types";
import { groupAggregate } from "@/lib/explorer/aggregate";
import {
  AGG_LABEL,
  getDimension,
  getMeasure,
  pickLabel,
  type Locale,
} from "@/lib/explorer/fields";
import type { PivotConfig } from "@/lib/explorer/visuals";
import { exportNodePng } from "@/lib/explorer/exportImage";
import { CardActions } from "./KpiCard";

export function PivotCard({
  config,
  rows,
  locale,
  onEdit,
  onRemove,
}: {
  config: PivotConfig;
  rows: UAPCase[];
  locale: Locale;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const dim = getDimension(config.dimension);
  const meas = getMeasure(config.measure);
  const data = groupAggregate(rows, config.dimension, config.measure, config.agg, {
    topN: config.topN,
    sort: config.sort ?? "value",
  });
  const total = data.reduce((a, b) => a + b.value, 0);

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
          {dim ? pickLabel(dim.label, locale) : config.dimension} ·{" "}
          {meas ? pickLabel(meas.label, locale) : config.measure} (
          {pickLabel(AGG_LABEL[config.agg], locale)})
        </p>
      </div>
      <div className="max-h-[260px] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-text text-muted">
              <th className="px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-widest">
                {dim ? pickLabel(dim.label, locale) : config.dimension}
              </th>
              <th className="px-2 py-1.5 text-right font-mono text-[10px] uppercase tracking-widest">
                {pickLabel(AGG_LABEL[config.agg], locale)}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.name} className="border-b border-border/60">
                <td className="px-2 py-1.5 text-text">{p.name}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-text">
                  {p.value.toLocaleString(locale === "en" ? "en-US" : "es-CL")}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={2} className="px-2 py-6 text-center text-muted">
                  {locale === "en" ? "No data" : "Sin datos"}
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && config.agg !== "avg" && (
            <tfoot>
              <tr className="border-t-2 border-text font-medium">
                <td className="px-2 py-1.5 text-text">{locale === "en" ? "Total" : "Total"}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-accent">
                  {(Math.round(total * 10) / 10).toLocaleString(locale === "en" ? "en-US" : "es-CL")}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </article>
  );
}
