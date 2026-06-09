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
 *       effective = prior + pressure × PRESSURE_SHIFT_FACTOR (currently 0.25)
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
 *   the EFFECTIVE (`prior + pressure × PRESSURE_SHIFT_FACTOR`, shown by
 *   IcdProbabilityChart and section ICD badges). They DIVERGE as the
 *   corpus grows. The most
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
  note: string;                     // short blurb — used by the compact chart card
  noteEn: string;
  prose?: string;                   // long-form executive prose — used by /probabilidades
  proseEn?: string;
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
    prose: "Es la hipótesis que describe el universo PREVIO al corpus: los miles de reportes UAP que llegan cada año a Project Blue Book, AARO, GEPAN/SEPRA y agencias equivalentes. En ese universo, casi todo se resuelve cuando se mira con calma — globos meteorológicos, satélites Starlink, Venus sobre el horizonte, lens flares, pareidolia. Project Blue Book cerró sus 12,618 reportes con más del 94% clasificados o resueltos; AARO reporta cifras similares en sus revisiones recientes. El corpus de este sitio existe precisamente porque sobrevive a ese filtro: son los casos que ni el revisor más escéptico pudo cerrar como confusión. Su prior del 97% sobre los reportes generales no contradice la apuesta del corpus; la fundamenta. Reconocer que la mayoría de reportes UAP son ruido es lo que vuelve interesantes a los que no lo son.",
    proseEn: "This is the hypothesis describing the PRIOR universe: the thousands of UAP reports flowing each year into Project Blue Book, AARO, GEPAN/SEPRA and equivalent agencies. In that universe nearly everything resolves on calm review — weather balloons, Starlink satellites, Venus near the horizon, lens flares, pareidolia. Project Blue Book closed its 12,618 reports with over 94% classified or solved; AARO reports similar figures in its recent reviews. This site's corpus exists precisely because it survives that filter: these are cases the most skeptical reviewer could not close as confusion. Its 97% prior over general reports does not contradict the corpus bet; it grounds it. Acknowledging that most UAP reports are noise is what makes the rest interesting.",
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
    prose: `No es una hipótesis aparte sino una consecuencia matemática de las otras. Si más de una explicación tiene prior alto —y aquí dos lo tienen sobre 70%— entonces el corpus no puede tener una sola causa: contiene varias mezcladas. Esto importa para el lector porque pone fin a la pregunta mal planteada: no busques 'la respuesta' del fenómeno UAP. El corpus es plural por construcción en ${STATS.years} años, ${STATS.countries} países y todas las fases tecnológicas del siglo XX y XXI. Algunos casos serán programas militares no reconocidos, otros fenómenos naturales raros, otros resistirán ambas y tensionarán hacia categorías más amplias. La pregunta útil no es '¿qué son?', sino '¿qué es cada uno?'. Por eso el catálogo está calibrado caso a caso, no en bloque — y por eso cada caso lista qué hipótesis empuja y en qué dirección.`,
    proseEn: `Not a separate hypothesis but a mathematical consequence of the others. If more than one explanation has a high prior —and here two are above 70%— then the corpus cannot have a single cause: it contains several mixed. This matters for the reader because it kills the wrong question: don't look for 'the answer' to the UAP phenomenon. The corpus is plural by construction over ${STATS.years} years, ${STATS.countries} countries and every technological phase of the 20th and 21st centuries. Some cases will be unacknowledged military programs, others rare natural phenomena, others will resist both and pull toward broader categories. The useful question is not 'what are they?', but 'what is each one?'. That is why the catalog is calibrated case by case, not in bulk — and why each case lists which hypotheses it pushes, and in which direction.`,
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
    prose: "Es la hipótesis del 'mundo conocido extendido': tecnología real, humana, no reconocida públicamente. El historial empírico la sostiene fuerte —el U-2 fue confundido con OVNIs durante años antes de ser desclasificado en 1976; el F-117 ya volaba en operaciones cuando aún era reportado como triángulo no identificado sobre Nevada; los drones experimentales actuales sobre rangos de prueba siguen generando reportes que la USAF declina aclarar. Que esta hipótesis explique varios casos del corpus es prácticamente seguro: la mecánica institucional de los black programs (compartimentación, cobertura mediante misidentificación deliberada, demoras de desclasificación de 20-40 años) está documentada. Lo que NO resuelve son los casos con performance que excede el state-of-the-art conocido —Nimitz 2004, Tehran 1976, los videos GIMBAL/GOFAST— donde físicos honestos dicen 'esto no encaja con ningún programa conocido', pero tampoco pueden afirmar con seguridad que no existe un programa que sí lo haga. Por eso el prior alto y el techo bajo simultáneo: explica mucho del corpus, pero deja casos críticos sin tocar.",
    proseEn: "It's the 'extended known world' hypothesis: real, human technology, not publicly acknowledged. The empirical record sustains it strongly —the U-2 was mistaken for UFOs for years before declassification in 1976; the F-117 was already in operational flight while still reported as an unidentified triangle over Nevada; current experimental drones over test ranges keep generating reports the USAF declines to clarify. That this hypothesis explains several corpus cases is practically certain: the institutional mechanics of black programs (compartmentalization, cover via deliberate misidentification, 20-40 year declassification lags) are documented. What it does NOT resolve are the cases with performance exceeding known state-of-the-art —Nimitz 2004, Tehran 1976, the GIMBAL/GOFAST videos— where honest physicists say 'this does not fit any known program', but also cannot confidently assert that no such program exists. Hence the simultaneous high prior and low ceiling: it explains much of the corpus, but leaves the critical cases untouched.",
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
    prose: "La hipótesis natural cubre lo que la física conoce pero el observador rara vez ha visto: plasmas atmosféricos, ball lightning, sprites, transient luminous events, ionización exótica sobre fallas tectónicas, reflejos termoclinales. Tiene prior alto porque el corpus contiene observaciones de luces persistentes sin firma de propulsión artificial —Hessdalen lleva más de cuatro décadas documentado por físicos noruegos, Popocatépetl reaparece con cada erupción, las Marfa Lights tienen su propio observatorio turístico. La prensa decimonónica reportaba foo fighters mucho antes de que existieran sensores capaces de resolverlos. Su debilidad es simétrica a la fortaleza de programas-clasificados: no explica bien los casos con maniobras intencionales, cambios de dirección sin inercia detectable, intercepción coordinada de un objetivo o tracking de aeronave. Plasma raro puede flotar, brillar, expandirse; no maniobra. El Informe Rommel 1980 sobre mutilaciones de ganado es la versión escéptica institucional más fuerte de esta familia: cuando se examinan los casos con método veterinario estándar, encajan.",
    proseEn: "The natural hypothesis covers what physics knows but the observer rarely sees: atmospheric plasmas, ball lightning, sprites, transient luminous events, exotic ionization over tectonic faults, thermocline reflections. It carries a high prior because the corpus contains persistent-light observations without any artificial propulsion signature —Hessdalen has been documented for over four decades by Norwegian physicists, Popocatépetl reappears with each eruption, the Marfa Lights have their own tourist observatory. 19th-century press reported foo fighters long before sensors could resolve them. Its weakness is symmetric to classified-program's strength: it does not explain cases with intentional maneuvering, inertia-free direction changes, coordinated target interception, or aircraft tracking. Rare plasma can float, glow, expand; it does not maneuver. The Rommel Report 1980 on cattle mutilations is the strongest institutional skeptical version in this family: examined with standard veterinary method, the cases fit.",
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
    prose: "La hipótesis más cargada políticamente y la más difícil de calibrar honestamente. Es una categoría paraguas: si interdimensional (prior 22%), ontológico no materialista (prior 22%) o tratado formal (prior 6%) son ciertos en al menos un caso, esta también lo es. Por cota de Fréchet su prior tiene que ser al menos tan alto como el más alto de sus subclases, y un poco más para dejar espacio a variantes sin nombre establecido —extraterrestre materialista clásico, ontologías que aún no tenemos vocabulario para describir. Lo que la sostiene en el corpus no es testimonio sino instrumentación: los casos militares con radar + IR + visual coordinados (Nimitz 2004, Tehran 1976, Lake Huron 2023) son evidencia fuerte de que hay ALGO físicamente real. Pero esa evidencia no discrimina entre tecnología clasificada y entidades no humanas — y esa indecidibilidad es exactamente lo que empuja el prior hacia arriba sin resolverlo en ninguna dirección. Lo improbable aquí no es 'que existan'; es 'que sepamos cómo nombrarlas con confianza'.",
    proseEn: "The most politically loaded hypothesis and the hardest to calibrate honestly. It is an umbrella: if interdimensional (prior 22%), non-materialist ontological (prior 22%) or formal treaty (prior 6%) is true in at least one case, this is too. By the Fréchet bound its prior must be at least as high as the highest-prior subclass, plus a bit more to leave room for variants without established naming —classical materialist extraterrestrial, ontologies we don't yet have vocabulary to describe. What sustains it in the corpus is not testimony but instrumentation: the military cases with coordinated radar + IR + visual (Nimitz 2004, Tehran 1976, Lake Huron 2023) are strong evidence that SOMETHING physically real is there. But that evidence does not discriminate between classified technology and non-human entities — and that undecidability is exactly what pushes the prior upward without resolving in either direction. What is unlikely here is not 'that they exist'; it is 'that we know how to name them confidently'.",
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
    prose: "Subclase específica de no humanas: la idea de que estos objetos atraviesan barreras espacio-tiempo en lugar de viajar por el espacio interestelar convencional. Es un frame técnico, no esotérico —Hal Puthoff y Eric Davis publicaron en revistas peer-reviewed sobre warp drives, manipulación de métrica y energía negativa; Jacques Vallée argumenta desde los años 70 que el patrón temporal del fenómeno (foo fighters → discos → triángulos → tic-tacs) sugiere un sistema de control adaptativo, no visitas físicas desde otro planeta. Su prior de 22% refleja que el frame es internamente coherente, compatible con física de frontera y endorsado por algunos físicos con credenciales sólidas. Pero el corpus no contiene aún una observación que SOLO se explique así: cada caso fuerte admite también lectura como tecnología clasificada o fenómeno natural raro. Es una hipótesis viva, no probada — y el corpus la sostiene como posibilidad estructural, no como conclusión.",
    proseEn: "Specific subclass of non-human: the idea that these objects traverse spacetime barriers rather than travel via conventional interstellar space. It's a technical frame, not an esoteric one —Hal Puthoff and Eric Davis have published peer-reviewed work on warp drives, metric engineering and negative energy; Jacques Vallée has argued since the 1970s that the phenomenon's temporal pattern (foo fighters → discs → triangles → tic-tacs) suggests an adaptive control system, not physical visits from another planet. Its 22% prior reflects a frame that is internally coherent, compatible with frontier physics and endorsed by physicists with solid credentials. But the corpus does not yet contain an observation explained ONLY by it: every strong case also admits reading as classified tech or rare natural phenomenon. It's a live hypothesis, not a proven one — the corpus sustains it as a structural possibility, not as a conclusion.",
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
    prose: "El frame más incómodo metodológicamente del menú. Afirma que el fenómeno es real pero que la ontología —qué tipo de cosa es— permanece abierta: no necesariamente materialista, no necesariamente extraterrestre, no demonios en sentido teológico, no espíritus en sentido espiritualista. John Mack, profesor de psiquiatría en Harvard Medical School, llegó a esta posición tras examinar clínicamente más de 200 experimentadores y encontrar que ni la psicopatología ni el fraude explicaban consistentemente los datos. Whitley Strieber lo sostuvo desde el lado fenomenológico durante cuatro décadas; Diana Pasulka lo academiza desde estudios religiosos en Oxford UP sin comprometerse con ninguna ontología propia. Su prior de 22% reconoce dos cosas a la vez: que la evidencia testimonial es extensa, bien documentada e institucionalmente respaldada — y que es difícil de auditar con métodos materialistas estándar. El caso Ariel School 1994 (62 niños zimbabuenses, encuentro coordinado, follow-up Mack 30 años después) es el paradigmático. Aceptar esta hipótesis no exige creer en nada; exige no descartar lo que las herramientas disponibles no pueden falsar.",
    proseEn: "Methodologically the most uncomfortable frame on the menu. It asserts that the phenomenon is real but the ontology —what kind of thing it is— remains open: not necessarily materialist, not necessarily extraterrestrial, not demons in any theological sense, not spirits in any spiritualist sense. John Mack, Harvard Medical School professor of psychiatry, arrived at this position after clinically examining over 200 experiencers and finding that neither psychopathology nor fraud consistently explained the data. Whitley Strieber sustained it from the phenomenological side for four decades; Diana Pasulka academizes it from religious studies at Oxford UP without committing to any ontology of her own. Its 22% prior acknowledges two things at once: that the testimonial evidence is extensive, well-documented and institutionally backed — and that it is hard to audit with standard materialist methods. The Ariel School 1994 case (62 Zimbabwean schoolchildren, coordinated encounter, Mack follow-up 30 years later) is the paradigmatic one. Accepting this hypothesis does not require believing anything; it requires not dismissing what the available tools cannot falsify.",
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
    prose: "La afirmación más específica y la peor evidenciada del menú. Sostiene que existió un acuerdo formal Eisenhower-Greys en 1954 con intercambio tecnológico y permisos de abducción limitados. William Cooper popularizó la versión en los años 80, Bob Lazar añadió la pieza de S-4 / Area 51 / elemento 115 en 1989. Ninguna afirmación tiene evidencia primaria verificable: ni documentos desclasificados que la mencionen, ni testigos corroborantes en posición plausible de saber, ni materiales analizados por laboratorios independientes. Su prior de 6% no es cero — el cover-up institucional sobre UAP está documentado desde el memo Twining 1947 hasta el memo Bolender 1969 y eso deja espacio epistémico para sorpresas — pero el corpus no la sostiene en ningún caso concreto. Es la hipótesis menos privilegiada precisamente porque, si fuera cierta, la institucionalización del programa la haría MÁS detectable con el tiempo, no menos. La ausencia sostenida de cualquier filtración técnica corroborada en 70 años pesa en su contra.",
    proseEn: "The most specific claim and the worst-evidenced on the menu. It asserts that a formal Eisenhower-Greys agreement existed in 1954, with technology exchange and limited abduction permits. William Cooper popularized the version in the 1980s; Bob Lazar added the S-4 / Area 51 / element 115 piece in 1989. Neither claim has verifiable primary evidence: no declassified documents mention it, no corroborating witnesses in a plausible position to know, no materials analyzed by independent labs. Its 6% prior is not zero — institutional UAP cover-up is documented from the Twining memo 1947 to the Bolender memo 1969, leaving epistemic room for surprises — but the corpus does not sustain it in any concrete case. It is the least-privileged hypothesis precisely because, if it were true, the program's institutionalization would make it MORE detectable over time, not less. The sustained absence of any corroborated technical leak across 70 years weighs against it.",
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
