export type Tier = "S" | "A" | "B";
export type EpistemicStatus = "documented" | "developing" | "projected";
export type Category = "incident" | "document" | "contactee" | "crop_circle";
/** Sub-tipo de la explicación prosaica (abre la narrativa mundano/natural). */
export type MundanoType = "misid" | "natural" | "fraude";

/** Subtipo de misidentificación: CON QUÉ objeto conocido se confundió el
 *  avistamiento. Solo aplica a casos con mundanoType="misid" (drill-down, capa 2
 *  bajo la narrativa «Misidentificación»; MECE dentro de misid). */
export type MisidSubtype = "astronomico" | "aeronave" | "espacial" | "terrestre_otros";
export type VerdictMoral = "neutral" | "hostile" | "positive" | "variable";

export interface Location {
  lat: number;
  lng: number;
  place?: string;
  place_en?: string;
}

export interface CaseSource {
  name: string;
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
 * el render (iframe para pdf, img para imagen). `fallbackUrl` apunta al
 * documento oficial original como respaldo navegable.
 */
export interface DocEmbed {
  src: string;
  type: "pdf" | "image";
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
  seoTitle?: string;
  seoDescription?: string;
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
  contribution: string;
  contribution_en: string;
}

export interface ResearcherSource {
  name: string;
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
  section: "A" | "B" | "C" | "D" | "E";
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
