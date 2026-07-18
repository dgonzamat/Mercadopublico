import type { UAPCase } from "@/lib/types";
import {
  dominantNarrativeLabel,
  MUNDANO_SUBTYPES,
  MISID_SUBTYPES,
} from "@/lib/meceClasses";

// Etiquetas de subtipos por key. Importadas de `lib/meceClasses` (data-free) —
// NO de `lib/meceModel`, que arrastra el corpus completo al chunk cliente del
// explorer (anti-pattern del LCP, enforzado por audit-consistency E18d).
const MUNDANO_LABEL = Object.fromEntries(
  MUNDANO_SUBTYPES.map((s) => [s.key, s.label]),
) as Record<(typeof MUNDANO_SUBTYPES)[number]["key"], string>;
const MISID_LABEL = Object.fromEntries(
  MISID_SUBTYPES.map((s) => [s.key, s.label]),
) as Record<(typeof MISID_SUBTYPES)[number]["key"], string>;

/**
 * Metadatos de los campos del corpus que el explorador BI puede usar como
 * dimensiones (ejes / categorías) y medidas (valores agregados). Centraliza
 * cómo se extrae cada valor de un `UAPCase` y sus etiquetas bilingües, para
 * que `aggregate.ts`, los gráficos, los KPIs y la tabla compartan una sola
 * fuente de verdad.
 */

export type Locale = "es" | "en";

export type AggFn = "count" | "sum" | "avg" | "median" | "min" | "max";

export interface Bilingual {
  es: string;
  en: string;
}

export interface DimensionDef {
  key: string;
  label: Bilingual;
  /** Devuelve el/los valor(es) de dimensión de un caso. `patterns` devuelve
   *  varios (un caso aporta a cada patrón que tiene). */
  values: (c: UAPCase) => string[];
}

export interface MeasureDef {
  key: string;
  label: Bilingual;
  /** Valor numérico por caso. `count` ignora el valor (cuenta filas). */
  value: (c: UAPCase) => number;
  /** Agregaciones permitidas para esta medida. */
  aggs: AggFn[];
}

export const CATEGORY_LABEL: Record<UAPCase["category"], Bilingual> = {
  incident: { es: "Incidente", en: "Incident" },
  document: { es: "Documento", en: "Document" },
  contactee: { es: "Contactado", en: "Contactee" },
  crop_circle: { es: "Agroglifo", en: "Crop circle" },
};

/** Década a partir del año de inicio: 1952 → "1950s". */
export function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

export const DIMENSIONS: DimensionDef[] = [
  {
    key: "tier",
    label: { es: "Nivel de evidencia (Tier)", en: "Evidence level (Tier)" },
    values: (c) => [`Tier ${c.tier}`],
  },
  {
    key: "category",
    label: { es: "Categoría", en: "Category" },
    values: (c) => [CATEGORY_LABEL[c.category]?.es ?? c.category],
  },
  {
    key: "country",
    label: { es: "País", en: "Country" },
    values: (c) => [c.country_name || c.country],
  },
  {
    key: "decade",
    label: { es: "Década", en: "Decade" },
    values: (c) => [decadeOf(c.year_start)],
  },
  {
    key: "year",
    label: { es: "Año", en: "Year" },
    values: (c) => [String(c.year_start)],
  },
  {
    key: "patterns",
    label: { es: "Patrón", en: "Pattern" },
    values: (c) => (c.patterns?.length ? c.patterns : ["—"]),
  },
  {
    key: "narrativa",
    label: { es: "Narrativa MECE (dominante)", en: "MECE narrative (dominant)" },
    // Narrativa más probable del posterior (argmax). Los documentos no llevan
    // posterior (la partición «qué era el objeto» no les aplica) → "—", como la
    // convención de `patterns` vacío (kpiDistinct la ignora). Etiqueta en ES
    // igual que la dimensión `category`: el laboratorio es solo-ES (no /en).
    values: (c) =>
      c.category === "document" || !c.posterior
        ? ["—"]
        : [dominantNarrativeLabel(c.posterior)],
  },
  {
    key: "mundano",
    label: { es: "Tipo mundano/natural", en: "Mundane/natural type" },
    // Subtipo de la narrativa mundano (misid / natural / fraude). Solo lo llevan
    // los casos con lean mundano; el resto → "—" (kpiDistinct lo ignora).
    values: (c) => (c.mundanoType ? [MUNDANO_LABEL[c.mundanoType]] : ["—"]),
  },
  {
    key: "misid",
    label: { es: "Subtipo de misidentificación", en: "Misidentification subtype" },
    // Drill-down bajo misid: con qué objeto conocido se confundió. Solo en casos
    // con mundanoType="misid" clasificados; el resto → "—".
    values: (c) => (c.misidSubtype ? [MISID_LABEL[c.misidSubtype]] : ["—"]),
  },
];

export const MEASURES: MeasureDef[] = [
  {
    key: "count",
    label: { es: "Nº de casos", en: "Case count" },
    value: () => 1,
    aggs: ["count"],
  },
  {
    key: "probability",
    label: { es: "Probabilidad (%)", en: "Probability (%)" },
    value: (c) => c.probability,
    aggs: ["avg", "median", "min", "max"],
  },
  {
    key: "patternsCount",
    label: { es: "Patrones por caso", en: "Patterns per case" },
    value: (c) => c.patterns?.length ?? 0,
    aggs: ["avg", "median", "sum", "min", "max"],
  },
  {
    key: "evidenceCount",
    label: { es: "Ítems de evidencia", en: "Evidence items" },
    value: (c) => c.evidence?.length ?? 0,
    aggs: ["sum", "avg", "median", "max"],
  },
  {
    key: "sourcesCount",
    label: { es: "Fuentes citadas", en: "Cited sources" },
    value: (c) => c.sources?.length ?? 0,
    aggs: ["sum", "avg", "median", "max"],
  },
  {
    key: "year_start",
    label: { es: "Año", en: "Year" },
    value: (c) => c.year_start,
    aggs: ["min", "max", "avg", "median"],
  },
];

export const AGG_LABEL: Record<AggFn, Bilingual> = {
  count: { es: "Conteo", en: "Count" },
  sum: { es: "Suma", en: "Sum" },
  avg: { es: "Promedio", en: "Average" },
  median: { es: "Mediana", en: "Median" },
  min: { es: "Mínimo", en: "Minimum" },
  max: { es: "Máximo", en: "Maximum" },
};

export function getDimension(key: string): DimensionDef | undefined {
  return DIMENSIONS.find((d) => d.key === key);
}

export function getMeasure(key: string): MeasureDef | undefined {
  return MEASURES.find((m) => m.key === key);
}

export function pickLabel(b: Bilingual, locale: Locale): string {
  return locale === "en" ? b.en : b.es;
}
