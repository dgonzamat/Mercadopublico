// ─────────────────────────────────────────────────────────────────────────
//  Sonda de QA INTERACTIVA  ·  npm run qa:interaction
// ─────────────────────────────────────────────────────────────────────────
//  Las tres sondas de prebuild son node-plain y no renderizan un pixel; la de
//  QA visual (qa-screenshots) SÍ renderiza pero corre con JS DESHABILITADO por
//  defecto, así que fotografía el layout estático. Queda un hueco: nada del
//  repo ejercita la interactividad del cliente. Esta sonda lo cierra para los
//  filtros de /researchers, que con >100 actores son la vía principal de
//  navegación: escribe en el input por CDP y comprueba el resultado en el DOM
//  (tarjetas realmente visibles, conteo aria-live, secciones vacías).
//
//  Es ON-DEMAND, no un gate del prebuild, por lo mismo que qa:shots: necesita
//  out/ (`npm run build` antes) y Chromium, que las node-plain evitan a
//  propósito. Mismo mecanismo CDP que qa-screenshots.mjs.
//
//  Ojo con el idioma al añadir aserciones de rol: la raíz sirve INGLÉS, así
//  que `data-search` lleva `credentials_en` — buscar "senador" ahí da 0 y
//  "senator" da 4. No es un bug del filtro.
import fs from "fs";
import http from "http";
import path from "path";
import { spawn } from "child_process";

const OUT = "out", PORT = 4599;
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".png":"image/png", ".svg":"image/svg+xml", ".woff2":"font/woff2", ".xml":"application/xml", ".txt":"text/plain" };
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split("?")[0]));
  try {
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    else if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
    else if (!fs.existsSync(file)) file = path.join(file, "index.html");
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404); res.end("404"); }
});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const chrome = ["/usr/bin/chromium","/usr/bin/chromium-browser","/usr/bin/google-chrome",
  ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? [path.join(process.env.PLAYWRIGHT_BROWSERS_PATH,"chromium")] : [])]
  .find(p => fs.existsSync(p));

await new Promise(r => server.listen(PORT, r));
const proc = spawn(chrome, ["--headless=new","--no-sandbox","--disable-gpu",
  "--remote-debugging-port=9456","--window-size=1440,2000","about:blank"], { stdio: "ignore" });

let targets;
for (let i = 0; i < 60; i++) {
  try { targets = await (await fetch("http://localhost:9456/json")).json(); if (targets?.length) break; } catch {}
  await sleep(150);
}
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: `http://localhost:${PORT}/researchers/` });
await sleep(3000);

// Cuenta tarjetas REALMENTE visibles (offsetParent null = oculta por CSS)
const visible = `[...document.querySelectorAll('[data-region] a')].filter(a=>a.offsetParent!==null).length`;
const countText = `document.querySelector('[aria-live=polite]')?.textContent.trim()`;
const emptyGroups = `[...document.querySelectorAll('[data-group]')].filter(g=>g.hasAttribute('data-empty')).length`;

const type = async (val) => {
  await evalJs(`(() => {
    const i = document.querySelector('input[type=search]');
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    set.call(i, ${JSON.stringify(val)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(400);
};

let fails = 0;
const check = (name, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : actual === expected;
  console.log(`  ${ok ? "✓" : "✗"} ${name}: ${JSON.stringify(actual)}`);
  if (!ok) fails++;
};

const toggles = `[...document.querySelectorAll('[data-toggle]')].filter(b=>!b.hidden).length`;
const clickToggle = async (code) => {
  await evalJs(`document.querySelector('[data-toggle="${code}"]').click()`);
  await sleep(400);
};

console.log("Filtro de /researchers · prueba interactiva\n");
// Truncado: 125 tarjetas en el HTML, pero solo 8 por sección a la vista.
// A=41 B=27 C=12 D=9 E=1 F=35 → 8+8+8+8+1+8 = 41 (todas las secciones ≥8)
check("truncado inicial: 41 visibles de 125", await evalJs(visible), 41);
check("las 125 siguen en el HTML (SEO)", await evalJs(`document.querySelectorAll('[data-search]').length`), 125);
check("5 secciones ofrecen 'ver todos'", await evalJs(toggles), 5);
check("conteo cuenta el TOTAL, no lo visible", await evalJs(countText), "125 actors");
check("sin secciones vacías", await evalJs(emptyGroups), 0);

await clickToggle("A");
check("desplegar A suma sus 33 restantes", await evalJs(visible), 41 + 33);
await clickToggle("A");
check("plegar A vuelve a 41", await evalJs(visible), 41);

await type("zamora");
check("busca 'zamora' → 1 visible", await evalJs(visible), 1);
check("conteo refleja el filtro", await evalJs(countText), "1 of 125 actors");
check("5 de 6 secciones vacías", await evalJs(emptyGroups), 5);

await type("antonio");                       // sin acento debe encontrar "Antônio"
check("'antonio' encuentra a Antônio (sin diacríticos)", await evalJs(visible), (n) => n >= 1);

await type("valdes");                        // sin tilde debe encontrar "Valdés"
check("'valdes' encuentra a Valdés", await evalJs(visible), (n) => n >= 1);

await type("senator");                       // la raíz sirve EN → credentials_en
check("'senator' matchea por rol (ruta EN)", await evalJs(visible), (n) => n >= 1);

await type("police officer");
check("'police officer' matchea por rol", await evalJs(visible), (n) => n >= 2);

await type("zzzzq");
check("sin resultados → 0 visibles", await evalJs(visible), 0);
check("aparece el estado vacío", await evalJs(`!!document.body.textContent.match(/No actor matches/)`), true);

await type("hill");
check("buscar LEVANTA el truncado (no esconde resultados)", await evalJs(visible), (n) => n >= 2);
check("buscando no se ofrece 'ver todos'", await evalJs(toggles), 0);

await type("");
check("limpiar vuelve al truncado de 41", await evalJs(visible), 41);
check("secciones vacías vuelven a 0", await evalJs(emptyGroups), 0);
check("los toggles reaparecen", await evalJs(toggles), 5);

ws.close(); proc.kill(); server.close();
console.log(fails ? `\n✗ ${fails} fallo(s)` : "\n✓ todas las aserciones pasaron");
process.exit(fails ? 1 : 0);
