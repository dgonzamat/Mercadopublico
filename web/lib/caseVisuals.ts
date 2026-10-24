import type { DocEmbed, UAPCase, VisualRole } from "@/lib/types";

const isContext = (d: { title?: string }) => /^(Contexto|Context)\b/.test(d.title ?? "");

/** Papel de un elemento: el que declara el dato y, si falta (la sonda E53 lo
 *  impide en el corpus), el que se deduce del tipo. */
export function visualRole(d: DocEmbed): VisualRole {
  if (d.role) return d.role;
  if (d.type === "video") return "prueba";
  if (d.type === "image") return isContext(d) ? "contexto" : "prueba";
  return "documento";
}

/** Todos los elementos visuales de una ficha —`documents`, `primaryDocument`
 *  y `featuredDoc`— como una sola lista, repartida por papel (especificación
 *  de la ficha, oct 2026). La página ya no decide la posición por el campo en
 *  que está guardado un elemento ni por su tipo, sino solo por su papel:
 *  `top` (la prueba, antes del relato, hasta dos), `paper` (el papeleo y la
 *  prueba que no cupo arriba) y `context` (al final). */
export function caseVisuals(c: UAPCase): { top: DocEmbed[]; paper: DocEmbed[]; context: DocEmbed[] } {
  const items: DocEmbed[] = [];
  if (c.featuredDoc) {
    const f = c.featuredDoc;
    items.push({ type: "link", src: f.url, title: f.label, title_en: f.label_en, description: f.note, description_en: f.note_en, role: f.role ?? "documento" });
  }
  items.push(...(c.documents ?? []));
  if (c.primaryDocument) {
    const p = c.primaryDocument;
    items.push({ type: "image", src: p.url, title: p.caption, title_en: p.caption_en, source: p.source, license: p.license, fallbackUrl: p.href, role: p.role });
  }
  const proof = items.filter((d) => visualRole(d) === "prueba");
  return {
    top: proof.slice(0, 2),
    paper: [...proof.slice(2), ...items.filter((d) => visualRole(d) === "documento")],
    context: items.filter((d) => visualRole(d) === "contexto"),
  };
}
