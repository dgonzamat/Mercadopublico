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
