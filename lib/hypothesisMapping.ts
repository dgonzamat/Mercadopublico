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
 */

export const PATTERN_TO_HYPOTHESIS: Record<string, string> = {
  "8a": "pluralidad", // efectos físicos / interacción biológica → algo real
  "8b": "pluralidad", // madre+sub-objetos → estructura intencional
  "8c": "clasificado", // muerte testigos críticos → supresión institucional
  "8d": "pluralidad", // investigadores aparte → diversidad de fuentes
  "8e": "pluralidad", // transparencia tiempo real → eventos reales registrados
  "8f": "pluralidad", // monitoreo riesgo catastrófico → patrón de interés intencional
  "8g": "natural", // persistencia local (Hessdalen, Popocatépetl) → fenómeno repetible
  "8h": "pluralidad", // morfologías múltiples → diversidad de fuentes
  "8i": "pluralidad", // framework de tiers → meta-pattern
  "8j": "pluralidad", // metodología Bayesiana → meta-pattern
  "8k": "interdimensional", // interferencia EM → física exótica
  "8l": "clasificado", // triángulos silenciosos → tecnología terrestre avanzada
  "8m": "clasificado", // cover-up institucional → estado oculta algo
  "8n": "clasificado", // ambigüedad estratégica → gestión estatal
  "8o": "clasificado", // sincronización cultural-institucional → coordinación estatal
  "8p": "interdimensional", // crop circles peer-reviewed → física anómala
  "8q": "clasificado", // ecosystem disclosure → presión sobre el estado
  "8r": "clasificado", // leaks/WikiLeaks → autenticación cruzada del cover-up
};

/**
 * Returns the IDs of cases that exhibit at least one pattern mapped
 * to the given hypothesis. Used by /probabilidades to list evidence
 * per hypothesis.
 */
export function casesForHypothesis(
  hypothesisId: string,
  cases: Array<{ id: string; patterns: string[] }>,
): string[] {
  return cases
    .filter((c) => c.patterns.some((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId))
    .map((c) => c.id);
}

/**
 * Evidence axis for a hypothesis: how many cases support it and how
 * many distinct patterns map to it. Used by IcdProbabilityChart to
 * differentiate hypotheses that share the same ICD-203 band.
 */
export function evidenceCountFor(
  hypothesisId: string,
  cases: Array<{ patterns: string[] }>,
): { caseCount: number; patternCount: number } {
  const supportingCases = cases.filter((c) =>
    c.patterns.some((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId),
  );
  const supportingPatterns = new Set(
    supportingCases.flatMap((c) =>
      c.patterns.filter((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId),
    ),
  );
  return {
    caseCount: supportingCases.length,
    patternCount: supportingPatterns.size,
  };
}
