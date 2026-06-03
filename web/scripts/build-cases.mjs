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
