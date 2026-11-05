// Pruebas unitarias de la sonda E60 (scripts/lib/note-hygiene.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { noteIssues, noteFindings } from "../scripts/lib/note-hygiene.mjs";

const kinds = (t) => noteIssues(t).map((h) => h.kind);

test("detecta nombres internos de campos", () => {
  assert.deepEqual(kinds("La cifra sale de whatHappened y no de la fuente."), ["campo"]);
  assert.deepEqual(kinds("Ver evidence_en[2]."), ["campo"]);
});

test("«posterior» como adjetivo no es un campo", () => {
  assert.deepEqual(kinds("Un informe posterior de la Fuerza Aérea lo confirma."), []);
});

test("detecta notas de trabajo del redactor en ES y EN (casos de la auditoría)", () => {
  assert.deepEqual(kinds("aaro.mil no es accesible desde el entorno de revisión, así que no se verificó."), ["nota"]);
  assert.deepEqual(kinds("Su artículo no es accesible desde aquí."), ["nota"]);
  assert.deepEqual(kinds("Enlace heredado."), ["nota"]);
  assert.deepEqual(kinds("Not reachable from this environment (403)."), ["nota"]);
});

test("detecta direcciones web crudas fuera de comillas", () => {
  assert.deepEqual(kinds("Copia en https://www.academia.edu/37772999/EXPEDIENTE."), ["url"]);
  assert.deepEqual(kinds("Ver www.nicap.org para el expediente."), ["url"]);
});

test("lo citado entre comillas queda fuera", () => {
  assert.deepEqual(kinds("El título es «Desde aquí se veía la luz»."), []);
  assert.deepEqual(kinds('The page says "from here to the coast".'), []);
});

test("una nota limpia no marca nada", () => {
  assert.deepEqual(kinds("Informe del Comando Aéreo de Defensa, 4 de abril de 1966, con la declaración de los dos operadores."), []);
});

test("revisa notas de fuentes y descripciones de documentos, en los dos idiomas", () => {
  const c = {
    sources: [{ name: "x", note: "ok" }, { name: "y", note_en: "inherited link" }],
    documents: [{ description: "ok", description_en: "see https://example.org/doc" }],
    featuredDoc: { caption: "según classBasis" },
  };
  assert.deepEqual(noteFindings(c).map((h) => `${h.field}:${h.kind}`), [
    "sources[1].note_en:nota",
    "documents[0].description_en:url",
    "featuredDoc.caption:campo",
  ]);
});
