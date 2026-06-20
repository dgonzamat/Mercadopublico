/**
 * MODELO MECE — probabilidades COMPARABLES (en migración, paso 1).
 * ================================================================
 *
 * Reemplaza la AGREGACIÓN del esquema viejo (10 hipótesis existenciales
 * solapadas, no comparables) por un POSTERIOR POR CASO sobre explicaciones
 * mutuamente excluyentes y exhaustivas (MECE) que suma 1. El agregado del
 * corpus reparte el 100% entre clases.
 *
 * PRESERVA LAS 10 HIPÓTESIS:
 *   - 5 son hojas directas: mundano (misidentificación), natural
 *     (fenómenos-naturales), clasificada (programas-clasificados), adversaria
 *     (tecnología-adversaria), ing_inversa (ingeniería-inversa).
 *   - 3 hojas son las subclases del paraguas: interdimensional, ontologico,
 *     tratado.
 *   - entidades-no-humanas = SUMA de esas 3 subclases (vista derivada).
 *   - heterogeneidad = 1 − mundano (vista derivada; ≥1 caso anómalo).
 *   - misidentificación como pre-filtro del universo previo sigue como claim
 *     aparte (fuera del corpus), no como clase de esta partición.
 *
 * COEXISTENCIA: durante la migración este módulo NO está cableado a las
 * páginas vivas. Lee `case.posterior` si existe; si no, deriva un posterior
 * PROVISIONAL desde los campos legacy.
 *
 * COMPARABILIDAD/CORRELACIÓN: E_j = Σ_i P(clase_j|caso_i) es lineal, así que
 * el agregado vale aunque los casos estén correlacionados. Sigue siendo
 * subjetivo, no calibrado.
 *
 * ALCANCE: casos de avistamiento/incidente. Los casos-documento se excluyen.
 */

import {
  ENTIDADES_SUBCLASSES,
  type MeceClassId,
  type Posterior,
  type UAPCase,
} from "./types";
import { cases as ALL_CASES } from "./data";

export const MECE_CLASSES: ReadonlyArray<{
  id: MeceClassId;
  label: string;
  labelEn: string;
  color: string;
  /** Hipótesis del modelo viejo que esta hoja preserva. */
  legacyHypothesis: string;
}> = [
  { id: "mundano", label: "Identificación errónea", labelEn: "Misidentification", color: "#5a6b7a", legacyHypothesis: "misidentificacion" },
  { id: "natural_desc", label: "Fenómeno natural", labelEn: "Natural phenomenon", color: "#3f7d5a", legacyHypothesis: "fenomenos-naturales" },
  { id: "clasificada", label: "Programas clasificados", labelEn: "Classified programs", color: "#7a6b23", legacyHypothesis: "programas-clasificados" },
  { id: "adversaria", label: "Tecnología adversaria", labelEn: "Adversary technology", color: "#8a4b23", legacyHypothesis: "tecnologia-adversaria" },
  { id: "ing_inversa", label: "Ingeniería inversa", labelEn: "Reverse engineering", color: "#9a5b3a", legacyHypothesis: "ingenieria-inversa" },
  { id: "interdimensional", label: "Interdimensional", labelEn: "Interdimensional", color: "#5b3a8a", legacyHypothesis: "interdimensional" },
  { id: "ontologico", label: "Ontológico no materialista", labelEn: "Non-materialist ontological", color: "#6b3a7a", legacyHypothesis: "ontologico-no-materialista" },
  { id: "tratado", label: "Tratado formal (greys)", labelEn: "Formal treaty (greys)", color: "#7a3a6b", legacyHypothesis: "tratado-greys" },
  { id: "indet", label: "Indeterminable", labelEn: "Indeterminable", color: "#3a3a3a", legacyHypothesis: "—" },
];

const CLASS_IDS = MECE_CLASSES.map((c) => c.id);

export function emptyPosterior(): Posterior {
  return {
    mundano: 0, natural_desc: 0, clasificada: 0, adversaria: 0, ing_inversa: 0,
    interdimensional: 0, ontologico: 0, tratado: 0, indet: 0,
  };
}

export function sumPosterior(p: Posterior): number {
  return CLASS_IDS.reduce((s, k) => s + (p[k] || 0), 0);
}

function normalize(p: Posterior): Posterior {
  const s = sumPosterior(p);
  if (s <= 0) return { ...emptyPosterior(), indet: 1 };
  const out = emptyPosterior();
  for (const k of CLASS_IDS) out[k] = p[k] / s;
  return out;
}

// ─── Vistas DERIVADAS (preservan hipótesis del modelo viejo) ──────────────

/** entidades-no-humanas = suma de las 3 subclases. */
export function entidadesNoHumanas(p: Posterior): number {
  return ENTIDADES_SUBCLASSES.reduce((s, k) => s + (p[k] || 0), 0);
}

/** heterogeneidad = 1 − mundano (probabilidad de que el caso sea anómalo). */
export function heterogeneidad(p: Posterior): number {
  return 1 - (p.mundano || 0);
}

// ─── Fallback de posterior ───────────────────────────────────────────────
//
// Todos los casos no-documento llevan un `posterior` hand-coded (invariante M1
// del audit). Esta función es solo una red de seguridad para un caso futuro
// sin posterior: deja la masa anómala como indeterminable (no inventa clase).

export function seedPosterior(c: UAPCase): Posterior {
  const anomalous = Math.max(0.05, Math.min(0.95, (c.probability ?? 50) / 100));
  const p = emptyPosterior();
  p.mundano = (1 - anomalous) * 0.7;
  p.indet = (1 - anomalous) * 0.3 + anomalous;
  return normalize(p);
}

export function posteriorFor(c: UAPCase): Posterior {
  return c.posterior ? normalize(c.posterior) : seedPosterior(c);
}

// ─── Agregación comparable ───────────────────────────────────────────────

export function modal(p: Posterior): { id: MeceClassId; prob: number } {
  let best: MeceClassId = "indet";
  let bestP = -1;
  for (const k of CLASS_IDS) if (p[k] > bestP) { best = k; bestP = p[k]; }
  return { id: best, prob: bestP };
}

/** E_j = Σ_i P(clase_j|caso_i). Suma = nº de ítems. */
export function expectedCounts(items: Array<{ posterior: Posterior }>): Posterior {
  const out = emptyPosterior();
  for (const it of items) for (const k of CLASS_IDS) out[k] += it.posterior[k];
  return out;
}

/** % enteros por mayor-resto (Hamilton): SIEMPRE suman 100. */
export function roundedShares(items: Array<{ posterior: Posterior }>): Posterior {
  const counts = expectedCounts(items);
  const n = items.length || 1;
  const rows = CLASS_IDS.map((id) => {
    const v = (counts[id] / n) * 100;
    return { id, floor: Math.floor(v), rem: v - Math.floor(v) };
  });
  let left = 100 - rows.reduce((s, r) => s + r.floor, 0);
  const out = emptyPosterior();
  const bump = new Set<MeceClassId>();
  for (const r of [...rows].sort((a, b) => b.rem - a.rem)) {
    if (left <= 0) break;
    bump.add(r.id);
    left--;
  }
  for (const r of rows) out[r.id] = r.floor + (bump.has(r.id) ? 1 : 0);
  return out;
}

export interface ScoredCase {
  id: string;
  name: string;
  tier: string;
  category: string;
  posterior: Posterior;
  seeded: boolean;
}

/** Casos del corpus a los que aplica el modelo (excluye documentos). */
export function corpusPosteriors(cases: UAPCase[] = ALL_CASES as UAPCase[]): ScoredCase[] {
  return cases
    .filter((c) => c.category !== "document")
    .map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      category: c.category,
      posterior: posteriorFor(c),
      seeded: !c.posterior,
    }));
}
