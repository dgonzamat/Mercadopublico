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
  { id: "nohumano_abierto", label: "No-humano sin gestión estatal", labelEn: "Non-human, no state management", color: "#5b3a8a", legacyHypothesis: "interdimensional + ontológico" },
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
