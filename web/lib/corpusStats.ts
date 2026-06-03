import type { UAPCase, Pattern } from "./types";

/**
 * Pure descriptive statistics over the corpus. NO inference — these are
 * counts/distributions you can verify by hand against data/cases.json.
 * Used in CorpusStats component to anchor the ICD-203 judgment chart
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
      color: p.color,
      count: cases.filter((c) => c.patterns.includes(p.id)).length,
    }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export interface EraDistribution {
  label: string;
  count: number;
  start: number;
  end: number;
}

const ERAS: Array<{ label: string; start: number; end: number }> = [
  { label: "Era inicial", start: 1947, end: 1959 },
  { label: "Era Cold War", start: 1960, end: 1979 },
  { label: "Fin Cold War", start: 1980, end: 1995 },
  { label: "Pre-disclosure", start: 1996, end: 2016 },
  { label: "Disclosure", start: 2017, end: 2030 },
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
