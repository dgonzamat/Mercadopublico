/**
 * Fichas fusionadas: id retirado → id que lo sustituye. El detalle de caso
 * genera una página para cada id retirado (en / y en /es) que declara
 * `canonical` a la ficha vigente, `noindex`, y redirige con meta refresh, para
 * no romper los enlaces ya publicados. El id retirado no vuelve a `cases`, así
 * que no cuenta en el corpus ni en el sitemap.
 */
export const CASE_ALIASES: Readonly<Record<string, string>> = {
  // Mismo vídeo (DVIDS 1007713, DOW-UAP-PR055); se contaba dos veces (oct 2026).
  "afghanistan-isr-disc-2020": "spherical-afghanistan-2020",
};
