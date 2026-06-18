import { cases, researchers, frameworks } from "./data";

/**
 * Aggregate every source cited across the entire corpus into one
 * consolidated bibliography, deduped by URL or name, grouped by
 * heuristic category. Used by /fuentes to show every reference at
 * once.
 *
 * Categorization is by URL domain (best-effort) and falls back to
 * "Sin link público" when no URL exists. Multiple cases can cite
 * the same source — we collect all citations so the bibliography
 * also shows where each reference appears.
 */

export type SourceCategory =
  | "official"
  | "archive"
  | "academic"
  | "press"
  | "book"
  | "code"
  | "audio_video"
  | "other";

export interface SourceAppearance {
  label: string;
  href?: string;
}

export interface AggregatedSource {
  name: string;
  url?: string;
  note?: string;
  category: SourceCategory;
  appearances: SourceAppearance[];
}

export const CATEGORY_LABELS: Record<
  SourceCategory,
  { es: string; en: string; description_es: string; description_en: string }
> = {
  official: {
    es: "Documentos oficiales (FOIA, IC, agencias)",
    en: "Official documents (FOIA, IC, agencies)",
    description_es:
      "Memos, reportes y archivos desclasificados de gobiernos y agencias de inteligencia. .gov, .mil, archives.gov, dni.gov, nasa.gov.",
    description_en:
      "Memos, reports and declassified files from governments and intelligence agencies. .gov, .mil, archives.gov, dni.gov, nasa.gov.",
  },
  archive: {
    es: "Repositorios desclasificados",
    en: "Declassified repositories",
    description_es:
      "Archivos abiertos que agregan documentos FOIA y materiales originales: The Black Vault, Project 1947, archive.org.",
    description_en:
      "Open archives aggregating FOIA documents and original materials: The Black Vault, Project 1947, archive.org.",
  },
  academic: {
    es: "Artículos académicos revisados por pares",
    en: "Academic papers and peer-reviewed",
    description_es:
      "Publicaciones científicas en arXiv, revistas y congresos. Incluye trabajos de Nolan, Vallée, Loeb y otros.",
    description_en:
      "Scientific publications in arxiv, journals, conferences. Includes work by Nolan, Vallée, Loeb and others.",
  },
  press: {
    es: "Periodismo investigativo",
    en: "Investigative journalism",
    description_es:
      "NYT, Washington Post, The Debrief, News Nation, más la cobertura de prensa internacional de incidentes y divulgación.",
    description_en:
      "NYT, Washington Post, The Debrief, News Nation, plus international press coverage of incidents and disclosure.",
  },
  book: {
    es: "Libros y memorias",
    en: "Books and memoirs",
    description_es:
      "Bibliografía publicada: Vallée, Mack, Strieber, Elizondo, Graves, Pasulka, Coulthart, Freixedo.",
    description_en:
      "Published bibliography: Vallée, Mack, Strieber, Elizondo, Graves, Pasulka, Coulthart, Freixedo.",
  },
  audio_video: {
    es: "Audio, video y documentales",
    en: "Audio, video and documentaries",
    description_es:
      "Material filmado: videos ATFLIR del Pentágono, documentales (Skinwalker, Patient Seventeen, Bob Lazar) y pódcasts de larga duración.",
    description_en:
      "Filmed material: Pentagon ATFLIR videos, documentaries (Skinwalker, Patient Seventeen, Bob Lazar), long-form podcasts.",
  },
  code: {
    es: "Código abierto y datos",
    en: "Open source and data",
    description_es:
      "Repositorios GitHub del corpus original y código fuente del sitio.",
    description_en:
      "GitHub repositories of the original corpus and site source code.",
  },
  other: {
    es: "Otros · Sin enlace público",
    en: "Other · No public link",
    description_es:
      "Documentos físicos, testimonios privados, archivos militares aún clasificados y referencias sin URL pública directa.",
    description_en:
      "Physical documents, private testimony, military files still classified, and references without a direct public URL.",
  },
};

const CATEGORY_ORDER: SourceCategory[] = [
  "official",
  "archive",
  "academic",
  "press",
  "book",
  "audio_video",
  "code",
  "other",
];

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function categorize(s: { name: string; url?: string; note?: string }): SourceCategory {
  const d = s.url ? domainOf(s.url) : "";
  const n = (s.name + " " + (s.note ?? "")).toLowerCase();

  if (
    /\.gov$|\.mil$|\.gov\/|\.mil\//.test(d) ||
    /^archives\./.test(d) ||
    d === "dni.gov" ||
    d === "nasa.gov" ||
    d === "congress.gov" ||
    d === "oversight.house.gov"
  ) return "official";

  if (/(blackvault|project1947|archive\.org|cufos|nicap)/.test(d)) return "archive";

  if (
    /arxiv\.org|science\.org|nature\.com|cell\.com|sciencedirect|mit\.edu|harvard\.edu|stanford\.edu|\.edu$|\.edu\//.test(d) ||
    /peer-reviewed|peer reviewed|journal|conference|arxiv/i.test(n)
  ) return "academic";

  if (
    /nytimes|washingtonpost|theatlantic|newyorker|guardian|reuters|apnews|news\b|thedebrief|theintercept|wired|vice|politico|nbcnews|cbsnews|abcnews|9news|kqed|kpbs/.test(d) ||
    d.includes("press") ||
    d.includes("times") ||
    /(\bnews\b|periódico|periodico)/i.test(n)
  ) return "press";

  if (
    /penguinrandomhouse|amazon|harpercollins|simonandschuster|oup\.com|oxford|cambridge|book|libro/.test(d) ||
    /\b(book|libro|memoir|biography|biografía)\b/i.test(n) ||
    n.includes("(book)") ||
    n.includes("memoir")
  ) return "book";

  if (
    /youtube|vimeo|spotify|apple\.com\/podcasts|soundcloud/.test(d) ||
    /\b(documentary|documental|podcast|video|interview|entrevista|filmado|filmación)\b/i.test(n)
  ) return "audio_video";

  if (/github\.com|gitlab/.test(d)) return "code";

  return "other";
}

function sourceKey(s: { name: string; url?: string }): string {
  return s.url ? `url:${s.url}` : `name:${s.name.toLowerCase().trim()}`;
}

export function getAllSources(): AggregatedSource[] {
  const map = new Map<string, AggregatedSource>();

  function add(
    s: { name: string; url?: string; note?: string },
    appearance: SourceAppearance,
  ) {
    const key = sourceKey(s);
    const existing = map.get(key);
    if (existing) {
      if (!existing.appearances.some((a) => a.label === appearance.label)) {
        existing.appearances.push(appearance);
      }
      return;
    }
    map.set(key, {
      name: s.name,
      url: s.url,
      note: s.note,
      category: categorize(s),
      appearances: [appearance],
    });
  }

  // Case sources
  for (const c of cases) {
    const appearance: SourceAppearance = {
      label: `${c.name} · ${c.year_start}`,
      href: `/cases/${c.id}`,
    };
    for (const s of c.sources ?? []) {
      add(s, appearance);
    }
  }

  // Researcher works (treat as published references)
  for (const r of researchers) {
    const appearance: SourceAppearance = {
      label: `${r.name}`,
      href: `/researchers/${r.id}`,
    };
    for (const w of r.works) {
      add(
        {
          name: `${w.title} (${w.year})`,
          note: w.contribution,
        },
        appearance,
      );
    }
  }

  // Frameworks: author + framework name as reference
  for (const f of frameworks) {
    add(
      {
        name: `${f.name} — ${f.author}`,
        note: f.one_sentence_es,
      },
      {
        label: "Framework teórico",
        href: "/frameworks",
      },
    );
  }

  // Standards reference (single official methodology link)
  add(
    {
      name: "ICD-203 Analytic Standards",
      url: "https://irp.fas.org/dni/icd/icd-203.pdf",
      note: "Intelligence Community Directive 2007 — calibration standard for analytical judgment",
    },
    { label: "Metodología", href: "/about" },
  );

  return Array.from(map.values());
}

export function groupByCategory(
  sources: AggregatedSource[],
): Array<{ category: SourceCategory; items: AggregatedSource[] }> {
  const groups = new Map<SourceCategory, AggregatedSource[]>();
  for (const s of sources) {
    const arr = groups.get(s.category) ?? [];
    arr.push(s);
    groups.set(s.category, arr);
  }
  // Within each group sort by name
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({
    category: c,
    items: groups.get(c)!,
  }));
}
