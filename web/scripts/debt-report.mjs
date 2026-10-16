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
  // Autorreferencias al archivo, no «corpus» como conjunto de datos de una
  // fuente («corpus de video de Yalman»): el primer barrido solo miraba «el
  // corpus»/«the corpus» y dejó ~45 fichas con «this corpus», «un corpus
  // calibrado» o «Ireland's first corpus case» (oct 2026).
  "«el corpus»": /\b(?:el|este|del|al|mismo) corpus\b|\b(?:the|this|same|calibrated|institutional|PURSUE) corpus\b|\bun corpus (?:calibrado|que|donde|serio)\b|\ba corpus (?:that|where|tracking)\b|\bcorpus (?:case|cases|file|pattern)\b/i,
  "nota de sesión": /\besta (?:misma )?sesión\b|\bthis (?:same )?session\b|\bthis session's\b/i,
  "«honesto»": /\bhonest/i,
  "«Es uno de los»": /\bEs uno de los\b|\bIt is one of the\b/,
};
// Lo citado es de la fuente, y la sinceridad de un testigo («hombre honesto»,
// «testigos honestos», «reporta honestamente lo que vio») es un dato del caso:
// ninguno es la muletilla del redactor que alaba su propia lectura.
const SINCERE = /hombre honesto|honest man|testigos honestos|honest witnesses|honestamente lo que vio|honestly reports?|describe it honestly/gi;
const unquotedProse = (c) => prose(c).replace(/«[^»]*»|"[^"]*"|“[^”]*”|(?<![\w])'[^']*'(?![\w])/g, "").replace(SINCERE, "");
console.log("\nProsa · fichas con muletillas (C3 = Tier A, C4/C5 = Tier B):");
const anyHit = cases.filter((c) => Object.values(MARKERS).some((re) => re.test(unquotedProse(c))));
console.log(`  total: ${anyHit.length} fichas · ${byTier(anyHit)}`);
for (const [label, re] of Object.entries(MARKERS)) {
  const hit = cases.filter((c) => re.test(unquotedProse(c)));
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

// 4 · Densidad e inconsistencias en TODAS las fichas (no en una de muestra).
// Ordenadas de menor a mayor coste de arreglo.
const PROSE = ["summary", "whatHappened", "whyMatters"];
const joinProse = (c, sfx) => [...PROSE.map((k) => c[k + sfx] ?? ""), ...(c["evidence" + sfx] ?? [])].join(" ");
const actorLinked = new Set([...fs.readFileSync(path.join(ROOT, "lib/researcherCases.ts"), "utf8").matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));
function soloContexto(c) {
  const d = [...(c.documents ?? []), c.primaryDocument, c.featuredDoc].filter(Boolean);
  return d.length > 0 && d.every((x) => /^(Contexto|Context)\b/.test(x.title ?? ""));
}
// R6 agotado: barrido hecho y sin documento primario posible (relato en libro o
// video, sin registro oficial, o archivo sin digitalizar). Detalle y fecha de
// cada barrido en docs/registros.md. Si una de estas fichas consigue documento,
// sale sola de la cuenta.
const R6_AGOTADO = new Set([
  "belgian-wave-1989", "naval-chile-2014", "west-freugh-1957", "cluj-barnea-1968", "robert-taylor-livingston-1979",
  "american-cosmic-2017", "boyd-bushman-2014", "buff-ledge-1968", "cape-girardeau-1941", "communion-1985",
  "ellsworth-woods-1977", "skinny-bob-abbott-2026",
  "bianchi-magallanes-2012", "chulucanas-2001", "fh227-pluna-1975", "mexico-eclipse-1991", "pucallpa-2008", "lead-masks-niteroi-1966",
]);
const checks = [
  // Convención: «» en español (con "" dentro de «» si hay cita anidada) y "" en inglés.
  ["comillas españolas «» en el texto inglés (prosa y fuente del porqué)", (c) => joinProse(c, "_en").includes("«") || (c.classBasis?.source && (c.classBasis.source_en ?? c.classBasis.source).includes("«"))],
  ["comillas rectas sueltas en el texto español", (c) => /(?<![\w\d])"[A-Za-zÁÉÍÓÚáéíóúñ]/.test(joinProse(c, "").replace(/«[^«»]*(?:«[^«»]*»[^«»]*)*»/g, ""))],
  ["evidencia con más de 8 ítems (plegada en la ficha desde el 6.º)", (c) => (c.evidence ?? []).length > 8],
  ["porqué de más de 700 caracteres (plegado en la ficha)", (c) => (c.classBasis?.es ?? "").length > 700],
  ["resumen de más de 700 caracteres (plegado en la ficha)", (c) => (c.summary ?? "").length > 700],
  // Un documento se justifica si respalda un caso (relatedCases) o un actor
  // (lib/researcherCases.ts); si no hace ninguna de las dos cosas, sobra.
  ["documentos que no respaldan ningún caso ni actor", (c) => c.category === "document" && !(c.relatedCases ?? []).length && !actorLinked.has(c.id)],
  // Una foto de contexto cumple E21 (la ficha tiene algo visual) pero no es
  // un documento del caso: esto mide cuántas fichas no tienen ninguno. Las de
  // R6_AGOTADO se barrieron sin resultado (detalle en docs/registros.md): se
  // cuentan aparte para separar «no lo tenemos» de «no se puede tener».
  ["sin documento del caso (solo foto de contexto)", (c) => soloContexto(c) && !R6_AGOTADO.has(c.id)],
  ["  · de ellas ya barridas sin documento posible", (c) => soloContexto(c) && R6_AGOTADO.has(c.id)],
];
console.log("\nFichas · densidad e inconsistencias (de menor a mayor coste):");
for (const [label, fn] of checks) {
  const hit = cases.filter(fn);
  console.log(`  ${label}: ${hit.length} · ${byTier(hit)}${hit.length && hit.length <= 12 ? " — " + hit.map((c) => c.id).join(", ") : ""}`);
}

// 5 · IA slop: huellas de texto generado, en las fichas y en la interfaz.
const SLOP = {
  "fórmula «no es X, es/sino Y»": /\bno es (?:solo |sólo |simplemente )?[^.;:]{1,60}?, (?:sino|es) |\bit is not [^.;:]{1,60}?, (?:but|it is) /i,
  "raya (—) en la prosa": /—/,
  "intensificador vacío (crucial, clave, fundamental…)": /\b(?:crucial|cabe destacar|vale la pena|sin duda|en definitiva|fundamental(?:mente)?|crucially|it is worth noting|notably|undoubtedly)\b/i,
};
console.log("\nIA slop · prosa de las fichas:");
// Lo citado entre comillas es de la fuente, no del redactor («sin duda» en
// boca de un informe de 1951 no es relleno): se excluye, como en E7b.
const unquoted = (t) => t.replace(/«[^»]*»|"[^"]*"|“[^”]*”|(?<![\w])'[^']*'(?![\w])/g, "");
// Fichas cuya fórmula «no es X, sino Y» se revisó y es un contraste factual
// (el expediente no es de Blue Book, sino un informe de accidente), no un
// recurso retórico: no son deuda. Si una deja de usarla, se avisa.
const FORMULA_REVIEWED = new Set([
  "allagash-1976", "alma-ata-1991", "colorado-law-enforcement-2023", "deception-island-1965",
  "detroit-dome-object-1958", "eight-pointed-star-2013",
  "ellsworth-woods-1977", "kinross-incident-1953", "trancas-1963",
  "uso-formation-nonlinear-edit-2024",
]);
for (const [label, re] of Object.entries(SLOP)) {
  const all = cases.filter((c) => re.test(unquoted(prose(c))));
  const reviewed = label.startsWith("fórmula") ? all.filter((c) => FORMULA_REVIEWED.has(c.id)) : [];
  const hit = all.filter((c) => !reviewed.includes(c));
  console.log(`  ${label}: ${hit.length} fichas · ${byTier(hit)}${reviewed.length ? ` (+${reviewed.length} revisadas: contraste factual)` : ""}`);
  if (label.startsWith("fórmula"))
    for (const id of FORMULA_REVIEWED) if (!all.some((c) => c.id === id)) console.log(`    ⚠ ${id} ya no usa la fórmula: sácala de FORMULA_REVIEWED`);
}
const srcFiles = (dir) => fs.readdirSync(path.join(ROOT, dir), { recursive: true }).filter((f) => /\.tsx$/.test(f)).map((f) => path.join(dir, f));
const ui = [...srcFiles("app"), ...srcFiles("components")].map((f) => [f, fs.readFileSync(path.join(ROOT, f), "utf8")]);
const uiStrings = (src) => [...src.matchAll(/\b(?:es|en)=(?:"([^"]{12,})"|\{`([^`]{12,})`\})/g)].map((m) => m[1] ?? m[2]);
const uiChecks = [
  ["textos de interfaz con raya (—)", (t) => /—/.test(t)],
  ["textos de interfaz con fórmula «no es X, es Y»", (t) => SLOP["fórmula «no es X, es/sino Y»"].test(t)],
  ["textos de interfaz con intensificador vacío", (t) => SLOP["intensificador vacío (crucial, clave, fundamental…)"].test(t)],
];
console.log("\nIA slop · textos de la interfaz (app/ y components/):");
for (const [label, fn] of uiChecks) {
  const hits = ui.flatMap(([f, src]) => uiStrings(src).filter(fn).map(() => f));
  const files = [...new Set(hits)];
  console.log(`  ${label}: ${hits.length} en ${files.length} archivos${files.length && files.length <= 6 ? " — " + files.join(", ") : ""}`);
}

// 6 · UX/UI: densidad de cada página construida (requiere out/ de un build).
const OUT = path.join(ROOT, "out");
console.log("\nUX/UI · densidad por página (out/):");
if (!fs.existsSync(OUT)) {
  console.log("  ciega: no hay out/ (corre npm run build)");
} else {
  const pages = [];
  for (const f of fs.readdirSync(OUT, { recursive: true })) {
    if (!/index\.html$/.test(f) || /^es\//.test(f) || /^cases\/.+\//.test(f) || /^(researchers|patterns|blog|frameworks|entities|probabilidades)\/.+\//.test(f)) continue;
    const html = fs.readFileSync(path.join(OUT, f), "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    const words = main.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const upper = (main.match(/class="[^"]*\buppercase\b/g) ?? []).length;
    pages.push({ page: "/" + f.replace(/index\.html$/, ""), words, upper, kb: Math.round(fs.statSync(path.join(OUT, f)).size / 1024) });
  }
  const heavy = pages.filter((p) => p.kb > 1500).sort((a, b) => b.kb - a.kb);
  // /cases/ es el índice completo: su filtro y su búsqueda trabajan en el
  // navegador sobre todas las fichas, y paginarlo los dejaría ciegos al resto
  // (decisión del dueño, 16 oct 2026, de dejarla larga).
  const WORDY_OK = new Set(["/cases/"]);
  const wordy = pages.filter((p) => p.words > 2500 && !WORDY_OK.has(p.page)).sort((a, b) => b.words - a.words);
  const shouty = pages.filter((p) => p.upper > 10).sort((a, b) => b.upper - a.upper);
  const fmt = (l, k) => l.slice(0, 6).map((p) => `${p.page} (${p[k]})`).join(", ");
  console.log(`  páginas de más de 1,5 MB: ${heavy.length}${heavy.length ? " — " + fmt(heavy, "kb") : ""}`);
  console.log(`  páginas de más de 2.500 palabras: ${wordy.length}${wordy.length ? " — " + fmt(wordy, "words") : ""}`);
  console.log(`  páginas con más de 10 rótulos en mayúsculas: ${shouty.length}${shouty.length ? " — " + fmt(shouty, "upper") : ""}`);
}

// 7 · Deuda que no se mide: estado escrito, sin cifras.
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
