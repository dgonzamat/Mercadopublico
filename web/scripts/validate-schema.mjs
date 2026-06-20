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
 * Además valida: MAPA (coordenadas en rango, sin placeholder 0,0),
 * BIBLIOGRAFÍA (todo caso/investigador cita ≥1 fuente, urls bien formadas) y
 * FOTOS (si hay foto, URL válida + licencia de atribución).
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
// URL http(s) válida, o ruta absoluta bajo /public (para fotos locales).
const isHttpUrl = (v) => typeof v === "string" && /^https?:\/\/\S+$/.test(v);
// Bandera: dos símbolos indicadores regionales (emoji de país, p. ej. 🇦🇷).
const isFlag = (v) =>
  typeof v === "string" && /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(v);
const isPhotoRef = (v) => isHttpUrl(v) || (typeof v === "string" && v.startsWith("/"));

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
  if (!isStr(r.flag)) err(w, "flag obligatorio (bandera de nacionalidad)");
  else if (!isFlag(r.flag))
    err(w, `flag debe ser un emoji de bandera de país (indicadores regionales): "${r.flag}"`);
  if (r.born !== undefined && !isNum(r.born)) err(w, "born debe ser number");
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

  // FOTOS: si hay foto debe ser URL http(s) o ruta /public, y exigir licencia
  // (cumplimiento de atribución: solo se usan imágenes PD/CC).
  for (const f of ["photo_credit", "photo_license"])
    if (r[f] !== undefined && !isStr(r[f])) err(w, `${f} debe ser string`);
  if (r.photo !== undefined) {
    if (!isPhotoRef(r.photo))
      err(w, `photo debe ser URL http(s) o ruta /public: "${r.photo}"`);
    if (!isStr(r.photo_license))
      err(w, "photo presente requiere photo_license (atribución PD/CC)");
  }

  // BIBLIOGRAFÍA: sources obligatorio (al menos una fuente verificable)
  if (!isArr(r.sources) || r.sources.length === 0) {
    err(w, "sources obligatorio (bibliografía): al menos una fuente");
  } else {
    r.sources.forEach((s, j) => {
      if (!isStr(s.name)) err(`${w}.sources[${j}]`, "name obligatorio (string)");
      for (const f of ["note", "note_en"])
        if (s[f] !== undefined && !isStr(s[f]))
          err(`${w}.sources[${j}]`, `${f} debe ser string`);
      if (s.url !== undefined && !isHttpUrl(s.url))
        err(`${w}.sources[${j}]`, `url malformada: "${s.url}"`);
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
  if (
    c.epistemicStatus !== undefined &&
    !["documented", "developing", "projected"].includes(c.epistemicStatus)
  )
    err(w, `epistemicStatus inválido "${c.epistemicStatus}"`);
  if (!CATEGORIES.has(c.category)) err(w, `category inválida "${c.category}"`);
  if (!isNum(c.probability)) err(w, "probability obligatorio (number)");
  // posterior (modelo MECE): si está presente, valida 6 claves y suma ≈ 1.
  // En incidentes es P(narrativa|objeto); en documentos es el "lean" evidencial
  // (a qué narrativa inclina el documento). Ambos usos son válidos.
  if (c.posterior !== undefined) {
    const MECE_KEYS = ["mundano_natural", "humana_clasificada", "adversaria", "nohumano_encubierto", "nohumano_abierto", "indet"];
    const miss = MECE_KEYS.filter((k) => typeof c.posterior[k] !== "number");
    const extra = Object.keys(c.posterior).filter((k) => !MECE_KEYS.includes(k));
    if (miss.length || extra.length)
      err(w, `posterior con claves inválidas (faltan/no-numéricas [${miss}], sobran [${extra}])`);
    else {
      const tot = MECE_KEYS.reduce((acc, k) => acc + c.posterior[k], 0);
      if (Math.abs(tot - 1) > 0.005) err(w, `posterior suma ${tot.toFixed(4)} (debe ser 1)`);
    }
  }
  if (!isStr(c.summary)) err(w, "summary obligatorio (string)");
  if (!isStr(c.summary_en)) err(w, "summary_en obligatorio (string)");

  // MAPA: coordenadas presentes, en rango y no placeholder (0,0 = null island)
  if (!c.location || !isNum(c.location.lat) || !isNum(c.location.lng)) {
    err(w, "location.{lat,lng} obligatorio (number)");
  } else {
    const { lat, lng } = c.location;
    if (lat < -90 || lat > 90) err(w, `location.lat fuera de rango [-90,90]: ${lat}`);
    if (lng < -180 || lng > 180)
      err(w, `location.lng fuera de rango [-180,180]: ${lng}`);
    if (lat === 0 && lng === 0)
      err(w, "location (0,0) — coordenadas placeholder (null island); usar el ancla terrestre real");
  }

  if (!isArr(c.patterns)) err(w, "patterns debe ser array");
  else
    c.patterns.forEach((p) => {
      if (!patternIds.has(p))
        err(w, `pattern "${p}" no existe en patterns.json`);
    });

  // BIBLIOGRAFÍA: todo caso debe citar al menos una fuente; url bien formada
  if (!isArr(c.sources) || c.sources.length === 0) {
    err(w, "sources obligatorio (bibliografía): al menos una fuente");
  } else {
    c.sources.forEach((s, j) => {
      if (!isStr(s.name)) err(`${w}.sources[${j}]`, "name obligatorio (string)");
      if (s.url !== undefined && !isHttpUrl(s.url))
        err(`${w}.sources[${j}]`, `url malformada: "${s.url}"`);
    });
  }
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
