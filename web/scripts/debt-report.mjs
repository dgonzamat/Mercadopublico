#!/usr/bin/env node
// Informe de deuda: TODA cifra sale del repo en el momento de correrlo.
// La deuda que no se puede medir (decisiones del dueño, rediseño, bloqueos)
// vive en data/debt-manual.json, sin cifras: una cifra escrita a mano en una
// lista de deuda caduca en silencio y se sigue leyendo como vigente.
//
// Uso (desde web/): node scripts/debt-report.mjs   ·   npm run deuda
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CASES_DIR = path.join(ROOT, "data/cases");
const cases = fs
  .readdirSync(CASES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf8")));

const TIERS = ["S", "A", "B"];
const byTier = (list) => TIERS.map((t) => `${t}×${list.filter((c) => c.tier === t).length}`).join(" ");

// 1 · Lo que mide la auditoría (sus WARN, tal como ella los declara).
console.log("\n═══ Deuda medida · " + new Date().toISOString().slice(0, 10) + " ═══\n");
const audit = spawnSync(process.execPath, [path.join(ROOT, "scripts/audit-consistency.mjs")], {
  cwd: ROOT,
  encoding: "utf8",
});
const auditOut = audit.stdout || "";
const warns = auditOut
  .split("\n")
  .filter((l) => /\b(E\d+[a-z]?|M\d+)\b/.test(l) && !/^\s*✓/.test(l))
  .map((l) => l.trim().replace(/^\S+:\d+\s+/, ""));
const totals = auditOut.match(/ERRORS:\s*\d+\s+WARNS:\s*\d+(\s+NOTES:\s*\d+)?/);
console.log("Auditoría (audit-consistency): " + (totals ? totals[0] : "sin resumen — revisar la sonda"));
for (const w of warns) console.log("  · " + (w.length > 220 ? w.slice(0, 217) + "…" : w));

// 2 · Muletillas de prosa (brief docs/brief-prosa.md), por ficha y tier.
const PROSE_FIELDS = ["summary", "whatHappened", "whyMatters"];
const prose = (c) =>
  [
    ...PROSE_FIELDS.flatMap((k) => [c[k], c[`${k}_en`]]),
    ...(c.evidence || []),
    ...(c.evidence_en || []),
  ]
    .filter(Boolean)
    .join("\n");
const MARKERS = {
  "«el corpus»": /\b(?:el|este|del|al) corpus\b|\bthe corpus\b/i,
  "«honesto»": /\bhonest/i,
  "«Es uno de los»": /\bEs uno de los\b|\bIt is one of the\b/,
};
console.log("\nProsa · fichas con muletillas (C3 = Tier A, C4/C5 = Tier B):");
const anyHit = cases.filter((c) => Object.values(MARKERS).some((re) => re.test(prose(c))));
console.log(`  total: ${anyHit.length} fichas · ${byTier(anyHit)}`);
for (const [label, re] of Object.entries(MARKERS)) {
  const hit = cases.filter((c) => re.test(prose(c)));
  console.log(`  ${label}: ${hit.length} · ${byTier(hit)}`);
}

// 3 · U11: rótulos de licencia sin traducción inglesa en lib/license.ts
// (el sitio EN los mostraría en español) o con inglés dentro del dato español.
const docsOf = (c) => [...(c.documents || []), c.primaryDocument, c.featuredDoc].filter(Boolean);
const licenseSrc = fs.readFileSync(path.join(ROOT, "lib/license.ts"), "utf8");
const translated = new Set([...licenseSrc.matchAll(/^\s+"((?:[^"\\]|\\.)*)":/gm)].map((m) => JSON.parse(`"${m[1]}"`)));
const researchers = JSON.parse(fs.readFileSync(path.join(ROOT, "data/researchers.json"), "utf8"));
const labels = [
  ...cases.flatMap((c) => docsOf(c).map((d) => d.license)),
  ...researchers.map((r) => r.photo_license),
].filter(Boolean);
const untranslated = [...new Set(labels.filter((l) => !/^CC/.test(l) && !translated.has(l)))];
const englishInEs = [...new Set(labels.filter((l) => /\bwork\b|Public domain/.test(l)))];
console.log(`\nU11 · licencias: ${untranslated.length} rótulos sin traducción en lib/license.ts, ${englishInEs.length} con inglés en el dato español`);
for (const l of [...untranslated, ...englishInEs]) console.log(`  · ${l}`);

// 4 · Deuda que no se mide: estado escrito, sin cifras.
const manualPath = path.join(ROOT, "data/debt-manual.json");
const manual = JSON.parse(fs.readFileSync(manualPath, "utf8"));
console.log("\nDeuda no medible (data/debt-manual.json):");
for (const group of manual) {
  console.log(`  ${group.group}`);
  for (const it of group.items) {
    console.log(`    ${it.id} · ${it.title} — ${it.state}`);
    // Una cifra de corpus escrita aquí caducaría: se mide en las secciones de arriba.
    if (/\d+\s*(?:fichas|casos|%|MB)/.test(`${it.title} ${it.state}`))
      console.log(`      ⚠ cifra escrita a mano en ${it.id}: medirla en este script en vez de copiarla`);
  }
}
console.log("");
