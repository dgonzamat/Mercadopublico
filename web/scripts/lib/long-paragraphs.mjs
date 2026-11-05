// Párrafos que en el móvil se leen como un muro. E52 corta en 1.200 caracteres,
// pero en una pantalla de 390 px eso son 25 a 31 líneas, y la auditoría de
// noviembre de 2026 encontró 401 muros en 283 fichas que la regla aprobaba.
// La fase 1 del plan baja el umbral a 900 (unas 19 líneas). Lo comparten E59
// (audit-consistency) y su prueba unitaria.

export const MAX_PARAGRAPH = 900;

/** Campos de relato que la ficha parte en párrafos por «\n\n». */
export const STORY_FIELDS = ["whatHappened", "whatHappened_en", "whyMatters", "whyMatters_en"];

/** Hallazgos de una ficha: [{ field, index, length }] por cada párrafo de más de `max` caracteres. */
export function longParagraphs(c, max = MAX_PARAGRAPH) {
  const out = [];
  for (const field of STORY_FIELDS) {
    const t = c[field];
    if (typeof t !== "string") continue;
    t.split("\n\n").forEach((p, index) => {
      if (p.length > max) out.push({ field, index, length: p.length });
    });
  }
  return out;
}
