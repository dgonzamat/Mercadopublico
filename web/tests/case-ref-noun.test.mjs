// Pruebas unitarias de la sonda E57 (scripts/lib/case-ref-noun.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { refsAsNoun, caseRefNounFindings } from "../scripts/lib/case-ref-noun.mjs";

test("detecta un enlace tras «el de» y tras «en» (Burgos, golfo de Omán)", () => {
  assert.equal(refsAsNoun("por este caso y por el de [[bardenas-reales-1975]].").length, 1);
  assert.equal(refsAsNoun("como mostró la AARO en [[aguadilla-2013]] y GoFast").length, 1);
});

test("detecta también en inglés", () => {
  assert.equal(refsAsNoun("as AARO showed in [[aguadilla-2013]] and GoFast").length, 1);
});

test("no marca el enlace que acompaña al nombre del caso", () => {
  assert.equal(refsAsNoun("el caso de Aguadilla [[aguadilla-2013]] y el de Nimitz ([[nimitz-2004]])").length, 0);
  assert.equal(refsAsNoun("sin enlaces").length, 0);
});

test("revisa evidencia y campos en inglés de una ficha", () => {
  const c = { summary: "ok", evidence: ["visto en [[x-1]]"], whyMatters_en: "seen in [[x-1]]" };
  const f = caseRefNounFindings(c).map((h) => h.field).sort();
  assert.deepEqual(f, ["evidence[0]", "whyMatters_en"]);
});
