// Marcadores de prosa (muletillas e «IA slop») que comparten el informe de
// deuda (debt-report.mjs, que los cuenta) y audit-consistency.mjs (E56, que
// rompe el build si reaparecen). Una sola definición: dos copias divergirían.
export const MARKERS = {
  // Autorreferencias al archivo, no «corpus» como conjunto de datos de una
  // fuente («corpus de video de Yalman»): el primer barrido solo miraba «el
  // corpus»/«the corpus» y dejó ~45 fichas con «this corpus», «un corpus
  // calibrado» o «Ireland's first corpus case» (oct 2026).
  "«el corpus»": /\b(?:el|este|del|al|mismo) corpus\b|\b(?:the|this|same|calibrated|institutional|PURSUE) corpus\b|\bun corpus (?:calibrado|que|donde|serio)\b|\ba corpus (?:that|where|tracking)\b|\bcorpus (?:case|cases|file|pattern)\b/i,
  "nota de sesión": /\besta (?:misma )?sesión\b|\bthis (?:same )?session\b|\bthis session's\b/i,
  "«honesto»": /\bhonest/i,
  "«Es uno de los»": /\bEs uno de los\b|\bIt is one of the\b/,
};

// Lo citado es de la fuente, y la sinceridad de un testigo («hombre honesto»,
// «testigos honestos», «reporta honestamente lo que vio») es un dato del caso:
// ninguno es la muletilla del redactor que alaba su propia lectura.
export const SINCERE = /hombre honesto|honest man|testigos honestos|honest witnesses|honestamente lo que vio|honestly reports?|describe it honestly|trustworthy and honest/gi;

export const SLOP = {
  "fórmula «no es X, es/sino Y»": /\bno es (?:solo |sólo |simplemente )?[^.;:]{1,60}?, (?:sino|es) |\bit is not [^.;:]{1,60}?, (?:but|it is) /i,
  "raya (—) en la prosa": /—/,
  "intensificador vacío (crucial, clave, fundamental…)": /\b(?:crucial|cabe destacar|vale la pena|sin duda|en definitiva|fundamental(?:mente)?|crucially|it is worth noting|notably|undoubtedly)\b/i,
};

// Fichas cuya fórmula «no es X, sino Y» se revisó y es un contraste factual
// (el expediente no es de Blue Book, sino un informe de accidente), no un
// recurso retórico: no son deuda. Si una deja de usarla, se avisa.
export const FORMULA_REVIEWED = new Set([
  "mexico-eclipse-1991", // «Venus no es una estrella, sino un planeta»: lo dice Printy, es un dato
]);

// Lo citado entre comillas es de la fuente, no del redactor: se excluye.
export const unquote = (t) => t.replace(/«[^»]*»|"[^"]*"|“[^”]*”|(?<![\w])'[^']*'(?![\w])/g, "");
