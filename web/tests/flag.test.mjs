// Pruebas unitarias de la sonda E58 (scripts/lib/flag.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { flagOf, flagMatches } from "../scripts/lib/flag.mjs";

test("deriva la bandera del código de país", () => {
  assert.equal(flagOf("US"), "🇺🇸");
  assert.equal(flagOf("CL"), "🇨🇱");
});
test("marca la bandera de otro país (caso JAL 1628)", () => {
  assert.equal(flagMatches({ country: "US", flag: "🇯🇵" }), false);
});
test("admite las excepciones deliberadas", () => {
  assert.equal(flagMatches({ country: "US", flag: "🌍" }), true);
  assert.equal(flagMatches({ country: "AR", flag: "🇦🇶" }), true);
  assert.equal(flagMatches({ country: "SU", flag: "🇷🇺" }), true);
});
