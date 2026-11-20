import type { UAPCase } from "./types";
import { countryEn } from "./i18n-geo";

/**
 * Nombre canónico de cada país (código ISO de `country`) en los dos idiomas:
 * el primer segmento de `country_name` que más se repite entre sus casos.
 * Existe porque /cobertura rotulaba cada fila con el nombre del primer caso
 * que encontraba («URSS / Rusia» para RU, cuando 7 de sus 8 casos dicen
 * «Rusia»), y el enlace a /cases filtraba por ese texto (nov 2026). Server-only:
 * recibe el corpus, no lo importa.
 */
export function canonicalCountryNames(cases: UAPCase[]): Record<string, { es: string; en: string }> {
  const tally = new Map<string, Map<string, number>>();
  for (const c of cases) {
    const name = c.country_name.split(" · ")[0];
    const m = tally.get(c.country) ?? new Map<string, number>();
    m.set(name, (m.get(name) ?? 0) + 1);
    tally.set(c.country, m);
  }
  const out: Record<string, { es: string; en: string }> = {};
  for (const [code, m] of tally) {
    const es = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    out[code] = { es, en: countryEn(es).split(" · ")[0] };
  }
  return out;
}
