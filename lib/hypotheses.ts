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
    color: "#ff4d4d",
    note: "Múltiples fuentes distintas mezcladas — no es UN solo fenómeno",
  },
  {
    id: "interdimensional",
    label: "Interdimensional / física exótica",
    corpusPct: 15,
    color: "#ff8800",
    note: "Vienen de otras dimensiones, no de otros planetas (Puthoff, Davis)",
  },
  {
    id: "natural",
    label: "Fenómeno natural no catalogado",
    corpusPct: 12,
    color: "#ffb347",
    note: "Plasma, ionización avanzada, sprites — Hessdalen, Popocatépetl",
  },
  {
    id: "clasificado",
    label: "Programa clasificado terrestre",
    corpusPct: 11,
    color: "#7fdbff",
    note: "Breakaway civilization, black budget militar (Jorjani)",
  },
  {
    id: "tratado",
    label: "Tratado formal con Greys",
    corpusPct: 8,
    color: "#aa88ff",
    note: "Hipótesis Cooper, Lazar — sin evidencia primaria verificable",
  },
  {
    id: "psicoespiritual",
    label: "Contacto psicoespiritual / 'Other'",
    corpusPct: 6,
    color: "#00aaff",
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

export { ICD_LABELS };
