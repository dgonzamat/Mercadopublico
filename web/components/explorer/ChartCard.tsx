"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { UAPCase } from "@/lib/types";
import { groupAggregate, cumulate } from "@/lib/explorer/aggregate";
import { useRef } from "react";
import {
  AGG_LABEL,
  getDimension,
  getMeasure,
  pickLabel,
  type Locale,
} from "@/lib/explorer/fields";
import type { ChartConfig } from "@/lib/explorer/visuals";
import { exportNodePng } from "@/lib/explorer/exportImage";
import { CardActions } from "./KpiCard";

// Recharts necesita colores reales (no clases Tailwind). Espejo de los tokens
// del tema en tailwind.config.ts.
const COLORS = {
  accent: "#c41e3a",
  tierS: "#8b0000",
  tierA: "#9c5a18",
  tierB: "#1e4f8b",
  muted: "#615a4d",
  text: "#1a1a1a",
  border: "#c4b89d",
  panel: "#ede6d4",
};
// Colores categóricos extra para series (más allá de los tokens de marca).
// Allowlisteados en scripts/audit-design.mjs como paleta de data-viz.
const PALETTE = [
  COLORS.accent,
  COLORS.tierB,
  COLORS.tierA,
  COLORS.tierS,
  COLORS.muted,
  "#3a7d44",
  "#7a4fb8",
  "#0f8b8d",
];

const AXIS = { fontSize: 11, fill: COLORS.muted, fontFamily: "ui-monospace, monospace" };
const TOOLTIP_STYLE = {
  background: COLORS.panel,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 0,
  fontSize: 12,
  color: COLORS.text,
};

export function ChartCard({
  config,
  rows,
  locale,
  onEdit,
  onRemove,
}: {
  config: ChartConfig;
  rows: UAPCase[];
  locale: Locale;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const dim = getDimension(config.dimension);
  const meas = getMeasure(config.measure);
  const sub =
    config.chartType === "scatter"
      ? locale === "en"
        ? "year × probability"
        : "año × probabilidad"
      : `${dim ? pickLabel(dim.label, locale) : config.dimension} · ${
          meas ? pickLabel(meas.label, locale) : config.measure
        } (${pickLabel(AGG_LABEL[config.agg], locale)})`;

  return (
    <article ref={ref} className="group relative flex min-w-0 flex-col gap-3 overflow-hidden border border-border bg-panel p-5">
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
          {sub}
        </p>
      </div>
      <div className="h-[260px] w-full">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {locale === "en" ? "No data for current filters" : "Sin datos para los filtros actuales"}
          </div>
        ) : (
          <ChartBody config={config} rows={rows} />
        )}
      </div>
    </article>
  );
}

function ChartBody({ config, rows }: { config: ChartConfig; rows: UAPCase[] }) {
  if (config.chartType === "scatter") {
    const points = rows.map((c) => ({
      x: c.year_start,
      y: c.probability,
      name: c.name,
    }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke={COLORS.border} strokeOpacity={0.5} />
          <XAxis type="number" dataKey="x" name="año" domain={["auto", "auto"]} tick={AXIS} />
          <YAxis type="number" dataKey="y" name="%" domain={[0, 100]} tick={AXIS} />
          <ZAxis range={[40, 40]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={points} fill={COLORS.accent} fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  let data = groupAggregate(rows, config.dimension, config.measure, config.agg, {
    topN: config.topN,
    sort: config.sort ?? "value",
  });
  if (config.cumulative && (config.chartType === "line" || config.chartType === "area")) {
    data = cumulate(data);
  }

  switch (config.chartType) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid stroke={COLORS.border} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="name" tick={AXIS} interval="preserveStartEnd" />
            <YAxis tick={AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="value" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid stroke={COLORS.border} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="name" tick={AXIS} interval="preserveStartEnd" />
            <YAxis tick={AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="value" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="45%"
              outerRadius="75%"
              paddingAngle={1}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11, color: COLORS.muted }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case "barH":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid stroke={COLORS.border} strokeOpacity={0.5} horizontal={false} />
            <XAxis type="number" tick={AXIS} />
            <YAxis type="category" dataKey="name" tick={AXIS} width={92} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: COLORS.border, fillOpacity: 0.25 }} />
            <Bar dataKey="value" fill={COLORS.accent} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "bar":
    default:
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid stroke={COLORS.border} strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="name" tick={AXIS} interval={0} angle={data.length > 6 ? -30 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 56 : 30} />
            <YAxis tick={AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: COLORS.border, fillOpacity: 0.25 }} />
            <Bar dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
  }
}
