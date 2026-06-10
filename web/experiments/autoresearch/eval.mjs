#!/usr/bin/env node
/**
 * AutoResearch evaluator — UAP Codex calibration loop
 *
 * Inmutable. Calcula una métrica compuesta sobre el modelo de calibración
 * y la imprime como JSON. Score más bajo = mejor.
 *
 * Componentes:
 *   audit_errors × 10   (fail-fast)
 *   audit_warns  ×  1
 *   band_jumps   ×  3   (effective cruza banda ICD-203 vs prior)
 *   coverage_gaps ×  2  (hipótesis primitiva con <3 evidenceContribution)
 *   extreme_drift × 1   (|effective − prior| > 35pp)
 *
 * Uso:
 *   node experiments/autoresearch/eval.mjs              # imprime JSON con score
 *   node experiments/autoresearch/eval.mjs --baseline   # mismo, marca baseline:true
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..", "..");
process.chdir(webRoot);

// ─── 1. Run audit-consistency, capture stdout ────────────────────────────

let auditOut;
let auditErrors = 0;
let auditWarns = 0;
try {
  auditOut = execSync("node scripts/audit-consistency.mjs", {
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" },
  });
} catch (err) {
  // exit 1 = errors present, capture stdout from err
  auditOut = (err.stdout || "") + (err.stderr || "");
  if (err.status === undefined) {
    console.error(JSON.stringify({ error: "audit script failed", message: err.message }));
    process.exit(2);
  }
}

const errMatch = auditOut.match(/ERRORS:\s*(\d+)/);
const warnMatch = auditOut.match(/WARNS:\s*(\d+)/);
auditErrors = errMatch ? Number(errMatch[1]) : 0;
auditWarns = warnMatch ? Number(warnMatch[1]) : 0;

// ─── 2. Parse priors + overrides + STRENGTH_WEIGHT from source files ─────

const hypSrc = fs.readFileSync(path.join(webRoot, "lib/hypotheses.ts"), "utf-8");

const HYP = [];
const re = /\{\s*id:\s*"([^"]+)",\s*kind:\s*"(primitive|antecedent|derived)",[\s\S]*?corpusPct:\s*(\d+)(?:[\s\S]*?corpusPctOverride:\s*(\d+))?[\s\S]*?\},/g;
let m;
while ((m = re.exec(hypSrc)) !== null) {
  HYP.push({
    id: m[1],
    kind: m[2],
    prior: Number(m[3]),
    override: m[4] !== undefined ? Number(m[4]) : undefined,
  });
}

const mappingSrc = fs.readFileSync(path.join(webRoot, "lib/hypothesisMapping.ts"), "utf-8");
const strengthMatch = mappingSrc.match(/STRENGTH_WEIGHT[^=]*=\s*\{([^}]+)\}/);
const STRENGTH = {};
if (strengthMatch) {
  for (const pair of strengthMatch[1].matchAll(/"?([a-z-]+)"?:\s*([0-9.]+)/g)) {
    STRENGTH[pair[1]] = Number(pair[2]);
  }
}

// ─── 3. Load corpus + compute effective using current model ──────────────

const cases = JSON.parse(fs.readFileSync(path.join(webRoot, "data/cases.json"), "utf-8"));
const UMBRELLA = {
  "entidades-no-humanas": ["interdimensional", "ontologico-no-materialista", "tratado-greys"],
};

function logit(p) { return Math.log(p / (1 - p)); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function pressureFor(hypId) {
  const targets = [hypId, ...(UMBRELLA[hypId] || [])];
  let p = 0;
  for (const c of cases) {
    for (const e of c.evidenceContribution || []) {
      if (!targets.includes(e.hypothesisId)) continue;
      const w = STRENGTH[e.strength] ?? 0;
      p += e.direction === "supports" ? w : -w;
    }
  }
  return p;
}

function evidenceCountFor(hypId) {
  const targets = [hypId, ...(UMBRELLA[hypId] || [])];
  let n = 0;
  for (const c of cases) {
    if ((c.evidenceContribution || []).some((e) => targets.includes(e.hypothesisId))) n++;
  }
  return n;
}

function pctToBand(pct) {
  if (pct >= 93) return "almost-certain";
  if (pct >= 80) return "very-likely";
  if (pct >= 55) return "probable";
  if (pct >= 41) return "even-chance";
  if (pct >= 20) return "unlikely";
  if (pct >= 7) return "very-unlikely";
  return "almost-no-chance";
}

const calibrations = [];
let bandJumps = 0;
let coverageGaps = 0;
let extremeDrift = 0;

for (const h of HYP) {
  let eff;
  if (h.override !== undefined) {
    eff = h.override;
  } else {
    const priorClamped = Math.max(0.01, Math.min(0.99, h.prior / 100));
    eff = sigmoid(logit(priorClamped) + pressureFor(h.id)) * 100;
    eff = Math.max(1, Math.min(99, eff));
  }
  const priorBand = pctToBand(h.prior);
  const effBand = pctToBand(eff);
  const drift = Math.abs(eff - h.prior);
  const cov = h.kind === "primitive" && h.override === undefined ? evidenceCountFor(h.id) : null;

  calibrations.push({
    id: h.id,
    kind: h.kind,
    prior: h.prior,
    effective: Number(eff.toFixed(1)),
    priorBand,
    effBand,
    drift: Number(drift.toFixed(1)),
    coverage: cov,
  });

  if (h.kind === "primitive" && h.override === undefined) {
    if (priorBand !== effBand) bandJumps++;
    if (drift > 35) extremeDrift++;
    if (cov !== null && cov < 3) coverageGaps++;
  }
}

// ─── 4. Compute composite score ──────────────────────────────────────────

const score =
  auditErrors * 10 +
  auditWarns * 1 +
  bandJumps * 3 +
  coverageGaps * 2 +
  extremeDrift * 1;

const isBaseline = process.argv.includes("--baseline");

const out = {
  baseline: isBaseline,
  timestamp: new Date().toISOString(),
  score,
  components: {
    auditErrors,
    auditWarns,
    bandJumps,
    coverageGaps,
    extremeDrift,
  },
  strengthWeights: STRENGTH,
  calibrations,
};

console.log(JSON.stringify(out, null, 2));
