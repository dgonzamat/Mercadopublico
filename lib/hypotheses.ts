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
  labelEn: string;
  corpusPct: number;
  color: string;
  note: string;
  noteEn: string;
  icd: IcdLabel;
}

const RAW: Array<Omit<Hypothesis, "icd">> = [
  {
    id: "pluralidad",
    label: "Son varias cosas distintas, no una sola",
    labelEn: "They are several distinct things, not one",
    corpusPct: 48,
    color: "#c41e3a",
    note: "Programas militares + fenómenos naturales + algo no humano + identificaciones erradas, mezclados bajo la misma etiqueta 'UAP'",
    noteEn: "Classified military programs + natural phenomena + something non-human + misidentifications, mixed under the same 'UAP' label",
  },
  {
    id: "interdimensional",
    label: "Interdimensional / física exótica",
    labelEn: "Interdimensional / exotic physics",
    corpusPct: 15,
    color: "#c07020",
    note: "Vienen de otras dimensiones, no de otros planetas (Puthoff, Davis)",
    noteEn: "They come from other dimensions, not other planets (Puthoff, Davis)",
  },
  {
    id: "natural",
    label: "Fenómeno natural no catalogado",
    labelEn: "Uncatalogued natural phenomenon",
    corpusPct: 12,
    color: "#8b6914",
    note: "Plasma, ionización avanzada, sprites — Hessdalen, Popocatépetl",
    noteEn: "Plasma, advanced ionization, sprites — Hessdalen, Popocatépetl",
  },
  {
    id: "clasificado",
    label: "Programa clasificado terrestre",
    labelEn: "Terrestrial classified program",
    corpusPct: 11,
    color: "#1e4f8b",
    note: "Breakaway civilization, black budget militar (Jorjani)",
    noteEn: "Breakaway civilization, military black budget (Jorjani)",
  },
  {
    id: "tratado",
    label: "Tratado formal con Greys",
    labelEn: "Formal treaty with Greys",
    corpusPct: 8,
    color: "#6b3aa0",
    note: "Hipótesis Cooper, Lazar — sin evidencia primaria verificable",
    noteEn: "Cooper, Lazar hypothesis — no verifiable primary evidence",
  },
  {
    id: "psicoespiritual",
    label: "Contacto psicoespiritual / 'Other'",
    labelEn: "Psychospiritual contact / 'Other'",
    corpusPct: 6,
    color: "#2a7878",
    note: "Mack, Strieber, framework ontológico-religioso de Pasulka",
    noteEn: "Mack, Strieber, Pasulka's ontological-religious framework",
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
