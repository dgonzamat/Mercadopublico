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
 * its pattern list (each mapped pattern = +0.5 to the mapped hypothesis).
 *
 * Two outputs:
 *   - pressureFor(h, cases) → continuous score (Σ supports − Σ weakens)
 *   - driftFor(h, cases) → comparison of implied vs calibrated probability
 *
 * Umbrella hypotheses inherit contributions from their subclasses
 * (same UMBRELLA_SUBCLASSES relation used by evidenceCountFor).
 */

export const STRENGTH_WEIGHT: Record<string, number> = {
  minimal: 0.5,
  modest: 2,
  substantial: 5,
  "category-breaking": 15,
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
 * Effective calibration — Option C: derived from prior + pressure, with
 * optional manual override.
 *
 * Resolution order:
 *   1. If `corpusPctOverride` is declared on the hypothesis, use it.
 *      Source = "override". Used by antecedent/derived hypotheses whose
 *      pct doesn't come from corpus evidence.
 *   2. Otherwise, compute: effective = prior + pressure × SHIFT_FACTOR
 *      Source = "derived" when pressure ≠ 0, "prior" when pressure = 0.
 *
 * The shift factor (0.5 pp per pressure point) means:
 *   - 1 modest contribution (+2 pressure) = +1 pp shift
 *   - 1 substantial contribution (+5 pressure) = +2.5 pp shift
 *   - 1 category-breaking contribution (+15 pressure) = +7.5 pp shift
 *   - 20 minimal contributions (+10 pressure) = +5 pp shift
 *
 * This makes a single case never dramatic but corpus accumulation
 * meaningful — matching the marginal-return principle from /about Ch. 2.
 */
export const PRESSURE_SHIFT_FACTOR = 0.5;

export type CalibrationSource = "override" | "derived" | "prior";

interface HypothesisLike {
  id: string;
  corpusPct: number;
  corpusPctOverride?: number;
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
  const shift = pressure * PRESSURE_SHIFT_FACTOR;
  const pctRaw = h.corpusPct + shift;
  const pct = Math.max(1, Math.min(99, pctRaw));
  const source: CalibrationSource = pressure === 0 ? "prior" : "derived";
  return { pct, source, pressure, supportingCases, shift };
}
