/**
 * Mapa ISO-2 → continente, para agrupar las visitas por región sin tracking
 * extra (solo reagrupa el país que ya guardamos). Códigos que no aparecen
 * (o "XX") se agrupan como desconocido en la UI.
 */
export type Continent = "AM" | "EU" | "AS" | "AF" | "OC" | "AN";

export const CONTINENT_NAME: Record<Continent, { es: string; en: string }> = {
  AM: { es: "América", en: "Americas" },
  EU: { es: "Europa", en: "Europe" },
  AS: { es: "Asia", en: "Asia" },
  AF: { es: "África", en: "Africa" },
  OC: { es: "Oceanía", en: "Oceania" },
  AN: { es: "Antártida", en: "Antarctica" },
};

/** Bandera redonda aproximada por continente (emoji neutro, decorativo). */
export const CONTINENT_GLYPH: Record<Continent, string> = {
  AM: "🌎",
  EU: "🌍",
  AS: "🌏",
  AF: "🌍",
  OC: "🌏",
  AN: "🧊",
};

const BY_CONTINENT: Record<Continent, string[]> = {
  AM: [
    "AG", "AI", "AR", "AW", "BB", "BL", "BM", "BO", "BQ", "BR", "BS", "BZ",
    "CA", "CL", "CO", "CR", "CU", "CW", "DM", "DO", "EC", "FK", "GD", "GF",
    "GL", "GP", "GT", "GY", "HN", "HT", "JM", "KN", "KY", "LC", "MF", "MQ",
    "MS", "MX", "NI", "PA", "PE", "PM", "PR", "PY", "SR", "SV", "SX", "TC",
    "TT", "US", "UY", "VC", "VE", "VG", "VI",
  ],
  EU: [
    "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE",
    "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU",
    "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
    "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ",
    "SK", "SM", "TR", "UA", "VA", "XK",
  ],
  AS: [
    "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "GE", "HK", "ID",
    "IL", "IN", "IQ", "IR", "JO", "JP", "KG", "KH", "KP", "KR", "KW", "KZ",
    "LA", "LB", "LK", "MM", "MN", "MO", "MV", "MY", "NP", "OM", "PH", "PK",
    "PS", "QA", "SA", "SG", "SY", "TH", "TJ", "TL", "TM", "TW", "UZ", "VN",
    "YE",
  ],
  AF: [
    "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ",
    "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE",
    "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA",
    "NE", "NG", "RE", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ",
    "TD", "TG", "TN", "TZ", "UG", "YT", "ZA", "ZM", "ZW",
  ],
  OC: [
    "AS", "AU", "CK", "FJ", "FM", "GU", "KI", "MH", "MP", "NC", "NF", "NR",
    "NU", "NZ", "PF", "PG", "PW", "SB", "TO", "TV", "VU", "WF", "WS",
  ],
  AN: ["AQ"],
};

const MAP: Record<string, Continent> = {};
for (const [cont, codes] of Object.entries(BY_CONTINENT) as [
  Continent,
  string[],
][]) {
  for (const cc of codes) MAP[cc] = cont;
}

/** Código ISO-2 → continente, o null si es desconocido. */
export function continentOf(cc: string): Continent | null {
  return MAP[cc] ?? null;
}
