// Pruebas unitarias de lib/startPage.ts (node --test, sin dependencias).
import { test } from "node:test";
import assert from "node:assert/strict";
import { startPage } from "../lib/startPage.ts";

test("abre en la página que declara el documento", () => {
  assert.equal(startPage(72, 406), 72);
});
test("sin página declarada abre en la 1", () => {
  assert.equal(startPage(undefined, 10), 1);
});
test("una página inválida o fuera de rango cae a la 1", () => {
  assert.equal(startPage(0, 10), 1);
  assert.equal(startPage(2.5, 10), 1);
  assert.equal(startPage(50, 10), 1);
});
test("antes de conocer el total respeta la página declarada", () => {
  assert.equal(startPage(5), 5);
});
