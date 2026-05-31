/**
 * Mapping of corpus patterns (8a-8r) to the hypotheses they primarily
 * inform. Used to surface "which cases support which hypothesis" on
 * /probabilidades. NOT used for any probability inference — this is a
 * heuristic catalog for transparent display, not a likelihood function.
 */

export const PATTERN_TO_HYPOTHESIS: Record<string, string> = {
  "8a": "pluralidad",
  "8b": "pluralidad",
  "8c": "clasificado",
  "8d": "pluralidad",
  "8e": "pluralidad",
  "8f": "pluralidad",
  "8g": "natural",
  "8h": "pluralidad",
  "8i": "pluralidad",
  "8j": "pluralidad",
  "8k": "interdimensional",
  "8l": "clasificado",
  "8m": "clasificado",
  "8n": "clasificado",
  "8o": "clasificado",
  "8p": "interdimensional",
  "8q": "clasificado",
  "8r": "clasificado",
};

export function casesForHypothesis(
  hypothesisId: string,
  cases: Array<{ id: string; patterns: string[] }>,
): string[] {
  return cases
    .filter((c) => c.patterns.some((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId))
    .map((c) => c.id);
}
