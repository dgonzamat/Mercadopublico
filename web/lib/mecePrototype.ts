/**
 * PROTOTIPO — modelo de probabilidad coherente y COMPARABLE.
 * ============================================================
 *
 * NO está cableado al sitio vivo. Es una prueba de concepto para evaluar el
 * reemplazo del esquema actual (10 hipótesis existenciales solapadas, no
 * comparables) por un POSTERIOR POR CASO sobre un conjunto de explicaciones
 * mutuamente excluyentes y exhaustivas (MECE) que suma 100% en cada caso.
 *
 * POR QUÉ ES COMPARABLE (y el modelo actual no):
 *   - Cada caso recibe una distribución sobre las MISMAS clases excluyentes.
 *   - El agregado del corpus = nº esperado de casos por explicación:
 *         E_j = Σ_i  P(clase_j | caso_i)
 *     Estos E_j SUMAN al nº de casos y son COMPARABLES entre sí.
 *   - Propiedad clave: la esperanza es LINEAL, así que E_j es válido AUNQUE
 *     los casos estén correlacionados — el agregado comparable esquiva el
 *     problema de independencia que rompe a los modelos tipo noisy-OR.
 *
 * QUÉ SIGUE SIENDO CIERTO (honestidad):
 *   - Los posteriores por caso son JUICIOS subjetivos, no frecuencias
 *     calibradas. Comparabilidad ≠ verdad. No hay bucle de resolución que
 *     calibre estos números empíricamente.
 *
 * ALCANCE: la partición "¿qué era el objeto, realmente?" aplica a casos de
 * AVISTAMIENTO / INCIDENTE. Los casos-documento e institucionales
 * (memos, audiencias, leaks) son de otra naturaleza y NO se modelan aquí —
 * necesitan una pista separada (capa de encubrimiento/institucional).
 */

export const MECE_CLASSES = [
  { id: "mundano", label: "Mundano / identificación errónea", labelEn: "Mundane / misidentification", color: "#5a6b7a" },
  { id: "natural_desc", label: "Fenómeno natural no catalogado", labelEn: "Uncatalogued natural phenomenon", color: "#3f7d5a" },
  { id: "clasificada", label: "Tecnología humana clasificada", labelEn: "Classified human technology", color: "#7a6b23" },
  { id: "adversaria", label: "Tecnología de otro Estado", labelEn: "Another state's technology", color: "#8a4b23" },
  { id: "no_humano", label: "Inteligencia no humana", labelEn: "Non-human intelligence", color: "#6b3a7a" },
  { id: "indet", label: "Indeterminable", labelEn: "Indeterminable", color: "#3a3a3a" },
] as const;

export type MeceClassId = (typeof MECE_CLASSES)[number]["id"];
export type Posterior = Record<MeceClassId, number>;

export interface ProtoCase {
  id: string;
  name: string;
  tier: string;
  /** Distribución sobre las 6 clases MECE; debe sumar 1. */
  posterior: Posterior;
  /** Una línea sobre por qué este reparto (la lectura dominante). */
  note: string;
}

/**
 * 10 casos de incidente reales, recodificados con posteriores ilustrativos
 * pero anclados en la narrativa/calibración ya escrita de cada expediente.
 * Valores a afinar caso por caso si el prototipo se aprueba.
 */
export const PROTO_CASES: ProtoCase[] = [
  {
    id: "nimitz-2004", name: "USS Nimitz (Tic Tac)", tier: "S",
    posterior: { mundano: 0.03, natural_desc: 0.04, clasificada: 0.18, adversaria: 0.22, no_humano: 0.33, indet: 0.20 },
    note: "Multi-sensor (radar+EO/IR+visual) con desempeño que excede el estado del arte conocido; nadie cierra una explicación mundana.",
  },
  {
    id: "tehran-1976", name: "Tehran (F-4)", tier: "S",
    posterior: { mundano: 0.15, natural_desc: 0.08, clasificada: 0.17, adversaria: 0.20, no_humano: 0.25, indet: 0.15 },
    note: "Fallos de instrumentos en intercepción militar; la hipótesis Júpiter (Klass) cubre la parte visual pero no las fallas electrónicas.",
  },
  {
    id: "rendlesham-1980", name: "Rendlesham Forest", tier: "S",
    posterior: { mundano: 0.45, natural_desc: 0.08, clasificada: 0.15, adversaria: 0.08, no_humano: 0.14, indet: 0.10 },
    note: "El faro de Orford Ness (Ridpath) explica buena parte; queda un residuo militar no cerrado.",
  },
  {
    id: "lake-huron-2023", name: "Lake Huron", tier: "S",
    posterior: { mundano: 0.68, natural_desc: 0.03, clasificada: 0.07, adversaria: 0.12, no_humano: 0.04, indet: 0.06 },
    note: "Desclasificación 2026 apunta a un pico-globo de aficionado benigno.",
  },
  {
    id: "canary-islands-1976", name: "Islas Canarias", tier: "S",
    posterior: { mundano: 0.68, natural_desc: 0.07, clasificada: 0.08, adversaria: 0.05, no_humano: 0.05, indet: 0.07 },
    note: "Ballester Olmos: lanzamiento de misil Poseidón al crepúsculo, visible desde las 7 islas.",
  },
  {
    id: "bosque-chile-2010", name: "El Bosque (FACh)", tier: "A",
    posterior: { mundano: 0.72, natural_desc: 0.06, clasificada: 0.03, adversaria: 0.02, no_humano: 0.06, indet: 0.11 },
    note: "Lectura entomológica (insecto cerca del lente) no refutada; valor institucional, no del objeto.",
  },
  {
    id: "colares-1977", name: "Colares (Operação Prato)", tier: "S",
    posterior: { mundano: 0.33, natural_desc: 0.15, clasificada: 0.12, adversaria: 0.05, no_humano: 0.22, indet: 0.13 },
    note: "Lesiones médicas documentadas pero la FAB cerró sin dictamen; histeria colectiva como explicación parcial.",
  },
  {
    id: "belgian-wave-1989", name: "Oleada belga", tier: "S",
    posterior: { mundano: 0.40, natural_desc: 0.08, clasificada: 0.20, adversaria: 0.12, no_humano: 0.12, indet: 0.08 },
    note: "Foto icónica = fraude confeso (2011); ecos de radar F-16 de interpretación discutida.",
  },
  {
    id: "westall-1966", name: "Westall (Melbourne)", tier: "S",
    posterior: { mundano: 0.55, natural_desc: 0.07, clasificada: 0.10, adversaria: 0.05, no_humano: 0.13, indet: 0.10 },
    note: "Globo HIBAL plausible y no refutado; la fuerza del caso es el volumen de testigos y la supresión, no el objeto.",
  },
  {
    id: "socorro-1964", name: "Socorro (Lonnie Zamora)", tier: "S",
    posterior: { mundano: 0.30, natural_desc: 0.05, clasificada: 0.22, adversaria: 0.06, no_humano: 0.27, indet: 0.10 },
    note: "Testigo policial sólido (Hynek); hipótesis de prototipo lunar/engaño estudiantil sin cierre.",
  },
];

const ZERO = (): Posterior => ({ mundano: 0, natural_desc: 0, clasificada: 0, adversaria: 0, no_humano: 0, indet: 0 });

/** Verifica que cada posterior sume 1 (± tol). Devuelve los ids que fallan. */
export function validatePosteriors(cases: ProtoCase[] = PROTO_CASES): string[] {
  return cases
    .filter((c) => Math.abs(MECE_CLASSES.reduce((s, k) => s + c.posterior[k.id], 0) - 1) > 1e-6)
    .map((c) => c.id);
}

/** Clase modal de un caso (la explicación más probable). */
export function modal(p: Posterior): { id: MeceClassId; prob: number } {
  let best: MeceClassId = "indet";
  let bestP = -1;
  for (const k of MECE_CLASSES) if (p[k.id] > bestP) { best = k.id; bestP = p[k.id]; }
  return { id: best, prob: bestP };
}

/**
 * Agregado COMPARABLE: nº esperado de casos por explicación.
 *   E_j = Σ_i P(clase_j | caso_i)   →   Σ_j E_j = nº de casos.
 * Lineal ⇒ válido aunque los casos estén correlacionados.
 */
export function expectedCounts(cases: ProtoCase[] = PROTO_CASES): Posterior {
  const out = ZERO();
  for (const c of cases) for (const k of MECE_CLASSES) out[k.id] += c.posterior[k.id];
  return out;
}

/**
 * Afirmación existencial coherente (≥1 caso es X) vía noisy-OR sobre los
 * mismos posteriores. OJO: esto SÍ asume independencia entre casos.
 */
export function noisyOrAtLeastOne(cls: MeceClassId, cases: ProtoCase[] = PROTO_CASES): number {
  return 1 - cases.reduce((prod, c) => prod * (1 - c.posterior[cls]), 1);
}
