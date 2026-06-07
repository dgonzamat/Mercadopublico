import { cases, researchers } from "./data";
import type { UAPCase, Researcher } from "./types";

/**
 * Asociación curada investigador → casos del corpus.
 *
 * Es una relación muchos-a-muchos que no encaja limpio dentro de ninguna de
 * las dos entidades, así que vive acá como fuente única. Se pobló a partir
 * de menciones en el contenido de cada caso + curaduría manual verificada.
 *
 * Los cinco teóricos que antes no tenían caso puntual ahora están anclados al
 * caso que efectivamente estudiaron: Freixedo → Colares (su caso canónico de
 * entidades hostiles); Nolan → Council Bluffs + American Cosmic (análisis de
 * materiales); Strieber → Communion (su propia abducción documentada);
 * Pasulka → American Cosmic (su trabajo de campo en 'American Cosmic');
 * Jorjani → testimonio de Grusch (el evento de disclosure que su filosofía
 * analiza). Ningún investigador queda huérfano.
 */
export const RESEARCHER_CASES: Record<string, string[]> = {
  // A — científicos
  vallee: ["pampa-joya-1980", "valdes-1977", "voronezh-1989"],
  hynek: ["socorro-1964", "valensole-1965", "hudson-valley-1983"],
  mcdonald: ["levelland-1957", "rb47-1957", "washington-dc-1952", "lakenheath-bentwaters-1956"],
  friedman: ["falcon-lake-1967", "varginha-1996", "roswell-1947"],
  puthoff: ["levelland-1957", "valdes-1977", "uss-jackson-2023"],
  davis: [
    "wilson-davis-2002",
    "grusch-testimony-2023",
    "valdes-1977",
    "levelland-1957",
    "uss-jackson-2023",
    "usper-2025",
  ],
  bigelow: ["aawsap-skinwalker-2008", "wikileaks-podesta-2016"],
  "ballester-olmos": ["canary-islands-1976", "manises-1979", "mexico-flir-2004"],
  franz: ["mexico-flir-2004"],
  fuenzalida: ["valdes-1977"],
  salazar: ["oleada-mexico-1965"],
  hourcade: ["cridovni-uruguay-1979", "fh227-pluna-1975"],
  banchs: ["trancas-1963", "mutilaciones-ganado-2002"],
  agostinelli: ["trancas-1963"],
  janosch: ["bariloche-1995", "mexico-flir-2004"],
  mack: ["ariel-school-1994"],
  hind: ["ariel-school-1994"],
  delonge: ["wikileaks-podesta-2016", "mccasland-disappearance-2026"],
  poher: ["trans-en-provence-1981", "geipan-gepan-france"],
  "taylor-t": ["aawsap-skinwalker-2008"],
  loeb: ["oumuamua-2017", "3i-atlas-2025"],
  haines: ["lago-de-cote-1971", "chicago-ohare-2006"],
  maccabee: ["jal1628-1986", "kaikoura-1978"],
  schuessler: ["cash-landrum-1980"],
  zeidman: ["coyne-1973", "battelle-special-report-1952"],
  powell: ["aguadilla-2013", "nimitz-2004"],
  rutkowski: ["shag-harbour-1967", "yukon-1996"],
  chalker: ["westall-1966", "valentich-1978"],

  // A — teóricos anclados al caso que estudiaron
  nolan: ["council-bluffs-1977", "american-cosmic-2017"],
  strieber: ["communion-1985"],
  pasulka: ["american-cosmic-2017"],
  freixedo: ["colares-1977"],
  jorjani: ["grusch-testimony-2023"],

  // B — insiders / militares
  ruppelt: [
    "twining-memo-1947",
    "estimate-situation-1948",
    "mantell-1948",
    "washington-dc-1952",
  ],
  grusch: [
    "grusch-testimony-2023",
    "bolender-memo-1969",
    "wilson-davis-2002",
    "usper-2025",
    "wikileaks-podesta-2016",
  ],
  elizondo: ["aawsap-skinwalker-2008"],
  mellon: ["wilson-davis-2002"],
  fravor: ["nimitz-2004", "grusch-testimony-2023"],
  dietrich: ["nimitz-2004"],
  "santa-maria": ["pampa-joya-1980"],
  choy: ["chulucanas-2001", "oifaa-difaa-peru", "lima-difaa-2019"],
  pope: ["rendlesham-1980", "cosford-1993"],
  graves: ["roosevelt-2014", "nimitz-2004", "grusch-testimony-2023"],
  keyhoe: ["washington-dc-1952"],
  kirkpatrick: ["uss-jackson-2023", "usper-2025"],
  nell: ["grusch-testimony-2023"],

  // C — actores políticos
  burlison: ["yemen-orb-2024"],
  luna: ["grusch-testimony-2023", "yemen-orb-2024"],
  burchett: ["grusch-testimony-2023"],

  // D — periodistas
  coulthart: [
    "dow-centcom-2020",
    "pursue-r03-2026",
    "mccasland-disappearance-2026",
    "aliens-gov-immigration-2026",
  ],
  kean: ["nimitz-2004", "kecksburg-1965"],
  knapp: ["aawsap-skinwalker-2008", "uss-omaha-2019"],
  corbell: ["uss-omaha-2019"],
  clarke: ["rendlesham-1980", "calvine-1990"],
  blumenthal: ["nimitz-2004"],
  gevaerd: ["varginha-1996", "colares-1977", "noite-oficial-1986", "arquivo-nacional-brasil-2026"],

  // E — comisiones oficiales latinoamericanas
  chamorro: ["pucallpa-2008", "chulucanas-2001", "oifaa-difaa-peru"],
  lianza: ["ciae-cefae-2011"],
  sanchez: ["cridovni-uruguay-1979"],
  bermudez: ["cefaa-chile-1997", "bosque-chile-2010", "naval-chile-2014"],
  bravo: ["cefaa-chile-1997", "bosque-chile-2010", "naval-chile-2014"],

  // Brasil — ufología de campo
  petit: ["colares-1977", "varginha-1996", "noite-oficial-1986", "arquivo-nacional-brasil-2026"],

  // Colombia — astronomía / escepticismo
  puerta: ["bogota-t33-1964"],

  // Europa — agencia oficial e instituciones
  velasco: ["geipan-gepan-france", "trans-en-provence-1981"],
  "de-brouwer": ["belgian-wave-1989"],
  strand: ["hessdalen-1981"],
};

/** Casos asociados a un investigador (resueltos a objetos UAPCase, en orden). */
export function casesForResearcher(researcherId: string): UAPCase[] {
  const ids = RESEARCHER_CASES[researcherId] ?? [];
  return ids
    .map((id) => cases.find((c) => c.id === id))
    .filter((c): c is UAPCase => Boolean(c));
}

/** Investigadores asociados a un caso (vía el mapa inverso). */
export function researchersForCase(caseId: string): Researcher[] {
  return researchers.filter((r) =>
    (RESEARCHER_CASES[r.id] ?? []).includes(caseId),
  );
}
