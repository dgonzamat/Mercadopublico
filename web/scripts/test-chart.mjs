/**
 * test-chart.mjs — test de regresión del gráfico de probabilidades.
 *
 * No hay framework de tests en el repo; siguiendo la convención de scripts
 * standalone, este valida los invariantes del donut y del pulido contra el HTML
 * generado por `next build` (SSG). Correr DESPUÉS de `npm run build`:
 *
 *   node scripts/test-chart.mjs
 *
 * Verifica:
 *  - El donut tiene exactamente 6 segmentos (hipótesis, no-humano consolidado).
 *  - Los arcos (stroke-dasharray) suman la circunferencia → la partición = 100%.
 *  - Los offsets son monótonos y no se solapan.
 *  - El centro del donut muestra el total de casos.
 *  - No se filtran fórmulas en español a la vista renderizada.
 *  - No reaparece el hover rojo (group-hover:text-accent) en la leyenda.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, "..", "out", "probabilidades", "index.html");

let html;
try {
  html = readFileSync(HTML_PATH, "utf8");
} catch {
  console.error(`✗ No existe ${HTML_PATH}. Corré \`npm run build\` antes del test.`);
  process.exit(1);
}

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failures++;
};
const approx = (a, b, tol) => Math.abs(a - b) <= tol;

// --- Parse de los segmentos del donut (stroke-width="38") -----------------
const circleRe = /<circle\b[^>]*stroke-width="38"[^>]*>/g;
const circles = html.match(circleRe) ?? [];

const num = (tag, attr) => {
  const m = tag.match(new RegExp(`${attr}="([^"]+)"`));
  return m ? m[1] : null;
};

console.log("Donut /probabilidades");

// 1) Nº de segmentos = 6 (no-humano consolidado)
if (circles.length === 6) ok(`6 segmentos en el donut`);
else fail(`esperaba 6 segmentos, encontré ${circles.length}`);

if (circles.length > 0) {
  const r = parseFloat(num(circles[0], "r"));
  const C = 2 * Math.PI * r;

  // 2) Los arcos suman ~ la circunferencia (gap de 1.5 por los 6 segmentos)
  const lens = circles.map((c) => {
    const da = num(c, "stroke-dasharray"); // "len rest"
    return parseFloat(da.split(/\s+/)[0]);
  });
  const sumLen = lens.reduce((s, x) => s + x, 0);
  const gapTotal = 1.5 * circles.length;
  if (approx(sumLen, C - gapTotal, 3)) ok(`los arcos suman la circunferencia (${sumLen.toFixed(1)} ≈ ${(C - gapTotal).toFixed(1)})`);
  else fail(`la suma de arcos ${sumLen.toFixed(1)} no coincide con C−gaps ${(C - gapTotal).toFixed(1)}`);

  // 3) Offsets monótonos no crecientes y no positivos (segmentos no se solapan)
  const offs = circles.map((c) => parseFloat(num(c, "stroke-dashoffset")));
  const monotone = offs.every((o, i) => o <= 0 && (i === 0 ? o === 0 : o <= offs[i - 1] + 1e-6));
  if (monotone) ok(`offsets monótonos, sin solape (primero = 0)`);
  else fail(`offsets no monótonos / con solape: ${offs.map((o) => o.toFixed(1)).join(", ")}`);
}

// 4) El centro del donut muestra el total de casos
if (/>\s*200\s*</.test(html)) ok(`el centro muestra el total (200 casos)`);
else fail(`no encontré el total "200" en el render`);

// 5) No se filtran fórmulas en español a la vista renderizada
const leaks = ["misid+natural+fraude", "clasificado+adversaria+no-humano"];
const leaked = leaks.filter((s) => html.includes(s));
if (leaked.length === 0) ok(`sin fórmulas en español filtradas`);
else fail(`fórmulas filtradas en el HTML: ${leaked.join(", ")}`);

// 6) No reaparece el hover rojo en la leyenda
if (!html.includes("group-hover:text-accent")) ok(`sin hover rojo (group-hover:text-accent)`);
else fail(`reapareció el hover rojo group-hover:text-accent`);

console.log("");
if (failures === 0) {
  console.log("✓ test-chart: todos los invariantes del donut OK");
  process.exit(0);
} else {
  console.error(`✗ test-chart: ${failures} fallo(s)`);
  process.exit(1);
}
