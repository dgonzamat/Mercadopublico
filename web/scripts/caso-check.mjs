#!/usr/bin/env node
// caso-check.mjs — autochequeo de una ficha NUEVA o editada ANTES de lanzar al
// verificador independiente. Informa, no bloquea (salvo `num` repetido).
//
// Por qué existe: en las cinco fichas de abducción de nov 2026 el verificador
// halló errores de cinco clases (ver docs/hallazgos-verificacion.md). Dos de
// ellas se pueden vigilar con un patrón de texto (afirmaciones de ausencia y
// léxico de España) y otra con una cuenta (las cifras de ES y EN deben ser las
// mismas). Lo demás (atribución, omisiones) solo lo ve un lector que abra la
// fuente: este script no lo sustituye, le quita trabajo.
//
// Uso (desde web/, node plano, sin node_modules):
//   node scripts/caso-check.mjs                 # fichas nuevas o editadas frente a origin/main
//   node scripts/caso-check.mjs id1 id2         # esas fichas
//   node scripts/caso-check.mjs --all           # todo el corpus (para medir falsos positivos)
//   node scripts/caso-check.mjs --strict ...    # exit 1 si hay ERROR (num repetido)
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(WEB, "data", "cases");
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const all = args.includes("--all");
const ids = args.filter((a) => !a.startsWith("--"));

const sh = (cmd) => {
  try { return execSync(cmd, { cwd: WEB, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch { return ""; }
};

// ─── qué fichas mirar ───────────────────────────────────────────────────────
let targets;
if (ids.length) targets = ids;
else if (all) targets = fs.readdirSync(CASES).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
else {
  const changed = sh("git diff --name-only origin/main -- data/cases").split("\n");
  const untracked = sh("git ls-files --others --exclude-standard -- data/cases").split("\n");
  targets = [...new Set([...changed, ...untracked])].filter((f) => f.endsWith(".json")).map((f) => path.basename(f, ".json"));
}
if (!targets.length) { console.log("caso-check: ninguna ficha nueva o editada frente a origin/main."); process.exit(0); }

// ─── reglas ─────────────────────────────────────────────────────────────────
// 1. Afirmaciones de ausencia: la causa de 4 de 5 fichas con hallazgo. Una frase
//    «nadie halló…» es un resultado de búsqueda disfrazado de hecho. No es un error:
//    obliga a preguntarse qué búsqueda la respalda y a escribir «no lo tenemos».
const AUS_ES = /[^.]*\b(no consta(n)?|no se (ha |han )?(hall|encontr)\w*|no hemos (hall|encontr)\w*|no hay (ning[uú]n|ninguna) (registro|an[aá]lisis|documento|prensa|fuente)|ninguna fuente|no existe(n)? (ning|registro))[^.]*\./gi;
const AUS_EN = /[^.]*\b(no record (from|of)|has not been found|have not been found|we have found no|we have not found|is no (record|independent|evidence from)|no independent (analysis|examination))\b[^.]*\./gi;
// 2. Léxico de España y voz del redactor (la guía /redaccion lo prohíbe).
const ESPANA = /\b(coches?|ordenadores?|aparcar|aparcad[oa]s?|vaqueros|rueda de prensa|m[oó]viles?|conducir un coche)\b/gi;
const VOZ_ES = /\b(cito|citamos|hemos|este expediente|esta ficha|nuestro an[aá]lisis|el corpus)\b/gi;
const VOZ_EN = /\b(I cite|we cite|this file|this entry|our analysis|the corpus)\b/gi;
// 3. Párrafos largos (E59 corta en 900; aquí se avisa antes).
const MAX_PARA = 880;

// Cifras comparables: se quitan las horas (18:35 / 6:35 p.m.) y las magnitudes con
// unidad, que cambian de número al pasar de un sistema a otro (30 m = 100 feet).
const UNIDADES = /\d[\d.,]*\s?(?:m|km|kg|pies|pie|feet|ft|yardas|yards|millas|miles|metros|meters|kil[oó]metros|kilometers|libras|pounds|°[CF]|grados|degrees)\b/gi;
const num = (t) => (t.replace(/\d{1,2}:\d{2}(\s?[ap]\.m\.)?/gi, " ").replace(UNIDADES, " ").match(/\d[\d.,]*\d/g) || []).map((n) => n.replace(/[.,]/g, ""));
const strip = (t) => (t || "").replace(/«[^»]*»|"[^"]*"|\[\[[^\]]*\]\]/g, "«…»");
const multiset = (a) => a.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});

const maxRemote = (() => {
  const files = sh("git ls-tree -r origin/main --name-only").split("\n").filter((f) => /^web\/data\/cases\/.*\.json$/.test(f));
  if (!files.length) return null;
  let max = 0;
  for (const f of files) {
    try { max = Math.max(max, JSON.parse(sh(`git show origin/main:${f}`)).num); } catch {}
  }
  return max;
})();
const remoteIds = new Set(sh("git ls-tree -r origin/main --name-only").split("\n").filter((f) => /^web\/data\/cases\/.*\.json$/.test(f)).map((f) => path.basename(f, ".json")));

const tally = {};
const bump = (k) => (tally[k] = (tally[k] || 0) + 1);
let errors = 0;

for (const id of targets) {
  const file = path.join(CASES, id + ".json");
  if (!fs.existsSync(file)) { console.log(`✗ ${id}: no existe data/cases/${id}.json`); errors++; continue; }
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  const out = [];

  // ERROR: num que choca con origin/main (solo si la ficha aún no está en main)
  if (maxRemote !== null && !remoteIds.has(id) && c.num <= maxRemote) {
    out.push(["ERROR", "num", `num ${c.num} ya está ocupado o es anterior al máximo de origin/main (${maxRemote}); el siguiente libre es ${maxRemote + 1}`]);
    errors++; bump("num");
  }

  const es = [c.summary, c.whatHappened, c.whyMatters, ...(c.evidence || [])].filter(Boolean).join("\n\n");
  const en = [c.summary_en, c.whatHappened_en, c.whyMatters_en, ...(c.evidence_en || [])].filter(Boolean).join("\n\n");
  const esN = strip(es), enN = strip(en);

  // WARN: ausencia
  const aus = [...(esN.match(AUS_ES) || []), ...(enN.match(AUS_EN) || [])].map((s) => s.trim().replace(/\s+/g, " "));
  for (const s of aus) { out.push(["WARN", "ausencia", s.length > 170 ? s.slice(0, 170) + "…" : s]); bump("ausencia"); }
  // WARN: léxico de España
  for (const m of new Set(esN.match(ESPANA) || [])) { out.push(["WARN", "léxico", `«${m}» (vocabulario de España; la norma es latinoamericana)`]); bump("léxico"); }
  // WARN: voz del redactor
  for (const m of new Set([...(esN.match(VOZ_ES) || []), ...(enN.match(VOZ_EN) || [])])) { out.push(["WARN", "voz", `«${m}» (voz del redactor)`]); bump("voz"); }
  // WARN: paridad de cifras ES/EN (cuerpo largo)
  const body = (x, y) => [x, y].filter(Boolean).join("\n\n");
  const nEs = multiset(num(strip(body(c.whatHappened, c.whyMatters)))), nEn = multiset(num(strip(body(c.whatHappened_en, c.whyMatters_en))));
  const faltanEn = Object.keys(nEs).filter((k) => !(k in nEn) && k.length >= 3);
  const faltanEs = Object.keys(nEn).filter((k) => !(k in nEs) && k.length >= 3);
  if (faltanEn.length || faltanEs.length) {
    out.push(["WARN", "cifras", `solo en ES: [${faltanEn.slice(0, 8).join(", ")}] · solo en EN: [${faltanEs.slice(0, 8).join(", ")}] (misma cifra en los dos idiomas)`]);
    bump("cifras");
  }
  // WARN: párrafos largos
  for (const [k, t] of [["whatHappened", c.whatHappened], ["whyMatters", c.whyMatters], ["whatHappened_en", c.whatHappened_en], ["whyMatters_en", c.whyMatters_en]]) {
    const long = (t || "").split("\n\n").filter((p) => p.length > MAX_PARA).length;
    if (long) { out.push(["WARN", "párrafo", `${k}: ${long} párrafo(s) de más de ${MAX_PARA} caracteres`]); bump("párrafo"); }
  }

  console.log(`\n${id} (num ${c.num}, Tier ${c.tier}): ${out.length ? out.length + " aviso(s)" : "sin avisos"}`);
  for (const [lvl, k, msg] of out) console.log(`  ${lvl === "ERROR" ? "✗" : "·"} [${k}] ${msg}`);
}

console.log("\nResumen por categoría:", Object.keys(tally).length ? JSON.stringify(tally) : "sin avisos");
console.log("Recuerda: atribución y omisiones no se miden aquí; las revisa el verificador independiente.");
if (strict && errors) process.exit(1);
