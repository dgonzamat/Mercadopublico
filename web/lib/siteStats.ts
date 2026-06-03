import { cases, patterns, frameworks, researchers } from "./data";

/**
 * Central site statistics derived from data at build time.
 *
 * Any page rendering corpus counts (cases, countries, years, patterns,
 * etc.) should read from STATS instead of computing locally — that way
 * every count stays consistent when the corpus grows.
 *
 * Previously each page derived its own counts (or worse, hardcoded
 * them), which led to drift: e.g. /home and /resumen said "12 países"
 * after the corpus had grown to 17.
 */

const CORPUS_START_YEAR = 1947;
const corpusEndYear = Math.max(...cases.map((c) => c.year_start));

export const STATS = {
  // Corpus volume
  cases: cases.length,
  patterns: patterns.length,
  frameworks: frameworks.length,
  researchers: researchers.length,

  // Tier distribution
  tierS: cases.filter((c) => c.tier === "S").length,
  tierA: cases.filter((c) => c.tier === "A").length,
  tierB: cases.filter((c) => c.tier === "B").length,

  // Geographic reach
  countries: new Set(cases.map((c) => c.country)).size,

  // Temporal reach
  startYear: CORPUS_START_YEAR,
  endYear: corpusEndYear,
  years: corpusEndYear - CORPUS_START_YEAR,
} as const;
