// PDF de respaldo de calidad interna: las fichas reescritas del lote, en
// español y en inglés, tal como las leería alguien (título, lugar, resumen,
// relato, por qué importa, evidencia). Uso: node pdf.mjs <salida.pdf> <id>...
import fs from "fs";
import { createRequire } from "module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const WEB = "/home/user/Mercadopublico/web/data/cases";
const [out, ...ids] = process.argv.slice(2);
const titles = Object.fromEntries(fs.readdirSync(WEB).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(`${WEB}/${f}`, "utf8"))).map((o) => [o.id, [o.name, o.name_en]]));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
const links = (s, l) => esc(s).replace(/\[\[([a-z0-9-]+)\]\]/g, (_, id) => `<u>${esc(titles[id]?.[l] ?? id)}</u>`);
const paras = (s, l) => (s || "").split("\n\n").map((p) => `<p>${links(p, l)}</p>`).join("");
const block = (o, l) => {
  const k = (f) => o[l ? `${f}_en` : f];
  const H = l ? ["What happened", "Why it matters", "Evidence"] : ["Qué pasó", "Por qué importa", "Evidencia"];
  return `<section><div class="meta">${o.year_start} · ${esc(l ? o.location.place_en : o.location.place)} · Tier ${o.tier}</div>
  <h1>${esc(k("name"))}</h1><p class="lede">${links(k("summary"), l)}</p>
  <h2>${H[0]}</h2>${paras(k("whatHappened"), l)}<h2>${H[1]}</h2>${paras(k("whyMatters"), l)}
  <h2>${H[2]}</h2><ul>${(k("evidence") || []).map((e) => `<li>${links(e, l)}</li>`).join("")}</ul></section>`;
};
const cases = ids.map((id) => JSON.parse(fs.readFileSync(`${WEB}/${id}.json`, "utf8")));
const html = `<!doctype html><meta charset="utf-8"><style>
body{font:11pt/1.55 Georgia,serif;color:#1a1a1a;margin:0} section{page-break-after:always;padding:0 4mm}
h1{font-size:20pt;line-height:1.2;margin:4mm 0} h2{font-size:12pt;margin:6mm 0 2mm;color:#c41e3a}
.meta{font:9pt sans-serif;color:#666} .lede{font-size:12pt} li{margin-bottom:2mm} .cover{padding:40mm 10mm}
</style><section class="cover"><h1>Lote R1 · fichas reescritas</h1><p>${new Date().toISOString().slice(0, 10)} · ${cases.length} fichas · español e inglés</p>
<ol>${cases.map((o) => `<li>${esc(o.name)}</li>`).join("")}</ol></section>
${cases.map((o) => block(o, 0) + block(o, 1)).join("")}`;
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent(html); await p.pdf({ path: out, format: "A4", margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" } });
await b.close(); console.log("PDF:", out);
