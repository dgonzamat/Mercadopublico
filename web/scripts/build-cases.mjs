#!/usr/bin/env node
// Build-time aggregator: reads data/cases/*.json (one file per case)
// and writes data/cases.json (the bundle imported by lib/data.ts).
// Source of truth = data/cases/. The bundle is generated artifact.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregateJsonFiles } from "./lib/aggregate-json.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.join(__dirname, "..", "data", "cases");
const outFile = path.join(__dirname, "..", "data", "cases.json");

const cases = aggregateJsonFiles(casesDir, outFile);
console.log(`build-cases: aggregated ${cases.length} cases → data/cases.json`);

// Client bundle: same corpus WITHOUT the heavy narrative prose. Client
// components (map, explorer) never render whatHappened/whyMatters, but importing
// the full cases.json into them shipped ~2.6 MB (68%) of dead weight to the
// browser and wrecked LCP. lib/dataClient.ts imports this slim file; server
// components keep using the full cases.json via lib/data.ts.
const HEAVY_PROSE = ["whatHappened", "whatHappened_en", "whyMatters", "whyMatters_en"];
const clientCases = cases.map((c) => {
  const slim = { ...c };
  for (const k of HEAVY_PROSE) delete slim[k];
  return slim;
});
const clientOutFile = path.join(__dirname, "..", "data", "cases-client.json");
fs.writeFileSync(clientOutFile, JSON.stringify(clientCases) + "\n");
console.log(`build-cases: client bundle (no prose) → data/cases-client.json`);

// Atlas bundle: SOLO los campos que el mapa (WorldMap, client) renderiza —
// coords + un puñado de labels. cases-client.json sigue pesando ~1.5 MB porque
// conserva summary/evidence/sources/posterior/name_en…, y el mapa no usa NADA
// de eso: solo id (nav), name+country_name+year+tier+probability (tooltip/filtro)
// y location (marcador). Esta proyección diminuta (~60 KB) es lo que
// lib/atlasData.ts embarca a /atlas, en vez de arrastrar el corpus client entero.
const ATLAS_FIELDS = ["id", "name", "tier", "country", "country_name", "year_start", "probability"];
const atlasPoints = cases
  .filter((c) => c.location && typeof c.location.lat === "number")
  .map((c) => {
    const p = { location: { lat: c.location.lat, lng: c.location.lng } };
    for (const k of ATLAS_FIELDS) p[k] = c[k];
    return p;
  });
const atlasOutFile = path.join(__dirname, "..", "data", "atlas-points.json");
fs.writeFileSync(atlasOutFile, JSON.stringify(atlasPoints) + "\n");
console.log(`build-cases: atlas points (${atlasPoints.length}) → data/atlas-points.json`);

// Site stats: a tiny JSON of the aggregate corpus counts that lib/siteStats.ts
// exposes as STATS. It exists so siteStats — which MobileNav (a CLIENT component
// in the global layout) imports for a single number — does NOT pull the full
// corpus into a client chunk shipped on every page. Without this, importing
// cases/patterns/etc. into siteStats bundled the entire 4 MB corpus site-wide.
const dataDir = path.join(__dirname, "..", "data");
const readArr = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf-8"));
const patterns = readArr("patterns.json");
const frameworks = readArr("frameworks.json");
const researchers = readArr("researchers.json");
// Ancla DELIBERADA de la era institucional moderna (Roswell/Twining, 1947) —
// NO es el mínimo del corpus y NO debe derivarse de él. El corpus incluye ~19
// antecedentes históricos anteriores (nuremberg-1561, utsuro-bune-1803,
// mystery-airships-1896, foo-fighters-1944, ghost-rockets-1946…), visibles en
// /cases y en la columna «‹1940» de /cobertura. El copy narra "1947–2026" como
// la secuencia institucional moderna (page.tsx/about.tsx atan 1947→Roswell),
// con esos casos como profundidad histórica, no como parte del rango titular.
// Derivar `startYear` del min (1561) rompería ese framing — no "corregir".
const CORPUS_START_YEAR = 1947;
const corpusEndYear = Math.max(...cases.map((c) => c.year_start));
const siteStats = {
  cases: cases.length,
  patterns: patterns.length,
  frameworks: frameworks.length,
  researchers: researchers.length,
  tierS: cases.filter((c) => c.tier === "S").length,
  tierA: cases.filter((c) => c.tier === "A").length,
  tierB: cases.filter((c) => c.tier === "B").length,
  countries: new Set(cases.map((c) => c.country)).size,
  startYear: CORPUS_START_YEAR,
  endYear: corpusEndYear,
  years: corpusEndYear - CORPUS_START_YEAR,
};
const statsOutFile = path.join(dataDir, "site-stats.json");
fs.writeFileSync(statsOutFile, JSON.stringify(siteStats, null, 2) + "\n");
console.log(`build-cases: site stats → data/site-stats.json`);
