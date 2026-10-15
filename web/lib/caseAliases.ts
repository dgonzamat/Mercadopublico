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
  "twining-memo-1947": "/researchers/ruppelt",
  "robertson-panel-1953": "tremonton-film-1952",
  "usper-2025": "fbi-uap-stills-a-2025",
  "mccasland-disappearance-2026": "/researchers/delonge",
  "ciae-cefae-2011": "/researchers/lianza",
  "battelle-special-report-1952": "/researchers/zeidman",
  "project-magnet-canada-1950": "shirleys-bay-1954",
  "pursue-release-2026": "/releases",
  "project-blue-book-1952-1969": "/researchers/ruppelt",
  "mufon-network-1969": "/researchers/schuessler",
  "aaro-historical-record-2024": "/researchers/kirkpatrick",
  "flying-saucer-working-party-1950": "/researchers/clarke",
  "aldo-rebelo-disclosure-2026": "/researchers/rebelo",
  "doe-nuclear-facility-uap-docs": "pantex-2015",
  "majestic-12-documents": "roswell-1947",
  "nz-defence-force-declass-2010": "kaikoura-1978",
  "nara-rg38-1947": "muroc-1947",
  "bolender-memo-1969": "/researchers/grusch",
  "grusch-testimony-2023": "/researchers/grusch",
  "aliens-gov-immigration-2026": "/researchers/coulthart",
  "cefaa-chile-1997": "/researchers/bermudez",
  "arquivo-nacional-brasil-2026": "/researchers/gevaerd",
  "rommel-report-1980": "new-mexico-cattle-mutilations-1979",
  "setka-ussr-1978": "petrozavodsk-1977",
  "uap-disclosure-act-2025": "/researchers/schumer",
  "immaculate-constellation-2024": "/researchers/matthew-brown",
  "condon-report-1968": "/researchers/mcdonald",
  "project-grudge-1949": "/researchers/hynek",
  "mit-lincoln-lab-ruppelt-1952": "/researchers/ruppelt",
  "dow-early-disc-studies-1948-1953": "/researchers/ruppelt",
  "nyt-aatip-2017": "aawsap-skinwalker-2008",
  "italy-aeronautica-declass-2014": "grazzanise-2005",
  "estimate-situation-1948": "chiles-whitted-1948",
  "wilson-davis-2002": "/researchers/davis",
  "pursue-r03-2026": "/releases/03",
  "japan-jai-directive-2020": "/researchers/kono",
  "oifaa-difaa-peru": "/researchers/chamorro",
  "denmark-airforce-files-2009": "mainbrace-1952",
  "capitol-press-conference-2026": "/researchers/grusch",
  "turner-report-1971": "mt-hale-1961",
  "desclasificacion-mod-espana-1992-1997": "/researchers/ballester-olmos",
  "project-condign-2000": "/researchers/clarke",
  "cometa-report-1999": "/researchers/velasco",
  "disclosure-forum-2026": "/researchers/mellon",
  "fbi-62hq83894-file": "maury-island-1947",
  "nasa-gemini-debriefings": "gemini4-mcdivitt-1965",
  "aaro-case-resolution-reports": "al-taqaddum-balloons-2017",
  "vanguard-enterprise-2026": "/researchers/matthew-brown",
  "hottel-memo-1950": "aztec-1948",
  "dow-centcom-2020": "/releases/01",
  "wikileaks-podesta-2016": "/researchers/delonge",
  "cridovni-uruguay-1979": "/researchers/sanchez",
  "geipan-gepan-france": "/researchers/poher",
  "ukraine-mao-uap-2022": "kyiv-mao-observations-2022",
  "poss-i-transients-2025": "/researchers/villarroel",
  "burlison-ffrdc-investigation-2026": "/researchers/burlison",
  "sky-canada-project-2025": "/researchers/hellyer",
  "nasa-uap-study-2023": "western-us-objects-2021",
  "sturrock-panel-1998": "/researchers/sturrock",
  "uap-whistleblower-immunity-2026": "/researchers/luna",
  "usaf-incident-summaries-1947-1950": "kenneth-arnold-1947",
  "cia-historical-uap-archive": "/releases/03",
  "reeves-foia-classified-network-2023": "/releases/02",
  "disclosure-project-2001": "/researchers/greer",
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
