#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Sonda de QA VISUAL — captura screenshots de vistas clave del sitio construido.
//
// Las otras sondas (audit-consistency, validate-schema, audit-design) son
// node-plain y corren en prebuild SIN node_modules: revisan datos, schema y
// tokens de contraste, pero NUNCA renderizan un pixel. Esta las complementa con
// la capa visual: construye el sitio, lo sirve y fotografía las vistas del
// manifiesto para revisión (o para acompañar un PR de UI/UX).
//
// A diferencia de las demás, ESTA sí requiere:
//   1. el sitio construido (`out/` — corre `npm run build` antes), y
//   2. Chromium (env PLAYWRIGHT_BROWSERS_PATH, ya provisto en el entorno).
// Por eso es ON-DEMAND (`npm run qa:shots`), no un gate del prebuild node-plain.
//
// Uso:
//   npm run qa:shots                 # todas las vistas del manifiesto
//   node scripts/qa-screenshots.mjs home case-xref     # solo esas vistas
//   node scripts/qa-screenshots.mjs --route /cases/varginha-1996/ --name adhoc
//   node scripts/qa-screenshots.mjs --route /cases/x/ --phrase "public front"
//
// Salida: web/qa-shots/<name>.png (gitignored).
//
// Lecciones incorporadas (descubiertas al fotografiar el visor de referencias):
//   · JS DESHABILITADO por defecto → layout ESTÁTICO: los visores PDF (react-pdf,
//     ssr:false) no cargan ni desplazan la página, y el HTML server-rendered
//     (prosa, enlaces ↗, donut SSR) se ve completo. `js:true` por vista si hace
//     falta interactividad.
//   · El DOM trae ES+EN a la vez (CSS oculta uno); al enfocar un elemento hay que
//     tomar el VISIBLE (rect height > 0), no el del idioma oculto.
//   · Clip con coords ABSOLUTAS de página + captureBeyondViewport (no scroll +
//     coords de viewport, que se pelean con el clip).
// ─────────────────────────────────────────────────────────────────────────

import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const OUT_DIR = path.join(root, "out");
const SHOTS_DIR = path.join(root, "qa-shots");
const PORT = Number(process.env.QA_PORT || 8123);

// ── Manifiesto de vistas QA (extensible) ─────────────────────────────────
// name: nombre del archivo. route: ruta del sitio. Enfoque opcional (una de):
//   phrase   → recorta el <p> visible que contiene ese texto (+ margen)
//   selector → recorta el primer elemento visible que matchea
//   (sin foco) → página desde arriba, alto `fullHeight` (default 2400)
// js:true fuerza ejecución de scripts (para vistas que la necesiten).
const VIEWS = [
  { name: "home", route: "/", fullHeight: 2200 },
  { name: "case-detail", route: "/cases/varginha-1996/", fullHeight: 2600 },
  { name: "case-xref", route: "/cases/burlison-ffrdc-investigation-2026/", phrase: "public front" },
  { name: "cases-list", route: "/cases/", fullHeight: 2200 },
  { name: "probabilidades", route: "/probabilidades/", fullHeight: 2600 },
  { name: "calidad", route: "/calidad/", fullHeight: 2400 },
];

// ── CLI ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
let views = VIEWS;
const adhoc = {};
const names = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--route") adhoc.route = argv[++i];
  else if (argv[i] === "--name") adhoc.name = argv[++i];
  else if (argv[i] === "--phrase") adhoc.phrase = argv[++i];
  else if (argv[i] === "--selector") adhoc.selector = argv[++i];
  else names.push(argv[i]);
}
if (adhoc.route) views = [{ name: adhoc.name || "adhoc", ...adhoc }];
else if (names.length) views = VIEWS.filter((v) => names.includes(v.name));

// ── Resolver el binario de Chromium (sin hardcodear la versión) ──────────
function findChrome() {
  if (process.env.QA_CHROME && fs.existsSync(process.env.QA_CHROME)) return process.env.QA_CHROME;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (fs.existsSync(base)) {
    const dir = fs.readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
    if (dir) {
      const p = path.join(base, dir, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  }
  for (const p of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Servidor estático mínimo de out/ (sin dependencias) ──────────────────
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };
function serve() {
  return http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(OUT_DIR, rel);
    try {
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      else if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
      else if (!fs.existsSync(file)) file = path.join(file, "index.html");
      const buf = fs.readFileSync(file);
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404); res.end("404");
    }
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error("qa-shots: falta out/ — corre `npm run build` primero.");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error("qa-shots: no encontré Chromium (define QA_CHROME o PLAYWRIGHT_BROWSERS_PATH).");
    process.exit(1);
  }
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const server = serve();
  await new Promise((r) => server.listen(PORT, r));

  const proc = spawn(chrome, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--remote-debugging-port=9455", "--force-device-scale-factor=2",
    "--window-size=1440,3000", "about:blank",
  ], { stdio: "ignore" });

  try {
    // esperar el endpoint de debugging
    let targets;
    for (let i = 0; i < 50; i++) {
      try { targets = await (await fetch("http://localhost:9455/json")).json(); if (targets?.length) break; } catch {}
      await sleep(150);
    }
    const page = targets.find((t) => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 0; const pending = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
    const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

    await send("Page.enable");
    await send("Runtime.enable");

    let ok = 0;
    for (const v of views) {
      await send("Emulation.setScriptExecutionDisabled", { value: !v.js });
      await send("Page.navigate", { url: `http://localhost:${PORT}${v.route}` });
      await sleep(v.js ? 2600 : 1800);

      const focus = v.phrase
        ? `(() => { const ps=[...document.querySelectorAll('p')].filter(p=>p.getBoundingClientRect().height>0); const p=ps.find(x=>x.textContent.includes(${JSON.stringify(v.phrase)})); if(!p) return null; const r=p.getBoundingClientRect(); return JSON.stringify({x:0,y:r.top+scrollY-60,w:1440,h:r.height+120}); })()`
        : v.selector
          ? `(() => { const el=[...document.querySelectorAll(${JSON.stringify(v.selector)})].find(e=>e.getBoundingClientRect().height>0); if(!el) return null; const r=el.getBoundingClientRect(); return JSON.stringify({x:Math.max(0,r.left+scrollX-40),y:r.top+scrollY-40,w:Math.min(1440,r.width+80),h:r.height+80}); })()`
          : `JSON.stringify({x:0,y:0,w:1440,h:${v.fullHeight || 2400}})`;
      const { result } = await send("Runtime.evaluate", { expression: focus, returnByValue: true });
      if (!result.value) { console.error(`  ✗ ${v.name}: no se encontró el foco (${v.phrase || v.selector})`); continue; }
      const box = JSON.parse(result.value);
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: box.x, y: Math.max(0, box.y), width: box.w, height: box.h, scale: 1 } });
      const outFile = path.join(SHOTS_DIR, `${v.name}.png`);
      fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
      console.log(`  ✓ ${v.name} → qa-shots/${v.name}.png  (${box.w}×${box.h})`);
      ok++;
    }
    ws.close();
    console.log(`\nqa-shots: ${ok}/${views.length} vistas capturadas en web/qa-shots/`);
  } finally {
    proc.kill();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
