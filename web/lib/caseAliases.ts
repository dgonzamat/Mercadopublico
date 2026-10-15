/**
 * Fichas fusionadas o integradas: id retirado → id del caso que lo sustituye,
 * o una ruta del sitio que empieza por «/» (un actor, una entrega de PURSUE)
 * cuando la ficha era un documento que ahora vive embebido ahí (oct 2026). El detalle de caso
 * genera una página para cada id retirado (en / y en /es) que declara
 * `canonical` a la ficha vigente, `noindex`, y redirige con meta refresh, para
 * no romper los enlaces ya publicados. El id retirado no vuelve a `cases`, así
 * que no cuenta en el corpus ni en el sitemap.
 */
export const CASE_ALIASES: Readonly<Record<string, string>> = {
  // Mismo vídeo (DVIDS 1007713, DOW-UAP-PR055); se contaba dos veces (oct 2026).
  "afghanistan-isr-disc-2020": "spherical-afghanistan-2020",
  // Fichas-documento integradas en lo que respaldan (decisión del dueño, oct
  // 2026: ningún documento con ficha propia). Los catálogos de clips de PURSUE
  // sin caso propio salieron del sitio; sus casos conservan sus clips.
  "dow-uap-release02-catalog-2023": "/releases/02",
  "dow-uap-release04-05-catalog-2025": "/releases",
};

/** Ruta canónica (raíz inglesa) del destino de un alias. */
export function aliasCanonical(target: string): string {
  return target.startsWith("/") ? `${target}/` : `/cases/${target}/`;
}

/** Enlace relativo desde /cases/<id>/ (o /es/cases/<id>/): conserva el
 *  basePath y el prefijo /es sin conocerlos. */
export function aliasHref(target: string): string {
  return target.startsWith("/") ? `../..${target}/` : `../${target}/`;
}
