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
 *   E8  Calibración existencial (post-#244):
 *       E8a (WARN) Una contribución `weakens` hacia una hipótesis
 *           corpus-existential es inerte — se calcula pero se descarta
 *           (la claim «≥1 caso» es monótona). Se avisa para que no se
 *           confunda con evidencia efectiva.
 *       E8b (ERROR) Invariante de monotonicidad: el `effective` de toda
 *           hipótesis corpus-existential debe ser ≥ su prior. Si se rompe,
 *           el motor o este mirror dejaron de excluir `weakens`.
 *   E9  (WARN) Cobertura investigador↔caso: marca los investigadores de
 *       researchers.json sin mención (por nombre/apellido) en ningún caso.
 *       Heurística por substring, conservadora (ver nota en la regla).
 *
 * NOTA · este script DUPLICA la calibración de lib/hypothesisMapping.ts
 * (no puede importar TS sin build). La sección 3 debe mantenerse espejada;
 * E8b es el guard que detecta cuando la copia se desincroniza.
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
    // claimType vive en el mismo bloque del objeto; lo extraemos del match
    // capturado (puede aparecer antes o después de corpusPct).
    const ct = /claimType:\s*"([^"]+)"/.exec(m[0]);
    out.push({
      id: m[1],
      prior: Number(m[2]),
      override: m[3] !== undefined ? Number(m[3]) : undefined,
      claimType: ct ? ct[1] : undefined,
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
const CLAIM_TYPE_BY_ID = Object.fromEntries(HYPOTHESES.map((h) => [h.id, h.claimType]));
const OVERRIDE_BY_ID = Object.fromEntries(
  HYPOTHESES.filter((h) => h.override !== undefined).map((h) => [h.id, h.override]),
);

// ─── 2. CARGA CORPUS ─────────────────────────────────────────────────────

const casesDir = path.join(root, "data", "cases");
const caseFileNames = fs
  .readdirSync(casesDir)
  .filter((f) => f.endsWith(".json"));
const cases = caseFileNames.map((f) =>
  JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8")),
);

// Texto crudo concatenado de todos los expedientes — lo usa RULE E9 para el
// cruce investigador↔caso por nombre (búsqueda de substring conservadora).
const caseCorpusText = caseFileNames
  .map((f) => fs.readFileSync(path.join(casesDir, f), "utf-8"))
  .join("\n");

const researchers = JSON.parse(
  fs.readFileSync(path.join(root, "data", "researchers.json"), "utf-8"),
);

const STATS = {
  cases: cases.length,
  countries: new Set(cases.map((c) => c.country)).size,
  tierS: cases.filter((c) => c.tier === "S").length,
  tierA: cases.filter((c) => c.tier === "A").length,
  tierB: cases.filter((c) => c.tier === "B").length,
  years: Math.max(...cases.map((c) => c.year_start)) - 1947,
  researchers: researchers.length,
};

// ─── 3. COMPUTE EFFECTIVE CALIBRATIONS (mirror lib/hypothesisMapping.ts) ─

// Must mirror lib/hypothesisMapping.ts STRENGTH_WEIGHT (log-odds Bayes-factor
// weights, NOT the legacy linear pressure points) AND su agregación: auto-seed
// por patrones + exclusión de `weakens` para hipótesis corpus-existential.
const STRENGTH_W = { minimal: 0.005, modest: 0.02, substantial: 0.05, "category-breaking": 0.15 };
const UMBRELLA = {
  "entidades-no-humanas": ["interdimensional", "ontologico-no-materialista", "tratado-greys"],
};

// PATTERN_TO_HYPOTHESIS parseado desde lib/hypothesisMapping.ts. Necesario
// para replicar el AUTO-SEED de lib: un caso SIN evidenceContribution explícita
// siembra una contribución `supports`/`minimal` por cada patrón mapeado. Sin
// esto el audit subcontaba la presión vs. lo que renderiza el sitio.
function parsePatternMap(src) {
  const body = /PATTERN_TO_HYPOTHESIS[^=]*=\s*\{([\s\S]*?)\n\};/.exec(src);
  if (!body) return {};
  const out = {};
  const re = /"([^"]+)":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(body[1])) !== null) out[m[1]] = m[2];
  return out;
}
const mappingSrc = fs.readFileSync(
  path.join(root, "lib", "hypothesisMapping.ts"),
  "utf-8",
);
const PATTERN_TO_HYPOTHESIS = parsePatternMap(mappingSrc);

/**
 * Mirror de lib/hypothesisMapping.ts → effectiveContributions(): si el caso
 * declara evidenceContribution, usa esas; si no, auto-siembra desde patterns
 * (dedup por hipótesis, dirección `supports`, peso `minimal`).
 */
function effectiveContributions(c) {
  if (c.evidenceContribution && c.evidenceContribution.length > 0) {
    return c.evidenceContribution.map((e) => ({
      hypothesisId: e.hypothesisId,
      direction: e.direction,
      weight: STRENGTH_W[e.strength] ?? 0,
    }));
  }
  const seen = new Set();
  const out = [];
  for (const p of c.patterns || []) {
    const hid = PATTERN_TO_HYPOTHESIS[p];
    if (!hid || seen.has(hid)) continue;
    seen.add(hid);
    out.push({ hypothesisId: hid, direction: "supports", weight: STRENGTH_W.minimal });
  }
  return out;
}

function pressureFor(hid) {
  const targets = [hid, ...(UMBRELLA[hid] || [])];
  let supports = 0;
  let weakens = 0;
  for (const c of cases) {
    for (const e of effectiveContributions(c)) {
      if (!targets.includes(e.hypothesisId)) continue;
      if (e.direction === "supports") {
        supports += e.weight;
      } else if (CLAIM_TYPE_BY_ID[hid] !== "corpus-existential") {
        // `weakens` solo cuenta para afirmaciones NO monótonas: una claim
        // «≥1 caso es X» no baja porque un candidato individual se descarte.
        // Ver claimType en lib/hypotheses.ts y CLAIM_TYPE en hypothesisMapping.ts.
        weakens += e.weight;
      }
    }
  }
  return supports - weakens;
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
  // Valores EFECTIVOS citados en /about (post-calibración estadística jun 2026:
  // monotonicidad existencial + anti doble conteo de anclas):
  // programas-clasificados ≈ 97, tecnologia-adversaria ≈ 93, fenómeno
  // natural ≈ 73, entidades-no-humanas ≈ 56, ingenieria-inversa ≈ 32.
  "93", "73", "56", "32",
]);

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
const inertWeakens = []; // RULE E8a — agregadas en un solo WARN al final
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
    // RULE E8a · `weakens` muerto: una contribución que debilita una hipótesis
    // corpus-existential se calcula pero se DESCARTA (la claim «≥1 caso» es
    // monótona). Sigue siendo un verdicto válido a nivel de caso, pero no
    // mueve la calibración global — se avisa para que nadie lo crea efectivo.
    if (
      e.direction === "weakens" &&
      CLAIM_TYPE_BY_ID[e.hypothesisId] === "corpus-existential"
    ) {
      inertWeakens.push({ caseId: c.id, hid: e.hypothesisId });
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

// RULE E8a · resumen agregado de `weakens` inertes (deuda silenciosa: datos
// que se calculan y se descartan). Un solo WARN para no inundar el prebuild.
if (inertWeakens.length > 0) {
  const byHyp = {};
  for (const w of inertWeakens) byHyp[w.hid] = (byHyp[w.hid] || 0) + 1;
  const breakdown = Object.entries(byHyp)
    .map(([h, n]) => `${h}×${n}`)
    .join(", ");
  record(
    "WARN",
    hypothesesPath,
    0,
    `${inertWeakens.length} inert weakens toward corpus-existential hypotheses (${breakdown}) — computed then discarded by monotonicity; valid as per-case verdicts only`,
  );
}

// ─── 9a. RULE E8b: monotonicity invariant for existential claims ─────────
//
// Una claim «≥1 caso es X» (corpus-existential) es monótona: descartar
// candidatos no puede bajar P(≥1 caso califique). Por tanto su `effective`
// NUNCA puede caer por debajo de su prior. Si esto se rompe, el motor
// (lib/hypothesisMapping.ts) o este mirror dejaron de excluir `weakens` —
// exactamente el drift que introdujo #244 en este auditor. Falla el build.
for (const h of HYPOTHESES) {
  if (h.override !== undefined || h.claimType !== "corpus-existential") continue;
  const eff = EFFECTIVE[h.id];
  if (eff + 1e-9 < h.prior) {
    record(
      "ERROR",
      hypothesesPath,
      0,
      `monotonicity broken: corpus-existential "${h.id}" effective=${eff.toFixed(2)} < prior=${h.prior} (weakens must be excluded — see #244)`,
    );
  }
}

// ─── 9c. RULE E9: researcher ↔ case association coverage ─────────────────
//
// No existe un vínculo estructurado investigador↔caso (los casos no tienen
// campo `researchers`). Esta regla mide la red IMPLÍCITA: un investigador se
// considera "asociado" si su nombre completo, o su apellido (≥4 letras),
// aparece como substring en el texto de algún expediente. La búsqueda por
// substring es deliberadamente conservadora: prefiere falsos positivos de
// asociación (no marcar un huérfano dudoso) antes que marcar erróneamente
// como huérfano a alguien que sí está citado. Los huérfanos se reportan en
// un único WARN agregado: son candidatos a enlazar con un caso o a revisar.
const orphanResearchers = [];
for (const r of researchers) {
  const full = (r.name || "").trim();
  const surname = full.split(/\s+/).pop() || "";
  const linked =
    (full.length >= 4 && caseCorpusText.includes(full)) ||
    (surname.length >= 4 && caseCorpusText.includes(surname));
  if (!linked) orphanResearchers.push(r.id);
}
const linkedCount = researchers.length - orphanResearchers.length;
if (orphanResearchers.length > 0) {
  record(
    "WARN",
    path.join(root, "data", "researchers.json"),
    0,
    `${orphanResearchers.length}/${researchers.length} investigadores sin mención en ningún caso (heurística por nombre): ${orphanResearchers.join(", ")} — candidatos a enlazar o revisar`,
  );
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
  "National Archives of Australia", // archivo nacional australiano (Turner Report)
  "Task Force on the Declassification of Federal Secrets", // sub-órgano House Oversight (Burlison)
  "Flying Saucer Working Party", // primer estudio oficial del MoD británico (1950)
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

// ─── 9c. RULE E10: prose bilingual completeness (ERROR) ──────────────────
//
// Calidad como patrón del audit: si un campo de prosa ES-first existe, su
// traducción _en es obligatoria — el toggle de idioma renderiza ambos, y un
// _en ausente deja al lector inglés con texto en español. summary/whatHappened/
// whyMatters son strings; evidence es array. (sources se exime: suele ser
// URLs/nombres propios neutrales.)

const PROSE_PAIRS = [
  ["summary", "summary_en"],
  ["whatHappened", "whatHappened_en"],
  ["whyMatters", "whyMatters_en"],
];
for (const c of cases) {
  const file = path.join(casesDir, c.id + ".json");
  for (const [es, en] of PROSE_PAIRS) {
    if (c[es] && !c[en]) {
      record("ERROR", file, 0, `E10 i18n: campo ES "${es}" sin traducción "${en}" (case ${c.id}) — la prosa debe ser bilingüe`);
    }
  }
  if (Array.isArray(c.evidence) && c.evidence.length && (!Array.isArray(c.evidence_en) || !c.evidence_en.length)) {
    record("ERROR", file, 0, `E10 i18n: "evidence" sin "evidence_en" (case ${c.id}) — la lista de evidencia debe ser bilingüe`);
  }
}

// ─── 9d. RULE E11: proper-noun fields with Spanish but no _en (WARN) ──────
//
// name y location.place pueden ser nombres propios idénticos en EN (Roswell,
// Lake Huron) — ahí _en es innecesario. Pero si contienen español descriptivo
// (Nuevo México, Departamento de Guerra, Cielo sobre…) y falta _en, el modo
// inglés muestra español. Heurística conservadora (sin diacríticos sueltos,
// para no marcar topónimos propios como Pará/Popocatépetl). WARN, no ERROR.

const ES_DESC_RE =
  /\b(sobre|cerca|entre|frente|cielo|fuerzas?|guerra|ministerio|departamento|ej[eé]rcito|a[eé]reo|a[eé]rea|nuevo|nueva|norte|sur|isla|islas|oc[eé]ano|provincias?|distrito|ubicaci[oó]n|reportes?|renombrado|defensa|nacional|c[aá]mara|esc(o|ó)cia|francia|brasil|b[eé]lgica|alemania|jap[oó]n|estado mayor|guerra)\b/i;
for (const c of cases) {
  const file = path.join(casesDir, c.id + ".json");
  if (c.name && !c.name_en && ES_DESC_RE.test(c.name)) {
    record("WARN", file, 0, `E11 i18n: "name" con español "${(c.name.match(ES_DESC_RE) || [])[0]}" sin name_en (case ${c.id})`);
  }
  const place = c.location && c.location.place;
  if (place && !(c.location && c.location.place_en) && ES_DESC_RE.test(place)) {
    record("WARN", file, 0, `E11 i18n: "place" con español "${(place.match(ES_DESC_RE) || [])[0]}" sin place_en (case ${c.id})`);
  }
}

// ─── 9e. RULE E12: lede robustness — summary too short (WARN) ─────────────
//
// El summary es el lede del caso: debe cargar quién/qué/cuándo/dónde, no ser
// una nota telegráfica. Un lede de primer nivel raramente baja de ~180 chars
// sin sacrificar dateline o atribución. WARN, no ERROR — es estándar editorial,
// no error de datos. (Histórico: 6 casos eran stubs <155 chars; reescritos jun
// 2026 a datelines completos.)

const LEDE_MIN = 180;
for (const c of cases) {
  const file = path.join(casesDir, c.id + ".json");
  const len = (c.summary || "").length;
  if (len > 0 && len < LEDE_MIN) {
    record("WARN", file, 0, `E12 lede: summary de ${len} chars (<${LEDE_MIN}) — un lede debe cargar quién/qué/cuándo/dónde (case ${c.id})`);
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
out.push(` Researchers linked to ≥1 case: ${linkedCount} / ${STATS.researchers}`);
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
