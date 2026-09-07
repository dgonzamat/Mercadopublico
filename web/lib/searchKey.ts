/**
 * Clave de búsqueda para los filtros de texto libre del sitio (/researchers,
 * /cases). El SERVIDOR la emite ya normalizada en `data-search` y el CLIENTE
 * normaliza la consulta con la MISMA función antes de comparar por substring.
 *
 * Vive aquí, y no duplicada en cada página, precisamente por eso: si las dos
 * normalizaciones divergen (una pliega diacríticos y la otra no), la búsqueda
 * falla en silencio — devuelve menos resultados sin que nada avise. Una sola
 * definición hace imposible ese desajuste.
 *
 * Plegar diacríticos es lo que hace que "antonio" encuentre "Antônio" y
 * "valdes" encuentre "Valdés".
 */
export function searchKey(...parts: string[]): string {
  return parts
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
