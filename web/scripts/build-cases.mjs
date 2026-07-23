#!/usr/bin/env node
// Build-time aggregator: reads data/cases/*.json (one file per case)
// and writes data/cases.json (the bundle imported by lib/data.ts).
// Source of truth = data/cases/. The bundle is generated artifact.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.join(__dirname, "..", "data", "cases");
const outFile = path.join(__dirname, "..", "data", "cases.json");

const files = fs.readdirSync(casesDir).filter((f) => f.endsWith(".json"));
const cases = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8")))
  .sort((a, b) => a.num - b.num);

fs.writeFileSync(outFile, JSON.stringify(cases, null, 2) + "\n");
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
