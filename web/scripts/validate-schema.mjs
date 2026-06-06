#!/usr/bin/env node
/**
 * Validador de schema — corre antes de cada build (prebuild hook), junto al
 * auditor de consistencia. Mientras audit-consistency.mjs vigila el DRIFT
 * editorial (porcentajes, conteos, copy), este script vigila la INTEGRIDAD
 * ESTRUCTURAL de las dos fuentes de verdad del corpus:
 *
 *   - data/researchers.json   (array de Researcher, ver lib/types.ts)
 *   - data/cases/*.json       (un UAPCase por archivo)
 *
 * Chequea campos obligatorios, tipos, enums, unicidad de ids/num y la
 * integridad referencial (framework → frameworks.json, patterns → patterns.json).
 *
 * SALIDA:
 *   - exit 0  → schema OK
 *   - exit 1  → al menos un error de schema (corta el build en CI)
 *
 * USO:
 *   node scripts/validate-schema.mjs           # falla en error
 *   node scripts/validate-schema.mjs --warn    # nunca exit ≠ 0
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf-8"));

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const isStr = (v) => typeof v === "string" && v.length > 0;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isArr = (v) => Array.isArray(v);

// ─── 1. Conjuntos de referencia ──────────────────────────────────────────

const frameworkIds = new Set(read("data/frameworks.json").map((f) => f.id));
const patternIds = new Set(read("data/patterns.json").map((p) => p.id));

// ─── 2. researchers.json ─────────────────────────────────────────────────

const SECTIONS = new Set(["A", "B", "C", "D", "E"]);
const researchers = read("data/researchers.json");
const seenResearcherIds = new Set();

researchers.forEach((r, i) => {
  const w = `researchers[${i}]${r.id ? ` (${r.id})` : ""}`;
  if (!isStr(r.id)) err(w, "id obligatorio (string)");
  else if (seenResearcherIds.has(r.id)) err(w, `id duplicado "${r.id}"`);
  else seenResearcherIds.add(r.id);

  if (!isStr(r.name)) err(w, "name obligatorio (string)");
  if (!isNum(r.born)) err(w, "born obligatorio (number)");
  if (r.death !== undefined && !isNum(r.death)) err(w, "death debe ser number");
  if (!SECTIONS.has(r.section)) err(w, `section inválida "${r.section}" (A–E)`);
  if (!isStr(r.section_label)) err(w, "section_label obligatorio (string)");
  if (!isStr(r.section_label_en)) err(w, "section_label_en obligatorio (string)");
  if (!isStr(r.credentials)) err(w, "credentials obligatorio (string)");
  if (!isStr(r.credentials_en)) err(w, "credentials_en obligatorio (string)");
  if (!isStr(r.bio_short)) err(w, "bio_short obligatorio (string)");
  if (!isStr(r.bio_short_en)) err(w, "bio_short_en obligatorio (string)");

  if (r.framework !== undefined && !frameworkIds.has(r.framework))
    err(w, `framework "${r.framework}" no existe en frameworks.json`);

  if (!isArr(r.works)) err(w, "works debe ser array");
  else
    r.works.forEach((wk, j) => {
      if (!isNum(wk.year)) err(`${w}.works[${j}]`, "year obligatorio (number)");
      if (!isStr(wk.title)) err(`${w}.works[${j}]`, "title obligatorio (string)");
      if (!isStr(wk.contribution))
        err(`${w}.works[${j}]`, "contribution obligatorio (string)");
      if (!isStr(wk.contribution_en))
        err(`${w}.works[${j}]`, "contribution_en obligatorio (string)");
    });

  // Campos opcionales: si están, deben ser string
  for (const f of ["photo", "photo_credit", "photo_license"])
    if (r[f] !== undefined && !isStr(r[f])) err(w, `${f} debe ser string`);

  // sources opcional: si está, array de { name, url?, note?, note_en? }
  if (r.sources !== undefined) {
    if (!isArr(r.sources)) err(w, "sources debe ser array");
    else
      r.sources.forEach((s, j) => {
        if (!isStr(s.name)) err(`${w}.sources[${j}]`, "name obligatorio (string)");
        for (const f of ["url", "note", "note_en"])
          if (s[f] !== undefined && !isStr(s[f]))
            err(`${w}.sources[${j}]`, `${f} debe ser string`);
      });
  }
});

// ─── 3. data/cases/*.json ────────────────────────────────────────────────

const TIERS = new Set(["S", "A", "B"]);
const CATEGORIES = new Set(["incident", "document", "contactee", "crop_circle"]);
const casesDir = path.join(root, "data", "cases");
const caseFiles = fs.readdirSync(casesDir).filter((f) => f.endsWith(".json"));
const seenCaseIds = new Set();
const seenNums = new Set();

for (const file of caseFiles) {
  const w = `cases/${file}`;
  let c;
  try {
    c = JSON.parse(fs.readFileSync(path.join(casesDir, file), "utf-8"));
  } catch (e) {
    err(w, `JSON inválido: ${e.message}`);
    continue;
  }

  if (!isStr(c.id)) err(w, "id obligatorio (string)");
  else if (seenCaseIds.has(c.id)) err(w, `id duplicado "${c.id}"`);
  else seenCaseIds.add(c.id);
  if (isStr(c.id) && `${c.id}.json` !== file)
    err(w, `id "${c.id}" no coincide con el nombre de archivo`);

  if (!isNum(c.num)) err(w, "num obligatorio (number)");
  else if (seenNums.has(c.num)) err(w, `num duplicado ${c.num}`);
  else seenNums.add(c.num);

  if (!isStr(c.name)) err(w, "name obligatorio (string)");
  if (!isNum(c.year_start)) err(w, "year_start obligatorio (number)");
  if (!isStr(c.country)) err(w, "country obligatorio (string)");
  if (!isStr(c.country_name)) err(w, "country_name obligatorio (string)");
  if (!isStr(c.flag)) err(w, "flag obligatorio (string)");
  if (!TIERS.has(c.tier)) err(w, `tier inválido "${c.tier}" (S/A/B)`);
  if (!CATEGORIES.has(c.category)) err(w, `category inválida "${c.category}"`);
  if (!isNum(c.probability)) err(w, "probability obligatorio (number)");
  if (!isStr(c.summary)) err(w, "summary obligatorio (string)");
  if (!isStr(c.summary_en)) err(w, "summary_en obligatorio (string)");

  if (!c.location || !isNum(c.location.lat) || !isNum(c.location.lng))
    err(w, "location.{lat,lng} obligatorio (number)");

  if (!isArr(c.patterns)) err(w, "patterns debe ser array");
  else
    c.patterns.forEach((p) => {
      if (!patternIds.has(p))
        err(w, `pattern "${p}" no existe en patterns.json`);
    });
}

// ─── 4. Reporte ──────────────────────────────────────────────────────────

console.log(
  `\nUAP Codex · Schema validation` +
    `\n  researchers: ${researchers.length}   cases: ${caseFiles.length}` +
    `\n  errores de schema: ${errors.length}\n`,
);
if (errors.length > 0) {
  console.log("  🔴 ERRORES:");
  for (const e of errors) console.log(`     ${e}`);
  console.log("");
  if (!process.argv.includes("--warn")) process.exit(1);
} else {
  console.log("  ✅ Schema válido.\n");
}
