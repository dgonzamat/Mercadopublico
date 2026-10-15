// Rótulo de licencia del visor en el idioma de la página. El dato
// (`license` en data/cases) está en español; el sitio es inglés-primario,
// así que la ruta EN lo traduce aquí. Un rótulo sin traducción conocida
// se muestra tal cual (las CC ya son iguales en los dos idiomas).
const EN: Record<string, string> = {
  "Dominio público": "Public domain",
  "Dominio público · obra del Gobierno de EE. UU.": "Public domain · US Government work",
  "Dominio público · obra del Gobierno de EE. UU. (17 USC §105)": "Public domain · US Government work (17 USC §105)",
  "Dominio público · NASA, obra del Gobierno de EE. UU.": "Public domain · NASA, US Government work",
  "Dominio público (obra del Gobierno de Australia anterior a 1975)": "Public domain (Australian Government work before 1975)",
  "Registro público del Congreso de EE.UU. (testimonio escrito publicado por el Comité de Supervisión de la Cámara)":
    "US Congressional public record (written testimony published by the House Oversight Committee)",
  "Registro público del Congreso de EE.UU. (declaración publicada por el Comité de Supervisión de la Cámara)":
    "US Congressional public record (statement published by the House Oversight Committee)",
  "Intervenciones públicas en el Parlamento, de uso libre (Ley de Derecho de Autor de Japón, art. 40)":
    "Public statements in Parliament, free to use (Japanese Copyright Act, art. 40)",
  "Dominio público · obra anterior a 1928": "Public domain · work published before 1928",
  "Dominio público (captura de la transmisión oficial de la Cámara de Representantes de EE.UU.)":
    "Public domain (capture of the official US House of Representatives broadcast)",
  "Documento oficial público (Arquivo Nacional; Lei 9.610, art. 8.º, IV)":
    "Public official document (Arquivo Nacional; Law 9.610, art. 8, IV)",
  "Acto oficial de la administración pública italiana, excluido del derecho de autor (Ley 633/1941, art. 5)":
    "Official act of the Italian public administration, excluded from copyright (Law 633/1941, art. 5)",
  "Transcripción literal con fines documentales; derechos del contenido de sus autores":
    "Verbatim transcript for documentary purposes; content rights belong to its authors",
  "Formulario operativo sin originalidad protegible; reproducción fotográfica de terceros; nombres del personal tapados":
    "Operational form without protectable originality; third-party photographic reproduction; staff names covered",
  "Dominio público · publicado en 1909": "Public domain · published in 1909",
  "Dominio público · obra del Congreso de EE.UU. (PD-USGov-Congress)": "Public domain · US Congress work (PD-USGov-Congress)",
  "Dominio público · obra de 1942, sin renovación de copyright": "Public domain · 1942 work, copyright not renewed",
  "Dominio público · despacho de agencia sin firma publicado en 1934 (más de 70 años)":
    "Public domain · unsigned wire dispatch published in 1934 (over 70 years)",
  "Dominio público · artículo de prensa sin firma publicado en 1954 (más de 70 años)":
    "Public domain · unsigned press article published in 1954 (over 70 years)",
  "Dominio público (fotografías publicadas en 1952; Ley 9.610, art. 44, protección de 70 años)":
    "Public domain (photographs published in 1952; Law 9.610, art. 44, 70-year protection)",
  "Dominio público (foto sueca de 1946, por antigüedad)": "Public domain (Swedish photo from 1946, by age)",
  "Dominio público (PD-USGov-POTUS)": "Public domain (PD-USGov-POTUS)",
  "Dominio público (CC0)": "Public domain (CC0)",
  "Dominio público en EE.UU. (PD-US)": "Public domain in the US (PD-US)",
  "Open Government Licence v3.0 (Crown copyright, Ministerio de Defensa)": "Open Government Licence v3.0 (Crown copyright, Ministry of Defence)",
  "Dominio público (obra del gobierno de EE. UU., 17 U.S.C. § 105)": "Public domain (US Government work, 17 U.S.C. § 105)",
  "Dominio público (PD-USGov, obra de la Marina de EE. UU.)": "Public domain (PD-USGov, US Navy work)",
  "CC BY 4.0 · Fuente: Biblioteca Central del Ejército del Aire": "CC BY 4.0 · Source: Biblioteca Central del Ejército del Aire",
};

export function licenseLabel(license: string | undefined, locale: "es" | "en"): string | undefined {
  if (!license || locale === "es") return license;
  return EN[license] ?? license;
}
