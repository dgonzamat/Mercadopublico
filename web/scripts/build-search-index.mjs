#!/usr/bin/env node
/**
 * Build-time generation of the client-side search index.
 *
 * Reads data/cases/*.json + data/researchers.json + data/patterns.json +
 * data/frameworks.json and emits a unified search payload at
 * public/search-index.json. Each entry carries a `type` discriminator so
 * SiteSearch can route, badge, and rank by kind. A small set of static
 * section pages (probabilidades, atlas, about…) is indexed too so they
 * are reachable from search, not just the global nav.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const casesDir = path.join(dataDir, "cases");
const researchersFile = path.join(dataDir, "researchers.json");
const outFile = path.join(__dirname, "..", "public", "search-index.json");

// ── LOCALIZACIÓN DE country_name ─────────────────────────────────────────
// El mapa vive en lib/i18n-geo.ts y lo consume el sitio; este script es
// node-plain y no puede importar TypeScript, así que lo PARSEA en vez de
// duplicarlo — un segundo diccionario sería un segundo origen de verdad.
// Si el parseo no rinde nada, aborta: una sonda ciega no es una sonda verde.
const geoSrc = fs.readFileSync(
  path.join(__dirname, "..", "lib", "i18n-geo.ts"),
  "utf-8",
);
const COUNTRY_EN = Object.fromEntries(
  [...geoSrc.matchAll(/^\s*"?([^"\n:]+?)"?:\s*"([^"]+)",\s*$/gm)].map(
    (m) => [m[1].trim(), m[2]],
  ),
);
if (Object.keys(COUNTRY_EN).length < 50) {
  console.error(
    `build-search-index: COUNTRY_EN sólo rindió ${Object.keys(COUNTRY_EN).length} entradas al parsear lib/i18n-geo.ts. ` +
      "El formato del mapa cambió y la localización de países quedaría silenciosamente en español. Abortando.",
  );
  process.exit(1);
}
const countryEn = (name) => COUNTRY_EN[name] ?? name;

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
    name_en: c.name_en,
    subtitle: c.country_name,
    subtitle_en: countryEn(c.country_name),
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
  subtitle_en: r.section_label_en || "Researcher",
  meta:
    [r.born ? String(r.born) : null, r.death ? `–${r.death}` : null]
      .filter(Boolean)
      .join("") +
    (r.framework ? ` · ${r.framework}` : ""),
  flag: "",
  year: r.born ? String(r.born) : "",
  year_start: r.born || 0,
  summary: r.bio_short || r.credentials || "",
  summary_en: r.bio_short_en || r.credentials_en || "",
  keywords: [r.credentials, r.framework, r.section_label]
    .filter(Boolean)
    .join(" "),
}));

// ── POSTS ────────────────────────────────────────────────────────────────
const postsDir = path.join(dataDir, "posts");
const postsData = fs.existsSync(postsDir)
  ? fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), "utf-8")))
  : [];

const postEntries = postsData.map((p) => ({
  type: "post",
  id: p.id, // href → /blog/{id}
  num: 0,
  name: p.title,
  name_en: p.title_en,
  subtitle: "Blog",
  subtitle_en: "Blog",
  meta: p.date || "",
  flag: "",
  year: p.date ? p.date.slice(0, 4) : "",
  year_start: p.date ? Number(p.date.slice(0, 4)) : 0,
  summary: p.summary || "",
  summary_en: p.summary_en,
  keywords: (p.tags || []).join(" "),
}));

// ── PATTERNS ─────────────────────────────────────────────────────────────
const patternsData = JSON.parse(
  fs.readFileSync(path.join(dataDir, "patterns.json"), "utf-8"),
);

const patternEntries = patternsData.map((p) => ({
  type: "pattern",
  id: p.letter, // href → /patterns/{letter}
  num: 0,
  name: p.name,
  name_en: p.name_en,
  subtitle: `Patrón ${p.id}`,
  subtitle_en: `Pattern ${p.id}`,
  meta: "",
  flag: "",
  year: "",
  year_start: 0,
  summary: p.description,
  summary_en: p.description_en,
  keywords: [p.id, p.name_en].filter(Boolean).join(" "),
}));

// ── FRAMEWORKS ───────────────────────────────────────────────────────────
const frameworksData = JSON.parse(
  fs.readFileSync(path.join(dataDir, "frameworks.json"), "utf-8"),
);

const frameworkEntries = frameworksData.map((f) => ({
  type: "framework",
  id: f.id, // href → /frameworks#{id}
  num: 0,
  name: f.name,
  name_en: f.name_en,
  subtitle: f.author || "Marco teórico",
  subtitle_en: f.author || "Theoretical framework",
  meta: "",
  flag: "",
  year: "",
  year_start: 0,
  summary: f.one_sentence_es,
  summary_en: f.one_sentence_en,
  keywords: [f.name_en, f.origin].filter(Boolean).join(" "),
}));

// ── STATIC PAGES ─────────────────────────────────────────────────────────
const pageEntries = [
  {
    id: "probabilidades",
    name: "Probabilidades",
    name_en: "Probabilities",
    subtitle: "Narrativas · modelo MECE",
    subtitle_en: "Narratives · MECE model",
    summary: "Las seis narrativas MECE y la partición comparable del corpus.",
    summary_en: "The six MECE narratives and the comparable corpus partition.",
    keywords: "narrativas explicaciones MECE particion comparable probabilidad",
  },
  {
    id: "atlas",
    name: "Atlas",
    name_en: "Atlas",
    subtitle: "Mapa global",
    subtitle_en: "Global map",
    summary: "Mapa global de los casos.",
    summary_en: "Global map of the cases.",
    keywords: "mapa map geografia geography",
  },
  {
    id: "about",
    name: "Metodología",
    name_en: "Methodology",
    subtitle: "Cómo se construyó",
    subtitle_en: "How it was built",
    summary: "Cómo se construyó el corpus.",
    summary_en: "How the corpus was built.",
    keywords: "metodo method methodology criterios",
  },
  {
    id: "resumen",
    name: "Resumen",
    name_en: "Summary",
    subtitle: "Lectura 10 min",
    subtitle_en: "10-min read",
    summary: "Lectura de 10 minutos.",
    summary_en: "10-minute read.",
    keywords: "resumen summary overview",
  },
  {
    id: "fuentes",
    name: "Fuentes",
    name_en: "Sources",
    subtitle: "Bibliografía",
    subtitle_en: "Bibliography",
    summary: "Bibliografía y fuentes primarias.",
    summary_en: "Bibliography and primary sources.",
    keywords: "bibliografia sources FOIA",
  },
  {
    id: "patterns",
    name: "Patrones",
    name_en: "Patterns",
    subtitle: "Índice de patrones",
    subtitle_en: "Pattern index",
    summary: "Índice de patrones recurrentes del corpus.",
    summary_en: "Index of recurring corpus patterns.",
    keywords: "patrones patterns",
  },
  {
    id: "frameworks",
    name: "Marcos teóricos",
    name_en: "Theoretical frameworks",
    subtitle: "Marcos comparados",
    subtitle_en: "Frameworks compared",
    summary: "Marcos teóricos comparados.",
    summary_en: "Theoretical frameworks compared.",
    keywords: "marcos frameworks teorias theories",
  },
  {
    id: "blog",
    name: "Blog",
    name_en: "Blog",
    subtitle: "El cuaderno",
    subtitle_en: "The notebook",
    summary: "Notas de método y avances del corpus.",
    summary_en: "Method notes and corpus progress.",
    keywords: "blog notas notebook posts",
  },
  {
    id: "contact",
    name: "Contacto",
    name_en: "Contact",
    subtitle: "Contacto",
    subtitle_en: "Contact",
    summary: "Correcciones, fuentes y casos faltantes.",
    summary_en: "Corrections, sources and missing cases.",
    keywords: "contacto contact email issue github",
  },
].map((p) => ({
  type: "page",
  id: p.id, // href → /{id}
  num: 0,
  name: p.name,
  name_en: p.name_en,
  subtitle: p.subtitle,
  subtitle_en: p.subtitle_en,
  meta: "",
  flag: "",
  year: "",
  year_start: 0,
  summary: p.summary,
  summary_en: p.summary_en,
  keywords: p.keywords,
}));

// ── EMIT ─────────────────────────────────────────────────────────────────
const index = [
  ...caseEntries,
  ...researcherEntries,
  ...postEntries,
  ...patternEntries,
  ...frameworkEntries,
  ...pageEntries,
];
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(index));

const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(
  `build-search-index: ${caseEntries.length} cases + ${researcherEntries.length} researchers + ${postEntries.length} posts + ${patternEntries.length} patterns + ${frameworkEntries.length} frameworks + ${pageEntries.length} pages → public/search-index.json (${sizeKb} KB)`,
);
