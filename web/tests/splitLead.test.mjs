// Pruebas unitarias de lib/splitLead.ts (node --test, sin dependencias).
import { test } from "node:test";
import assert from "node:assert/strict";
import { splitLead } from "../lib/splitLead.ts";

const relleno = (n) => "palabra ".repeat(n).trim();

test("corta al final de una frase normal antes del límite", () => {
  const t = `${relleno(20)}. Segunda frase ${relleno(60)}.`;
  const { lead, rest } = splitLead(t, 200);
  assert.ok(lead.endsWith("palabra."));
  assert.ok(rest.startsWith("Segunda frase"));
});

test("no corta en una inicial (caso Lubbock 1951)", () => {
  // La inicial es el último punto antes del límite: así se cortaba el recuadro.
  const t = `${relleno(20)}. Un profesor dijo a J. Allen Hynek que ${relleno(30)}. Después ${relleno(60)}.`;
  const { lead } = splitLead(t, 200);
  assert.ok(!lead.endsWith("J."), `cortó en la inicial: «${lead.slice(-20)}»`);
});

test("no corta en «EE. UU.» ni en «Dr.»", () => {
  const t = `${relleno(20)}. El caso llegó a EE. UU. Navy y al Dr. Menzel, que ${relleno(30)}. Después ${relleno(60)}.`;
  const { lead } = splitLead(t, 200);
  assert.ok(!/(UU|Dr)\.$/.test(lead), `cortó en una abreviatura: «${lead.slice(-20)}»`);
});

test("devuelve el texto entero si es corto", () => {
  const t = "Una frase. Otra frase.";
  assert.deepEqual(splitLead(t, 200), { lead: t });
});
