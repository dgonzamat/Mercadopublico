import type { UAPCase, Pattern } from "./types";

/**
 * Pure descriptive statistics over the corpus. NO inference — these are
 * counts/distributions you can verify by hand against data/cases.json.
 * Used in CorpusStats component to anchor the corpus overview
 * with verifiable facts.
 */

export interface TierDistribution {
  S: number;
  A: number;
  B: number;
  total: number;
}

export function tierDistribution(cases: UAPCase[]): TierDistribution {
  return {
    S: cases.filter((c) => c.tier === "S").length,
    A: cases.filter((c) => c.tier === "A").length,
    B: cases.filter((c) => c.tier === "B").length,
    total: cases.length,
  };
}

export interface PatternFrequency {
  id: string;
  letter: string;
  name: string;
  name_en: string;
  count: number;
  color: string;
}

export function topPatterns(
  cases: UAPCase[],
  patterns: Pattern[],
  n: number = 5,
): PatternFrequency[] {
  return patterns
    .map((p) => ({
      id: p.id,
      letter: p.letter,
      name: p.name,
      name_en: p.name_en,
      color: p.color,
      count: cases.filter((c) => c.patterns.includes(p.id)).length,
    }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export interface EraDistribution {
  label: string;
  label_en: string;
  /** Sobreescribe el rango numérico de la fila. Solo lo usa el tramo de
   *  antecedentes: su `start` es 0 y la plantilla `start–end` lo imprimía como
   *  «0–46», que se lee como un rango de años y parece un bug. */
  range?: string;
  count: number;
  start: number;
  end: number;
}

// Los porcentajes de CorpusStats se calculan sobre el TOTAL del corpus, así que
// las eras tienen que cubrirlo entero o las barras suman menos de 100 % sin
// decirlo. Faltaba el tramo previo: los ~17 antecedentes anteriores a 1947 más
// los casos de 1946, que no caían en ninguna era (mismo agujero que tenía el
// bucketing de /cases, sep 2026). El corte en 1946 deja intacta el ancla
// editorial de 1947 para la era institucional moderna.
// `label_en` no es opcional: CorpusStats renderizaba `{e.label}` crudo y las
// etiquetas son españolas, así que /resumen las mostraba en español también en
// el sitio inglés — la clase «campo con par bilingüe consumido crudo» de
// CLAUDE.md, aquí sin siquiera par que consumir. El resto del componente ya
// usaba `<T es={p.name} en={p.name_en}>` para los patrones; las eras eran la
// excepción. Exigirlo en el tipo hace que tsc obligue a traer el par.
const ERAS: Array<{ label: string; label_en: string; start: number; end: number; range?: string }> = [
  { label: "Antecedentes", label_en: "Antecedents", start: 0, end: 1946, range: "‹1947" },
  { label: "Era inicial", label_en: "Early era", start: 1947, end: 1959 },
  { label: "Era Cold War", label_en: "Cold War era", start: 1960, end: 1979 },
  { label: "Fin Cold War", label_en: "Late Cold War", start: 1980, end: 1995 },
  { label: "Pre-disclosure", label_en: "Pre-disclosure", start: 1996, end: 2016 },
  { label: "Disclosure", label_en: "Disclosure", start: 2017, end: 2030 },
];

export function eraDistribution(cases: UAPCase[]): EraDistribution[] {
  return ERAS.map((e) => ({
    ...e,
    count: cases.filter((c) => c.year_start >= e.start && c.year_start <= e.end).length,
  }));
}

export function countryCount(cases: UAPCase[]): number {
  return new Set(cases.map((c) => c.country)).size;
}
