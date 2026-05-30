export type Tier = "S" | "A" | "B";
export type Category = "incident" | "document" | "contactee" | "crop_circle";
export type VerdictMoral = "neutral" | "hostile" | "positive" | "variable";

export interface Location {
  lat: number;
  lng: number;
  place?: string;
}

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
  probability: number;
  summary: string;
  summary_en?: string;
  patterns: string[];
  category: Category;
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
}

export interface Researcher {
  id: string;
  name: string;
  born: number;
  death?: number;
  section: "A" | "B" | "C" | "D" | "E";
  section_label: string;
  credentials: string;
  framework?: string;
  bio_short: string;
  works: ResearcherWork[];
}
