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
    "psicoespiritual",
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
