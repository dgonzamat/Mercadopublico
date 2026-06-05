import { ICD_LABELS, pctToIcdLabel, type IcdLabel } from "./icd203";
import { STATS } from "./siteStats";

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
 *
 * COPY NUMERIC DISCIPLINE (applies to EVERY page citing percentages):
 *
 *   Each hypothesis has TWO numbers: the PRIOR (`corpusPct` here) and
 *   the EFFECTIVE (`prior + pressure × 0.5`, shown by IcdProbabilityChart
 *   and section ICD badges). They DIVERGE as the corpus grows. The most
 *   common drift bug in this codebase is editorial copy that cites a
 *   number without naming which one — readers see two different numbers
 *   for the same hypothesis on the same page.
 *
 *   When editorial copy cites a percentage, name it:
 *     "su prior de 22%"      ← unambiguous prior reference
 *     "el chart muestra 44%" ← unambiguous effective reference
 *     "lo que da 28%"        ← AVOID: reads as effective claim
 *
 *   Static strings (`.note`, MoveList items, chapter bodies, etc.)
 *   cannot interpolate the effective at render time. Two options:
 *   (a) keep them prior-only with the word "prior" attached, or
 *   (b) move the cite into a server component where `effectiveCalibration`
 *       is in scope and interpolate `calib.pct`.
 *
 *   Pages bound by this rule: /probabilidades, /about, /home, /resumen,
 *   and any component that reads HYPOTHESES or PRIMITIVE_HYPOTHESES.
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
    note: `Esta no es una hipótesis aparte — es una conclusión que se sigue de las otras. Si más de una explicación tiene prior alto, por matemática básica el corpus tiene que contener varias causas mezcladas. Negarlo requeriría asumir que casi todos los casos comparten la misma explicación — estadísticamente extremo en ${STATS.years} años.`,
    noteEn: `This isn't a separate hypothesis — it's a conclusion that follows from the others. If more than one hypothesis has a high prior, basic math forces the corpus to contain mixed causes. Denying this would require assuming nearly all cases share a single explanation — statistically extreme over ${STATS.years} years.`,
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
    note: "Categoría amplia: incluye tres versiones más específicas — interdimensional, ontológico no materialista, tratado formal — más espacio para variantes sin nombre establecido (ET clásico, ontologías nuevas). Tiene que ser al menos tan probable como la subclase de mayor prior. Improbable, pero no descartable.",
    noteEn: "Broad category: includes three more specific versions — interdimensional, non-materialist ontological, formal treaty — plus room for variants without established naming (classical ET, new ontologies). Must be at least as probable as the highest-prior subclass. Unlikely, but not ruled out.",
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
    id: "ontologico-no-materialista",
    kind: "primitive",
    label: "≥1 caso es ontológico no materialista (frame Mack/Strieber)",
    labelEn: "≥1 case is non-materialist ontological (Mack/Strieber frame)",
    corpusPct: 22,
    color: "#2a7878",
    note: "Subclase de 'no humanas': fenómeno real pero ontología abierta — sin commit a aliens materialistas, demonios, ni cosmología fija. Marco Mack (Harvard, psiquiatría clínica + psicología transpersonal) más Strieber; Pasulka academiza la familia desde estudios religiosos sin commit ontológico propio. Ariel School es el caso paradigmático del corpus.",
    noteEn: "Subclass of 'non-human': real phenomenon with open ontology — no commit to materialist aliens, demons, or fixed cosmology. Mack frame (Harvard, clinical psychiatry + transpersonal psychology) plus Strieber; Pasulka academizes the family from religious studies without ontological commitment of her own. Ariel School is the paradigmatic corpus case.",
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
