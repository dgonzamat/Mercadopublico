/** Corta un texto largo en una entrada de frases completas (hasta `max`
 *  caracteres) y el resto, que la ficha pliega. Si no hay un punto razonable
 *  donde cortar, o lo que sobra es corto, devuelve el texto entero. */
export function splitLead(t: string, max: number): { lead: string; rest?: string } {
  if (t.length <= max + 200) return { lead: t };
  const re = /[.!?»"](?=\s+[A-ZÁÉÍÓÚÑ«"(¿¡])/g;
  let cut = -1;
  let next = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    if (t[m.index] === "." && isAbbreviation(t, m.index)) continue;
    if (m.index < max) cut = m.index + 1;
    else { next = m.index + 1; break; }
  }
  // Si la primera frase ya pasa de `max`, se corta al final de esa frase
  // en vez de devolver el texto entero (que era lo que dejaba sin plegar
  // los porqués que abren con una frase larga).
  if (cut < 120 && next > 0) cut = next;
  if (cut < 120 || t.length - cut < 200) return { lead: t };
  return { lead: t.slice(0, cut), rest: t.slice(cut).trim() };
}

// Un punto que cierra una inicial («J. Allen Hynek») o una abreviatura
// («EE. UU.», «Dr.») no termina la frase. Sin esta comprobación el recuadro
// «Por qué» de Lubbock 1951 se cortaba en «dijo a J.» (auditoría, nov 2026).
const ABBREVIATION = /(?:^|[\s(«"“])(?:[A-ZÁÉÍÓÚÑ]|EE|UU|Sr|Sra|Srta|Dr|Dra|Mr|Mrs|Ms|Jr|St|Gral|Cap|Tte|Cnel|Sgto|núm|Núm|etc|vs|aprox)$/;
function isAbbreviation(t: string, dot: number): boolean {
  return ABBREVIATION.test(t.slice(Math.max(0, dot - 8), dot));
}
