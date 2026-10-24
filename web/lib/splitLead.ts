/** Corta un texto largo en una entrada de frases completas (hasta `max`
 *  caracteres) y el resto, que la ficha pliega. Si no hay un punto razonable
 *  donde cortar, o lo que sobra es corto, devuelve el texto entero. */
export function splitLead(t: string, max: number): { lead: string; rest?: string } {
  if (t.length <= max + 200) return { lead: t };
  const re = /[.!?»"](?=\s+[A-ZÁÉÍÓÚÑ«"(¿¡])/g;
  let cut = -1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) && m.index < max) cut = m.index + 1;
  // Si la primera frase ya pasa de `max`, se corta al final de esa frase
  // en vez de devolver el texto entero (que era lo que dejaba sin plegar
  // los porqués que abren con una frase larga).
  if (cut < 120 && m) cut = m.index + 1;
  if (cut < 120 || t.length - cut < 200) return { lead: t };
  return { lead: t.slice(0, cut), rest: t.slice(cut).trim() };
}
