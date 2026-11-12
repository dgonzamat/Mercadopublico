// Enlaces entre casos usados como sustantivo. `linkCaseRefs` (lib/caseRefs.tsx)
// dibujaba cada `[[slug]]` solo como «↗», así que «por el de [[x]]» o «como
// mostró la AARO en [[x]] y GoFast» se leía «por el de ↗» y la frase quedaba sin
// sustantivo. Desde nov 2026 el enlace muestra el nombre corto del caso, pero la
// frase sigue debiendo nombrar el caso por sí misma. La auditoría de noviembre de
// 2026 lo encontró en Burgos 1975, el golfo de Omán y los cohetes fantasma de
// Finlandia. Lo comparten E57 (audit-consistency) y su prueba unitaria.

const NOUN_SLOT = /(?:^|[\s(«"])(el de|la de|los de|las de|lo de|en|por|del|al|con|desde|sobre|entre|según|como en|of|in|by|from|with|on|at)\s+\[\[([a-z0-9-]+)\]\]/gi;

/** Devuelve [{ before, slug }] por cada `[[slug]]` que ocupa el lugar de un
 *  sustantivo (tras un artículo o una preposición). */
export function refsAsNoun(text) {
  if (!text || !String(text).includes("[[")) return [];
  const out = [];
  for (const m of String(text).matchAll(NOUN_SLOT)) out.push({ before: m[1], slug: m[2] });
  return out;
}

/** Campos de prosa que la ficha renderiza con linkCaseRefs. */
export const PROSE_FIELDS = ["summary", "summary_en", "whatHappened", "whatHappened_en", "whyMatters", "whyMatters_en"];

/** Hallazgos de una ficha: [{ field, before, slug }]. */
export function caseRefNounFindings(c) {
  const out = [];
  const fields = [...PROSE_FIELDS.map((f) => [f, c[f]]), ...(c.evidence || []).map((t, i) => [`evidence[${i}]`, t]), ...(c.evidence_en || []).map((t, i) => [`evidence_en[${i}]`, t])];
  for (const [field, t] of fields) for (const r of refsAsNoun(t)) out.push({ field, ...r });
  return out;
}
