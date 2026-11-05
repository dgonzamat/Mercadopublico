#!/usr/bin/env node
// Factor UI/UX de la auditoría diaria: fotografía cada ficha de la muestra como
// la ve un lector en el teléfono (390×844, JS activo, /es/cases/<id>/) y mide lo
// que una captura no dice sola. Necesita out/ fresco (`npm run build` en web/).
// Uso: node ui.mjs <carpeta_muestra>   → <carpeta>/ui/<id>/p01.png… y metricas.json
import fs from "fs";
import http from "http";
import path from "path";
import { createRequire } from "module";
import { execSync } from "child_process";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = createRequire(path.join(execSync("npm root -g").toString().trim(), "noop.js"))("playwright"); }
// El sitio se sirve desde la raíz (uapcodex.org): next.config.mjs deja basePath vacío
// salvo que NEXT_PUBLIC_BASE_PATH diga otra cosa. Servirlo bajo /Mercadopublico hacía
// que el router del cliente no reconociera /es y pasara el chrome a inglés con el
// error #418: tres «defectos transversales» de la auditoría eran de esta sonda (nov 2026).
const WEB = "/home/user/Mercadopublico/web", OUT = path.join(WEB, "out"), BASE = process.env.NEXT_PUBLIC_BASE_PATH || "", H = 844, MAXP = 14;
const dir = process.argv[2];
const m = JSON.parse(fs.readFileSync(path.join(dir, "muestra.json")));
// out/ rancio = capturas de una ficha que ya no existe así (lección de test-chart).
const stale = m.fichas.filter(([, id]) => {
  const h = path.join(OUT, "es/cases", id, "index.html"), j = path.join(WEB, "data/cases", id + ".json");
  return !fs.existsSync(h) || fs.statSync(h).mtimeMs < fs.statSync(j).mtimeMs;
});
if (stale.length) { console.error("ui: out/ RANCIO para", stale.map((s) => s[1]).join(", "), "— corre npm run build en web/"); process.exit(2); }

const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".pdf": "application/pdf", ".json": "application/json", ".woff2": "font/woff2", ".mjs": "application/javascript" };
const server = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split("?")[0]);
  if (BASE && u.startsWith(BASE)) u = u.slice(BASE.length);
  let f = path.join(OUT, u);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader("content-type", types[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(r);
}).listen(0);
const port = server.address().port;

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
const out = {};
for (const [, id] of m.fichas) {
  const page = await ctx.newPage();
  const fails = [];
  page.on("response", (r) => { if (r.status() >= 400 && r.url().includes("127.0.0.1")) fails.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  page.on("pageerror", (e) => fails.push("JS " + String(e).slice(0, 120)));
  await page.goto(`http://127.0.0.1:${port}${BASE}/es/cases/${id}/`, { waitUntil: "networkidle" }).catch(() => {});
  // Bajar poco a poco para que carguen los visores perezosos, y volver arriba.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += H) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(250); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
  const met = await page.evaluate((H) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.width > 0; };
    const top = (e) => e.getBoundingClientRect().top + window.scrollY;
    const art = document.querySelector("article") || document.body;
    const h2 = [...art.querySelectorAll("section h2")].find(vis);
    const proof = [...art.querySelectorAll("p")].find((e) => vis(e) && /^(Registro del suceso|Record of the event)$/.test(e.textContent.trim()));
    const first = proof ?? h2;
    const paras = [...art.querySelectorAll("p")].filter(vis).map((p) => {
      const lh = parseFloat(getComputedStyle(p).lineHeight) || 24;
      return { lineas: Math.round(p.getBoundingClientRect().height / lh), ini: p.textContent.trim().slice(0, 60) };
    });
    const imgs = [...art.querySelectorAll("img")].filter(vis);
    const rotas = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src"));
    const ancho = [...art.querySelectorAll("*")].filter((e) => vis(e) && e.getBoundingClientRect().right > window.innerWidth + 2).slice(0, 5).map((e) => e.tagName + "." + (e.className || "").toString().slice(0, 40));
    const toques = [...art.querySelectorAll("a, button")].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.height < 24 && e.textContent.trim().length < 3; }).length;
    const crudo = (art.innerText.match(/\[\[[a-z0-9-]+\]\]|\*\*[^*]+\*\*|`[^`]+`|\/(researchers|frameworks|cases)\/[a-z0-9-]+/g) || []).slice(0, 5);
    const visores = art.querySelectorAll("canvas, iframe, video").length;
    return {
      pantallas_total: +(document.documentElement.scrollHeight / H).toFixed(1),
      pantallas_hasta_caso: first ? +(top(first) / H).toFixed(2) : null,
      parrafos_mas_largos: paras.sort((a, b) => b.lineas - a.lineas).slice(0, 3),
      imagenes: imgs.length, imagenes_rotas: rotas, visores_renderizados: visores,
      // Por elemento, no por página: un contenedor que recorta (overflow hidden) no
      // desplaza la página y aun así deja texto cortado (Ferrol, Harare; nov 2026).
      desborde_horizontal: ancho,
      toques_pequenos: toques, markup_crudo: crudo,
    };
  }, H);
  met.recursos_fallidos = fails.slice(0, 8);
  const d = path.join(dir, "ui", id); fs.mkdirSync(d, { recursive: true });
  const n = Math.min(MAXP, Math.ceil(met.pantallas_total));
  for (let i = 0; i < n; i++) {
    await page.evaluate((v) => window.scrollTo(0, v), i * H); await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(d, `p${String(i + 1).padStart(2, "0")}.png`) });
    // p01 con el aviso de cookies tal como lo ve quien llega; el resto sin él,
    // para que no tape el pie de cada pantalla.
    if (i === 0) { await page.getByRole("button", { name: /^(Reject|Rechazar)$/ }).first().click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(300); }
  }
  met.capturas = n;
  out[id] = met;
  await page.close();
  console.log(id, met.pantallas_total, "pantallas;", met.pantallas_hasta_caso, "hasta el caso;", met.imagenes_rotas.length, "img rotas;", met.recursos_fallidos.length, "fallos");
}
await browser.close(); server.close();
fs.writeFileSync(path.join(dir, "ui", "metricas.json"), JSON.stringify(out, null, 1));
