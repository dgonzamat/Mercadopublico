// Texto del redactor a la vista en las notas de fuentes y en las descripciones
// de documentos. E47 y E56 miran la prosa del caso, pero no estas notas, y la
// auditoría de noviembre de 2026 halló en ellas nombres internos de campos
// («según whatHappened»), notas de trabajo («no es accesible desde el entorno
// de revisión», «enlace heredado») y direcciones web crudas. Lo citado entre
// comillas es de la fuente y queda fuera. Lo comparten E60 (audit-consistency)
// y su prueba unitaria.

// «posterior» no entra: en español es un adjetivo común («un informe posterior»).
const FIELD = /\b(?:whatHappened|whyMatters|classBasis|summary_en|name_en|note_en|mundanoType|evidenceReviewed|featuredDoc|primaryDocument)\b|\bevidence(?:_en)?\[\d*\]/;

const WORKNOTE = new RegExp(
  [
    "entorno de revisi[oó]n",
    "review environment",
    "(?:desde|en) (?:este|el) entorno",
    "(?:from|in) this (?:environment|session|container|sandbox)",
    "desde aqu[ií]",
    "\\bfrom here\\b",
    "enlace heredado",
    "inherited link",
    "esta ficha",
    "this entry\\b",
  ].join("|"),
  "i",
);

const RAW_URL = /\bhttps?:\/\/\S+|\bwww\.[a-z0-9-]+\.[a-z]{2,}\S*/i;

const unquote = (t) => t.replace(/«[^»]*»|“[^”]*”|"[^"\n]*"/g, " ");

/** Revisa un texto suelto: [{ kind, match }], kind ∈ campo | nota | url. */
export function noteIssues(text) {
  if (typeof text !== "string" || !text) return [];
  const t = unquote(text);
  const out = [];
  for (const [kind, re] of [["campo", FIELD], ["nota", WORKNOTE], ["url", RAW_URL]]) {
    const m = t.match(re);
    if (m) out.push({ kind, match: m[0] });
  }
  return out;
}

/** Hallazgos de una ficha en sus notas de fuentes y descripciones de documentos. */
export function noteFindings(c) {
  const texts = [];
  (c.sources || []).forEach((s, i) => {
    for (const k of ["note", "note_en"]) texts.push([`sources[${i}].${k}`, s?.[k]]);
  });
  const docs = [...(c.documents || []).map((d, i) => [`documents[${i}]`, d]), ["primaryDocument", c.primaryDocument], ["featuredDoc", c.featuredDoc]];
  for (const [where, d] of docs) {
    if (!d) continue;
    for (const k of ["description", "description_en", "caption", "caption_en"]) texts.push([`${where}.${k}`, d[k]]);
  }
  const out = [];
  for (const [field, t] of texts) for (const h of noteIssues(t)) out.push({ field, ...h });
  return out;
}
