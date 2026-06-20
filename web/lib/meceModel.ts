/**
 * MODELO MECE — probabilidades COMPARABLES (en migración, paso 1).
 * ================================================================
 *
 * Reemplaza el esquema viejo (10 hipótesis existenciales solapadas, no
 * comparables; ver lib/hypotheses.ts + lib/hypothesisMapping.ts) por un
 * POSTERIOR POR CASO sobre explicaciones mutuamente excluyentes y exhaustivas
 * (MECE) que suma 1. El agregado del corpus reparte el 100% entre clases.
 *
 * COEXISTENCIA: durante la migración este módulo NO está cableado a las
 * páginas vivas. Lee `case.posterior` si existe; si no, deriva un posterior
 * PROVISIONAL desde los campos legacy (probability + evidenceContribution),
 * para poder ver el modelo sobre los 200 casos antes de recodificarlos a mano.
 *
 * COMPARABILIDAD Y CORRELACIÓN: el agregado E_j = Σ_i P(clase_j | caso_i) es
 * lineal, así que vale aunque los casos estén correlacionados — esquiva el
 * problema de independencia. Sigue siendo subjetivo, no calibrado.
 *
 * ALCANCE: aplica a casos de avistamiento/incidente. Los casos-documento
 * (category === "document") se EXCLUYEN: la partición "¿qué era el objeto?"
 * no les aplica.
 */

import type { MeceClassId, Posterior, UAPCase } from "./types";
import { cases as ALL_CASES } from "./data";

export const MECE_CLASSES: ReadonlyArray<{
  id: MeceClassId;
  label: string;
  labelEn: string;
  color: string;
}> = [
  { id: "mundano", label: "Mundano / identificación errónea", labelEn: "Mundane / misidentification", color: "#5a6b7a" },
  { id: "natural_desc", label: "Fenómeno natural no catalogado", labelEn: "Uncatalogued natural phenomenon", color: "#3f7d5a" },
  { id: "clasificada", label: "Tecnología humana clasificada", labelEn: "Classified human technology", color: "#7a6b23" },
  { id: "adversaria", label: "Tecnología de otro Estado", labelEn: "Another state's technology", color: "#8a4b23" },
  { id: "no_humano", label: "Inteligencia no humana", labelEn: "Non-human intelligence", color: "#6b3a7a" },
  { id: "indet", label: "Indeterminable", labelEn: "Indeterminable", color: "#3a3a3a" },
];

const CLASS_IDS = MECE_CLASSES.map((c) => c.id);

export function emptyPosterior(): Posterior {
  return { mundano: 0, natural_desc: 0, clasificada: 0, adversaria: 0, no_humano: 0, indet: 0 };
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

// ─── Sembrado provisional desde campos legacy ────────────────────────────

/** Hipótesis vieja → clase MECE (las no listadas no aportan al sembrado). */
const HYP_TO_CLASS: Record<string, MeceClassId> = {
  misidentificacion: "mundano",
  "fenomenos-naturales": "natural_desc",
  "programas-clasificados": "clasificada",
  "tecnologia-adversaria": "adversaria",
  "entidades-no-humanas": "no_humano",
  interdimensional: "no_humano",
  "ontologico-no-materialista": "no_humano",
  "tratado-greys": "no_humano",
  "ingenieria-inversa": "no_humano",
  // heterogeneidad: meta-claim, no aporta a una clase concreta
};

const STRENGTH_W: Record<string, number> = {
  minimal: 0.005,
  modest: 0.02,
  substantial: 0.05,
  "category-breaking": 0.15,
};

/**
 * Posterior PROVISIONAL para un caso sin `posterior` explícito. Heurística
 * transparente (a reemplazar en la migración por valores afinados a mano):
 *   - `anomalous` = probability/100, acotado — masa de "explicación real".
 *   - el resto (1−anomalous) va a mundano (mayoría) + indet.
 *   - la masa `anomalous` se reparte entre {clasificada, adversaria,
 *     no_humano, natural_desc} según las contribuciones `supports` legacy;
 *     si no hay ninguna, va a `indet` (no sabemos a qué clase asignarla).
 */
export function seedPosterior(c: UAPCase): Posterior {
  const anomalous = Math.max(0.05, Math.min(0.95, (c.probability ?? 50) / 100));
  const mundaneMass = 1 - anomalous;

  const p = emptyPosterior();
  p.mundano = mundaneMass * 0.7;
  p.indet = mundaneMass * 0.3;

  const w: Partial<Record<MeceClassId, number>> = {};
  let totalW = 0;
  for (const e of c.evidenceContribution ?? []) {
    if (e.direction !== "supports") continue;
    const cls = HYP_TO_CLASS[e.hypothesisId];
    if (!cls || cls === "mundano") continue; // mundano ya cubierto por masa mundana
    const ww = STRENGTH_W[e.strength] ?? 0.005;
    w[cls] = (w[cls] ?? 0) + ww;
    totalW += ww;
  }

  if (totalW > 0) {
    for (const cls of CLASS_IDS) if (w[cls]) p[cls] += anomalous * (w[cls]! / totalW);
  } else {
    // anomalía sin clase asignable → indeterminable
    p.indet += anomalous;
  }
  return normalize(p);
}

/** Posterior efectivo: el declarado, o el sembrado provisional. */
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

/** E_j = Σ_i P(clase_j | caso_i). Suma = nº de ítems. Comparable y lineal. */
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
  const bump = new Set<MeceClassId>();
  for (const r of [...rows].sort((a, b) => b.rem - a.rem)) {
    if (left <= 0) break;
    bump.add(r.id);
    left--;
  }
  const out = emptyPosterior();
  for (const r of rows) out[r.id] = r.floor + (bump.has(r.id) ? 1 : 0);
  return out;
}

export interface ScoredCase {
  id: string;
  name: string;
  tier: string;
  posterior: Posterior;
  seeded: boolean;
}

/**
 * Posteriores de los casos del corpus a los que aplica el modelo
 * (excluye category === "document"). Default: corpus completo.
 */
export function corpusPosteriors(cases: UAPCase[] = ALL_CASES as UAPCase[]): ScoredCase[] {
  return cases
    .filter((c) => c.category !== "document")
    .map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      posterior: posteriorFor(c),
      seeded: !c.posterior,
    }));
}
