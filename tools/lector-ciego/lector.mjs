#!/usr/bin/env node
// Lector ciego de fichas: corre la prueba del lector (/auditar-prosa §2,
// /nuevo-caso 5d) con `claude -p` lanzado FUERA del repo, para que el lector no
// reciba CLAUDE.md. El subagente `ficha-lector` sí lo recibía entero (guía de
// redacción, MECE, tiers): comprobado el 20 nov 2026 preguntándole por E56.
//
// Uso (desde la raíz del repo):
//   node tools/lector-ciego/lector.mjs --lang es <id> [<id>…]   (hasta 5 fichas)
//   node tools/lector-ciego/lector.mjs --control                (¿ve reglas?)
// Opciones: --out <archivo.md> guarda la respuesta; --model (por defecto opus).
//
// El brief se lee de .claude/commands/auditar-prosa.md, que es su único hogar.
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (k) => { const i = args.indexOf(k); if (i < 0) return false; args.splice(i, 1); return true; };
const control = flag("--control");
const lang = opt("--lang", "es");
const model = opt("--model", "opus");
const out = opt("--out", null);
const ids = args;
const die = (m) => { console.error(`lector-ciego: ${m}`); process.exit(1); };

if (!control) {
  if (!["es", "en"].includes(lang)) die("--lang debe ser es o en");
  if (ids.length < 1 || ids.length > 5) die("indica de 1 a 5 ids de ficha (casos distintos)");
}

// Directorio fuera del repo: CLAUDE.md se busca subiendo desde el cwd.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lector-ciego-"));
if (path.relative(repo, dir).split(path.sep)[0] !== "..") die(`el tmp ${dir} cae dentro del repo`);

let prompt;
if (control) {
  prompt = "Sin usar herramientas, mirando solo tu contexto inicial: ¿ves instrucciones de algún proyecto, un CLAUDE.md o reglas de redacción? Responde Sí o No y, si es Sí, cita una línea.";
} else {
  const skill = fs.readFileSync(path.join(repo, ".claude/commands/auditar-prosa.md"), "utf8");
  const brief = skill.split("\n").find((l) => l.startsWith("> Eres una persona culta"));
  if (!brief) die("no encontré el brief del lector en auditar-prosa.md §2");
  const sfx = lang === "en" ? "_en" : "";
  const files = ids.map((id, n) => {
    const f = path.join(repo, "web/data/cases", `${id}.json`);
    if (!fs.existsSync(f)) die(`no existe la ficha ${id}`);
    const c = JSON.parse(fs.readFileSync(f, "utf8"));
    const get = (k) => c[k + sfx] ?? (sfx ? die(`${id} no tiene ${k}${sfx}`) : "");
    // Lo que ve el lector del sitio: el enlace [[slug]] se muestra como «↗».
    const arrow = (s) => String(s || "").replace(/\s*\[\[[^\]]+\]\]/g, " ↗");
    const place = (lang === "en" ? c.location?.place_en : null) ?? c.location?.place ?? c.country_name;
    const txt = [get("name"), place, get("summary"), get("whatHappened"), get("whyMatters")].map(arrow).join("\n\n");
    const p = path.join(dir, `texto-${n + 1}.txt`);
    fs.writeFileSync(p, txt + "\n");
    return p;
  });
  prompt = `${brief.replace(/^>\s*/, "")}\n\nLee estos textos, cada uno es un caso distinto, y responde por separado para cada uno:\n${files.map((p) => `- ${p}`).join("\n")}`;
}

// --setting-sources local: ni el CLAUDE.md global (~/.claude) ni settings de usuario.
const r = spawnSync("claude", [
  "-p", "--model", model, "--tools", control ? "" : "Read", "--setting-sources", "local",
  "--system-prompt", "Eres un lector general. Lees solo los archivos que se te indican, con Read, y respondes. No usas otras fuentes.",
  "--output-format", "json", prompt,
], { cwd: dir, encoding: "utf8", maxBuffer: 32 << 20 });
fs.rmSync(dir, { recursive: true, force: true });
if (r.error) die(`no pude lanzar claude: ${r.error.message}`);
let j;
try { j = JSON.parse(r.stdout); } catch { die(`salida inesperada:\n${(r.stdout || r.stderr).slice(0, 800)}`); }
if (j.is_error) die(`claude devolvió error: ${j.result}`);

const head = control ? "Control: ¿el lector ve reglas?" : `Lector ciego · ${lang} · ${ids.join(", ")}`;
const text = `# ${head}\n\n${j.result}\n\n_modelo ${model} · costo ${j.total_cost_usd?.toFixed(3)} USD_\n`;
if (out) { fs.writeFileSync(out, text); console.log(`guardado en ${out}`); } else console.log(text);
