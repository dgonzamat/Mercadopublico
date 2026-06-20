/**
 * MODELO MECE — probabilidades COMPARABLES.
 * =========================================
 *
 * Reemplaza la AGREGACIÓN del esquema viejo (hipótesis existenciales solapadas,
 * no comparables) por un POSTERIOR POR CASO sobre SEIS NARRATIVAS mutuamente
 * excluyentes y exhaustivas (MECE) que suma 1. El agregado del corpus reparte
 * el 100% entre las narrativas.
 *
 * SEIS NARRATIVAS CONJUNTAS (objeto + postura institucional):
 *   - mundano_natural: objeto conocido / ilusión / error / fraude o fenómeno
 *     natural. Absorbe «misidentificación» y «fenómenos naturales».
 *   - humana_clasificada: programa secreto propio o aliado (encubrimiento
 *     intrínseco). Antigua «programas clasificados».
 *   - adversaria: tecnología de vigilancia de otro Estado.
 *   - nohumano_encubierto: inteligencia/tecnología no humana que un Estado
 *     conoce, controla u oculta — incluye ingeniería inversa y la narrativa de
 *     tratado. Es la combinación «no-humano + ocultación estatal» como clase.
 *   - nohumano_abierto: fenómeno no humano que ninguna institución controla ni
 *     oculta (sistema de control tipo Vallée; interdimensional / ontológico).
 *   - indet: evidencia insuficiente para asignar una narrativa.
 *
 * VISTAS DERIVADAS:
 *   - entidades-no-humanas = nohumano_encubierto + nohumano_abierto.
 *   - heterogeneidad = 1 − mundano_natural (≥1 caso anómalo).
 *
 * Las hipótesis del marco anterior se conservan como mapeo dentro de cada
 * narrativa (campo legacyHypothesis), no como clases independientes.
 *
 * FALLBACK: si un caso no trae `posterior`, seedPosterior deriva uno provisional
 * desde `probability` (sin pesos ni contribuciones — esos campos se eliminaron).
 *
 * COMPARABILIDAD/CORRELACIÓN: E_j = Σ_i P(narrativa_j|caso_i) es lineal, así que
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

export function emptyPosterior(): Posterior {
  return {
    mundano_natural: 0, humana_clasificada: 0, adversaria: 0,
    nohumano_encubierto: 0, nohumano_abierto: 0, indet: 0,
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
  return 1 - (p.mundano_natural || 0);
}

// ─── Fallback de posterior ───────────────────────────────────────────────
//
// Todos los casos no-documento llevan un `posterior` hand-coded (invariante M1
// del audit). Esta función es solo una red de seguridad para un caso futuro
// sin posterior: deja la masa anómala como indeterminable (no inventa clase).

export function seedPosterior(c: UAPCase): Posterior {
  const anomalous = Math.max(0.05, Math.min(0.95, (c.probability ?? 50) / 100));
  const p = emptyPosterior();
  p.mundano_natural = (1 - anomalous) * 0.7;
  p.indet = (1 - anomalous) * 0.3 + anomalous;
  return normalize(p);
}

export function posteriorFor(c: UAPCase): Posterior {
  return c.posterior ? normalize(c.posterior) : seedPosterior(c);
}

/**
 * Clasificación forzada: redistribuye la masa `indet` proporcionalmente sobre
 * las 5 narrativas sustantivas, de modo que ningún caso quede en
 * indeterminable. Si un caso no tiene soporte sustantivo, cae en mundano/natural
 * (default prosaico). Idempotente: aplicarla dos veces da el mismo resultado.
 */
export function classifiedPosterior(p: Posterior): Posterior {
  const out = emptyPosterior();
  const subst = CLASS_IDS.filter((k) => k !== "indet");
  const total = subst.reduce((s, k) => s + (p[k] || 0), 0);
  if (total <= 0) { out.mundano_natural = 1; return out; }
  for (const k of subst) out[k] = (p[k] || 0) / total;
  return out;
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
  mundanoType?: UAPCase["mundanoType"];
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
      mundanoType: c.mundanoType,
    }));
}

/**
 * Casos-documento con su "lean" evidencial: a qué narrativa inclina el
 * contenido del documento (NO «qué era el objeto» — un documento no tiene
 * objeto). Es un eje distinto del de incidentes; se muestra aparte y NUNCA
 * se suma con `corpusPosteriors`. Los documentos sin posterior declarado caen
 * en `indet` (no inclinan a ninguna narrativa: puro proceso/inconcluso).
 */
export function documentPosteriors(cases: UAPCase[] = ALL_CASES as UAPCase[]): ScoredCase[] {
  return cases
    .filter((c) => c.category === "document")
    .map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      category: c.category,
      posterior: c.posterior ? normalize(c.posterior) : { ...emptyPosterior(), indet: 1 },
      seeded: !c.posterior,
      mundanoType: c.mundanoType,
    }));
}
