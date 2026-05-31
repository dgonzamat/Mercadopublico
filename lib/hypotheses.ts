import { ICD_LABELS, pctToIcdLabel, type IcdLabel } from "./icd203";

/**
 * Single source of truth for the 6 main hypotheses about what UAPs are.
 *
 * `corpusPct` is the historical figure from METHODOLOGY.md — an analytical
 * judgment, NOT a posterior derived from a formal model. We label it via
 * ICD-203 to avoid implying false precision (e.g., "48%" vs "45%" is not
 * meaningfully different given the evidence base).
 */

export interface Hypothesis {
  id: string;
  label: string;
  corpusPct: number;
  color: string;
  note: string;
  icd: IcdLabel;
}

const RAW: Array<Omit<Hypothesis, "icd">> = [
  {
    id: "pluralidad",
    label: "Pluralidad de inteligencias",
    corpusPct: 48,
    color: "#c41e3a",
    note: "Múltiples fuentes distintas mezcladas — no es UN solo fenómeno",
  },
  {
    id: "interdimensional",
    label: "Interdimensional / física exótica",
    corpusPct: 15,
    color: "#c07020",
    note: "Vienen de otras dimensiones, no de otros planetas (Puthoff, Davis)",
  },
  {
    id: "natural",
    label: "Fenómeno natural no catalogado",
    corpusPct: 12,
    color: "#8b6914",
    note: "Plasma, ionización avanzada, sprites — Hessdalen, Popocatépetl",
  },
  {
    id: "clasificado",
    label: "Programa clasificado terrestre",
    corpusPct: 11,
    color: "#1e4f8b",
    note: "Breakaway civilization, black budget militar (Jorjani)",
  },
  {
    id: "tratado",
    label: "Tratado formal con Greys",
    corpusPct: 8,
    color: "#6b3aa0",
    note: "Hipótesis Cooper, Lazar — sin evidencia primaria verificable",
  },
  {
    id: "psicoespiritual",
    label: "Contacto psicoespiritual / 'Other'",
    corpusPct: 6,
    color: "#2a7878",
    note: "Mack, Strieber, framework ontológico-religioso de Pasulka",
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
