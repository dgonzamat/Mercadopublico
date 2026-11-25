import type { CryptidClassId, PosteriorCripto } from "./types";

/**
 * Modelo de los críptidos (25 nov 2026, decisión del dueño): seis explicaciones
 * mutuamente excluyentes que suman 1 (`posteriorCripto`). Es una colección
 * aparte: no entra en ningún total UAP. DATA-FREE (solo tipos), como
 * lib/meceClasses.ts; los colores viven aquí, fuera del scan de audit-design,
 * y reutilizan la paleta de las narrativas MECE.
 */
export const CRYPTID_CLASSES: ReadonlyArray<{
  id: CryptidClassId;
  label: string;
  labelEn: string;
  /** Una línea: qué afirma la explicación. */
  gloss: string;
  glossEn: string;
  color: string;
  /** true = cuenta en la cifra «sin explicar». */
  unexplained: boolean;
}> = [
  { id: "ordinaria", label: "Causa ordinaria", labelEn: "Ordinary cause", gloss: "Un animal conocido mal identificado u otra causa natural o técnica corriente.", glossEn: "A known animal misidentified, or another ordinary natural or technical cause.", color: "#5a6b7a", unexplained: false },
  { id: "fraude", label: "Fraude", labelEn: "Hoax", gloss: "Un engaño deliberado.", glossEn: "A deliberate hoax.", color: "#8a6b5a", unexplained: false },
  { id: "no_catalogada", label: "Especie no catalogada", labelEn: "Uncatalogued species", gloss: "Un animal real que la ciencia aún no ha descrito.", glossEn: "A real animal not yet described by science.", color: "#4f7a6a", unexplained: true },
  { id: "extraterrestre", label: "Extraterrestre", labelEn: "Extraterrestrial", gloss: "Un ser biológico de otro planeta.", glossEn: "A biological being from another planet.", color: "#6b3a7a", unexplained: true },
  { id: "interdimensional", label: "Interdimensional", labelEn: "Interdimensional", gloss: "Una entidad que no es un animal físico: paranormal o de otra dimensión.", glossEn: "An entity that is not a physical animal: paranormal or from another dimension.", color: "#5a6cc8", unexplained: true },
  { id: "indet", label: "Indeterminado", labelEn: "Indeterminate", gloss: "La evidencia no alcanza para decidir.", glossEn: "The evidence is not enough to decide.", color: "#3a3a3a", unexplained: true },
];

export function cryptidClassDef(id: CryptidClassId | undefined) {
  return CRYPTID_CLASSES.find((k) => k.id === id);
}

/** Cifra «sin explicar»: no_catalogada + extraterrestre + interdimensional +
 *  indet, en %, con Math.round (la misma que exige E43c). Si la especie ya está
 *  descrita (`speciesDescribed`), no_catalogada no suma. */
export function cryptidUnexplained(p: PosteriorCripto, speciesDescribed = false): number {
  const tot = CRYPTID_CLASSES.reduce((a, k) => a + p[k.id], 0);
  const u = CRYPTID_CLASSES
    .filter((k) => k.unexplained && !(speciesDescribed && k.id === "no_catalogada"))
    .reduce((a, k) => a + p[k.id], 0);
  return Math.round((100 * u) / tot);
}

/** Porcentajes enteros por resto mayor: los seis impresos suman 100. */
export function cryptidPctParts(p: PosteriorCripto): number[] {
  const vals = CRYPTID_CLASSES.map((k) => p[k.id]);
  const tot = vals.reduce((a, b) => a + b, 0) || 1;
  const raw = vals.map((v) => (100 * v) / tot);
  const parts = raw.map(Math.floor);
  let rest = 100 - parts.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    parts[i]++;
    rest--;
  }
  return parts;
}
