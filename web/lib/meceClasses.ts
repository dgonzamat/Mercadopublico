import type { MeceClassId, MisidSubtype, MundanoType, Posterior } from "./types";

/**
 * Metadatos de las SEIS narrativas MECE (id + etiquetas bilingües + color) y el
 * argmax del posterior. Vive APARTE de `meceModel.ts` a propósito: este módulo
 * importa SOLO tipos, así que es seguro importarlo desde código alcanzable por
 * un componente cliente (p. ej. `lib/explorer/fields.ts` → el explorer del
 * laboratorio). `meceModel.ts` hace `import { cases } from "./data"` (corpus
 * completo); importarlo desde el cliente embutiría los ~4 MB de `cases.json` en
 * el chunk — el anti-pattern del LCP documentado en CLAUDE.md. `meceModel.ts`
 * re-exporta `MECE_CLASSES` desde aquí, así que sigue siendo la fuente única.
 */

export const MECE_CLASSES: ReadonlyArray<{
  id: MeceClassId;
  label: string;
  labelEn: string;
  color: string;
  /** Hipótesis del marco anterior que esta narrativa absorbe. */
  legacyHypothesis: string;
  /** Ancla a la sección de la narrativa en /probabilidades (donde se explica qué
   *  significa y enlaza al listado de casos filtrados). NO usar en vistas que NO
   *  corresponden a la clasificación modal navegable (p. ej. la agregación Σ P de
   *  /calidad es valor esperado fraccional, NO el conteo modal de /probabilidades,
   *  pero sí apunta ahí para que el usuario salte a la explicación de la narrativa). */
  href?: string;
}> = [
  { id: "mundano_natural", label: "Mundano / natural", labelEn: "Mundane / natural", color: "#5a6b7a", legacyHypothesis: "misidentificación + fenómenos-naturales" },
  { id: "humana_clasificada", label: "Tecnología humana clasificada", labelEn: "Classified human technology", color: "#7a6b23", legacyHypothesis: "programas-clasificados", href: "/probabilidades/#hyp-humana_clasificada" },
  { id: "adversaria", label: "Tecnología adversaria", labelEn: "Adversary technology", color: "#8a4b23", legacyHypothesis: "tecnología-adversaria", href: "/probabilidades/#hyp-adversaria" },
  // Las dos narrativas no-humanas apuntan a `#hyp-nohumano`, no a su propio id:
  // /probabilidades renderiza con `consolidateNonHuman`, así que allí existe una
  // sola sección para ambas. Enlazar a `#hyp-nohumano_encubierto` navegaba a la
  // página y no hacía scroll a ninguna parte — un fallo mudo.
  { id: "nohumano_encubierto", label: "No-humano + encubrimiento estatal", labelEn: "Non-human + state cover-up", color: "#6b3a7a", legacyHypothesis: "ingeniería-inversa + tratado-greys + entidades con cover-up", href: "/probabilidades/#hyp-nohumano" },
  // El azul de `nohumano_abierto` (antes #5b3a8a, un violeta casi idéntico al
  // #6b3a7a de encubierto: ΔE 4.1 en visión normal → indistinguibles) se separó
  // a #5a6cc8: ΔE 16.2 normal / 13.9 CVD, validado con el script del skill
  // dataviz. Mantiene la oscuridad muteada del palette (L*rel 0.17). No revertir
  // sin re-validar la separación del par no-humano.
  { id: "nohumano_abierto", label: "No-humano sin gestión estatal", labelEn: "Non-human, no state management", color: "#5a6cc8", legacyHypothesis: "interdimensional + ontológico", href: "/probabilidades/#hyp-nohumano" },
  { id: "indet", label: "Indeterminable", labelEn: "Indeterminable", color: "#3a3a3a", legacyHypothesis: "—", href: "/probabilidades/#hyp-indet" },
];

const CLASS_IDS = MECE_CLASSES.map((c) => c.id);

/**
 * Narrativa DOMINANTE de un posterior (argmax). Mismo criterio que `modal()` de
 * meceModel, pero puro y sin dependencias de datos para poder correr en el
 * cliente. Empate → la primera en orden de `MECE_CLASSES`.
 */
export function dominantNarrative(p: Posterior): MeceClassId {
  let best: MeceClassId = "indet";
  let bestP = -Infinity;
  for (const k of CLASS_IDS) {
    const v = p[k] ?? 0;
    if (v > bestP) {
      best = k;
      bestP = v;
    }
  }
  return best;
}

const MECE_LABEL_BY_ID = Object.fromEntries(
  MECE_CLASSES.map((c) => [c.id, c.label]),
) as Record<MeceClassId, string>;

/** Etiqueta (ES) de la narrativa dominante de un posterior. Compartida por la
 *  dimensión y el filtro del explorer para no duplicar el mapeo argmax→label. */
export function dominantNarrativeLabel(p: Posterior): string {
  return MECE_LABEL_BY_ID[dominantNarrative(p)];
}

// ─── Clases prosaicas de la narrativa mundano/natural (primer nivel) ─────────
// Viven aquí (data-free, junto a MECE_CLASSES) para que el explorer cliente los
// use como dimensiones sin arrastrar el corpus. meceModel los re-exporta. Los
// colores viven en lib (no en app/components) → fuera del scan de audit-design.

/** Clases de OBJETO dentro de mundanoType="misid" (`misidSubtype`): qué era el
 *  objeto. Se muestran como clases de PRIMER NIVEL (no como drill-down bajo una
 *  «misidentificación»): el sitio nombra el objeto, no el error del testigo.
 *  Los globos se archivan bajo `aeronave`. Colores separados entre sí (ΔE ≥ 12)
 *  y del gris de «Indeterminado» (INDET_COLOR); `luces_tierra` (#9a6a8a, malva
 *  mudo) queda a ΔE76 ≥ 27 de toda la paleta prosaica e hipótesis y ≥ 3:1 sobre
 *  el crema y el fondo oscuro de la home. */
export const MISID_SUBTYPES: ReadonlyArray<{
  key: "astronomico" | "aeronave" | "espacial" | "luces_tierra" | "animal" | "terrestre_otros";
  label: string;
  labelEn: string;
  color: string;
}> = [
  { key: "astronomico", label: "Objeto astronómico", labelEn: "Astronomical object", color: "#3d6a8f" },
  { key: "aeronave", label: "Aeronave", labelEn: "Aircraft", color: "#7d95a6" },
  { key: "espacial", label: "Objeto espacial", labelEn: "Space object", color: "#3f4e5a" },
  { key: "luces_tierra", label: "En tierra", labelEn: "Ground-level", color: "#9a6a8a" },
  { key: "animal", label: "Animal", labelEn: "Animal", color: "#2e7d8c" },
  // TRANSITORIO: el bucket de misid sin objeto fijado. Se conserva válido
  // mientras la pasada de datos reparte sus casos entre las clases de arriba.
  // Recoge también los casos misid sin `misidSubtype`.
  { key: "terrestre_otros", label: "Objeto convencional no precisado", labelEn: "Conventional object, not pinned down", color: "#5a6b7a" },
];

export type ProsaicKey = (typeof MISID_SUBTYPES)[number]["key"] | "natural" | "fraude" | "instrumento" | "psicosocial" | "sin_propuesta" | "folclore";

/** Las clases prosaicas que se MUESTRAN (primer nivel): las de objeto
 *  (misidSubtype) + fenómeno natural + posible fraude. MECE dentro de
 *  mundano_natural. */
export const PROSAIC_CLASSES: ReadonlyArray<{ key: ProsaicKey; label: string; labelEn: string; color: string }> = [
  ...MISID_SUBTYPES,
  { key: "natural", label: "Fenómeno natural", labelEn: "Natural phenomenon", color: "#4f7a6a" },
  { key: "fraude", label: "Posible fraude", labelEn: "Possible hoax", color: "#8a6b5a" },
  { key: "instrumento", label: "Fallo de instrumento", labelEn: "Instrument artifact", color: "#8a7d3a" },
  { key: "psicosocial", label: "Causa psicológica, médica o social", labelEn: "Psychological, medical or social cause", color: "#6a5f94" },
  // Ninguna fuente propone una causa, pero los casos parecidos que sí se
  // resolvieron fueron casi siempre algo ordinario: la masa prosaica se conserva
  // por tasa base en vez de pasar a «Indeterminado». Sin detalle.
  { key: "sin_propuesta", label: "Sin explicación propuesta", labelEn: "No explanation proposed", color: "#6f7f8c" },
  // Leyendas y relatos de época sin testigo verificable: la lectura prosaica es
  // literaria, no un objeto mal identificado ni un engaño (decisión del dueño).
  { key: "folclore", label: "Relato folclórico o literario", labelEn: "Folklore or literary account", color: "#9a7b4f" },
];

/** Clase prosaica mostrada para un caso: `mundanoType` + `misidSubtype` del dato.
 *  Sin `mundanoType` el modelo ya caía en misid (M2 de audit-consistency lo
 *  vigila); misid sin subtipo → «objeto convencional no precisado». */
export function prosaicKey(mundanoType?: MundanoType, misidSubtype?: MisidSubtype): ProsaicKey {
  if (mundanoType && mundanoType !== "misid") return mundanoType;
  return misidSubtype ?? "terrestre_otros";
}

// ─── Detalle de SEGUNDO nivel (objectDetail) ────────────────────────────────
// Qué objeto concreto dentro de cada clase prosaica. Data-free (lo usan el
// explorer cliente y validate-schema.mjs, que lo parsea de este archivo). Una
// clase sin entrada (fraude, terrestre_otros) no admite detalle. Ausente en el
// caso = «sin precisar».

export type ObjectDetailDef = { key: string; label: string; labelEn: string };

export const OBJECT_DETAILS: Readonly<Partial<Record<ProsaicKey, ReadonlyArray<ObjectDetailDef>>>> = {
  astronomico: [
    { key: "planeta_estrella", label: "Planeta o estrella", labelEn: "Planet or star" },
    { key: "meteoro", label: "Meteoro o bólido", labelEn: "Meteor or fireball" },
    { key: "luna", label: "Luna", labelEn: "Moon" },
  ],
  aeronave: [
    { key: "avion", label: "Avión", labelEn: "Airplane" },
    { key: "helicoptero", label: "Helicóptero", labelEn: "Helicopter" },
    { key: "dron", label: "Dron", labelEn: "Drone" },
    { key: "globo", label: "Globo", labelEn: "Balloon" },
  ],
  espacial: [
    { key: "cohete_misil", label: "Cohete o misil", labelEn: "Rocket or missile" },
    { key: "satelite", label: "Satélite", labelEn: "Satellite" },
    { key: "reentrada", label: "Reentrada", labelEn: "Reentry" },
  ],
  luces_tierra: [
    { key: "faro_reflector", label: "Faro o reflector", labelEn: "Beacon or searchlight" },
    { key: "bengala", label: "Bengala o pirotecnia", labelEn: "Flare or fireworks" },
    { key: "vehiculo", label: "Vehículo", labelEn: "Vehicle" },
    { key: "llama_industrial", label: "Llama industrial", labelEn: "Industrial flare" },
    { key: "persona", label: "Persona", labelEn: "Person" },
  ],
  animal: [
    { key: "ave", label: "Ave", labelEn: "Bird" },
    { key: "insecto", label: "Insecto", labelEn: "Insect" },
  ],
  natural: [
    { key: "atmosferico", label: "Atmosférico (rayo en bola, nubes)", labelEn: "Atmospheric (ball lightning, clouds)" },
    { key: "optico", label: "Óptico (espejismo, refracción, propagación anómala del radar)", labelEn: "Optical (mirage, refraction, anomalous radar propagation)" },
  ],
  instrumento: [
    { key: "pelicula_foto", label: "Defecto de película o foto", labelEn: "Film or photo defect" },
    { key: "sensor_radar", label: "Artefacto del sensor o del radar", labelEn: "Sensor or radar artifact" },
    { key: "falla_equipo", label: "Avería de equipo", labelEn: "Equipment failure" },
  ],
  psicosocial: [
    { key: "contagio_colectivo", label: "Contagio colectivo", labelEn: "Collective contagion" },
    { key: "sugestion", label: "Sugestión", labelEn: "Suggestion" },
    { key: "paralisis_sueno", label: "Parálisis del sueño", labelEn: "Sleep paralysis" },
    { key: "medica", label: "Causa médica o neurológica", labelEn: "Medical or neurological cause" },
  ],
};

/** Rótulo del detalle ausente. */
export const DETAIL_UNSPECIFIED = { key: "sin_precisar", label: "Sin precisar", labelEn: "Not specified" } as const;

/** Definición del detalle `objectDetail` dentro de la clase `pk`, o undefined
 *  si el caso no lo trae (o no es válido para esa clase). */
export function objectDetailDef(pk: ProsaicKey, objectDetail?: string): ObjectDetailDef | undefined {
  if (!objectDetail) return undefined;
  return OBJECT_DETAILS[pk]?.find((d) => d.key === objectDetail);
}
