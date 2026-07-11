import statsData from "@/data/site-stats.json";

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
 *
 * IMPORTANT: STATS reads a tiny generated JSON (data/site-stats.json,
 * emitted by scripts/build-cases.mjs), NOT the corpus itself. This module
 * is imported by MobileNav — a CLIENT component in the global layout — so
 * importing `cases`/`patterns`/etc. here would bundle the entire ~4 MB
 * corpus into a client chunk shipped on EVERY page (the site-wide LCP
 * killer). Keep this file corpus-free.
 */
export const STATS = statsData as {
  cases: number;
  patterns: number;
  frameworks: number;
  researchers: number;
  tierS: number;
  tierA: number;
  tierB: number;
  countries: number;
  startYear: number;
  endYear: number;
  years: number;
};
