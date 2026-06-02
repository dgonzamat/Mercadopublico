import { ICD_LABELS, pctToIcdLabel, type IcdLabel } from "./icd203";

/**
 * Single source of truth for the 6 main hypotheses about what UAPs are.
 *
 * `corpusPct` is the historical figure from METHODOLOGY.md — an analytical
 * judgment, NOT a posterior derived from a formal model. We label it via
 * ICD-203 to avoid implying false precision (e.g., "48%" vs "45%" is not
 * meaningfully different given the evidence base).
 *
 * Plurality (#01) is a meta-hypothesis: "several of the below are partially
 * true". Its `subhypotheses` decompose the claim into independently testable
 * components, each with its own ICD-203 band. The non-mutual-exclusivity
 * documented in /about applies — sub-probabilities do NOT need to sum to 100%.
 */

export interface SubHypothesis {
  id: string;
  label: string;
  labelEn: string;
  midPct: number;
  note: string;
  noteEn: string;
  icd: IcdLabel;
}

export interface Hypothesis {
  id: string;
  label: string;
  labelEn: string;
  corpusPct: number;
  color: string;
  note: string;
  noteEn: string;
  icd: IcdLabel;
  subhypotheses?: SubHypothesis[];
}

type RawSubHypothesis = Omit<SubHypothesis, "icd">;
type RawHypothesis = Omit<Hypothesis, "icd" | "subhypotheses"> & {
  subhypotheses?: RawSubHypothesis[];
};

const RAW: RawHypothesis[] = [
  {
    id: "pluralidad",
    label: "Son varias cosas distintas, no una sola",
    labelEn: "They are several distinct things, not one",
    corpusPct: 48,
    color: "#c41e3a",
    note: "Programas militares + fenómenos naturales + algo no humano + identificaciones erradas, mezclados bajo la misma etiqueta 'UAP'",
    noteEn: "Classified military programs + natural phenomena + something non-human + misidentifications, mixed under the same 'UAP' label",
    subhypotheses: [
      {
        id: "pluralidad-clasificado",
        label: "Parte son programas militares clasificados",
        labelEn: "Part are classified military programs",
        midPct: 88,
        note: "Skunkworks, breakaway tech, drones experimentales — documentado históricamente (U-2 confundido con UFOs 1950s)",
        noteEn: "Skunkworks, breakaway tech, experimental drones — historically documented (U-2 misidentified as UFOs in 1950s)",
      },
      {
        id: "pluralidad-natural",
        label: "Parte son fenómenos naturales raros",
        labelEn: "Part are rare natural phenomena",
        midPct: 70,
        note: "Plasma atmosférico, sprites, ball lightning, ionización exótica — explica casos folklóricos persistentes",
        noteEn: "Atmospheric plasma, sprites, ball lightning, exotic ionization — explains persistent folkloric cases",
      },
      {
        id: "pluralidad-no-humano",
        label: "Parte son entidades no humanas",
        labelEn: "Part are non-human entities",
        midPct: 50,
        note: "No necesariamente ET clásico — podría ser interdimensional, ultraterrestre, criptoterrestre, o categorías que no tenemos",
        noteEn: "Not necessarily classical ET — could be interdimensional, ultraterrestrial, cryptoterrestrial, or categories we don't yet have",
      },
      {
        id: "pluralidad-misid",
        label: "Parte son identificaciones erradas",
        labelEn: "Part are misidentifications",
        midPct: 97,
        note: "Globos, satélites, aves, lens flares, pareidolia — Project Blue Book resolvió ~95% de reportes así",
        noteEn: "Balloons, satellites, birds, lens flares, pareidolia — Project Blue Book resolved ~95% of reports this way",
      },
    ],
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
  subhypotheses: h.subhypotheses?.map((s) => ({
    ...s,
    icd: pctToIcdLabel(s.midPct),
  })),
}));

export function getHypothesis(id: string): Hypothesis | undefined {
  return HYPOTHESES.find((h) => h.id === id);
}

// Re-export for convenience.
export { ICD_LABELS };
