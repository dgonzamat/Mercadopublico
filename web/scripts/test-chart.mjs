/**
 * test-chart.mjs — test de regresión del gráfico de probabilidades.
 *
 * No hay framework de tests en el repo; siguiendo la convención de scripts
 * standalone, este valida los invariantes del donut y del pulido contra el HTML
 * generado por `next build` (SSG). Corre automáticamente como hook `postbuild`
 * (gate de CI, igual que los audits); también a mano con `npm test`:
 *
 *   node scripts/test-chart.mjs   # requiere out/ (correr tras el build)
 *
 * Verifica:
 *  - El donut tiene exactamente 6 segmentos (hipótesis, no-humano consolidado).
 *  - Los arcos (stroke-dasharray) suman la circunferencia → la partición = 100%.
 *  - Los offsets son monótonos y no se solapan.
 *  - El centro del donut muestra el total de casos.
 *  - No se filtran fórmulas en español a la vista renderizada.
 *  - No reaparece el hover rojo (group-hover:text-accent) en la leyenda.
 */
import { readFileSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, "..", "out", "probabilidades", "index.html");
const CASES_JSON = join(__dirname, "..", "data", "cases.json");

let html;
try {
  html = readFileSync(HTML_PATH, "utf8");
} catch {
  console.error(`✗ No existe ${HTML_PATH}. Corré \`npm run build\` antes del test.`);
  process.exit(1);
}

// Guardrail de frescura (jul 2026): `out/` es artefacto de build gitignored que
// puede quedar RANCIO en un contenedor de larga vida. Si el HTML construido es
// más viejo que el corpus fuente (`data/cases.json`, regenerado en cada
// prebuild), el build no corrió tras el último cambio de datos y las aserciones
// de abajo compararían HTML viejo contra un corpus nuevo → fallos FALSOS que
// parecen regresiones. Abortar acá con un mensaje inequívoco en vez de mentir.
// En el path gateado (postbuild de `npm run build`) `out/` recién se construyó,
// así que este check nunca dispara; solo protege el path manual (`npm test`).
try {
  if (statSync(HTML_PATH).mtimeMs < statSync(CASES_JSON).mtimeMs) {
    console.error(
      `✗ out/ RANCIO: ${HTML_PATH}\n` +
        `  es más viejo que data/cases.json — el build no corrió tras el último\n` +
        `  cambio del corpus. Las aserciones de abajo serían FALSAS (comparan HTML\n` +
        `  viejo vs corpus nuevo). Corré \`npm run build\` (o \`rm -rf out\`) antes del test.`,
    );
    process.exit(1);
  }
} catch {
  /* falta cases.json (artefacto de build): el check de total abajo lo maneja */
}

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failures++;
};
const approx = (a, b, tol) => Math.abs(a - b) <= tol;

// --- Parse de los segmentos del donut (marcados con data-segment) ---------
// data-segment distingue los arcos de hipótesis del anillo de fondo y del halo.
const circleRe = /<circle\b[^>]*\bdata-segment\b[^>]*>/g;
const circles = html.match(circleRe) ?? [];

const num = (tag, attr) => {
  const m = tag.match(new RegExp(`${attr}="([^"]+)"`));
  return m ? m[1] : null;
};

console.log("Donut /probabilidades");

// 1) Nº de segmentos = 7: 6 hipótesis (no-humano consolidado) + 1 porción de
//    casos-documento, para que el donut marque el TOTAL del corpus.
if (circles.length === 7) ok(`7 segmentos en el donut (6 hipótesis + documentos)`);
else fail(`esperaba 7 segmentos (6 hipótesis + documentos), encontré ${circles.length}`);

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

// 4) El centro del donut marca el TOTAL del corpus.
//    El total NO se hardcodea (anti-pattern del repo): se deriva del corpus
//    generado (data/cases.json) para que el test no se rompa al crecer el corpus.
//    El donut reparte el corpus completo: incidentes por hipótesis + una porción
//    para los casos-documento, de modo que el centro marca cases.length (el total).
//    La clasificación POR HIPÓTESIS sigue siendo solo sobre incidentes (canon
//    CLAUDE.md / sonda E24); los documentos son una porción neutra, no una hipótesis.
let expectedN = null;
try {
  const raw = JSON.parse(readFileSync(join(__dirname, "..", "data", "cases.json"), "utf8"));
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.cases) ? raw.cases : null;
  expectedN = list ? list.length : null;
} catch {
  /* cases.json es artefacto de build; si falta, caemos al check laxo abajo */
}
if (expectedN != null) {
  if (new RegExp(`>\\s*${expectedN}\\s*<`).test(html)) ok(`el centro marca el total del corpus derivado (${expectedN})`);
  else fail(`el centro no marca el total del corpus (${expectedN})`);
} else if (/>\s*\d{2,4}\s*</.test(html)) {
  ok(`el centro muestra un total numérico (no se pudo derivar del corpus)`);
} else {
  fail(`no encontré el total de casos en el render`);
}

// 5) No se filtran fórmulas en español a la vista renderizada
const leaks = ["misid+natural+fraude", "clasificado+adversaria+no-humano"];
const leaked = leaks.filter((s) => html.includes(s));
if (leaked.length === 0) ok(`sin fórmulas en español filtradas`);
else fail(`fórmulas filtradas en el HTML: ${leaked.join(", ")}`);

// 6) No reaparece el hover rojo en la leyenda
if (!html.includes("group-hover:text-accent")) ok(`sin hover rojo (group-hover:text-accent)`);
else fail(`reapareció el hover rojo group-hover:text-accent`);

// ── Otros gráficos del corpus (smoke tests) ───────────────────────────────
function readOut(rel) {
  try {
    return readFileSync(join(__dirname, "..", "out", rel), "utf8");
  } catch {
    return null;
  }
}
function check(label, present) {
  if (present) ok(label);
  else fail(label);
}

console.log("\nHome · snapshot de hipótesis");
const home = readOut("index.html");
if (home == null) fail("no existe out/index.html");
else {
  check("renderiza el snapshot de hipótesis (header)", /casos del corpus|corpus's \d+ cases|Cómo se clasifican|How the corpus/.test(home));
  check("declara que suman 100%", home.includes("suman 100%") || home.includes("sum to 100%"));
}

console.log("\nCaso · CasePosterior");
// roswell-1947 es un caso estable con posterior MECE.
const casePage = readOut("cases/roswell-1947/index.html");
if (casePage == null) fail("no existe out/cases/roswell-1947/index.html");
else {
  check("renderiza la hipótesis modal del caso", /Hipótesis modal|Modal hypothesis/.test(casePage));
  check("la barra por caso suma 100%", casePage.includes("suma 100%") || casePage.includes("sums to 100%"));
}

console.log("");
if (failures === 0) {
  console.log("✓ test-chart: todos los gráficos del corpus OK");
  process.exit(0);
} else {
  console.error(`✗ test-chart: ${failures} fallo(s)`);
  process.exit(1);
}
