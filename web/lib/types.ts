export type Tier = "S" | "A" | "B";
export type EpistemicStatus = "documented" | "developing" | "projected";
export type Category = "incident" | "document" | "contactee" | "crop_circle";
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
 * MODELO MECE (en migración) — reemplazo de evidenceContribution + las 10
 * hipótesis existenciales solapadas. Cada caso recibe una distribución sobre
 * un conjunto de explicaciones MUTUAMENTE EXCLUYENTES y EXHAUSTIVAS que suma
 * 1. El agregado del corpus (Σ posteriores) reparte el 100% entre clases y es
 * comparable. Ver lib/meceModel.ts. Coexiste con el modelo viejo durante la
 * migración; `posterior` es opcional hasta recodificar las ~200 fichas.
 */
/**
 * Hojas de la partición (suman 1 por caso). Preservan las hipótesis del modelo
 * viejo: 5 son hipótesis directas, 3 son las subclases del paraguas «entidades
 * no humanas». Las hipótesis DERIVADAS se recuperan como vistas:
 *   - entidades-no-humanas = interdimensional + ontologico + tratado
 *   - heterogeneidad       = 1 − mundano  (≥1 caso genuinamente anómalo)
 * (misidentificación como pre-filtro del universo previo sigue aparte.)
 */
export type MeceClassId =
  | "mundano"          // misidentificación / objeto conocido / fraude
  | "natural_desc"     // fenómeno natural (catalogado o no)
  | "clasificada"      // programas clasificados (tec. humana propia/aliada)
  | "adversaria"       // tecnología de vigilancia de otro Estado
  | "ing_inversa"      // ingeniería inversa de tecnología no humana (programa)
  | "interdimensional" // subclase de entidades no humanas
  | "ontologico"       // subclase: ontológico no materialista
  | "tratado"          // subclase: tratado formal (greys)
  | "indet";           // indeterminable / evidencia insuficiente

export type Posterior = Record<MeceClassId, number>;

/** Subclases que componen el paraguas «entidades no humanas» (derivado). */
export const ENTIDADES_SUBCLASSES: MeceClassId[] = [
  "interdimensional",
  "ontologico",
  "tratado",
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
  // Estatus epistémico del caso. Ausente = "documented" (evidencia
  // primaria verificable). "developing" = reciente/en curso; "projected"
  // = contenido near-future del corpus (análisis, no hecho documentado).
  epistemicStatus?: EpistemicStatus;
  probability: number;
  summary: string;
  summary_en?: string;
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
