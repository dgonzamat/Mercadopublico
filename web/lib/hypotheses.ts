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
 * CALIBRATION MODEL (Option C — hybrid derived + override):
 *
 *   - `corpusPct` is the PRIOR — the baseline probability the analyst
 *     assigns to this proposition in absence of corpus evidence. Used as
 *     the starting point for build-time derivation.
 *
 *   - At build time, `effectiveCalibration(h, cases)` (in
 *     lib/hypothesisMapping) computes the displayed probability:
 *       effective = prior + pressure × 0.5
 *     where `pressure` is the sum of declared case contributions for the
 *     hypothesis (see lib/types.ts EvidenceContribution). Each new case
 *     therefore shifts the displayed pct automatically.
 *
 *   - `corpusPctOverride` is an optional manual final value that bypasses
 *     all pressure logic. Used for hypotheses whose pct is NOT a function
 *     of the corpus — antecedent (pre-filter universe) and derived
 *     (consequence-of-primitives) hypotheses always declare an override.
 *
 *   - The verbal ICD-203 band is recomputed from the effective pct, so
 *     adding cases that shift the pct across a band boundary auto-updates
 *     the verbal label too.
 *
 * Umbrella relations (subclass → superclass) live in
 * `lib/hypothesisMapping.ts` (UMBRELLA_SUBCLASSES). Evidence counts and
 * pressure both honor them: an umbrella inherits its subclasses' coverage.
 */

export type HypothesisKind = "primitive" | "antecedent" | "derived";

export interface Hypothesis {
  id: string;
  label: string;
  labelEn: string;
  corpusPct: number;                // PRIOR — baseline before corpus evidence
  corpusPctOverride?: number;       // optional manual final value (bypasses pressure)
  color: string;
  note: string;
  noteEn: string;
  icd: IcdLabel;                    // computed from corpusPct (prior); see effectiveCalibration for derived
  kind: HypothesisKind;
}

const RAW: Array<Omit<Hypothesis, "icd">> = [
  {
    id: "misidentificacion",
    kind: "antecedent",
    label: "Misidentificaciones explican la mayoría de reportes",
    labelEn: "Misidentifications explain the majority of reports",
    corpusPct: 97,
    corpusPctOverride: 97,
    color: "#6b6356",
    note: "Esta hipótesis describe un universo distinto: los miles de reportes generales (estilo Project Blue Book o AARO) ANTES de pasar filtros institucionales. En ese universo, casi todo se resuelve como confusiones — globos, satélites, aves, lens flares, pareidolia. Los casos del corpus ya pasaron esos filtros precisamente para excluir esta categoría, así que aquí su peso es prácticamente cero.",
    noteEn: "This hypothesis describes a different universe: the thousands of general reports (Project Blue Book / AARO style) BEFORE passing institutional filters. In that universe, nearly everything resolves as confusions — balloons, satellites, birds, lens flares, pareidolia. The corpus cases already passed those filters precisely to exclude this category, so its weight here is practically zero.",
  },
  {
    id: "heterogeneidad",
    kind: "derived",
    label: "El corpus contiene varias causas heterogéneas",
    labelEn: "The corpus contains several heterogeneous causes",
    corpusPct: 95,
    corpusPctOverride: 95,
    color: "#c41e3a",
    note: "Esta no es una hipótesis aparte — es una conclusión que se sigue de las otras. Si más de una explicación tiene probabilidad alta (programas clasificados al 88%, fenómenos naturales al 70%), por matemática básica el corpus tiene que contener varias causas mezcladas. Negarlo requeriría asumir que casi todos los casos comparten la misma explicación — estadísticamente extremo en 79 años.",
    noteEn: "This isn't a separate hypothesis — it's a conclusion that follows from the others. If more than one explanation has high probability (classified programs at 88%, natural phenomena at 70%), basic math forces the corpus to contain mixed causes. Denying this would require assuming nearly all cases share a single explanation — statistically extreme over 79 years.",
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
    note: "Categoría amplia: incluye tres versiones más específicas — interdimensional, psicoespiritual, tratado encubierto — más espacio para variantes sin nombre establecido (ET clásico, ontologías nuevas). Tiene que ser al menos tan probable como la versión más alta, lo que da algo cerca de 28%. Improbable, pero no descartable.",
    noteEn: "Broad category: includes three more specific versions — interdimensional, psychospiritual, covert treaty — plus room for variants without established naming (classical ET, new ontologies). Must be at least as probable as the highest specific version, which lands near 28%. Unlikely, but not ruled out.",
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
