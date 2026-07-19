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

// MECE_CLASSES vive en `./meceClasses` (data-free) para poder importarlo desde
// el cliente sin arrastrar el corpus. Se re-exporta aquí para no romper a sus
// consumidores existentes (app/calidad, este módulo).
export { MECE_CLASSES } from "./meceClasses";
import { MECE_CLASSES } from "./meceClasses";

/** Color neutro/mudo de la narrativa «Indeterminado» en el donut navegable
 *  (más claro que el #3a3a3a de MECE_CLASSES para que se vea sobre el fondo
 *  oscuro de la home). Los documentos sin lean y los incidentes inconclusos caen
 *  aquí. Vive en lib (no en app/components) → fuera del scan de audit-design D3. */
export const INDET_COLOR = "#8a8172";

const CLASS_IDS = MECE_CLASSES.map((c) => c.id);

// MUNDANO_SUBTYPES / MISID_SUBTYPES viven en `./meceClasses` (data-free) para
// que el explorer cliente los use como dimensiones sin arrastrar el corpus. Se
// re-exportan aquí para no romper a sus consumidores (MeceChart, /cases,
// /probabilidades).
export { MUNDANO_SUBTYPES, MISID_SUBTYPES } from "./meceClasses";
// `MUNDANO_SUBTYPES` se usa localmente (expandedHypotheses) → import local
// además del re-export (el re-export no crea binding). `MISID_SUBTYPES` solo se
// re-exporta (no se usa aquí), así que no se importa para no gatillar noUnusedLocals.
import { MUNDANO_SUBTYPES } from "./meceClasses";

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

export interface HypRow { key: string; label: string; labelEn: string; color: string; count: number; }

/**
 * Conteos sobre el conjunto EXPANDIDO de hipótesis (clasificación forzada):
 * mundano/natural se abre en sus 3 sub-tipos según el `mundanoType` de cada caso,
 * y —con consolidateNonHuman— las dos no-humanas se funden en una. Ningún caso
 * queda en indeterminable. Para 1 ítem, los counts son su distribución (suman 1).
 */
type HypInput = { posterior: Posterior; mundanoType?: UAPCase["mundanoType"] };
export function expandedHypotheses(items: ReadonlyArray<HypInput>, opts: { consolidateNonHuman?: boolean; keepIndet?: boolean } = {}): HypRow[] {
  const byId = Object.fromEntries(MECE_CLASSES.map((c) => [c.id, c])) as Record<MeceClassId, (typeof MECE_CLASSES)[number]>;
  const acc: Record<string, number> = {};
  for (const s of items) {
    // keepIndet: conserva la masa «indeterminado» como narrativa propia (usa el
    // posterior crudo normalizado). Si no, se reparte a la fuerza sobre las 5
    // sustantivas (clasificación forzada clásica, sin indeterminado).
    const cp = opts.keepIndet ? normalize(s.posterior) : classifiedPosterior(s.posterior);
    acc[s.mundanoType ?? "misid"] = (acc[s.mundanoType ?? "misid"] || 0) + cp.mundano_natural;
    acc.humana_clasificada = (acc.humana_clasificada || 0) + cp.humana_clasificada;
    acc.adversaria = (acc.adversaria || 0) + cp.adversaria;
    if (opts.consolidateNonHuman) {
      acc.nohumano = (acc.nohumano || 0) + cp.nohumano_encubierto + cp.nohumano_abierto;
    } else {
      acc.nohumano_encubierto = (acc.nohumano_encubierto || 0) + cp.nohumano_encubierto;
      acc.nohumano_abierto = (acc.nohumano_abierto || 0) + cp.nohumano_abierto;
    }
    if (opts.keepIndet) acc.indet = (acc.indet || 0) + cp.indet;
  }
  const meta: Record<string, { label: string; labelEn: string; color: string }> = {
    humana_clasificada: byId.humana_clasificada,
    adversaria: byId.adversaria,
    nohumano_encubierto: byId.nohumano_encubierto,
    nohumano_abierto: byId.nohumano_abierto,
    nohumano: { label: "No-humano", labelEn: "Non-human", color: byId.nohumano_abierto.color },
    // «Indeterminado» como narrativa navegable propia (color visible sobre fondo oscuro).
    indet: { label: "Indeterminado", labelEn: "Indeterminate", color: INDET_COLOR },
  };
  for (const st of MUNDANO_SUBTYPES) meta[st.key] = st;
  return Object.entries(acc)
    .filter(([, v]) => v > 0.001)
    .map(([key, count]) => ({ key, label: meta[key].label, labelEn: meta[key].labelEn, color: meta[key].color, count }))
    .sort((a, b) => b.count - a.count);
}

/** Hipótesis modal (display) de un caso, sobre el conjunto expandido. */
export function modalHypothesis(s: HypInput, opts: { consolidateNonHuman?: boolean; keepIndet?: boolean } = {}): HypRow {
  return expandedHypotheses([s], opts)[0];
}

/**
 * Conteo por hipótesis MODAL (argmax): cada ítem cuenta 1 (entero) en su
 * narrativa más probable del conjunto expandido. Suma = nº de ítems. Es la
 * clasificación forzada NAVEGABLE: coincide con el filtro de /cases (cada caso
 * cae en un solo bucket) y con el CTA «Ver los N casos». Difiere del
 * `expandedHypotheses` (nº ESPERADO, fraccional): esa es la partición
 * comparable del modelo; ésta es la que se puede listar. `count` es entero.
 */
export function modalCounts(items: ReadonlyArray<HypInput>, opts: { consolidateNonHuman?: boolean; keepIndet?: boolean } = {}): HypRow[] {
  const meta = new Map<string, HypRow>();
  const counts: Record<string, number> = {};
  for (const s of items) {
    const m = modalHypothesis(s, opts);
    counts[m.key] = (counts[m.key] ?? 0) + 1;
    if (!meta.has(m.key)) meta.set(m.key, m);
  }
  return [...meta.values()]
    .map((r) => ({ ...r, count: counts[r.key] }))
    .sort((a, b) => b.count - a.count);
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

export interface DecadeMece {
  decade: number;
  n: number;
  shares: Posterior; // media del posterior sobre los incidentes de la década (suma 1)
  heterogeneity: number; // 1 − share medio mundano_natural
  nonHuman: number; // share medio de las dos narrativas no-humanas
}

/**
 * Composición MECE media por década sobre los **incidentes con posterior**
 * (misma partición que `corpusPosteriors`: documentos y casos sin posterior
 * quedan fuera — un documento no reparte «qué era el objeto»). Cada `shares`
 * es el promedio del posterior de la década, así que suma 1. `heterogeneity`
 * = 1 − share mundano (cuánto del corpus resiste explicación mundana); es la
 * vista derivada `heterogeneidad` agregada en el tiempo. Se recorta a décadas
 * ≥ `from` (default 1940) donde el corpus tiene densidad — antes hay un puñado
 * de casos históricos que harían ruido. El `n` viaja para no ocultar muestras
 * finas.
 */
export function meceByDecade(
  cases: UAPCase[] = ALL_CASES as UAPCase[],
  from = 1940,
): DecadeMece[] {
  const byDecade = new Map<number, { n: number; sum: Posterior }>();
  for (const c of cases) {
    if (c.category === "document" || !c.posterior) continue;
    const decade = Math.floor(c.year_start / 10) * 10;
    if (decade < from) continue;
    let e = byDecade.get(decade);
    if (!e) { e = { n: 0, sum: emptyPosterior() }; byDecade.set(decade, e); }
    const p = posteriorFor(c);
    e.n += 1;
    for (const k of CLASS_IDS) e.sum[k] += p[k];
  }
  return [...byDecade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, { n, sum }]) => {
      const shares = emptyPosterior();
      for (const k of CLASS_IDS) shares[k] = sum[k] / n;
      return {
        decade,
        n,
        shares,
        heterogeneity: heterogeneidad(shares),
        nonHuman: entidadesNoHumanas(shares),
      };
    });
}
