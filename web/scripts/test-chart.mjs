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
 *  - El donut tiene un segmento por narrativa modal presente en los INCIDENTES
 *    (clases prosaicas + humana + adversaria + no-humano consolidado +
 *    Indeterminado), derivado de data/cases.json — no hardcodeado.
 *  - Lo prosaico se nombra por el objeto: las clases prosaicas presentes se
 *    renderizan y no queda ninguna categoría «Misidentificación».
 *  - Los arcos (stroke-dasharray) suman la circunferencia → la partición = 100%.
 *  - Los offsets son monótonos y no se solapan.
 *  - El centro del donut muestra el total de INCIDENTES (los documentos no
 *    entran en el agregado: son evidencia, no sucesos).
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

// --- Lo esperado, derivado del corpus (nada hardcodeado) ------------------
// Réplica mínima de lib/meceModel (corpusPosteriors + modalHypothesis con
// consolidateNonHuman + keepIndet): solo incidentes; cada uno cae en el argmax
// de {clase prosaica, humana, adversaria, no-humano, indet}, con empate a favor
// del primero en ese orden (el sort estable de expandedHypotheses).
const PROSAIC_ORDER = ["astronomico", "aeronave", "espacial", "luces_tierra", "terrestre_otros", "natural", "fraude", "instrumento", "psicosocial"];
const prosaicKey = (c) =>
  c.mundanoType && c.mundanoType !== "misid" ? c.mundanoType : c.misidSubtype ?? "terrestre_otros";
let incidents = null;
let expectedModal = null; // Map key → nº de incidentes
try {
  const raw = JSON.parse(readFileSync(CASES_JSON, "utf8"));
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.cases) ? raw.cases : null;
  if (list) {
    incidents = list.filter((c) => c.category !== "document");
    expectedModal = new Map();
    for (const c of incidents) {
      const p = c.posterior;
      if (!p) continue; // sin posterior = seed (M1 lo impide); no se replica aquí
      const tot = Object.values(p).reduce((a, b) => a + b, 0) || 1;
      const cand = [
        [prosaicKey(c), p.mundano_natural / tot],
        ["humana_clasificada", p.humana_clasificada / tot],
        ["adversaria", p.adversaria / tot],
        ["nohumano", (p.nohumano_encubierto + p.nohumano_abierto) / tot],
        ["indet", p.indet / tot],
      ].filter(([, v]) => v > 0.001);
      let best = cand[0];
      for (const x of cand) if (x[1] > best[1]) best = x;
      expectedModal.set(best[0], (expectedModal.get(best[0]) ?? 0) + 1);
    }
  }
} catch {
  /* cases.json es artefacto de build; si falta, caemos a los checks laxos */
}

// --- Parse de los segmentos del donut (marcados con data-segment) ---------
// data-segment distingue los arcos de hipótesis del anillo de fondo y del halo.
const circleRe = /<circle\b[^>]*\bdata-segment\b[^>]*>/g;
const circles = html.match(circleRe) ?? [];

const num = (tag, attr) => {
  const m = tag.match(new RegExp(`${attr}="([^"]+)"`));
  return m ? m[1] : null;
};

console.log("Donut /probabilidades");

// 1) Nº de segmentos = nº de narrativas modales presentes en los incidentes: lo
//    prosaico abierto en sus clases de objeto + fenómeno natural + posible
//    fraude, más tecnología humana + adversaria + no-humano (consolidado) +
//    Indeterminado (incidentes inconclusos). Derivado del corpus porque las
//    clases cambian con la taxonomía (sep 2026: entra «Luces en tierra», sale de
//    forma transitoria «Objeto convencional no precisado»).
if (expectedModal) {
  const n = expectedModal.size;
  if (circles.length === n) ok(`${n} segmentos en el donut (uno por narrativa modal presente)`);
  else fail(`esperaba ${n} segmentos (${[...expectedModal.keys()].join(", ")}), encontré ${circles.length}`);
} else if (circles.length >= 4) ok(`${circles.length} segmentos en el donut (no se pudo derivar del corpus)`);
else fail(`muy pocos segmentos en el donut: ${circles.length}`);

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

// 4) El centro del donut marca el TOTAL de INCIDENTES.
//    El total NO se hardcodea (anti-pattern del repo): se deriva del corpus
//    generado (data/cases.json). Solo cuentan los casos no-documento: los
//    documentos son evidencia, no sucesos, y no entran en ningún agregado
//    (lib/meceModel corpusPosteriors; sonda E24).
const expectedN = incidents ? incidents.length : null;
if (expectedN != null) {
  if (new RegExp(`>\\s*${expectedN}\\s*<`).test(html)) ok(`el centro marca el total de incidentes derivado (${expectedN})`);
  else fail(`el centro no marca el total de incidentes (${expectedN})`);
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

// 5b) Lo prosaico se nombra por el OBJETO: las clases prosaicas presentes se
//     renderizan (ES y EN) y no vuelve la categoría «Misidentificación» (ni en
//     la raíz inglesa ni en el espejo /es). /probabilidades no lleva prosa de
//     casos, así que cualquier aparición es una etiqueta de UI. Las etiquetas se
//     leen de lib/meceClasses.ts (fuente única), no se duplican aquí.
const MECE_SRC = readFileSync(join(__dirname, "..", "lib", "meceClasses.ts"), "utf8");
const LABELS = new Map(
  [...MECE_SRC.matchAll(/\{ key: "(\w+)", label: "([^"]+)", labelEn: "([^"]+)"/g)]
    .filter((m) => PROSAIC_ORDER.includes(m[1]))
    .map((m) => [m[1], { es: m[2], en: m[3] }]),
);
const presentProsaic = PROSAIC_ORDER.filter((k) => expectedModal ? expectedModal.has(k) : LABELS.has(k));
const PROSAIC_LABELS = {
  "probabilidades/index.html": presentProsaic.map((k) => LABELS.get(k)?.en ?? k),
  "es/probabilidades/index.html": presentProsaic.map((k) => LABELS.get(k)?.es ?? k),
};
for (const [rel, labels] of Object.entries(PROSAIC_LABELS)) {
  const page = readFileSync(join(__dirname, "..", "out", rel), "utf8");
  const missing = labels.filter((l) => !page.includes(l));
  if (missing.length === 0) ok(`${rel}: las ${labels.length} clases prosaicas presentes se renderizan`);
  else fail(`${rel}: faltan clases prosaicas: ${missing.join(", ")}`);
  if (!/misidentifica/i.test(page)) ok(`${rel}: sin categoría «Misidentificación»`);
  else fail(`${rel}: reapareció «Misidentificación/Misidentification»`);
}

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

// Los enteros REALMENTE impresos suman 100 — no basta con que la leyenda lo
// prometa. Redondear cada fila por su cuenta daba 101% en pantalla bajo ese
// mismo texto, y el test pasaba igual porque solo validaba los valores crudos.
//
// Los casos se eligen VERIFICANDO el render, no el `posterior` crudo: lo que se
// imprime sale de `expandedHypotheses` (abre mundano en subtipos), así que son
// números distintos a los del JSON. Escaneando out/ con el bug presente: **110
// de 249** casos imprimían ≠100. `roswell-1947` NO era uno de ellos —probarlo
// solo a él es un test ciego, que fue justo el error original—, así que aquí van
// tres que SÍ fallaban: dos por arriba (101%) y uno por abajo (98%).
console.log("\nCaso · los % impresos suman 100 (resto mayor)");
for (const slug of [
  "aawsap-skinwalker-2008", // daba 101% — además la página de más tráfico
  "allagash-1976", // daba 101%
  "valentich-1978", // daba 98%
]) {
  const html = readOut(`cases/${slug}/index.html`);
  if (html == null) {
    fail(`no existe out/cases/${slug}/index.html`);
    continue;
  }
  // La leyenda va entre el grid de filas y el pie "Hipótesis modal": el % del
  // modal queda fuera (viene después de ese texto) y los del `title` de la
  // barra también (vienen antes del grid).
  const leyenda = html.match(
    /grid-cols-1 gap-x-6[\s\S]*?(?:Hipótesis modal|Modal hypothesis)/,
  );
  if (!leyenda) {
    fail(`${slug}: no encontré la leyenda de CasePosterior en el render`);
    continue;
  }
  // React intercala `<!-- -->` entre el número y el "%" (dos nodos de texto
  // contiguos), así que el separador es opcional en el patrón.
  const partes = [...leyenda[0].matchAll(/>(\d+)(?:<!-- -->)?%</g)].map((m) =>
    Number(m[1]),
  );
  const suma = partes.reduce((s, n) => s + n, 0);
  check(
    `${slug}: ${partes.join("+")} = ${suma}`,
    partes.length >= 2 && suma === 100,
  );
}

console.log("");
if (failures === 0) {
  console.log("✓ test-chart: todos los gráficos del corpus OK");
  process.exit(0);
} else {
  console.error(`✗ test-chart: ${failures} fallo(s)`);
  process.exit(1);
}
