import { ICD_LABELS, pctToIcdLabel, type IcdLabel } from "./icd203";

/**
 * Single source of truth for the hypothesis universe about UAP.
 *
 * PARADIGM: Independent propositions (not mutually exclusive).
 *
 * Each hypothesis carries a `kind` tag separating three roles:
 *   - "primitive"  — independent proposition about the corpus; lives on the
 *                    main ICD-203 chart axis.
 *   - "antecedent" — applies to a DIFFERENT universe (pre-filter reports)
 *                    than the institutional corpus. Cannot share the chart
 *                    axis with primitives without committing a universe
 *                    mix-up. Rendered in a separate section.
 *   - "derived"    — logical consequence of the primitives, not an
 *                    independent declaration. Computed, not calibrated.
 *
 * `corpusPct` is the analytical midpoint estimate. Mapped to ICD-203 band
 * via pctToIcdLabel() — the standard remains words-over-decimals because
 * we lack a formal likelihood model.
 *
 * Umbrella relations (subclass → superclass) live in
 * `lib/hypothesisMapping.ts` (UMBRELLA_SUBCLASSES). Evidence counts honor
 * them: an umbrella inherits its subclasses' case/pattern coverage.
 */

export type HypothesisKind = "primitive" | "antecedent" | "derived";

export interface Hypothesis {
  id: string;
  label: string;
  labelEn: string;
  corpusPct: number;
  color: string;
  note: string;
  noteEn: string;
  icd: IcdLabel;
  kind: HypothesisKind;
}

const RAW: Array<Omit<Hypothesis, "icd">> = [
  {
    id: "misidentificacion",
    kind: "antecedent",
    label: "Misidentificaciones explican la mayoría de reportes",
    labelEn: "Misidentifications explain the majority of reports",
    corpusPct: 97,
    color: "#6b6356",
    note: "ANTECEDENTE — aplica al universo PRE-FILTRO (reportes generales tipo Blue Book / AARO), NO al corpus institucional. Por construcción, P(misidentificación | caso ∈ corpus) ≈ 0%: los 64 casos pasaron filtros institucionales precisamente para excluir esta clase. Se muestra como antecedente del proceso de selección, no como hipótesis en competencia.",
    noteEn: "ANTECEDENT — applies to the PRE-FILTER universe (general reports such as Blue Book / AARO), NOT to the institutional corpus. By construction, P(misidentification | case ∈ corpus) ≈ 0%: the 64 cases passed institutional filters precisely to exclude this class. Shown as antecedent to the selection process, not as a competing hypothesis.",
  },
  {
    id: "heterogeneidad",
    kind: "derived",
    label: "El corpus contiene varias causas heterogéneas",
    labelEn: "The corpus contains several heterogeneous causes",
    corpusPct: 95,
    color: "#c41e3a",
    note: "DERIVADA — no es proposición primitiva. P(heterogeneidad) = 1 − P(a lo sumo una causa primitiva verdadera). Por Fréchet, P(H3 ∧ H4) ≥ P(H3) + P(H4) − 1 = 0.58, lo que ya implica P(heterogeneidad) ≥ 0.58. El 95% reportado asume dependencia positiva fuerte entre primitivas.",
    noteEn: "DERIVED — not a primitive proposition. P(heterogeneity) = 1 − P(at most one primitive cause true). Fréchet bound gives P(H3 ∧ H4) ≥ 0.58, which already implies P(heterogeneity) ≥ 0.58. The reported 95% assumes strong positive dependence among primitives.",
  },
  {
    id: "programas-clasificados",
    kind: "primitive",
    label: "≥1 caso es programa militar clasificado",
    labelEn: "≥1 case is a classified military program",
    corpusPct: 88,
    color: "#1e4f8b",
    note: "Skunkworks, breakaway tech, drones experimentales. Documentado: U-2 confundido con UFOs (1950s), F-117 (1980s). Vehículos no acknowledged siguen existiendo.",
    noteEn: "Skunkworks, breakaway tech, experimental drones. Historically documented: U-2 misidentified as UFOs (1950s), F-117 (1980s). Non-acknowledged vehicles continue to exist.",
  },
  {
    id: "fenomenos-naturales",
    kind: "primitive",
    label: "≥1 caso es fenómeno natural raro no catalogado",
    labelEn: "≥1 case is a rare uncatalogued natural phenomenon",
    corpusPct: 70,
    color: "#8b6914",
    note: "Plasma atmosférico, sprites, ball lightning, ionización exótica. Explica recurrencias locales (Hessdalen, Popocatépetl, Marfa).",
    noteEn: "Atmospheric plasma, sprites, ball lightning, exotic ionization. Explains local recurrences (Hessdalen, Popocatépetl, Marfa).",
  },
  {
    id: "entidades-no-humanas",
    kind: "primitive",
    label: "≥1 caso involucra entidades no humanas (categoría amplia)",
    labelEn: "≥1 case involves non-human entities (broad category)",
    corpusPct: 28,
    color: "#8b0000",
    note: "Paraguas sobre H6 interdimensional, H7 psicoespiritual, H8 tratado, + ET clásico / categorías sin vocabulario establecido. Cota Fréchet: max(subclase) ≤ P(H5) ≤ Σ subclases ⇒ 22% ≤ P(H5) ≤ 50%. El 28% reflejado = max(22%) + pequeño excedente por ET clásico, asumiendo overlap significativo entre subclases nombradas. Cae en banda 'Improbable' (20-45%).",
    noteEn: "Umbrella over H6 interdimensional, H7 psychospiritual, H8 treaty, + classical ET / categories without established vocabulary. Fréchet bound: max(subclass) ≤ P(H5) ≤ Σ subclasses ⇒ 22% ≤ P(H5) ≤ 50%. The reported 28% = max(22%) + small excess for classical ET, assuming significant overlap among named subclasses. Falls in 'Unlikely' band (20-45%).",
  },
  {
    id: "interdimensional",
    kind: "primitive",
    label: "≥1 caso es interdimensional / física exótica",
    labelEn: "≥1 case is interdimensional / exotic physics",
    corpusPct: 22,
    color: "#c07020",
    note: "Subclase específica de 'no humanas': vienen de otras dimensiones / atraviesan barreras espacio-tiempo. Framework Puthoff, Davis, Vallée's control system.",
    noteEn: "Specific subclass of 'non-human': they come from other dimensions / traverse spacetime barriers. Puthoff, Davis, Vallée's control system framework.",
  },
  {
    id: "psicoespiritual",
    kind: "primitive",
    label: "≥1 caso es psicoespiritual / ontológico-religioso",
    labelEn: "≥1 case is psychospiritual / ontological-religious",
    corpusPct: 22,
    color: "#2a7878",
    note: "Subclase de 'no humanas': fenómeno ontológicamente distinto a aliens físicos. Mack, Strieber, Pasulka. Incluye lecturas religiosas (Boebert/Nephilim).",
    noteEn: "Subclass of 'non-human': ontologically distinct from physical aliens. Mack, Strieber, Pasulka. Includes religious readings (Boebert/Nephilim).",
  },
  {
    id: "tratado-greys",
    kind: "primitive",
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

export const PRIMITIVE_HYPOTHESES: Hypothesis[] = HYPOTHESES.filter(
  (h) => h.kind === "primitive",
);
export const ANTECEDENT_HYPOTHESES: Hypothesis[] = HYPOTHESES.filter(
  (h) => h.kind === "antecedent",
);
export const DERIVED_HYPOTHESES: Hypothesis[] = HYPOTHESES.filter(
  (h) => h.kind === "derived",
);

export function getHypothesis(id: string): Hypothesis | undefined {
  return HYPOTHESES.find((h) => h.id === id);
}

// Re-export for convenience.
export { ICD_LABELS };
