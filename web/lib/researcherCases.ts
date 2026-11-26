import { cases, cryptids, researchers } from "./data";
import type { UAPCase, Researcher } from "./types";

/**
 * Asociación curada investigador → casos del corpus.
 *
 * Es una relación muchos-a-muchos que no encaja limpio dentro de ninguna de
 * las dos entidades, así que vive acá como fuente única. Se pobló a partir
 * de menciones en el contenido de cada caso + curaduría manual verificada.
 *
 * Los teóricos que antes no tenían caso puntual ahora están anclados al
 * caso que efectivamente estudiaron: Freixedo → Colares (su caso canónico de
 * entidades hostiles); Nolan → Council Bluffs + American Cosmic (análisis de
 * materiales); Strieber → Communion (su propia abducción documentada);
 * Pasulka → American Cosmic (su trabajo de campo en 'American Cosmic').
 * Ningún investigador queda huérfano.
 */
export const RESEARCHER_CASES: Record<string, string[]> = {
  // A — científicos
  "wang-sichao": ["china-spiral-1981"],
  vallee: ["la-joya-arequipa-1980", "valdes-1977", "voronezh-1989"],
  hynek: ["socorro-1964", "valensole-1965", "hudson-valley-1983"],
  mcdonald: ["levelland-1957", "rb47-1957", "washington-dc-1952", "lakenheath-bentwaters-1956"],
  friedman: ["falcon-lake-1967", "varginha-1996", "roswell-1947"],
  puthoff: ["levelland-1957", "valdes-1977", "uss-jackson-2023"],
  davis: [
    "valdes-1977",
    "levelland-1957",
    "uss-jackson-2023",
  ],
  bigelow: ["aawsap-skinwalker-2008"],
  "ballester-olmos": ["canary-islands-1976", "manises-1979", "campeche-2004"],
  franz: ["campeche-2004"],
  fuenzalida: ["valdes-1977"],
  salazar: ["oleada-mexico-1965"],
  hourcade: ["fh227-pluna-1975"],
  banchs: ["trancas-1963", "mutilaciones-ganado-2002"],
  agostinelli: ["trancas-1963", "capilla-del-monte-1986"],
  janosch: ["bariloche-1995", "campeche-2004"],
  mack: ["ariel-school-1994"],
  hind: ["ariel-school-1994"],
  poher: ["trans-en-provence-1981"],
  "taylor-t": ["aawsap-skinwalker-2008"],
  loeb: ["oumuamua-2017", "3i-atlas-2025"],
  // Ata, presentado como extraterrestre en su documental «Sirius» (2013), y el fechado
  // de la esfera de Buga que difundió en 2025 (26 nov 2026).
  greer: ["atacama-ata-2018", "buga-esfera-2025"],
  haines: ["lago-de-cote-1971", "chicago-ohare-2006"],
  maccabee: ["jal1628-1986", "kaikoura-1978"],
  hastings: ["malmstrom-1967", "minot-afb-1968", "loring-afb-1975", "big-sur-vandenberg-1964"],
  randles: ["todmorden-godfrey-1980", "rendlesham-1980"],
  salas: ["malmstrom-1967"],
  callahan: ["jal1628-1986"],
  schuessler: ["cash-landrum-1980"],
  zeidman: ["coyne-1973"],
  "james-fox": ["varginha-1996"],
  powell: ["aguadilla-2013", "nimitz-2004"],
  rutkowski: ["shag-harbour-1967", "yukon-1996"],
  chalker: ["westall-1966", "valentich-1978"],
  west: ["roosevelt-2014", "nimitz-2004"],
  knuth: ["nimitz-2004"],
  sturrock: ["trans-en-provence-1981"],
  nickell: ["kelly-hopkinsville-1955"],
  menzel: [
    "kenneth-arnold-1947",
    "lubbock-lights-1951",
    "washington-dc-1952",
    "nash-fortenberry-1952",
    "barra-da-tijuca-1952",
    "levelland-1957",
    "socorro-1964",
    "falcon-lake-1967",
  ],
  klass: [
    "cape-girardeau-1941",
    "mcminnville-trent-1950",
    "rb47-1957",
    "socorro-1964",
    "andreasson-ashburnham-1967",
    "pascagoula-1973",
    "val-johnson-1979",
    "st-clair-triangle-2000",
  ],
  oberg: [
    "big-sur-vandenberg-1964",
    "gemini4-mcdivitt-1965",
    "gemini7-borman-1965",
    "skylab-observations-1973",
    "kovalyonok-salyut6-1981",
    "minsk-aeroflot-1984",
    "france-wave-1990",
    "sts48-1991",
    "caballero-negro-1998",
  ],
  sheaffer: ["mcminnville-trent-1950", "aztec-1948", "cash-landrum-1980", "phoenix-lights-1997", "campeche-2004"],
  sparks: [
    "uss-supply-1904",
    "skylab-observations-1973",
    "falconbridge-norad-1975",
    "ellsworth-woods-1977",
    "cash-landrum-1980",
    "campeche-2004",
  ],

  // A — teóricos anclados al caso que estudiaron
  nolan: ["council-bluffs-1977", "american-cosmic-2017"],
  strieber: ["communion-1985"],
  pasulka: ["american-cosmic-2017"],

  // B — insiders / militares
  ruppelt: [
    "kenneth-arnold-1947",
    "mantell-1948",
    "washington-dc-1952",
  ],
  grusch: ["varginha-1996"],
  lianza: ["aguadilla-2013", "bariloche-1995", "campo-de-mayo-1972"],
  sanchez: ["fh227-pluna-1975"],
  elizondo: ["aawsap-skinwalker-2008"],
  fravor: ["nimitz-2004"],
  dietrich: ["nimitz-2004"],
  "kevin-day": ["nimitz-2004"],
  "santa-maria": ["la-joya-arequipa-1980"],
  choy: ["chulucanas-2001", "lima-difaa-2019"],
  pope: ["rendlesham-1980", "cosford-1993"],
  graves: ["roosevelt-2014", "nimitz-2004"],
  keyhoe: ["washington-dc-1952"],
  kirkpatrick: ["uss-jackson-2023", "mosul-orb-2016"],
  stratton: ["roswell-1947"],
  corso: ["roswell-1947"],
  gallaudet: ["nimitz-2004"],
  quintanilla: ["hassayampa-philippine-sea-1965", "exeter-1965", "kecksburg-1965", "portage-county-1966"],
  marcel: ["roswell-1947"],

  // C — actores políticos
  burlison: ["yemen-orb-2024"],
  reid: ["aawsap-skinwalker-2008"],
  luna: ["yemen-orb-2024"],
  gillibrand: ["mystery-drones-east-coast-2024"],
  burchett: ["varginha-1996"],
  moskowitz: ["varginha-1996"],
  rebelo: ["varginha-1996"],

  // D — periodistas
  coulthart: ["nimitz-2004", "varginha-1996"],
  kean: ["nimitz-2004", "kecksburg-1965"],
  knapp: ["aawsap-skinwalker-2008", "uss-omaha-2019"],
  corbell: ["uss-omaha-2019", "spherical-afghanistan-2020"],
  clarke: ["rendlesham-1980", "calvine-1990", "howden-moor-1997"],
  blumenthal: ["nimitz-2004"],
  cooper: ["aawsap-skinwalker-2008", "nimitz-2004", "roosevelt-2014"],
  gevaerd: ["varginha-1996", "colares-1977", "noite-oficial-1986"],
  // Críptidos que difundió (26 nov 2026, decisión del dueño): las momias de Nazca
  // presentadas en el Congreso de Perú y peritadas en Lima, Metepec y Ciudad Juárez.
  maussan: ["mexico-eclipse-1991", "campeche-2004", "popocatepetl-1992", "maussan-congreso-mexico-2023", "momias-lima-peritaje-2024", "metepec-ser-2007", "ciudad-juarez-pterodactilo-2026", "buga-esfera-2025"],

  // E — psicología analítica
  jung: ["nuremberg-1561", "basel-1566"],

  // E — comisiones oficiales latinoamericanas
  chamorro: ["pucallpa-2008", "chulucanas-2001"],
  bermudez: ["bosque-chile-2010", "naval-chile-2014", "collahuasi-2013"],
  bravo: ["bosque-chile-2010", "naval-chile-2014", "collahuasi-2013"],

  // Brasil — ufología de campo
  petit: ["colares-1977", "varginha-1996", "noite-oficial-1986"],

  // Colombia — astronomía / escepticismo
  puerta: ["bogota-t33-1964"],

  // Europa — agencia oficial e instituciones
  velasco: ["trans-en-provence-1981"],
  "de-brouwer": ["belgian-wave-1989"],
  strand: ["hessdalen-1981"],

  // Japón — actor político / directiva UAP del Ministerio de Defensa

  // F — experiencers: cada uno ancla a su propio expediente. A diferencia de
  // A–E, acá la relación es 1:1 por construcción — el actor existe en el
  // directorio PORQUE el caso existe, no al revés.
  "betty-hill": ["hill-1961"],
  "barney-hill": ["hill-1961"],
  "vilas-boas": ["vilas-boas-1957"],
  bledsoe: ["bledsoe-cape-fear-2007"],
  walton: ["walton-1975"],
  schirmer: ["schirmer-ashland-1967"],
  wolski: ["emilcin-1978"],
  zanfretta: ["zanfretta-1978"],
  napolitano: ["napolitano-brooklyn-1989"],
  "meng-zhaoguo": ["meng-zhaoguo-1994"],
  bianchi: ["bianchi-magallanes-2012"],
  valdes: ["valdes-1977"],
  schneider: ["dulce-schneider-1979"],
  hickson: ["pascagoula-1973"],
  parker: ["pascagoula-1973"],
  zamora: ["socorro-1964"],
  masse: ["valensole-1965"],
  dewilde: ["quarouble-1954"],
  heinonen: ["imjarvi-1970"],
  viljo: ["imjarvi-1970"],
  shrum: ["cisco-grove-1964"],
  "kathleen-may": ["flatwoods-1952"],
  "philip-spencer": ["ilkley-moor-1987"],
  "gonzalez-petare": ["petare-1954"],
  "ponce-petare": ["petare-1954"],
  "francois-delpeuch": ["cussac-1967"],
  "anne-marie-delpeuch": ["cussac-1967"],
  kawano: ["kofu-japan-1975"],
  yamahata: ["kofu-japan-1975"],
  trejo: ["talavera-la-real-1976"],
  "jim-weiner": ["allagash-1976"],
  "jack-weiner": ["allagash-1976"],
  foltz: ["allagash-1976"],
  rak: ["allagash-1976"],
  arnold: ["kenneth-arnold-1947", "maury-island-1947"],
  adamski: ["adamski-desert-center-1952", "vilas-boas-1957"],
};

/** Casos asociados a un investigador (resueltos a objetos UAPCase, en orden).
 *  Incluye los críptidos (26 nov 2026): viven fuera de `cases` y su fila
 *  enlaza a /cryptids según `category`. */
export function casesForResearcher(researcherId: string): UAPCase[] {
  const ids = RESEARCHER_CASES[researcherId] ?? [];
  return ids
    .map((id) => cases.find((c) => c.id === id) ?? cryptids.find((c) => c.id === id))
    .filter((c): c is UAPCase => Boolean(c));
}

/** Investigadores asociados a un caso (vía el mapa inverso). */
export function researchersForCase(caseId: string): Researcher[] {
  return researchers.filter((r) =>
    (RESEARCHER_CASES[r.id] ?? []).includes(caseId),
  );
}
