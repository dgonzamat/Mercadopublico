#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Sonda de página: ¿llega el lector al relato sin atravesar el papeleo?
//
// Mide, en un móvil de 390×844, cuántas pantallas hay desde arriba de la
// ficha hasta el primer contenido del caso —el registro del suceso (vídeo o
// foto) si lo hay, o el relato— y que nada más se cuele antes, en TODAS las fichas
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
import { execSync } from "child_process";

// Playwright no es dependencia del repo: está instalado de forma global en el
// entorno, así que se busca primero aquí y después en la raíz global de npm.
const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  const globalRoot = execSync("npm root -g").toString().trim();
  playwright = createRequire(path.join(globalRoot, "noop.js"))("playwright");
}
const { chromium } = playwright;
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
  // El primer contenido del caso es el registro del suceso (bloque 4, si lo
  // hay) o el relato; entre «Qué fue» y él no puede colarse nada más.
  const m = await page.evaluate(() => {
    const vis = (e) => e && e.getBoundingClientRect().height > 0;
    const top = (e) => e.getBoundingClientRect().top + window.scrollY;
    const h2 = [...document.querySelectorAll("article section h2")].find(vis);
    const proof = [...document.querySelectorAll("article p")].find((e) => vis(e) && /^(Registro del suceso|Record of the event)$/.test(e.textContent.trim()));
    const header = document.querySelector("article header");
    const first = proof ?? h2;
    // Lo que haya entre el fin de la cabecera y el primer contenido del caso.
    const gap = header && first ? [...document.querySelectorAll("article > *")].filter((e) => vis(e) && top(e) >= top(header) + header.getBoundingClientRect().height - 1 && top(e) < top(first) - 1 && !e.contains(first)).length : 0;
    return { y: first ? top(first) : null, gap };
  });
  rows.push({ id, screens: m.y == null ? null : +(m.y / H).toFixed(2), gap: m.gap });
}
await browser.close();
server.close();

const ok = rows.filter((r) => r.screens != null).map((r) => r.screens).sort((a, b) => a - b);
const over = rows.filter((r) => r.screens == null || r.screens > MAX || r.gap > 0).sort((a, b) => (b.screens ?? 99) - (a.screens ?? 99));
console.log(`qa-relato: ${rows.length} fichas · pantallas hasta el caso: mediana ${ok[ok.length >> 1]}, p90 ${ok[Math.floor(ok.length * 0.9)]}, máx ${ok.at(-1)}`);
if (arg("--json")) fs.writeFileSync(arg("--json"), JSON.stringify(rows, null, 1));
if (over.length) {
  console.log(`  ${over.length} pasan de ${MAX} pantallas, no tienen relato o tienen algo entre la cabecera y el caso:`);
  over.slice(0, 20).forEach((r) => console.log(`    ${r.id}  ${r.screens ?? "sin relato"}${r.gap ? `  (${r.gap} bloque(s) entre la cabecera y el caso)` : ""}`));
  process.exit(1);
}
console.log(`  ✓ todas por debajo de ${MAX} pantallas.`);
