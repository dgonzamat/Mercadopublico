#!/usr/bin/env node
/**
 * probe-hits-report.mjs — resumen de lo que las sondas frenaron en local
 * (data/probe-hits.jsonl, que escribe scripts/lib/probe-log.mjs).
 * Uso: npm run sondas:frenos [-- --desde AAAA-MM-DD]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LOG = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "probe-hits.jsonl");
const i = process.argv.indexOf("--desde");
const desde = i > -1 ? process.argv[i + 1] : "";
const rows = fs.existsSync(LOG)
  ? fs.readFileSync(LOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.date >= desde)
  : [];
const by = new Map();
for (const r of rows) {
  const k = `${r.probe} · ${r.rule}`;
  const e = by.get(k) ?? { n: 0, days: new Set(), last: "" };
  e.n++;
  e.days.add(r.date);
  if (r.date > e.last) e.last = r.date;
  by.set(k, e);
}
console.log(`Frenos de sondas en local${desde ? ` desde ${desde}` : ""}: ${rows.length} registros, ${by.size} reglas`);
for (const [k, e] of [...by].sort((a, b) => b[1].n - a[1].n))
  console.log(`  ${String(e.n).padStart(4)}  en ${String(e.days.size).padStart(3)} días  · último ${e.last}  · ${k}`);
if (!rows.length) console.log("  (sin registros todavía)");
