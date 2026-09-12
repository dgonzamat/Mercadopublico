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

/**
 * País ISO → región. Lista a mano, PORQUE la agrupación es editorial (Rusia y
 * Eurasia van en Asia, el Caribe hispano en Latinoamérica) y ninguna tabla ISO
 * la daría. El precio de escribirla a mano es que se queda atrás cuando el
 * corpus crece: en sep 2026 había 28 casos de 16 países sin mapear —Grecia,
 * Irak, la URSS, Rumanía, Ucrania…— cayendo todos en `data-region="otro"`, que
 * NO existe como opción del filtro, así que quedaban inalcanzables en cuanto
 * alguien filtraba por región (el CSS oculta todo `[data-region]` que no calce).
 * El filtro anunciaba «Europe · 64» sobre 69 casos europeos reales.
 *
 * Por eso la completitud ya no depende de acordarse: `audit-consistency.mjs`
 * E35 falla el build si un caso trae un país que esta tabla no conoce.
 */
const COUNTRY_REGION: Record<string, Region> = {
  // Norteamérica
  US: "norteamerica", CA: "norteamerica", MX: "norteamerica", PR: "norteamerica",
  // Latinoamérica (Centro, Sur y Caribe hispano)
  AR: "latinoamerica", BO: "latinoamerica", BR: "latinoamerica", CL: "latinoamerica",
  CO: "latinoamerica", CR: "latinoamerica", EC: "latinoamerica", PE: "latinoamerica",
  UY: "latinoamerica", VE: "latinoamerica", PA: "latinoamerica", GT: "latinoamerica",
  CU: "latinoamerica", SV: "latinoamerica",
  // Europa
  BE: "europa", CZ: "europa", ES: "europa", FR: "europa", GB: "europa", IT: "europa",
  NO: "europa", SE: "europa", DE: "europa", NL: "europa", PT: "europa", IE: "europa",
  PL: "europa", CH: "europa", AT: "europa", DK: "europa", FI: "europa",
  GR: "europa", RO: "europa", UA: "europa",
  // Asia (incluye Rusia/Eurasia)
  RU: "asia", IN: "asia", JP: "asia", CN: "asia", KR: "asia", ID: "asia", TH: "asia",
  SU: "asia", KZ: "asia", AF: "asia", VN: "asia", MY: "asia", KP: "asia",
  // Medio Oriente
  IR: "medio-oriente", TR: "medio-oriente", IL: "medio-oriente", SA: "medio-oriente",
  AE: "medio-oriente", EG: "medio-oriente", IQ: "medio-oriente", OM: "medio-oriente",
  SY: "medio-oriente",
  // Oceanía
  AU: "oceania", NZ: "oceania", PG: "oceania", FJ: "oceania",
  // África
  DZ: "africa", ZW: "africa", ZA: "africa", NG: "africa", KE: "africa", MA: "africa",
  TZ: "africa", MG: "africa",
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
