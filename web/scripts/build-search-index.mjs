#!/usr/bin/env node
/**
 * Build-time generation of the client-side search index.
 *
 * Reads data/cases/*.json + data/researchers.json and emits a unified
 * search payload at public/search-index.json. Each entry carries a
 * `type` discriminator so SiteSearch can route, badge, and rank by
 * kind. Frameworks and patterns intentionally not indexed yet — they
 * have fewer items and are typically found by browsing /frameworks
 * and /patterns directly.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const casesDir = path.join(dataDir, "cases");
const researchersFile = path.join(dataDir, "researchers.json");
const outFile = path.join(__dirname, "..", "public", "search-index.json");

// ── CASES ────────────────────────────────────────────────────────────────
const cases = fs
  .readdirSync(casesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8")));

const caseEntries = cases
  .map((c) => ({
    type: "case",
    id: c.id,
    num: c.num,
    name: c.name,
    subtitle: c.country_name,
    meta:
      (c.year_end ? `${c.year_start}–${c.year_end}` : String(c.year_start)) +
      ` · Tier ${c.tier}`,
    flag: c.flag,
    year: c.year_end ? `${c.year_start}–${c.year_end}` : String(c.year_start),
    year_start: c.year_start,
    summary: c.summary,
    summary_en: c.summary_en,
    keywords: (c.patterns || []).join(" "),
  }))
  .sort((a, b) => a.num - b.num);

// ── RESEARCHERS ──────────────────────────────────────────────────────────
const researchers = JSON.parse(fs.readFileSync(researchersFile, "utf-8"));

const researcherEntries = researchers.map((r) => ({
  type: "researcher",
  id: r.id,
  num: 0,
  name: r.name,
  subtitle: r.section_label || "Investigador",
  meta:
    [r.born ? String(r.born) : null, r.death ? `–${r.death}` : null]
      .filter(Boolean)
      .join("") +
    (r.framework ? ` · ${r.framework}` : ""),
  flag: "",
  year: r.born ? String(r.born) : "",
  year_start: r.born || 0,
  summary: r.bio_short || r.credentials || "",
  keywords: [r.credentials, r.framework, r.section_label]
    .filter(Boolean)
    .join(" "),
}));

// ── EMIT ─────────────────────────────────────────────────────────────────
const index = [...caseEntries, ...researcherEntries];
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(index));

const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(
  `build-search-index: ${caseEntries.length} cases + ${researcherEntries.length} researchers → public/search-index.json (${sizeKb} KB)`,
);
