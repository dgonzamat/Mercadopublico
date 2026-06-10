#!/usr/bin/env node
/**
 * Auditor permanente — corre antes de cada build (prebuild hook).
 *
 * Verifica que la copy editorial y los datos del corpus sigan consistentes
 * con la source-of-truth (lib/hypotheses.ts + STATS derivado del corpus).
 *
 * SALIDA:
 *   - exit 0  → todo OK o solo WARNINGs
 *   - exit 1  → al menos un ERROR (corta el build en CI)
 *
 * USO:
 *   node scripts/audit-consistency.mjs           # full audit
 *   node scripts/audit-consistency.mjs --warn    # nunca exit ≠ 0
 *
 * REGLAS:
 *   E1  Cada % editorial en /app debe coincidir con el prior canónico de
 *       la hipótesis o estar listado en STALE_OK / EDITORIAL_RANGES_OK.
 *   E2  Cada uso del prior debe estar tageado con la palabra "prior" en
 *       la misma línea, salvo overrides documentados.
 *   E3  Conteos hardcoded (78/77/79 etc.) en /app y /components deben
 *       coincidir con STATS calculado del corpus.
 *   E4  Términos prohibidos (drift de renames) no deben aparecer en /app
 *       ni en case rationales rendered to user.
 *   E5  evidenceContribution.hypothesisId debe existir en HYPOTHESES.
 *   E6  Cada caso Tier S debería declarar al menos un evidenceContribution
 *       (calibración manual; los demás auto-seedean de patterns).
 *   E7  Spanglish: los campos ES-first de casos (name, summary) no deben
 *       contener inglés descriptivo — el inglés vive en *_en. Heurística
 *       curada con exenciones para nombres propios y texto entre comillas.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// ─── 1. CARGA SOURCE-OF-TRUTH ────────────────────────────────────────────

const hypothesesPath = path.join(root, "lib", "hypotheses.ts");
const hypothesesSrc = fs.readFileSync(hypothesesPath, "utf-8");

/**
 * Parse priors from lib/hypotheses.ts via regex (TS parser would be overkill).
 * Matches `id: "x"` followed by `corpusPct: N` and optional `corpusPctOverride: N`.
 */
function parseHypotheses(src) {
  const out = [];
  const re = /\{\s*id:\s*"([^"]+)",[\s\S]*?corpusPct:\s*(\d+)(?:[\s\S]*?corpusPctOverride:\s*(\d+))?[\s\S]*?\},/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push({
      id: m[1],
      prior: Number(m[2]),
      override: m[3] !== undefined ? Number(m[3]) : undefined,
    });
  }
  return out;
}
const HYPOTHESES = parseHypotheses(hypothesesSrc);
if (HYPOTHESES.length < 6) {
  console.error("audit: failed to parse lib/hypotheses.ts (got", HYPOTHESES.length, "hypotheses)");
  process.exit(1);
}
const HYP_IDS = new Set(HYPOTHESES.map((h) => h.id));
const PRIOR_BY_ID = Object.fromEntries(HYPOTHESES.map((h) => [h.id, h.prior]));
const OVERRIDE_BY_ID = Object.fromEntries(
  HYPOTHESES.filter((h) => h.override !== undefined).map((h) => [h.id, h.override]),
);

// ─── 2. CARGA CORPUS ─────────────────────────────────────────────────────

const casesDir = path.join(root, "data", "cases");
const cases = fs
  .readdirSync(casesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8")));

const STATS = {
  cases: cases.length,
  countries: new Set(cases.map((c) => c.country)).size,
  tierS: cases.filter((c) => c.tier === "S").length,
  tierA: cases.filter((c) => c.tier === "A").length,
  tierB: cases.filter((c) => c.tier === "B").length,
  years: Math.max(...cases.map((c) => c.year_start)) - 1947,
};

// ─── 3. COMPUTE EFFECTIVE CALIBRATIONS (mirror lib/hypothesisMapping.ts) ─

// Must mirror lib/hypothesisMapping.ts STRENGTH_WEIGHT (log-odds Bayes-factor
// weights, NOT the legacy linear pressure points).
const STRENGTH_W = { minimal: 0.005, modest: 0.02, substantial: 0.05, "category-breaking": 0.15 };
const UMBRELLA = {
  "entidades-no-humanas": ["interdimensional", "ontologico-no-materialista", "tratado-greys"],
};

function pressureFor(hid) {
  const targets = [hid, ...(UMBRELLA[hid] || [])];
  let p = 0;
  for (const c of cases) {
    for (const e of c.evidenceContribution || []) {
      if (!targets.includes(e.hypothesisId)) continue;
      const w = STRENGTH_W[e.strength] ?? 0;
      p += e.direction === "supports" ? w : -w;
    }
  }
  return p;
}

function logit(p) { return Math.log(p / (1 - p)); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

const EFFECTIVE = {};
for (const h of HYPOTHESES) {
  if (h.override !== undefined) {
    EFFECTIVE[h.id] = h.override;
  } else {
    const priorClamped = Math.max(0.01, Math.min(0.99, h.prior / 100));
    const pct = sigmoid(logit(priorClamped) + pressureFor(h.id)) * 100;
    EFFECTIVE[h.id] = Math.max(1, Math.min(99, pct));
  }
}

// ─── 4. REGLAS DE DRIFT ──────────────────────────────────────────────────

/**
 * Percentages allowed to appear without matching a hypothesis prior.
 * Each entry is a documented editorial exception with a reason.
 */
const EDITORIAL_RANGES_OK = new Set([
  // Tier reliability bands in about/page.tsx (Hynek-derived, not hypothesis priors)
  "75", "85", "65", "50", "40",
  // Movement deltas in about/page.tsx (illustrative case-level shifts, not priors)
  "5", "2", "1", "0",
  // Pedagogical anti-pattern example in about/page.tsx (illustrative only)
  "48",
  // Paradigm note: "probabilidades pueden superar 100%"
  "100",
  // Vallée 1975 prediction year count (51 = 2026 - 1975, not a corpus stat)
  "51",
  // Universe pre-filter cite that doubles as Project Blue Book stat (= override 97)
  "97",
  // Heterogeneity override
  "95",
  // Whole-number priors (must equal a hypothesis prior to pass)
  "88", "70", "28", "30", "22", "6",
  // Effective-value cites in about/page.tsx Ch.4 under the log-odds model:
  // programas-clasificados ≈ 96, fenómeno natural ≈ 44, tecnologia-adversaria
  // ≈ 89, ingenieria-inversa ≈ 31, entidades-no-humanas ≈ 54.
  "96", "44", "89", "31", "54",
]);

/**
 * Set of all override values across hypotheses — used to avoid flagging
 * a number as "drift from override X" when it's actually override Y.
 */
const ALL_OVERRIDE_VALUES = new Set(Object.values(OVERRIDE_BY_ID));

/**
 * Phrases that drifted out of the rename history. Forbidden anywhere
 * user-facing (app/ pages + case rationales rendered by the slug page).
 */
const FORBIDDEN_TERMS = [
  { needle: "psicoespiritual", reason: "rename → ontologico-no-materialista (hypothesis layer)" },
  { needle: "algo no humano", reason: "rename → entidades no humanas" },
  { needle: "tratado encubierto", reason: "rename → tratado formal" },
];

/**
 * Files exempt from FORBIDDEN_TERMS scan (framework slug is allowed to
 * preserve the historical theoretical-school name).
 */
const FORBIDDEN_EXEMPT = new Set([
  "data/frameworks.json",
  "data/researchers.json",
]);

// ─── 5. SCAN UTILITIES ───────────────────────────────────────────────────

function walk(dir, exts) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((ext) => e.name.endsWith(ext))) out.push(full);
  }
  return out;
}

const findings = [];
function record(level, file, line, msg) {
  findings.push({ level, file: path.relative(root, file), line, msg });
}

// ─── 6. RULE E1 + E2: percentages in app/**/*.tsx ────────────────────────

const PCT_RE = /(\d{1,3})\s*%/g;

const tsxFiles = walk(path.join(root, "app"), [".tsx"]);
for (const file of tsxFiles) {
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    let m;
    PCT_RE.lastIndex = 0;
    while ((m = PCT_RE.exec(line)) !== null) {
      const pct = m[1];
      // Skip clearly-non-editorial uses
      if (/className=|tracking-|opacity|width|height|gap-|p-|m-|--tw/.test(line)) continue;
      if (line.includes("ICD%20203")) continue; // PDF URL
      if (/text-\[\d+%/.test(line)) continue; // tailwind size token
      if (/var\(|hsl\(|rgb\(/.test(line)) continue;

      const matchesPrior = Object.values(PRIOR_BY_ID).includes(Number(pct));
      const matchesOverride = Object.values(OVERRIDE_BY_ID).includes(Number(pct));
      const allowed = EDITORIAL_RANGES_OK.has(pct);

      if (!matchesPrior && !matchesOverride && !allowed) {
        record("ERROR", file, lineNo, `unknown % cited: "${pct}%" (no matching hypothesis prior, override, or editorial exception)`);
      }

      // Rule E2 (relaxed): if the % matches a primitive prior AND
      // the line doesn't mention "prior" AND isn't a tier conf band,
      // warn. Overrides (97/95) are exempt — they have separate
      // vocabulary ("antes del filtro", "consecuencia"). Tier bands
      // (conf="…") are illustrations of reliability, not priors.
      const isPrimitivePrior = matchesPrior && !matchesOverride;
      const isTierConfBand = /conf=|Tier\s*\d/i.test(line);
      if (isPrimitivePrior && !/prior/i.test(line) && !isTierConfBand) {
        record("WARN", file, lineNo, `% "${pct}%" matches a primitive prior — line should tag it explicitly as "prior" (COPY NUMERIC DISCIPLINE)`);
      }
    }
  });
}

// Specific cross-check: pre-filter-universe context cites should match
// the misidentificacion override exactly.
const PREFILTER_OVERRIDE = OVERRIDE_BY_ID["misidentificacion"];
if (PREFILTER_OVERRIDE !== undefined) {
  const ctxWords = "globos|balloons|Blue Book|AARO|pareidolia|lens flares|reportes generales|general (?:UAP )?reports|pre-filter|antes del filtro";
  for (const file of tsxFiles) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    lines.forEach((line, i) => {
      // Match only when ctxWords appear NEAR a percentage in the same line
      const re = new RegExp(`(?:${ctxWords})[^\\n]{0,200}?(\\d{1,3})\\s*%`, "i");
      const m = line.match(re);
      if (!m) return;
      // If the canonical override value appears anywhere on the line,
      // the line is internally correct — even if multiple values coexist
      // (e.g. about-page "97% antes del filtro... y 95% consecuencia").
      const hasCanonical = new RegExp(`\\b${PREFILTER_OVERRIDE}\\s*%`).test(line);
      if (hasCanonical) return;
      const cited = Number(m[1]);
      if (cited === PREFILTER_OVERRIDE) return;
      record(
        "ERROR",
        file,
        i + 1,
        `pre-filter universe context cites "${cited}%" but misidentificacion override=${PREFILTER_OVERRIDE}% — drift`,
      );
    });
  }
}

// ─── 7. RULE E3: hardcoded counts in /app + /components ──────────────────

const CANONICAL_COUNTS = new Map([
  [STATS.cases, "STATS.cases"],
  [STATS.countries, "STATS.countries"],
  [STATS.years, "STATS.years"],
  [STATS.tierS, "STATS.tierS"],
  [STATS.tierA, "STATS.tierA"],
  [STATS.tierB, "STATS.tierB"],
  [STATS.patterns, "STATS.patterns"],
  [STATS.researchers, "STATS.researchers"],
  [STATS.frameworks, "STATS.frameworks"],
]);

// Drift detection (±5) solo para los conteos grandes: el ±5 de cuentas
// chicas (patterns 18, frameworks 11) colisiona con números comunes y daría
// falsos positivos. Esas se cazan por match exacto, no por drift.
const DRIFT_BASES = [
  STATS.cases,
  STATS.countries,
  STATS.years,
  STATS.tierS,
  STATS.tierA,
  STATS.tierB,
];
const DRIFT_NUMBERS = new Set();
for (const c of DRIFT_BASES) {
  for (let d = -5; d <= 5; d++) if (d !== 0) DRIFT_NUMBERS.add(c + d);
}
// Don't confuse small numbers (1-10) with stats drift
for (let n = 1; n <= 12; n++) DRIFT_NUMBERS.delete(n);

const sourceFiles = [
  ...tsxFiles,
  ...walk(path.join(root, "components"), [".tsx"]),
];
for (const file of sourceFiles) {
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    // Skip metadata / className / opacity / hex
    if (/className=|tracking-|opacity|min-h-\[|max-w-|#[0-9a-fA-F]{3,8}/.test(line)) return;
    // Skip Vallée 1975 prediction line (date arithmetic, not corpus stat)
    if (/Vallée|Vallee|1975/.test(line)) return;
    // Look for "<number> casos|cases|países|countries|años|years"
    const ctxRe = /\b(\d{2,3})\s+(casos|cases|países|countries|años|years|patrones|patterns|investigadores|researchers|marcos|frameworks)\b/g;
    let m;
    while ((m = ctxRe.exec(line)) !== null) {
      const n = Number(m[1]);
      // Allowed if it matches a canonical value AND uses STATS interpolation
      if (line.includes("STATS.")) continue;
      if (CANONICAL_COUNTS.has(n)) {
        record("WARN", file, lineNo, `hardcoded "${n} ${m[2]}" matches a STATS value — should use \${STATS.*} for drift-resistance`);
      } else if (DRIFT_NUMBERS.has(n)) {
        record("ERROR", file, lineNo, `hardcoded "${n} ${m[2]}" is close to a STATS value but doesn't match — likely drift (current STATS=${JSON.stringify(STATS)})`);
      }
    }
  });
}

// ─── 8. RULE E4: forbidden terms (drift signatures) ──────────────────────

const scanForForbidden = [
  ...tsxFiles,
  ...walk(path.join(root, "data", "cases"), [".json"]),
  ...walk(path.join(root, "components"), [".tsx"]),
];
for (const file of scanForForbidden) {
  const rel = path.relative(root, file);
  if ([...FORBIDDEN_EXEMPT].some((p) => rel.endsWith(p))) continue;
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((line, i) => {
    for (const { needle, reason } of FORBIDDEN_TERMS) {
      if (line.toLowerCase().includes(needle.toLowerCase())) {
        record("WARN", file, i + 1, `forbidden phrase "${needle}" — ${reason}`);
      }
    }
  });
}

// ─── 9. RULE E5 + E6: evidenceContribution integrity ─────────────────────

let tierSWithoutContrib = 0;
for (const c of cases) {
  for (const e of c.evidenceContribution || []) {
    if (!HYP_IDS.has(e.hypothesisId)) {
      record(
        "ERROR",
        path.join(casesDir, c.id + ".json"),
        0,
        `evidenceContribution references unknown hypothesisId "${e.hypothesisId}" (case ${c.id})`,
      );
    }
    if (!(e.strength in STRENGTH_W)) {
      record(
        "ERROR",
        path.join(casesDir, c.id + ".json"),
        0,
        `evidenceContribution has unknown strength "${e.strength}" (case ${c.id})`,
      );
    }
    if (!["supports", "weakens"].includes(e.direction)) {
      record(
        "ERROR",
        path.join(casesDir, c.id + ".json"),
        0,
        `evidenceContribution has unknown direction "${e.direction}" (case ${c.id})`,
      );
    }
  }
  if (c.tier === "S" && (!c.evidenceContribution || c.evidenceContribution.length === 0)) {
    tierSWithoutContrib++;
    record(
      "WARN",
      path.join(casesDir, c.id + ".json"),
      0,
      `Tier S case "${c.id}" has no evidenceContribution — calibration auto-seeds from patterns only`,
    );
  }
}

// ─── 9b. RULE E7: Spanglish in ES-facing case fields ─────────────────────
//
// `name` y `summary` son los campos ES-first que renderiza /cases. Inglés
// descriptivo ahí es drift editorial (el inglés vive en name_en/summary_en).
// Heurística conservadora: lista curada de palabras inglesas comunes en
// títulos UAP que casi nunca aparecen en prosa española. Se exime el texto
// entre comillas (títulos citados) y los nombres propios canónicos.

const SPANGLISH_RE =
  /\b(crash|lights|wave|shutdown|files|hearing|leaked|streaks|highway|island|wartime|rhetoric|summaries|saucer|nests?|weaponized|weaponizada|sighting|witness(es)?|burns?|recovery|the|of|with|from)\b/i;

const SPANGLISH_PROPER_OK = [
  "Phoenix Lights",          // nombre canónico global del evento
  "Ariel School",            // ídem
  "Skinwalker Ranch",        // ídem
  "Hudson Valley",           // topónimo
  "Lake Huron",              // topónimo
  "East Coast",              // topónimo en nombre de caso ya establecido
  "Mystery Drones",          // etiqueta mediática canónica
  "Blue Book",
  "Estimate of the Situation", // título de documento
  "Special Report",            // título de documento (Battelle)
  "Ministry of Supply",        // institución
  "Bombing Trials Unit",       // institución
  "National Press Club",
  "Operation Animal Mutilation", // título de informe
  "Joint Defence Facility",      // institución
  "Eyre Highway",                // topónimo (carretera)
  "University of Queensland",    // institución
  "Department of War",           // institución US (DoD renombrado 2026)
];

function stripQuotedAndProper(s) {
  let t = s.replace(/'[^']*'|"[^"]*"|«[^»]*»|‘[^’]*’/g, "");
  for (const k of SPANGLISH_PROPER_OK) t = t.split(k).join("");
  return t;
}

for (const c of cases) {
  for (const field of ["name", "summary"]) {
    const v = c[field];
    if (!v) continue;
    const m = stripQuotedAndProper(v).match(SPANGLISH_RE);
    if (m) {
      record(
        "ERROR",
        path.join(casesDir, c.id + ".json"),
        0,
        `E7 spanglish: campo ES "${field}" contiene "${m[0]}" (case ${c.id}) — mover el inglés a ${field}_en o citar entre comillas`,
      );
    }
  }
}

// ─── 10. REPORT ──────────────────────────────────────────────────────────

const errors = findings.filter((f) => f.level === "ERROR");
const warns = findings.filter((f) => f.level === "WARN");

const out = [];
out.push("");
out.push("═══════════════════════════════════════════════════════════════════");
out.push(" UAP Codex · Consistency Audit");
out.push("═══════════════════════════════════════════════════════════════════");
out.push("");
out.push(` Cases:        ${STATS.cases}`);
out.push(` Countries:    ${STATS.countries}`);
out.push(` Years:        ${STATS.years}`);
out.push(` Tier S/A/B:   ${STATS.tierS} / ${STATS.tierA} / ${STATS.tierB}`);
out.push(` Tier S w/o evidenceContribution: ${tierSWithoutContrib}`);
out.push("");
out.push(" Hypothesis priors → effective:");
for (const h of HYPOTHESES) {
  const eff = EFFECTIVE[h.id];
  const tag = h.override !== undefined ? "[override]" : "[derived]";
  out.push(`   ${h.id.padEnd(30)} prior=${String(h.prior).padStart(3)}  effective=${String(eff).padStart(5)}  ${tag}`);
}
out.push("");
out.push(`─ Findings ──────────────────────────────────────────────────────`);
out.push(`  ERRORS: ${errors.length}    WARNS: ${warns.length}`);
out.push("");

if (errors.length > 0) {
  out.push("  🔴 ERRORS (must fix — break the build in CI):");
  for (const f of errors) {
    out.push(`     ${f.file}:${f.line}  ${f.msg}`);
  }
  out.push("");
}
if (warns.length > 0) {
  out.push("  🟡 WARNINGS (review):");
  for (const f of warns.slice(0, 30)) {
    out.push(`     ${f.file}:${f.line}  ${f.msg}`);
  }
  if (warns.length > 30) out.push(`     … and ${warns.length - 30} more`);
  out.push("");
}
if (errors.length === 0 && warns.length === 0) {
  out.push("  ✅ All consistency checks passed.");
  out.push("");
}
out.push("═══════════════════════════════════════════════════════════════════");
out.push("");

console.log(out.join("\n"));

const warnOnly = process.argv.includes("--warn");
if (errors.length > 0 && !warnOnly) process.exit(1);
