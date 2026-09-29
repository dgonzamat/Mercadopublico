import type { MeceClassId, MisidSubtype, MundanoType, Posterior } from "./types";

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
  /** Ancla a la sección de la narrativa en /probabilidades (donde se explica qué
   *  significa y enlaza al listado de casos filtrados). NO usar en vistas que NO
   *  corresponden a la clasificación modal navegable (p. ej. la agregación Σ P de
   *  /calidad es valor esperado fraccional, NO el conteo modal de /probabilidades,
   *  pero sí apunta ahí para que el usuario salte a la explicación de la narrativa). */
  href?: string;
}> = [
  { id: "mundano_natural", label: "Mundano / natural", labelEn: "Mundane / natural", color: "#5a6b7a", legacyHypothesis: "misidentificación + fenómenos-naturales" },
  { id: "humana_clasificada", label: "Tecnología humana clasificada", labelEn: "Classified human technology", color: "#7a6b23", legacyHypothesis: "programas-clasificados", href: "/probabilidades/#hyp-humana_clasificada" },
  { id: "adversaria", label: "Tecnología adversaria", labelEn: "Adversary technology", color: "#8a4b23", legacyHypothesis: "tecnología-adversaria", href: "/probabilidades/#hyp-adversaria" },
  // Las dos narrativas no-humanas apuntan a `#hyp-nohumano`, no a su propio id:
  // /probabilidades renderiza con `consolidateNonHuman`, así que allí existe una
  // sola sección para ambas. Enlazar a `#hyp-nohumano_encubierto` navegaba a la
  // página y no hacía scroll a ninguna parte — un fallo mudo.
  { id: "nohumano_encubierto", label: "No-humano + encubrimiento estatal", labelEn: "Non-human + state cover-up", color: "#6b3a7a", legacyHypothesis: "ingeniería-inversa + tratado-greys + entidades con cover-up", href: "/probabilidades/#hyp-nohumano" },
  // El azul de `nohumano_abierto` (antes #5b3a8a, un violeta casi idéntico al
  // #6b3a7a de encubierto: ΔE 4.1 en visión normal → indistinguibles) se separó
  // a #5a6cc8: ΔE 16.2 normal / 13.9 CVD, validado con el script del skill
  // dataviz. Mantiene la oscuridad muteada del palette (L*rel 0.17). No revertir
  // sin re-validar la separación del par no-humano.
  { id: "nohumano_abierto", label: "No-humano sin gestión estatal", labelEn: "Non-human, no state management", color: "#5a6cc8", legacyHypothesis: "interdimensional + ontológico", href: "/probabilidades/#hyp-nohumano" },
  { id: "indet", label: "Indeterminable", labelEn: "Indeterminable", color: "#3a3a3a", legacyHypothesis: "—", href: "/probabilidades/#hyp-indet" },
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

/** Sub-tipos de mundano/natural (MODELO DE DATOS: `mundanoType`). Se conservan
 *  como vocabulario del dato y de sus validadores, pero NO se muestran tal cual:
 *  «misid» describe el error del testigo, no lo que era el objeto, así que en
 *  pantalla se abre en las clases concretas de `MISID_SUBTYPES` (ver
 *  `PROSAIC_CLASSES`). Su `label` es la del agregado interno, no una etiqueta
 *  de UI. */
export const MUNDANO_SUBTYPES: ReadonlyArray<{
  key: "misid" | "natural" | "fraude";
  label: string;
  labelEn: string;
  color: string;
}> = [
  { key: "misid", label: "Objeto convencional", labelEn: "Conventional object", color: "#5a6b7a" },
  { key: "natural", label: "Fenómeno natural", labelEn: "Natural phenomenon", color: "#4f7a6a" },
  { key: "fraude", label: "Posible fraude", labelEn: "Possible hoax", color: "#8a6b5a" },
];

/** Clases de OBJETO dentro de mundanoType="misid" (`misidSubtype`): qué era el
 *  objeto. Se muestran como clases de PRIMER NIVEL (no como drill-down bajo una
 *  «misidentificación»): el sitio nombra el objeto, no el error del testigo.
 *  Los globos se archivan bajo `aeronave` por convención del corpus. Colores
 *  separados entre sí (ΔE ≥ 12) y del gris de «Indeterminado» (INDET_COLOR), con
 *  el que antes chocaba `terrestre_otros`; el bucket mayoritario conserva el
 *  azul-acero histórico. */
export const MISID_SUBTYPES: ReadonlyArray<{
  key: "astronomico" | "aeronave" | "espacial" | "terrestre_otros";
  label: string;
  labelEn: string;
  color: string;
}> = [
  { key: "astronomico", label: "Objeto astronómico", labelEn: "Astronomical object", color: "#3d6a8f" },
  { key: "aeronave", label: "Aeronave o globo", labelEn: "Aircraft or balloon", color: "#7d95a6" },
  { key: "espacial", label: "Cohete, satélite o reentrada", labelEn: "Rocket, satellite or reentry", color: "#3f4e5a" },
  // El bucket mayoritario: el análisis inclina a un objeto convencional pero no
  // fija cuál. Recoge también los casos misid sin `misidSubtype`.
  { key: "terrestre_otros", label: "Objeto convencional no precisado", labelEn: "Conventional object, not pinned down", color: "#5a6b7a" },
];

export type ProsaicKey = (typeof MISID_SUBTYPES)[number]["key"] | "natural" | "fraude";

/** Las seis clases prosaicas que se MUESTRAN (primer nivel): las cuatro de
 *  objeto + fenómeno natural + posible fraude. MECE dentro de mundano_natural. */
export const PROSAIC_CLASSES: ReadonlyArray<{ key: ProsaicKey; label: string; labelEn: string; color: string }> = [
  ...MISID_SUBTYPES,
  { key: "natural", label: "Fenómeno natural", labelEn: "Natural phenomenon", color: "#4f7a6a" },
  { key: "fraude", label: "Posible fraude", labelEn: "Possible hoax", color: "#8a6b5a" },
];

/** Clase prosaica mostrada para un caso: `mundanoType` + `misidSubtype` del dato.
 *  Sin `mundanoType` el modelo ya caía en misid (M2 de audit-consistency lo
 *  vigila); misid sin subtipo → «objeto convencional no precisado». */
export function prosaicKey(mundanoType?: MundanoType, misidSubtype?: MisidSubtype): ProsaicKey {
  if (mundanoType === "natural" || mundanoType === "fraude") return mundanoType;
  return misidSubtype ?? "terrestre_otros";
}
