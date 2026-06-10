/**
 * Mapping of corpus patterns (8a-8r) to the hypotheses they primarily
 * inform. Used to surface "which cases support which hypothesis" on
 * /probabilidades. NOT used for any probability inference — this is a
 * heuristic catalog for transparent display, not a likelihood function.
 *
 * Each pattern maps to ONE primary hypothesis (the one most directly
 * implied by the pattern's documented characteristics). A pattern can
 * be relevant to multiple hypotheses in interpretation, but for the
 * UI we pick the strongest match.
 *
 * IDs updated to match the 8-hypothesis independent framework
 * (lib/hypotheses.ts post-reformulation).
 */

export const PATTERN_TO_HYPOTHESIS: Record<string, string> = {
  "8a": "heterogeneidad", // efectos físicos / interacción biológica → algo real
  "8b": "heterogeneidad", // madre+sub-objetos → estructura intencional (diversidad)
  "8c": "programas-clasificados", // muerte testigos críticos → supresión institucional
  "8d": "heterogeneidad", // investigadores aparte → diversidad de fuentes
  "8e": "heterogeneidad", // transparencia tiempo real → eventos reales registrados
  "8f": "heterogeneidad", // monitoreo riesgo catastrófico → patrón de interés intencional
  "8g": "fenomenos-naturales", // persistencia local (Hessdalen, Popocatépetl) → fenómeno repetible
  "8h": "heterogeneidad", // morfologías múltiples → diversidad explícita
  "8i": "heterogeneidad", // framework de tiers → meta-pattern
  "8j": "heterogeneidad", // metodología Bayesiana → meta-pattern
  "8k": "interdimensional", // interferencia EM → física exótica
  "8l": "programas-clasificados", // triángulos silenciosos → tecnología terrestre avanzada
  "8m": "programas-clasificados", // cover-up institucional → estado oculta algo
  "8n": "programas-clasificados", // ambigüedad estratégica → gestión estatal
  "8o": "programas-clasificados", // sincronización cultural-institucional → coordinación estatal
  "8p": "interdimensional", // crop circles peer-reviewed → física anómala
  "8q": "programas-clasificados", // ecosystem disclosure → presión sobre el estado
  "8r": "programas-clasificados", // leaks/WikiLeaks → autenticación cruzada del cover-up
  "8s": "tecnologia-adversaria", // vigilancia aérea de otro Estado → plataformas sin atribución inmediata
};

/**
 * Umbrella relations: superclass → its named subclasses.
 *
 * Evidence counts for an umbrella inherit from its subclasses (set union).
 * This enforces the math the page invokes: P(unión) ≥ P(cualquier subclase) —
 * which at the level of corpus evidence means the umbrella must list at least
 * every case that supports any subclass.
 *
 * Without this, the umbrella H5 displays 0 supporting cases while H6 displays
 * 7, which is internally incoherent.
 */
export const UMBRELLA_SUBCLASSES: Record<string, string[]> = {
  "entidades-no-humanas": [
    "interdimensional",
    "ontologico-no-materialista",
    "tratado-greys",
  ],
};

function targetIdsFor(hypothesisId: string): string[] {
  const subclasses = UMBRELLA_SUBCLASSES[hypothesisId];
  return subclasses ? [hypothesisId, ...subclasses] : [hypothesisId];
}

/**
 * Returns the IDs of cases that exhibit at least one pattern mapped
 * to the given hypothesis OR any of its umbrella subclasses.
 */
export function casesForHypothesis(
  hypothesisId: string,
  cases: Array<{ id: string; patterns: string[] }>,
): string[] {
  const targets = targetIdsFor(hypothesisId);
  return cases
    .filter((c) =>
      c.patterns.some((p) => targets.includes(PATTERN_TO_HYPOTHESIS[p])),
    )
    .map((c) => c.id);
}

/**
 * Evidence axis for a hypothesis: case + distinct-pattern coverage.
 * Inherits from umbrella subclasses (see UMBRELLA_SUBCLASSES).
 *
 * NOTE: this counts CORPUS COVERAGE — how many institutional cases exhibit
 * a related pattern — not likelihood strength. The corpus is pre-filtered
 * for anomaly, so high counts reflect prevalence in the filtered sample,
 * not Bayesian evidential weight.
 */
export function evidenceCountFor(
  hypothesisId: string,
  cases: Array<{ patterns: string[] }>,
): { caseCount: number; patternCount: number } {
  const targets = targetIdsFor(hypothesisId);
  const supportingCases = cases.filter((c) =>
    c.patterns.some((p) => targets.includes(PATTERN_TO_HYPOTHESIS[p])),
  );
  const supportingPatterns = new Set(
    supportingCases.flatMap((c) =>
      c.patterns.filter((p) => targets.includes(PATTERN_TO_HYPOTHESIS[p])),
    ),
  );
  return {
    caseCount: supportingCases.length,
    patternCount: supportingPatterns.size,
  };
}

/**
 * Per-case calibration system — see lib/types.ts EvidenceContribution.
 *
 * Each case can declare explicit contributions; otherwise auto-seeded from
 * its pattern list (each mapped pattern = one `minimal` supporting
 * contribution to the mapped hypothesis).
 *
 * MATHEMATICAL MODEL: log-odds Bayesian-style update.
 *
 *   effective = sigmoid(logit(prior) + Σ direction × weight)
 *
 *   - `weight` is the case's contribution magnitude in log-odds space (a
 *     Bayes-factor-like quantity).
 *   - `direction` ∈ {+1 supports, −1 weakens}.
 *   - sigmoid saturates asymptotically toward 0 and 1, so no artificial
 *     clamp is needed: the prior's distance from the extremes provides a
 *     natural ceiling/floor.
 *
 *   The weights below are calibrated CONSERVATIVELY because corpus cases
 *   are not independent observations — they share cultural era, selection
 *   bias and methodological assumptions. A "modest" contribution = +0.02
 *   in log-odds = odds × 1.020x = ~2% boost. This means 50 modest cases
 *   would shift logit by 1.0 — moving a 50%-prior to ~73%, an 88%-prior to
 *   ~95% — neither of which saturates artificially.
 *
 * Umbrella hypotheses inherit contributions from their subclasses
 * (same UMBRELLA_SUBCLASSES relation used by evidenceCountFor).
 */

/**
 * Per-strength weight in log-odds space (≈ ln(Bayes factor)).
 * Interpretation by strength:
 *   minimal           → odds × 1.005x  (very weak hint)
 *   modest            → odds × 1.020x  (clear hint)
 *   substantial       → odds × 1.051x  (solid evidence)
 *   category-breaking → odds × 1.162x  (paradigm-shifting observation)
 *
 * Conservative on purpose: corpus cases are correlated (shared era,
 * selection bias). Treating each as an independent Bayesian observation
 * with strong likelihood would saturate the dial within a handful of
 * cases. Compare with NAIVE_LINEAR_WEIGHT (kept for migration audit).
 */
export const STRENGTH_WEIGHT: Record<string, number> = {
  minimal: 0.005,
  modest: 0.02,
  substantial: 0.05,
  "category-breaking": 0.15,
};

interface MinimalCase {
  id?: string;
  patterns: string[];
  evidenceContribution?: Array<{
    hypothesisId: string;
    direction: "supports" | "weakens";
    strength: string;
  }>;
}

interface NormalizedContribution {
  caseId: string;
  hypothesisId: string;
  direction: "supports" | "weakens";
  strength: string;
  weight: number;
}

/**
 * Returns effective contributions for a case. If the case declares
 * `evidenceContribution`, those are used directly. Otherwise, auto-seed
 * from patterns: each pattern mapped to a hypothesis emits a `minimal`
 * supporting contribution to that hypothesis.
 */
function effectiveContributions(c: MinimalCase): NormalizedContribution[] {
  const caseId = c.id ?? "(unknown)";
  if (c.evidenceContribution && c.evidenceContribution.length > 0) {
    return c.evidenceContribution.map((e) => ({
      caseId,
      hypothesisId: e.hypothesisId,
      direction: e.direction,
      strength: e.strength,
      weight: STRENGTH_WEIGHT[e.strength] ?? 0,
    }));
  }
  // Auto-seed from patterns
  const seen = new Set<string>();
  const out: NormalizedContribution[] = [];
  for (const p of c.patterns) {
    const hid = PATTERN_TO_HYPOTHESIS[p];
    if (!hid || seen.has(hid)) continue;
    seen.add(hid);
    out.push({
      caseId,
      hypothesisId: hid,
      direction: "supports",
      strength: "minimal",
      weight: STRENGTH_WEIGHT.minimal,
    });
  }
  return out;
}

/**
 * Continuous pressure index per hypothesis.
 * Honors umbrella inheritance (subclass contributions count for the umbrella).
 */
export function pressureFor(
  hypothesisId: string,
  cases: MinimalCase[],
): { pressure: number; supportingCases: number; declaredCases: number } {
  const targets = targetIdsFor(hypothesisId);
  let supports = 0;
  let weakens = 0;
  const supportingCaseIds = new Set<string>();
  let declaredCases = 0;
  for (const c of cases) {
    let touched = false;
    if (c.evidenceContribution && c.evidenceContribution.length > 0) {
      declaredCases++;
    }
    for (const e of effectiveContributions(c)) {
      if (!targets.includes(e.hypothesisId)) continue;
      touched = true;
      if (e.direction === "supports") supports += e.weight;
      else weakens += e.weight;
    }
    if (touched) supportingCaseIds.add(c.id ?? "");
  }
  return {
    pressure: supports - weakens,
    supportingCases: supportingCaseIds.size,
    declaredCases,
  };
}

/**
 * Effective calibration — log-odds Bayesian update with optional override.
 *
 * Resolution order:
 *   1. If `corpusPctOverride` is declared on the hypothesis, use it.
 *      Source = "override". Used by antecedent/derived hypotheses whose
 *      pct doesn't come from corpus evidence.
 *   2. Otherwise:
 *        logit_prior = ln(prior / (1 − prior))
 *        logit_eff   = logit_prior + Σ direction × STRENGTH_WEIGHT[strength]
 *        effective   = sigmoid(logit_eff) = 1 / (1 + exp(−logit_eff))
 *      Source = "derived" when pressure ≠ 0, "prior" when pressure = 0.
 *
 * Why log-odds and not a linear `prior + pressure × k`:
 *   - The linear model saturated artificially at the 1–99% clamp: a
 *     hypothesis with prior 88% and pressure 56 went straight to 99% (cap)
 *     for any reasonable k.
 *   - Log-odds saturates asymptotically (sigmoid never reaches 0 or 1),
 *     so the same evidence shifts probabilities NEAR the extremes much
 *     less than near 50%. That is the correct Bayesian behavior: when
 *     prior is already 95%, a "modest" hint isn't going to push it past
 *     99%; when prior is 50%, that same hint moves the needle visibly.
 *
 * The clamp to [1, 99] is kept as a SAFETY bound for floating-point edge
 * cases and to keep the ICD-203 rule (never 0%, never 100%) visible, but
 * it is no longer the source of the ceiling.
 */

/**
 * @deprecated kept for back-compat audit of the previous linear model.
 * The log-odds model does NOT use a multiplicative shift factor.
 */
export const PRESSURE_SHIFT_FACTOR = 1;

export type CalibrationSource = "override" | "derived" | "prior";

interface HypothesisLike {
  id: string;
  corpusPct: number;
  corpusPctOverride?: number;
}

function logit(p: number): number {
  return Math.log(p / (1 - p));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function effectiveCalibration(
  h: HypothesisLike,
  cases: MinimalCase[],
): {
  pct: number;
  source: CalibrationSource;
  pressure: number;
  supportingCases: number;
  shift: number;
} {
  const { pressure, supportingCases } = pressureFor(h.id, cases);
  if (h.corpusPctOverride !== undefined) {
    return {
      pct: h.corpusPctOverride,
      source: "override",
      pressure,
      supportingCases,
      shift: 0,
    };
  }
  const priorClamped = Math.max(0.01, Math.min(0.99, h.corpusPct / 100));
  const logitEffective = logit(priorClamped) + pressure;
  const pctRaw = sigmoid(logitEffective) * 100;
  const pct = Math.max(1, Math.min(99, pctRaw));
  const shift = pct - h.corpusPct;
  const source: CalibrationSource = pressure === 0 ? "prior" : "derived";
  return { pct, source, pressure, supportingCases, shift };
}
