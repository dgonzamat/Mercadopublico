// @ts-check
/**
 * audit-design.mjs — health check de diseño codificado.
 *
 * Corre en prebuild/CI junto a validate-schema y audit-consistency. Convierte
 * el "health check" manual en un gate automático: rompe el build ante
 * regresiones de diseño que antes solo se detectaban a ojo.
 *
 * Checks (FAIL = exit 1):
 *   D1 · Contraste WCAG AA — cada par texto/superficie/tier debe ser >= 4.5:1.
 *   D2 · Drift de color de tier — los hex hardcodeados en WorldMap deben
 *        coincidir con los tokens de tailwind (origen del bug #323).
 *   D3 · Off-palette — todo hex hardcodeado en app/components/css debe ser un
 *        token de tailwind o estar en HEX_ALLOWLIST (con justificación). Caza
 *        cualquier drift de color futuro, no solo el viejo #b86b1f de #323.
 *   D4 · Touch targets — ningún interactivo por debajo del mínimo WCAG 2.2 (24px).
 *
 * WARN (no rompe): touch targets entre 24 y 43px (recomendado 44).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warns = [];

// ── helpers ────────────────────────────────────────────────────────────────
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, acc);
    else if (/\.(tsx?|css)$/.test(e.name)) acc.push(rel);
  }
  return acc;
}
const FILES = [...walk("app"), ...walk("components"), "app/globals.css"].filter(
  (f, i, a) => a.indexOf(f) === i && fs.existsSync(path.join(ROOT, f)),
);

// WCAG relative luminance + contrast ratio.
function lin(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function lum(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a, b) {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ── parse tokens de tailwind.config.ts ───────────────────────────────────────
const tw = read("tailwind.config.ts");
const tokens = {};
for (const m of tw.matchAll(/["']?([A-Za-z0-9-]+)["']?\s*:\s*["'](#[0-9A-Fa-f]{6})["']/g)) {
  tokens[m[1]] = m[2].toLowerCase();
}
function tok(name) {
  if (!tokens[name]) throw new Error(`token "${name}" no encontrado en tailwind.config.ts`);
  return tokens[name];
}

// ── D1 · Contraste WCAG AA (>= 4.5 para texto) ───────────────────────────────
const AA = 4.5;
const PAIRS = [
  ["text", "bg"], ["text", "panel"], ["text", "surface-2"],
  ["muted", "bg"], ["muted", "panel"], ["muted", "surface-2"],
  ["accent", "bg"],
  ["tierS", "bg"], ["tierA", "bg"], ["tierB", "bg"],
];
for (const [fg, bgk] of PAIRS) {
  const r = ratio(tok(fg), tok(bgk));
  if (r < AA) {
    errors.push(`D1 contraste: ${fg}/${bgk} = ${r.toFixed(2)}:1 < AA ${AA} (${tok(fg)} sobre ${tok(bgk)})`);
  }
}

// ── D2 · Drift de color de tier (WorldMap vs tokens) ─────────────────────────
const wm = read("components/WorldMap.tsx");
for (const [key, token] of [["S", "tierS"], ["A", "tierA"], ["B", "tierB"]]) {
  // TIER_COLOR record: S: "#..",
  const m = wm.match(new RegExp(`${key}:\\s*"(#[0-9A-Fa-f]{6})"`));
  if (m && m[1].toLowerCase() !== tok(token)) {
    errors.push(`D2 drift: WorldMap tier ${key} = ${m[1]} ≠ token ${token} ${tok(token)} (sincronizar)`);
  }
}

// ── D3 · Off-palette — todo hex hardcodeado debe ser token o estar allowlisteado ─
// Subsume el guard del viejo #b86b1f: cualquier hex no-token rompe el build.
const TOKEN_VALUES = new Set(Object.values(tokens));
const HEX_ALLOWLIST = new Set([
  "#e8e4da", // fondo del canvas Leaflet (WorldMap) — base de mapa decorativa, no es token de texto
]);
for (const f of FILES) {
  read(f).split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      const hex = m[0].toLowerCase();
      if (!TOKEN_VALUES.has(hex) && !HEX_ALLOWLIST.has(hex)) {
        errors.push(`D3 off-palette: ${hex} en ${f}:${i + 1} — usar un token de tailwind o agregar a HEX_ALLOWLIST con justificación`);
      }
    }
  });
}

// ── D4 · Touch targets (min interactivo) ─────────────────────────────────────
// Lee la altura DECLARADA de un interactivo: min-h-[Npx], h-[Npx] y h-N de
// Tailwind (N·4 px). Antes solo miraba min-h-[…] y era ciego a `h-10` (40px) y
// similares. Si no hay altura declarada, no se puede inferir estáticamente
// (muchos dependen de padding) → no se reporta.
const WCAG_MIN = 24; // WCAG 2.2 AA (2.5.8)
const RECOMMENDED = 44;
const INTERACTIVE = /(<button|<a\s|<Link|role="button"|cursor-pointer|onClick|href=)/;
function declaredHeightPx(line) {
  const px = [];
  for (const m of line.matchAll(/min-h-\[(\d+)px\]/g)) px.push(Number(m[1]));
  for (const m of line.matchAll(/\bh-\[(\d+)px\]/g)) px.push(Number(m[1]));
  for (const m of line.matchAll(/\bh-(\d+(?:\.\d+)?)\b/g)) px.push(Number(m[1]) * 4);
  return px.length ? Math.max(...px) : null; // mayor altura declarada = la del elemento
}
for (const f of FILES) {
  const lines = read(f).split("\n");
  lines.forEach((line, i) => {
    if (!INTERACTIVE.test(line)) return;
    const px = declaredHeightPx(line);
    if (px == null) return;
    const where = `${f}:${i + 1}`;
    if (px < WCAG_MIN) errors.push(`D4 touch target: ${px}px < WCAG ${WCAG_MIN}px en ${where}`);
    else if (px < RECOMMENDED) warns.push(`D4 touch target: ${px}px < recomendado ${RECOMMENDED}px en ${where}`);
  });
}

// ── reporte ──────────────────────────────────────────────────────────────────
console.log(`[audit-design] ${FILES.length} archivos · ${Object.keys(tokens).length} tokens`);
for (const w of warns) console.log(`  ⚠ ${w}`);
if (errors.length) {
  console.error(`\n[audit-design] ✗ ${errors.length} fallo(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`[audit-design] ✓ contraste AA, sin drift de tier, touch targets OK`);
