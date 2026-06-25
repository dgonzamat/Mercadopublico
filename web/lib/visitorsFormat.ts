/**
 * Helpers compartidos del módulo /visitantes (formato de país y fecha).
 * Sin estado ni red — solo formateo, reutilizable por la tabla, el panel y el mapa.
 */

/** Código ISO-2 → emoji de bandera (indicadores regionales). */
export function flagEmoji(cc: string): string {
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  const BASE = 0x1f1e6; // 🇦
  return String.fromCodePoint(
    BASE + cc.charCodeAt(0) - 65,
    BASE + cc.charCodeAt(1) - 65,
  );
}

const NAME_ES = new Intl.DisplayNames(["es"], { type: "region" });
const NAME_EN = new Intl.DisplayNames(["en"], { type: "region" });

/** Código ISO-2 → nombre del país en es/en. "XX"/desconocido → fallback. */
export function countryName(cc: string, locale: "es" | "en"): string {
  const fallback = locale === "es" ? "Desconocido" : "Unknown";
  if (cc === "XX" || !/^[A-Z]{2}$/.test(cc)) return fallback;
  const dn = locale === "es" ? NAME_ES : NAME_EN;
  try {
    return dn.of(cc) || cc;
  } catch {
    return cc;
  }
}

const SECTION_LABEL: Record<string, { es: string; en: string }> = {
  "": { es: "Inicio", en: "Home" },
  cases: { es: "Casos", en: "Cases" },
  probabilidades: { es: "Probabilidades", en: "Probabilities" },
  atlas: { es: "Atlas", en: "Atlas" },
  patterns: { es: "Patrones", en: "Patterns" },
  researchers: { es: "Investigadores", en: "Researchers" },
  frameworks: { es: "Frameworks", en: "Frameworks" },
  about: { es: "Acerca", en: "About" },
  resumen: { es: "Resumen", en: "Summary" },
  visitantes: { es: "Visitantes", en: "Visitors" },
  posts: { es: "Blog", en: "Blog" },
};

/** Convierte un slug ("rendlesham-1980") en texto legible ("Rendlesham 1980"). */
function prettySlug(slug: string): string {
  const s = decodeURIComponent(slug).replace(/-/g, " ").trim();
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Ruta → etiqueta legible en es/en. "/" → Inicio; "/cases" → Casos;
 * "/cases/rendlesham-1980" → "Casos · Rendlesham 1980". Rutas desconocidas
 * caen al propio path.
 */
export function pageLabel(path: string, locale: "es" | "en"): string {
  const clean = path.split("?")[0].split("#")[0];
  const parts = clean.split("/").filter(Boolean); // ["cases","slug"]
  const section = SECTION_LABEL[parts[0] ?? ""];
  if (!section) return clean || "/";
  const head = section[locale];
  if (parts.length <= 1) return head;
  return `${head} · ${prettySlug(parts.slice(1).join("/"))}`;
}

/** Día (YYYY-MM-DD) → "25 jun" en es/en, fijado a UTC para no desfasar. */
export function fmtDay(day: string, locale: string): string {
  try {
    return new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    });
  } catch {
    return day;
  }
}

/** Fecha + hora en formato 12h (AM/PM), en la zona horaria del visitante. */
export function fmtDateTime(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}
