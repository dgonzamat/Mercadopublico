import type { AggFn, Bilingual } from "./fields";

/**
 * Configuración declarativa de cada visual del tablero. El estado del
 * explorador es una lista de estos objetos (serializable a localStorage).
 */

export type ChartType = "bar" | "barH" | "line" | "area" | "pie" | "scatter";

export type KpiMode = "value" | "distinct" | "threshold" | "share";

export interface KpiConfig {
  id: string;
  kind: "kpi";
  title: Bilingual;
  /** value: medida+agg · distinct: nº de valores únicos de una dimensión ·
   *  threshold: % de casos con medida ≥ valor · share: % por categoría. */
  mode?: KpiMode;
  measure: string;
  agg: AggFn;
  /** mode="distinct": dimensión cuyos valores únicos se cuentan. */
  distinctDimension?: string;
  /** mode="threshold": umbral mínimo de la medida. */
  threshold?: { measure: string; value: number };
  /** mode="share": porcentaje de filas con field=value. */
  share?: { field: "tier" | "category"; value: string };
  /** Muestra el delta del valor filtrado vs. el mismo cálculo sobre todo el corpus. */
  compare?: boolean;
}

export interface ChartConfig {
  id: string;
  kind: "chart";
  title: Bilingual;
  chartType: ChartType;
  dimension: string;
  measure: string;
  agg: AggFn;
  topN?: number;
  sort?: "value" | "label" | "none";
  /** Suma corrida sobre la dimensión ordenada (solo line/area). */
  cumulative?: boolean;
}

export interface PivotConfig {
  id: string;
  kind: "pivot";
  title: Bilingual;
  dimension: string;
  measure: string;
  agg: AggFn;
  topN?: number;
  sort?: "value" | "label" | "none";
}

export interface HeatmapConfig {
  id: string;
  kind: "heatmap";
  title: Bilingual;
  dimensionX: string;
  dimensionY: string;
  measure: string;
  agg: AggFn;
  topNX?: number;
  topNY?: number;
}

export type VisualConfig = KpiConfig | ChartConfig | PivotConfig | HeatmapConfig;

/** ¿El visual ocupa una celda ancha del grid (no es KPI)? */
export function isPanel(v: VisualConfig): boolean {
  return v.kind !== "kpi";
}

export const CHART_TYPE_LABEL: Record<ChartType, Bilingual> = {
  bar: { es: "Barras", en: "Bar" },
  barH: { es: "Barras horizontales", en: "Horizontal bar" },
  line: { es: "Líneas", en: "Line" },
  area: { es: "Área", en: "Area" },
  pie: { es: "Dona", en: "Donut" },
  scatter: { es: "Dispersión", en: "Scatter" },
};

/** Identificador estable sin depender de Date.now/Math.random en SSR. */
let _seq = 0;
export function newVisualId(prefix = "v"): string {
  _seq += 1;
  return `${prefix}-${_seq}-${Date.now().toString(36)}`;
}

/** Tablero inicial — útil al abrir sin configurar nada. */
export const DEFAULT_VISUALS: VisualConfig[] = [
  {
    id: "kpi-count",
    kind: "kpi",
    title: { es: "Casos", en: "Cases" },
    measure: "count",
    agg: "count",
  },
  {
    id: "kpi-avg-prob",
    kind: "kpi",
    title: { es: "Probabilidad media", en: "Average probability" },
    measure: "probability",
    agg: "avg",
    compare: true,
  },
  {
    id: "kpi-high-prob",
    kind: "kpi",
    title: { es: "% probabilidad ≥ 70", en: "% probability ≥ 70" },
    mode: "threshold",
    measure: "probability",
    agg: "count",
    threshold: { measure: "probability", value: 70 },
  },
  {
    id: "kpi-countries",
    kind: "kpi",
    title: { es: "Países", en: "Countries" },
    mode: "distinct",
    measure: "count",
    agg: "count",
    distinctDimension: "country",
  },
  {
    id: "kpi-patterns",
    kind: "kpi",
    title: { es: "Patrones cubiertos", en: "Patterns covered" },
    mode: "distinct",
    measure: "count",
    agg: "count",
    distinctDimension: "patterns",
  },
  {
    id: "kpi-share-s",
    kind: "kpi",
    title: { es: "% Tier S", en: "% Tier S" },
    mode: "share",
    measure: "count",
    agg: "count",
    share: { field: "tier", value: "S" },
  },
  {
    id: "chart-tier",
    kind: "chart",
    title: { es: "Casos por nivel de evidencia", en: "Cases by evidence level" },
    chartType: "bar",
    dimension: "tier",
    measure: "count",
    agg: "count",
    sort: "label",
  },
  {
    id: "chart-decade",
    kind: "chart",
    title: { es: "Casos por década", en: "Cases by decade" },
    chartType: "area",
    dimension: "decade",
    measure: "count",
    agg: "count",
    sort: "label",
  },
  {
    id: "chart-category",
    kind: "chart",
    title: { es: "Casos por categoría", en: "Cases by category" },
    chartType: "pie",
    dimension: "category",
    measure: "count",
    agg: "count",
  },
  {
    id: "chart-country",
    kind: "chart",
    title: { es: "Top 10 países", en: "Top 10 countries" },
    chartType: "barH",
    dimension: "country",
    measure: "count",
    agg: "count",
    topN: 10,
  },
  {
    id: "chart-prob-tier",
    kind: "chart",
    title: {
      es: "Probabilidad media por nivel",
      en: "Average probability by level",
    },
    chartType: "bar",
    dimension: "tier",
    measure: "probability",
    agg: "avg",
    sort: "label",
  },
  {
    id: "chart-cumulative",
    kind: "chart",
    title: { es: "Casos acumulados por década", en: "Cumulative cases by decade" },
    chartType: "line",
    dimension: "decade",
    measure: "count",
    agg: "count",
    sort: "label",
    cumulative: true,
  },
  {
    id: "heatmap-country-decade",
    kind: "heatmap",
    title: { es: "Mapa de calor país × década", en: "Heatmap country × decade" },
    dimensionX: "decade",
    dimensionY: "country",
    measure: "count",
    agg: "count",
    topNY: 12,
  },
];
