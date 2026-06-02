import { ICD_LABELS, pctToIcdLabel, type IcdLabel } from "./icd203";

/**
 * Single source of truth for the 8 independent hypotheses about UAP.
 *
 * PARADIGM: Independent propositions (not mutually exclusive).
 *
 * Each hypothesis = P(this proposition is true of at least some cases in
 * the corpus). Probabilities do NOT sum to 100% — they CAN'T, because
 * hypotheses are not mutually exclusive (see /about chapter 3).
 *
 * This replaces the previous 6-hypothesis exclusive framework, which
 * contradicted its own non-exclusivity claim by summing to exactly 100%.
 *
 * `corpusPct` is the analytical midpoint estimate. Mapped to ICD-203 band
 * via pctToIcdLabel() — the standard remains words-over-decimals because
 * we lack a formal likelihood model.
 */

export interface Hypothesis {
  id: string;
  label: string;
  labelEn: string;
  corpusPct: number;
  color: string;
  note: string;
  noteEn: string;
  icd: IcdLabel;
}

const RAW: Array<Omit<Hypothesis, "icd">> = [
  {
    id: "misidentificacion",
    label: "Misidentificaciones explican la mayoría de reportes",
    labelEn: "Misidentifications explain the majority of reports",
    corpusPct: 97,
    color: "#6b6356",
    note: "Globos, satélites, aves, lens flares, pareidolia. Project Blue Book resolvió ~95% así. Aplica a reportes generales, no a los 52 institucionales del corpus (que sobrevivieron filtros).",
    noteEn: "Balloons, satellites, birds, lens flares, pareidolia. Project Blue Book resolved ~95% this way. Applies to general reports, not to the 52 institutional corpus cases (which survived filters).",
  },
  {
    id: "heterogeneidad",
    label: "El corpus contiene varias causas heterogéneas",
    labelEn: "The corpus contains several heterogeneous causes",
    corpusPct: 95,
    color: "#c41e3a",
    note: "Trivialmente cierta si CUALQUIER otra hipótesis abajo es parcialmente verdadera. Negarla requiere asumir explicación monolítica para 52 casos en 79 años — estadísticamente extremo.",
    noteEn: "Trivially true if ANY hypothesis below is partially true. Denying it requires assuming a monolithic explanation for 52 cases over 79 years — statistically extreme.",
  },
  {
    id: "programas-clasificados",
    label: "≥1 caso es programa militar clasificado",
    labelEn: "≥1 case is a classified military program",
    corpusPct: 88,
    color: "#1e4f8b",
    note: "Skunkworks, breakaway tech, drones experimentales. Documentado: U-2 confundido con UFOs (1950s), F-117 (1980s). Vehículos no acknowledged siguen existiendo.",
    noteEn: "Skunkworks, breakaway tech, experimental drones. Historically documented: U-2 misidentified as UFOs (1950s), F-117 (1980s). Non-acknowledged vehicles continue to exist.",
  },
  {
    id: "fenomenos-naturales",
    label: "≥1 caso es fenómeno natural raro no catalogado",
    labelEn: "≥1 case is a rare uncatalogued natural phenomenon",
    corpusPct: 70,
    color: "#8b6914",
    note: "Plasma atmosférico, sprites, ball lightning, ionización exótica. Explica recurrencias locales (Hessdalen, Popocatépetl, Marfa).",
    noteEn: "Atmospheric plasma, sprites, ball lightning, exotic ionization. Explains local recurrences (Hessdalen, Popocatépetl, Marfa).",
  },
  {
    id: "entidades-no-humanas",
    label: "≥1 caso involucra entidades no humanas (categoría amplia)",
    labelEn: "≥1 case involves non-human entities (broad category)",
    corpusPct: 45,
    color: "#8b0000",
    note: "Paraguas que abarca ET clásico, interdimensional, ultraterrestre, criptoterrestre, o categorías ontológicas no establecidas. P(unión) ≥ P(cualquier subclase específica).",
    noteEn: "Umbrella covering classical ET, interdimensional, ultraterrestrial, cryptoterrestrial, or unestablished ontological categories. P(union) ≥ P(any specific subclass).",
  },
  {
    id: "interdimensional",
    label: "≥1 caso es interdimensional / física exótica",
    labelEn: "≥1 case is interdimensional / exotic physics",
    corpusPct: 22,
    color: "#c07020",
    note: "Subclase específica de 'no humanas': vienen de otras dimensiones / atraviesan barreras espacio-tiempo. Framework Puthoff, Davis, Vallée's control system.",
    noteEn: "Specific subclass of 'non-human': they come from other dimensions / traverse spacetime barriers. Puthoff, Davis, Vallée's control system framework.",
  },
  {
    id: "psicoespiritual",
    label: "≥1 caso es psicoespiritual / ontológico-religioso",
    labelEn: "≥1 case is psychospiritual / ontological-religious",
    corpusPct: 22,
    color: "#2a7878",
    note: "Subclase de 'no humanas': fenómeno ontológicamente distinto a aliens físicos. Mack, Strieber, Pasulka. Incluye lecturas religiosas (Boebert/Nephilim).",
    noteEn: "Subclass of 'non-human': ontologically distinct from physical aliens. Mack, Strieber, Pasulka. Includes religious readings (Boebert/Nephilim).",
  },
  {
    id: "tratado-greys",
    label: "Existe tratado formal con Greys (claim específica)",
    labelEn: "A formal treaty with Greys exists (specific claim)",
    corpusPct: 6,
    color: "#6b3aa0",
    note: "Hipótesis Cooper, Lazar — afirmación histórica específica de acuerdo Eisenhower 1954. Sin evidencia primaria verificable en el corpus.",
    noteEn: "Cooper, Lazar hypothesis — specific historical claim of Eisenhower 1954 agreement. No verifiable primary evidence in the corpus.",
  },
];

export const HYPOTHESES: Hypothesis[] = RAW.map((h) => ({
  ...h,
  icd: pctToIcdLabel(h.corpusPct),
}));

export function getHypothesis(id: string): Hypothesis | undefined {
  return HYPOTHESES.find((h) => h.id === id);
}

// Re-export for convenience.
export { ICD_LABELS };
