#!/usr/bin/env node
/**
 * Build-time generation of the client-side search index.
 *
 * Reads data/cases/*.json (source of truth) and emits a compact JSON
 * blob with just the fields SiteSearch needs. The result lives in
 * public/search-index.json so it's served as a static asset and
 * lazy-loaded by the search component on first focus.
 *
 * Keeping it in `public/` (not bundled into the JS) means:
 *   - Zero impact on First Load JS
 *   - Cached by the browser independently
 *   - Updated automatically on every deploy
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.join(__dirname, "..", "data", "cases");
const outFile = path.join(__dirname, "..", "public", "search-index.json");

const cases = fs
  .readdirSync(casesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8")));

const index = cases
  .map((c) => ({
    id: c.id,
    num: c.num,
    name: c.name,
    country: c.country_name,
    flag: c.flag,
    year: c.year_end ? `${c.year_start}–${c.year_end}` : String(c.year_start),
    year_start: c.year_start,
    tier: c.tier,
    summary: c.summary,
    summary_en: c.summary_en,
    patterns: c.patterns,
  }))
  .sort((a, b) => a.num - b.num);

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(index));
const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(`build-search-index: ${index.length} cases → public/search-index.json (${sizeKb} KB)`);
