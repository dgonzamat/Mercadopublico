// Pruebas unitarias de la sonda E59 (scripts/lib/long-paragraphs.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { longParagraphs, MAX_PARAGRAPH } from "../scripts/lib/long-paragraphs.mjs";

const p = (n) => "a".repeat(n);

test("el umbral es 900: 900 pasa y 901 no", () => {
  assert.equal(MAX_PARAGRAPH, 900);
  assert.equal(longParagraphs({ whatHappened: p(900) }).length, 0);
  assert.deepEqual(longParagraphs({ whatHappened: p(901) }), [{ field: "whatHappened", index: 0, length: 901 }]);
});

test("mide cada párrafo por separado, no el campo entero", () => {
  assert.equal(longParagraphs({ whatHappened: `${p(899)}\n\n${p(899)}` }).length, 0);
  assert.deepEqual(longParagraphs({ whyMatters: `${p(10)}\n\n${p(950)}` }).map((h) => h.index), [1]);
});

test("revisa también los campos en inglés", () => {
  const f = longParagraphs({ whatHappened: p(10), whatHappened_en: p(901), whyMatters_en: p(1000) }).map((h) => h.field);
  assert.deepEqual(f, ["whatHappened_en", "whyMatters_en"]);
});
