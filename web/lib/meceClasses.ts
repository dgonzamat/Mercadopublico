import type { MeceClassId, Posterior } from "./types";

/**
 * Metadatos de las SEIS narrativas MECE (id + etiquetas bilingües + color) y el
 * argmax del posterior. Vive APARTE de `meceModel.ts` a propósito: este módulo
 * importa SOLO tipos, así que es seguro importarlo desde código alcanzable por
 * un componente cliente (p. ej. `lib/explorer/fields.ts` → el explorer del
 * laboratorio). `meceModel.ts` hace `import { cases } from "./data"` (corpus
 * completo); importarlo desde el cliente embutiría los ~4 MB de `cases.json` en
 * el chunk — el anti-pattern del LCP documentado en CLAUDE.md. `meceModel.ts`
 * re-exporta `MECE_CLASSES` desde aquí, así que sigue siendo la fuente única.
 */

export const MECE_CLASSES: ReadonlyArray<{
  id: MeceClassId;
  label: string;
  labelEn: string;
  color: string;
  /** Hipótesis del marco anterior que esta narrativa absorbe. */
  legacyHypothesis: string;
}> = [
  { id: "mundano_natural", label: "Mundano / natural", labelEn: "Mundane / natural", color: "#5a6b7a", legacyHypothesis: "misidentificación + fenómenos-naturales" },
  { id: "humana_clasificada", label: "Tecnología humana clasificada", labelEn: "Classified human technology", color: "#7a6b23", legacyHypothesis: "programas-clasificados" },
  { id: "adversaria", label: "Tecnología adversaria", labelEn: "Adversary technology", color: "#8a4b23", legacyHypothesis: "tecnología-adversaria" },
  { id: "nohumano_encubierto", label: "No-humano + encubrimiento estatal", labelEn: "Non-human + state cover-up", color: "#6b3a7a", legacyHypothesis: "ingeniería-inversa + tratado-greys + entidades con cover-up" },
  // El azul de `nohumano_abierto` (antes #5b3a8a, un violeta casi idéntico al
  // #6b3a7a de encubierto: ΔE 4.1 en visión normal → indistinguibles) se separó
  // a #5a6cc8: ΔE 16.2 normal / 13.9 CVD, validado con el script del skill
  // dataviz. Mantiene la oscuridad muteada del palette (L*rel 0.17). No revertir
  // sin re-validar la separación del par no-humano.
  { id: "nohumano_abierto", label: "No-humano sin gestión estatal", labelEn: "Non-human, no state management", color: "#5a6cc8", legacyHypothesis: "interdimensional + ontológico" },
  { id: "indet", label: "Indeterminable", labelEn: "Indeterminable", color: "#3a3a3a", legacyHypothesis: "—" },
];

const CLASS_IDS = MECE_CLASSES.map((c) => c.id);

/**
 * Narrativa DOMINANTE de un posterior (argmax). Mismo criterio que `modal()` de
 * meceModel, pero puro y sin dependencias de datos para poder correr en el
 * cliente. Empate → la primera en orden de `MECE_CLASSES`.
 */
export function dominantNarrative(p: Posterior): MeceClassId {
  let best: MeceClassId = "indet";
  let bestP = -Infinity;
  for (const k of CLASS_IDS) {
    const v = p[k] ?? 0;
    if (v > bestP) {
      best = k;
      bestP = v;
    }
  }
  return best;
}

const MECE_LABEL_BY_ID = Object.fromEntries(
  MECE_CLASSES.map((c) => [c.id, c.label]),
) as Record<MeceClassId, string>;

/** Etiqueta (ES) de la narrativa dominante de un posterior. Compartida por la
 *  dimensión y el filtro del explorer para no duplicar el mapeo argmax→label. */
export function dominantNarrativeLabel(p: Posterior): string {
  return MECE_LABEL_BY_ID[dominantNarrative(p)];
}

// ─── Subtipos de la narrativa mundano/natural (drill-down navegable) ─────────
// Viven aquí (data-free, junto a MECE_CLASSES) para que el explorer cliente los
// use como dimensiones sin arrastrar el corpus. meceModel los re-exporta. Los
// colores viven en lib (no en app/components) → fuera del scan de audit-design.

/** Sub-tipos de mundano/natural, promovidos a hipótesis de primer nivel. */
export const MUNDANO_SUBTYPES: ReadonlyArray<{
  key: "misid" | "natural" | "fraude";
  label: string;
  labelEn: string;
  color: string;
}> = [
  { key: "misid", label: "Misidentificación", labelEn: "Misidentification", color: "#5a6b7a" },
  { key: "natural", label: "Fenómeno natural", labelEn: "Natural phenomenon", color: "#4f7a6a" },
  { key: "fraude", label: "Posible fraude", labelEn: "Possible hoax", color: "#8a6b5a" },
];

/** Subtipos de «Misidentificación» (drill-down, capa 2): con qué objeto conocido
 *  se confundió. MECE dentro de misid. Rampa afín al azul-acero de misid. */
export const MISID_SUBTYPES: ReadonlyArray<{
  key: "astronomico" | "aeronave" | "espacial" | "terrestre_otros";
  label: string;
  labelEn: string;
  color: string;
}> = [
  { key: "astronomico", label: "Astronómico", labelEn: "Astronomical", color: "#5f7d94" },
  { key: "aeronave", label: "Aeronave", labelEn: "Aircraft", color: "#6b8ea3" },
  { key: "espacial", label: "Espacial (satélite/reentrada)", labelEn: "Space (satellite/reentry)", color: "#4d6475" },
  // El bucket mayoritario: casos misid cuyo texto no fija un objeto concreto.
  // Etiqueta honesta —no un «otros» que finja precisión que no hay.
  { key: "terrestre_otros", label: "Sin objeto único identificado", labelEn: "No single object identified", color: "#8a8172" },
];
