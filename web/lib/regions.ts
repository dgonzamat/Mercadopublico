/**
 * Agrupación de países en regiones, para los filtros de casos e investigadores.
 *
 * Los casos traen un código ISO en `country`; los investigadores traen una
 * bandera emoji en `flag` (que se decodifica a ISO con `flagToCountry`).
 * Se incluyen códigos que aún no están en el corpus para que el filtro siga
 * funcionando cuando se agreguen.
 */
export type Region =
  | "norteamerica"
  | "latinoamerica"
  | "europa"
  | "asia"
  | "medio-oriente"
  | "oceania"
  | "africa";

export const REGION_ORDER: Region[] = [
  "norteamerica",
  "latinoamerica",
  "europa",
  "asia",
  "medio-oriente",
  "oceania",
  "africa",
];

export const REGION_LABELS: Record<Region, { es: string; en: string }> = {
  norteamerica: { es: "Norteamérica", en: "North America" },
  latinoamerica: { es: "Latinoamérica", en: "Latin America" },
  europa: { es: "Europa", en: "Europe" },
  asia: { es: "Asia", en: "Asia" },
  "medio-oriente": { es: "Medio Oriente", en: "Middle East" },
  oceania: { es: "Oceanía", en: "Oceania" },
  africa: { es: "África", en: "Africa" },
};

const COUNTRY_REGION: Record<string, Region> = {
  // Norteamérica
  US: "norteamerica", CA: "norteamerica", MX: "norteamerica", PR: "norteamerica",
  // Latinoamérica (Centro, Sur y Caribe hispano)
  AR: "latinoamerica", BO: "latinoamerica", BR: "latinoamerica", CL: "latinoamerica",
  CO: "latinoamerica", CR: "latinoamerica", EC: "latinoamerica", PE: "latinoamerica",
  UY: "latinoamerica", VE: "latinoamerica", PA: "latinoamerica", GT: "latinoamerica",
  // Europa
  BE: "europa", CZ: "europa", ES: "europa", FR: "europa", GB: "europa", IT: "europa",
  NO: "europa", SE: "europa", DE: "europa", NL: "europa", PT: "europa", IE: "europa",
  PL: "europa", CH: "europa", AT: "europa", DK: "europa", FI: "europa",
  // Asia (incluye Rusia/Eurasia)
  RU: "asia", IN: "asia", JP: "asia", CN: "asia", KR: "asia", ID: "asia", TH: "asia",
  // Medio Oriente
  IR: "medio-oriente", TR: "medio-oriente", IL: "medio-oriente", SA: "medio-oriente",
  AE: "medio-oriente", EG: "medio-oriente",
  // Oceanía
  AU: "oceania", NZ: "oceania", PG: "oceania", FJ: "oceania",
  // África
  DZ: "africa", ZW: "africa", ZA: "africa", NG: "africa", KE: "africa", MA: "africa",
};

/** Región de un código ISO de país (o undefined si no está mapeado). */
export function regionOf(country: string): Region | undefined {
  return COUNTRY_REGION[country];
}

/** Decodifica una bandera emoji (dos indicadores regionales) a su código ISO. */
export function flagToCountry(flag: string): string {
  const cps = Array.from(flag).map((ch) => ch.codePointAt(0) ?? 0);
  if (cps.length === 2 && cps.every((c) => c >= 0x1f1e6 && c <= 0x1f1ff)) {
    return cps.map((c) => String.fromCharCode(c - 0x1f1e6 + 65)).join("");
  }
  return "";
}
