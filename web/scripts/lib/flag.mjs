// Bandera que corresponde al país de una ficha (regla de país: el del lugar del
// suceso). Se admiten tres excepciones deliberadas: un globo para el espacio o
// un área sin país, la de la Antártida y la rusa para la Unión Soviética. La
// auditoría de página (nov 2026) halló la bandera de Japón en JAL 1628, sobre
// Alaska. Lo comparten E58 (audit-consistency) y su prueba unitaria.
const ALLOWED_EXTRA = new Set(["🌍", "🌎", "🌏", "🇦🇶"]);

export function flagOf(cc) {
  if (!/^[A-Z]{2}$/.test(cc || "")) return null;
  return [...cc].map((ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65)).join("");
}

/** true si la bandera de la ficha casa con su país o es una excepción admitida. */
export function flagMatches(c) {
  if (!c.flag || ALLOWED_EXTRA.has(c.flag)) return true;
  if (c.country === "SU") return c.flag === "🇷🇺";
  const want = flagOf(c.country);
  return want === null || c.flag === want;
}
