import tax from "@/data/cryptid-taxonomy.json";

/**
 * Categorías de los críptidos (25 nov 2026, decisión del dueño): términos
 * establecidos de la criptozoología, con la criatura como segundo nivel. La
 * lista vive en data/cryptid-taxonomy.json, que también lee validate-schema.mjs.
 */
export type CryptidGroup = { id: string; es: string; en: string };
export type Creature = { id: string; group: string; es: string; en: string };

export const CRYPTID_GROUPS: ReadonlyArray<CryptidGroup> = tax.groups;
export const CREATURES: ReadonlyArray<Creature> = tax.creatures;

export function creatureOf(id: string | undefined): Creature | undefined {
  return CREATURES.find((k) => k.id === id);
}

export function groupOf(id: string | undefined): CryptidGroup | undefined {
  const k = creatureOf(id);
  return k ? CRYPTID_GROUPS.find((g) => g.id === k.group) : undefined;
}
