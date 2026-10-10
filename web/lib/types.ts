export type Tier = "S" | "A" | "B";
export type EpistemicStatus = "documented" | "developing" | "projected";
export type Category = "incident" | "document" | "contactee" | "crop_circle";
/** Sub-tipo de la explicación prosaica (abre la narrativa mundano/natural). */
/** `instrumento` = la anomalía la produjo el equipo (película, sensor, radar,
 *  avería); `psicosocial` = contagio colectivo, sugestión, parálisis del sueño;
 *  `sin_propuesta` = ninguna fuente propone una causa, pero casos parecidos
 *  suelen resolverse como algo ordinario (tasa base; decisión del dueño, 29 sep 2026). */
export type MundanoType = "misid" | "natural" | "fraude" | "instrumento" | "psicosocial" | "sin_propuesta" | "folclore";

/** Clase de OBJETO de una misidentificación: qué era lo que se vio. Solo aplica
 *  a casos con mundanoType="misid"; es el primer nivel de la taxonomía prosaica
 *  (el detalle de segundo nivel va en `objectDetail`). `terrestre_otros` es
 *  transitorio: se conserva válido mientras la pasada de datos lo reparte. */
export type MisidSubtype = "astronomico" | "aeronave" | "espacial" | "luces_tierra" | "animal" | "terrestre_otros";
export type VerdictMoral = "neutral" | "hostile" | "positive" | "variable";

export interface Location {
  lat: number;
  lng: number;
  place?: string;
  place_en?: string;
}

export interface CaseSource {
  name: string;
  /** Par inglés del nombre. El sitio es inglés-primario y el detalle renderiza
   *  `name_en ?? name`, así que una fuente sin par muestra su nombre español a
   *  la ruta inglesa. Venía de un array paralelo `sources_en` que NADIE leía:
   *  81 nombres traducidos existían en el dato y no llegaban a la página. */
  name_en?: string;
  url?: string;
  note?: string;
  note_en?: string;
}

export interface CaseDocument {
  url: string;
  alt: string;
  caption: string;
  caption_en?: string;
  source: string;
  license: string;
  href?: string;
}

/**
 * Documento embebido en el visor inline del caso. `src` es same-origin
 * (ruta bajo /pursue/) porque war.gov bloquea el framing/fetch de terceros:
 * solo un asset auto-hospedado se puede embeber con garantía. `type` decide
 * el render (visor cliente para pdf, img para imagen, iframe para video).
 * `fallbackUrl` apunta al documento oficial original como respaldo navegable.
 *
 * `type: "video"` es la excepción al invariante same-origin, y la única que
 * hay: los videos PURSUE pesan >150MB sin renditions menores (medido: PR051
 * = 154MB), muy por encima del techo de /pursue (30MB) y del bucket (30-50MB),
 * así que rehostearlos no es opción. DVIDS —el mirror oficial del DoD— sirve
 * `/video/embed/<id>` SIN `x-frame-options` ni `frame-ancestors` (el resto de
 * su sitio va con DENY, o sea que el embed es deliberado). A cambio de esa
 * conveniencia se pierde la garantía: un tercero puede cambiar su política
 * unilateralmente, así que la contraparte es la sonda viva
 * `check-dvids-embeds.mjs`, que vigila que sigan siendo framables.
 */
export interface DocEmbed {
  src: string;
  type: "pdf" | "image" | "video";
  title: string;
  title_en?: string;
  source?: string;
  license?: string;
  fallbackUrl?: string;
}

/**
 * MODELO MECE — narrativas conjuntas (objeto + postura institucional).
 * Cada caso reparte 100% sobre 6 narrativas mutuamente excluyentes y
 * exhaustivas. A diferencia de un eje de solo-objeto, estas bundlean el
 * encubrimiento DENTRO de la hipótesis, de modo que «no-humano + ocultación
 * estatal» es una clase propia (nohumano_encubierto), no una combinación
 * imposible. El agregado del corpus (Σ posteriores) reparte el 100% y es
 * comparable. Ver lib/meceModel.ts.
 *
 * Mapeo con el marco anterior (10 hipótesis):
 *   mundano_natural      = misidentificación + fenómenos-naturales
 *   humana_clasificada   = programas-clasificados
 *   adversaria           = tecnología-adversaria
 *   nohumano_encubierto  = ingeniería-inversa + tratado-greys + entidades con cover-up
 *   nohumano_abierto     = interdimensional + ontológico sin gestión estatal
 *   indet                = indeterminable
 * Derivadas: entidades-no-humanas = encubierto + abierto; heterogeneidad = 1 − mundano_natural.
 */
export type MeceClassId =
  | "mundano_natural"      // objeto conocido / error / fraude / fenómeno natural
  | "humana_clasificada"   // programa secreto propio o aliado (encubrimiento intrínseco)
  | "adversaria"           // tecnología de vigilancia de otro Estado
  | "nohumano_encubierto"  // no-humano que un Estado conoce/controla/oculta (incl. ing. inversa)
  | "nohumano_abierto"     // no-humano sin gestión estatal (sistema de control tipo Vallée)
  | "indet";               // indeterminable / evidencia insuficiente

export type Posterior = Record<MeceClassId, number>;

/** Subclases no-humanas → vista derivada «entidades no humanas». */
export const ENTIDADES_SUBCLASSES: MeceClassId[] = [
  "nohumano_encubierto",
  "nohumano_abierto",
];

export interface UAPCase {
  id: string;
  num: number;
  name: string;
  name_en?: string;
  year_start: number;
  year_end?: number;
  country: string;
  country_name: string;
  flag: string;
  location: Location;
  tier: Tier;
  /**
   * Releases del PURSUE/AARO de las que el caso extrae documentos (1–4+).
   * Derivado de las citas en sources/documents; permite filtrar y promocionar
   * el contenido por release. Ausente = el caso no cita ninguna release PURSUE.
   */
  pursueReleases?: number[];
  /** Sub-tipo de la explicación prosaica si el caso carga masa mundano/natural. */
  mundanoType?: MundanoType;
  /** Subtipo de misidentificación (con qué objeto conocido se confundió). Solo
   *  en casos mundanoType="misid"; es un drill-down bajo esa narrativa. */
  misidSubtype?: MisidSubtype;
  /** Detalle de SEGUNDO nivel de la clase prosaica (p. ej. `planeta_estrella`
   *  bajo `astronomico`, `globo` bajo `aeronave`, `optico` bajo `natural`). La
   *  clase es `misidSubtype` si mundanoType="misid" y "natural" si
   *  mundanoType="natural"; los valores admitidos por clase viven en
   *  `OBJECT_DETAILS` (lib/meceClasses.ts) y los valida validate-schema.mjs. No
   *  aplica a «fraude» ni a casos sin mundanoType. Ausente = «sin precisar». */
  objectDetail?: string;
  /** Fecha (AAAA-MM-DD) en que la clasificación —posterior, probability,
   *  mundanoType— se asignó o se contrastó leyendo la evidencia primaria del caso
   *  (expediente, télex, informe, crónica de la época), no un resumen secundario.
   *  Ausente = la clasificación no está verificada contra el documento. */
  evidenceReviewed?: string;
  /** Por qué la clase prosaica es esa (o por qué no hay ninguna): la frase de
   *  la fuente que la fija, ES + EN, y la fuente. Se muestra en el detalle. */
  classBasis?: { es: string; en: string; source: string; source_en?: string; url?: string };
  /** Solo en documentos: ids de los incidentes de los que este documento es
   *  evidencia. El documento no reparte probabilidad propia (no es un suceso);
   *  la ficha de cada caso enlazado lo lista como «Documentos que lo respaldan». */
  relatedCases?: string[];
  // Estatus epistémico del caso. Ausente = "documented" (evidencia
  // primaria verificable). "developing" = reciente/en curso; "projected"
  // = contenido near-future del corpus (análisis, no hecho documentado).
  epistemicStatus?: EpistemicStatus;
  probability: number;
  summary: string;
  summary_en?: string;
  // Overrides SEO opcionales. Cuando la query real con la que la gente
  // encuentra el caso no coincide con `name`/`summary` (ej. buscan "AARO
  // Historical Record Report" pero el name es "AAWSAP / Skinwalker Ranch"),
  // estos campos alimentan el <title> y la meta description con las palabras
  // que el usuario escribe, sin tocar el H1 ni la prosa. Ausentes = se usa
  // name/summary. `seoTitle` reemplaza el título completo (sin el sufijo
  // "· UAP Codex"), así que conviene mantenerlo ≤60 caracteres.
  // Variante ES: la sirve /es/cases/[slug]/.
  seoTitle?: string;
  seoDescription?: string;
  // Variante EN: la sirve la ruta raíz /cases/[slug]/. Sin estos, la ruta
  // inglesa heredaba el `seoTitle` en ESPAÑOL y lo mostraba en la SERP a un
  // público anglófono (jul 2026: 542 impresiones y 0 clicks entre AAWSAP y
  // Grusch, ambos en posición ~7). Ausentes = se cae a name_en/summary_en.
  seoTitle_en?: string;
  seoDescription_en?: string;
  // Documento primario destacado. Se renderiza como bloque prominente bajo el
  // hero (arriba del fold), para casos cuya query dominante tiene intención
  // "descargar el PDF" (ej. AAWSAP ↔ "AARO Historical Record Report pdf"):
  // convierte la página en el mejor puente hacia el documento en vez de
  // dejar al usuario rebotar buscando el PDF. Ausente = no se renderiza.
  featuredDoc?: {
    label: string;
    label_en?: string;
    url: string;
    note?: string;
    note_en?: string;
  };
  // Documentos primarios embebidos en el visor inline (PDF/imagen
  // auto-hospedados bajo /pursue/). Ausente = no se renderiza el visor.
  documents?: DocEmbed[];
  patterns: string[];
  // Forma(s) de la entidad reportada, por slug de data/entity-morphology.json.
  // Multi-etiqueta como `patterns`: un caso puede describir dos morfologías
  // distintas en el mismo encuentro (vilas-boas-1957, voronezh-1989). Ausente
  // en la gran mayoría del corpus, que documenta objetos sin ocupante.
  // NO es un eje del modelo MECE: no reparte probabilidad ni entra al agregado
  // de /probabilidades, que trabaja sobre la narrativa del incidente completo.
  entityMorphology?: string[];
  category: Category;
  // Optional rich-content fields. When present, the case detail page
  // renders a fully-explained version. When absent, the summary is the
  // only narrative shown (legacy/short cases).
  whatHappened?: string;     // 2-3 paragraphs: chronology + context
  whatHappened_en?: string;  // English translation
  whyMatters?: string;       // 1 paragraph: analytical significance
  whyMatters_en?: string;    // English translation
  evidence?: string[];       // bullet list of documented evidence items
  evidence_en?: string[];    // English translation
  sources?: CaseSource[];    // citations / primary documents
  primaryDocument?: CaseDocument; // optional primary-source image (PD/CC only)
  // MODELO MECE (en migración): distribución sobre explicaciones excluyentes,
  // suma 1. Opcional hasta recodificar las fichas. Mientras esté ausente,
  // lib/meceModel.ts deriva un posterior provisional desde los campos legacy.
  posterior?: Posterior;
}

export interface Pattern {
  id: string;
  letter: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  color: string;
}

export interface EntityMorphology {
  slug: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  color: string;
  // false = arquetipo conocido en la literatura ufológica sin ningún caso
  // del corpus que cumpla el estándar editorial. No genera página de detalle
  // (ver generateStaticParams en app/entities/[slug]/page.tsx).
  present: boolean;
  // ids de Framework hacia los que lee esta forma (frameworks.json). Vacío
  // cuando no hay lectura defendible — la ausencia de marco es el dato,
  // no un campo sin completar.
  readsToward: string[];
}

export interface Framework {
  id: string;
  name: string;
  name_en: string;
  author: string;
  origin: string;
  verdict_moral: VerdictMoral;
  one_sentence_es: string;
  one_sentence_en: string;
}

export interface ResearcherWork {
  year: number;
  title: string;
  // Par inglés del título. Ausente en las obras cuyo título es un nombre
  // propio neutro (un libro: "Communion"), donde no hay nada que traducir.
  // Obligatorio de facto cuando el título es DESCRIPTIVO ("Sesiones de
  // hipnosis con…"), o el sitio inglés-primario sirve español crudo.
  title_en?: string;
  contribution: string;
  contribution_en: string;
}

export interface ResearcherSource {
  name: string;
  /** Par inglés del nombre (mismo patrón que CaseSource): el sitio es
   *  inglés-primario y la ficha renderiza `name_en ?? name`, así que una fuente
   *  sin par muestra su nombre español a la ruta inglesa. */
  name_en?: string;
  url?: string;
  note?: string;
  note_en?: string;
}

export interface Researcher {
  id: string;
  name: string;
  flag: string;           // bandera de nacionalidad (emoji regional, p. ej. 🇦🇷)
  born?: number;
  death?: number;
  // F = experiencers (abducidos/contactados): el sujeto del fenómeno, no un
  // actor de disclosure. Mantener en sync con SECTIONS de validate-schema.mjs.
  section: "A" | "B" | "C" | "D" | "E" | "F";
  section_label: string;
  section_label_en: string;
  credentials: string;
  credentials_en: string;
  framework?: string;
  bio_short: string;
  bio_short_en: string;
  // Biografía larga opcional (~estándar de página, párrafos separados por
  // "\n\n"). Cuando existe, la página de actor la renderiza en vez del
  // bio_short — para investigadores con demanda real de búsqueda por nombre,
  // donde el párrafo corto rankeaba en posición 30-90 por contenido delgado.
  bio?: string;
  bio_en?: string;
  // Overrides SEO opcionales (mismo patrón que UAPCase). Apuntan al ángulo
  // ganable "<nombre> UAP" en vez del nombre puro (que compite con Wikipedia).
  seoTitle?: string;
  seoDescription?: string;
  works: ResearcherWork[];
  // Optional portrait. `photo` is a path under /public (e.g.
  // "/researchers/luna.jpg"). Only freely-licensed images (PD/CC) are used;
  // when absent the UI falls back to an initials avatar.
  photo?: string;
  photo_credit?: string;   // attribution / source line
  photo_license?: string;  // e.g. "Public domain"
  // Primary references that back the bio. Mirrors CaseSource.
  sources?: ResearcherSource[];
}

/**
 * Entrada de blog. Mismo patrón que UAPCase: un archivo JSON por post en
 * data/posts/, agregado a data/posts.json por scripts/build-posts.mjs.
 * El cuerpo es texto plano con párrafos separados por `\n\n` (igual que
 * `whatHappened` en los casos) — sin parser de markdown, sin deps nuevas.
 */
export interface Post {
  id: string;          // slug (= nombre de archivo)
  num: number;         // secuencia para orden y prev/next
  title: string;
  title_en?: string;
  date: string;        // ISO yyyy-mm-dd
  summary: string;
  summary_en?: string;
  tags?: string[];
  body: string;        // párrafos separados por \n\n
  body_en?: string;
}
