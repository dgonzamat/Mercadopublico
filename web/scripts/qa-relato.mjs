#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Sonda de página: ¿llega el lector al relato sin atravesar el papeleo?
//
// Mide, en un móvil de 390×844, cuántas pantallas hay desde arriba de la
// ficha hasta el primer párrafo de «Qué pasó», en TODAS las fichas
// (`/es/cases/<id>/`). Nació de la especificación de la ficha (oct 2026): el
// visor de documentos iba antes del relato y lo empujaba a 2,9 pantallas en la
// ficha típica y a 9,6 en Skinwalker, y ninguna sonda lo veía porque las de
// prebuild no renderizan. Falla (exit 1) si alguna ficha pasa del tope.
//
// Como qa-screenshots, es ON-DEMAND (`npm run qa:relato`): necesita `out/`
// (`npm run build` antes) y Chromium con Playwright, ya instalados en el
// entorno. JS desactivado: mide el HTML estático, con los visores de PDF en su
// hueco reservado de 60vh (en el teléfono llegan a 80vh), así que la cifra es
// un suelo.
//
// Uso: node scripts/qa-relato.mjs [--max 2.5] [--json salida.json]
// ─────────────────────────────────────────────────────────────────────────
import fs from "fs";
import http from "http";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(root, "out");
const BASE = "/Mercadopublico";
const H = 844;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MAX = Number(arg("--max", "2.5"));

if (!fs.existsSync(path.join(OUT, "es", "cases"))) {
  console.error("qa-relato: falta out/ (corre `npm run build` antes).");
  process.exit(2);
}
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const server = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split("?")[0]);
  if (u.startsWith(BASE)) u = u.slice(BASE.length);
  let f = path.join(OUT, u);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader("content-type", types[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(r);
}).listen(0);
const port = server.address().port;

const ids = fs.readdirSync(path.join(root, "data", "cases")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
const browser = await chromium.launch();
const page = await (await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: H }, isMobile: true })).newPage();
const rows = [];
for (const id of ids) {
  await page.goto(`http://127.0.0.1:${port}${BASE}/es/cases/${id}/`, { waitUntil: "load" });
  const y = await page.evaluate(() => {
    const h2 = [...document.querySelectorAll("article section h2")].find((e) => e.getBoundingClientRect().height > 0);
    return h2 ? h2.getBoundingClientRect().top + window.scrollY : null;
  });
  rows.push({ id, screens: y == null ? null : +(y / H).toFixed(2) });
}
await browser.close();
server.close();

const ok = rows.filter((r) => r.screens != null).map((r) => r.screens).sort((a, b) => a - b);
const over = rows.filter((r) => r.screens == null || r.screens > MAX).sort((a, b) => (b.screens ?? 99) - (a.screens ?? 99));
console.log(`qa-relato: ${rows.length} fichas · pantallas hasta el relato: mediana ${ok[ok.length >> 1]}, p90 ${ok[Math.floor(ok.length * 0.9)]}, máx ${ok.at(-1)}`);
if (arg("--json")) fs.writeFileSync(arg("--json"), JSON.stringify(rows, null, 1));
if (over.length) {
  console.log(`  ${over.length} pasan de ${MAX} pantallas (o no tienen relato):`);
  over.slice(0, 20).forEach((r) => console.log(`    ${r.id}  ${r.screens ?? "sin relato"}`));
  process.exit(1);
}
console.log(`  ✓ todas por debajo de ${MAX} pantallas.`);
