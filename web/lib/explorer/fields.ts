import type { UAPCase } from "@/lib/types";
import {
  DETAIL_UNSPECIFIED,
  dominantNarrativeLabel,
  MECE_CLASSES,
  MISID_SUBTYPES,
  OBJECT_DETAILS,
  objectDetailDef,
  PROSAIC_CLASSES,
  prosaicKey,
} from "@/lib/meceClasses";

// País canónico por código ISO (nov 2026). La dimensión agrupaba por
// `country_name` crudo y partía los 98 países en 133 variantes («Alaska, EE.UU.»,
// «Estados Unidos (ubicación exacta no revelada)»…). DataExplorer registra el
// mapa calculado con lib/countryNames sobre el corpus cliente; este módulo
// sigue sin importar datos.
let COUNTRY_NAMES: Record<string, { es: string; en: string }> = {};
let COUNTRY_EN_BY_ES: Record<string, string> = {};
export function registerCountryNames(map: Record<string, { es: string; en: string }>) {
  COUNTRY_NAMES = map;
  COUNTRY_EN_BY_ES = Object.fromEntries(Object.values(map).map((n) => [n.es, n.en]));
}
export function countryLabel(c: UAPCase): string {
  return COUNTRY_NAMES[c.country]?.es ?? c.country_name.split(" · ")[0];
}

// Etiquetas de subtipos por key. Importadas de `lib/meceClasses` (data-free) —
// NO de `lib/meceModel`, que arrastra el corpus completo al chunk cliente del
// explorer (anti-pattern del LCP, enforzado por audit-consistency E18d).
const PROSAIC_LABEL = Object.fromEntries(
  PROSAIC_CLASSES.map((s) => [s.key, s.label]),
) as Record<(typeof PROSAIC_CLASSES)[number]["key"], string>;
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
  // Nunca llega al laboratorio (build-cases saca los críptidos de cases-client).
  cryptid: { es: "Críptido", en: "Cryptid" },
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
    values: (c) => [countryLabel(c)],
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
    label: { es: "Explicación más probable", en: "Most likely explanation" },
    // Narrativa más probable del posterior (argmax). Los documentos no llevan
    // posterior (la partición «qué era el objeto» no les aplica) → "—", como la
    // convención de `patterns` vacío (kpiDistinct la ignora). Los valores son
    // la etiqueta ES (clave estable de agrupación); `localizeDimValue` los
    // traduce al mostrarlos.
    values: (c) =>
      c.category === "document" || !c.posterior
        ? ["—"]
        : [dominantNarrativeLabel(c.posterior)],
  },
  {
    key: "mundano",
    label: { es: "Clase prosaica", en: "Prosaic class" },
    // Clase prosaica concreta (las seis de primer nivel: cuatro de objeto +
    // natural + fraude), igual que /probabilidades. Solo la llevan los casos con
    // lean mundano; el resto → "—" (kpiDistinct lo ignora). Key conservada.
    values: (c) =>
      c.mundanoType ? [PROSAIC_LABEL[prosaicKey(c.mundanoType, c.misidSubtype)]] : ["—"],
  },
  {
    key: "misid",
    label: { es: "Clase de objeto convencional", en: "Conventional object class" },
    // Qué objeto era (misidSubtype). Solo en casos con mundanoType="misid"
    // clasificados; el resto → "—". Key conservada por compatibilidad.
    values: (c) => (c.misidSubtype ? [MISID_LABEL[c.misidSubtype]] : ["—"]),
  },
  {
    key: "detalle",
    label: { es: "Detalle del objeto", en: "Object detail" },
    // Segundo nivel (`objectDetail`) dentro de la clase prosaica. Solo las clases
    // con detalle (OBJECT_DETAILS); sin él → «Sin precisar». Fraude, la clase
    // transitoria y los casos sin lean mundano → "—".
    values: (c) => {
      if (!c.mundanoType) return ["—"];
      const pk = prosaicKey(c.mundanoType, c.misidSubtype);
      if (!OBJECT_DETAILS[pk]) return ["—"];
      return [objectDetailDef(pk, c.objectDetail)?.label ?? DETAIL_UNSPECIFIED.label];
    },
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
    label: { es: "Sin causa conocida (%)", en: "No known cause (%)" },
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
    value: (c) => c.evidence?.length ?? c.evidenceCount ?? 0,
    aggs: ["sum", "avg", "median", "max"],
  },
  {
    key: "sourcesCount",
    label: { es: "Fuentes citadas", en: "Cited sources" },
    value: (c) => c.sources?.length ?? c.sourcesCount ?? 0,
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

// Traducción de los valores de dimensión al mostrarlos (nov 2026): los valores
// son la etiqueta ES, que sirve de clave estable; en la ruta inglesa la tabla,
// los gráficos y los filtros los pasan por aquí.
const EN_BY_ES: Record<string, string> = Object.fromEntries([
  ...Object.values(CATEGORY_LABEL).map((b) => [b.es, b.en]),
  ...MECE_CLASSES.map((m) => [m.label, m.labelEn]),
  ...PROSAIC_CLASSES.map((p) => [p.label, p.labelEn]),
  ...MISID_SUBTYPES.map((m) => [m.label, m.labelEn]),
  ...Object.values(OBJECT_DETAILS).flatMap((ds) => (ds ?? []).map((d) => [d.label, d.labelEn])),
  [DETAIL_UNSPECIFIED.label, DETAIL_UNSPECIFIED.labelEn],
]);
export function localizeDimValue(value: string, locale: Locale): string {
  if (locale === "es") return value;
  return COUNTRY_EN_BY_ES[value] ?? EN_BY_ES[value] ?? value;
}
