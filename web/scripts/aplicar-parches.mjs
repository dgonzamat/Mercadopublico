#!/usr/bin/env node
// aplicar-parches.mjs — aplica a las fichas los arreglos que entrega el
// verificador independiente como parches exactos (docs/brief-verificacion.md,
// «Patch file»). Existe porque en el piloto de nov 2026 el orquestador
// reescribía a mano cada arreglo: gastaba contexto y creó al menos 6 de los ~37
// defectos que marcaron los lectores. El script no decide qué es cierto: solo
// aplica texto exacto y obliga a que cada parche traiga su cita.
//
// Formato (JSON, una lista):
//   { "ficha": "<id>", "hallazgo": 3, "severidad": "ALTA|MEDIA|BAJA",
//     "hecho": true,                    // cambia un hecho (no solo la forma)
//     "cita": "archivo, p. 6, párr. 1: «…»",
//     "old": "texto exacto tal como se lee en la ficha",
//     "new": "texto que lo reemplaza" }
// `old` y `new` van como texto legible (con saltos de párrafo como \n\n); el
// script los escapa igual que el JSON de la ficha. `old` debe aparecer una sola vez.
//
// Regla de contraste (decisión del dueño, 18 nov 2026; vive en /nuevo-caso 5c):
// el orquestador abre la fuente de todo parche ALTA, MEDIA o con "hecho": true
// antes de aplicarlo; los BAJA de forma se aplican con la cita del verificador.
// Por eso el script, sin --contrastado, solo aplica los BAJA sin "hecho" y lista
// el resto para contrastar.
//
// Campo "añade" (18 nov 2026, tras la tanda 539–542): true si el parche suma un
// dato que la ficha no traía, false si solo corrige o quita. En esa tanda, 14 de
// los defectos de lectura estaban en frases que añadieron parches bien escritos:
// el problema era el dato de más, no la forma. Por eso un parche con "añade": true
// sobre la prosa (summary, whatHappened, whyMatters y sus _en) no se aplica: el
// dato va a evidence o a la nota de la fuente. Sin el campo, avisa y aplica.
//
// Uso (desde web/):
//   node scripts/aplicar-parches.mjs parches.json                 # aplica solo BAJA de forma
//   node scripts/aplicar-parches.mjs parches.json --contrastado 1,4,7   # además, esos hallazgos ya contrastados
//   node scripts/aplicar-parches.mjs parches.json --dry-run       # no escribe nada
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry-run");
const ci = args.indexOf("--contrastado");
const contrastados = new Set(ci >= 0 ? (args[ci + 1] || "").split(",").map((s) => s.trim()).filter(Boolean) : []);
if (!file) { console.error("Uso: node scripts/aplicar-parches.mjs <parches.json> [--contrastado 1,2] [--dry-run]"); process.exit(2); }

const parches = JSON.parse(fs.readFileSync(file, "utf8"));
const esc = (s) => JSON.stringify(s).slice(1, -1); // mismo escape que el JSON de la ficha
const textos = {};
const leer = (id) => (textos[id] ??= fs.readFileSync(path.join(WEB, "data", "cases", id + ".json"), "utf8"));

const PROSA = new Set(["summary", "whatHappened", "whyMatters"].flatMap((k) => [k, k + "_en"]));
const contiene = (v, s) => typeof v === "string" ? v.includes(s) : v && typeof v === "object" ? Object.values(v).some((x) => contiene(x, s)) : false;
const campoDe = (id, old) => {
  const c = JSON.parse(leer(id));
  return Object.keys(c).find((k) => contiene(c[k], old)) ?? "otro";
};

let aplicados = 0, pendientes = 0, fallos = 0, desviados = 0;
for (const p of parches) {
  const tag = `${p.ficha} #${p.hallazgo} (${p.severidad}${p.hecho ? ", hecho" : ""})`;
  if (!p.cita || !String(p.cita).trim()) { console.log(`✗ ${tag}: sin cita; no se aplica`); fallos++; continue; }
  const exige = p.severidad !== "BAJA" || p.hecho;
  if (exige && !contrastados.has(String(p.hallazgo))) { console.log(`· ${tag}: contrastar con la fuente antes de aplicar → ${p.cita}`); pendientes++; continue; }
  const t = leer(p.ficha);
  const o = esc(p.old), n = esc(p.new);
  const veces = t.split(o).length - 1;
  if (veces !== 1) { console.log(`✗ ${tag}: el texto viejo aparece ${veces} veces; no se aplica`); fallos++; continue; }
  const campo = campoDe(p.ficha, p.old);
  if (p["añade"] === true && PROSA.has(campo)) {
    console.log(`→ ${tag}: añade un dato a ${campo}; no se aplica: llévalo a evidence o a la nota de la fuente`); desviados++; continue;
  }
  if (p["añade"] === undefined) console.log(`  ${tag}: sin campo "añade"; se trata como corrección`);
  textos[p.ficha] = t.replace(o, n);
  console.log(`✓ ${tag}`); aplicados++;
}
for (const [id, t] of Object.entries(textos)) {
  try { JSON.parse(t); } catch (e) { console.log(`✗ ${id}: el resultado no es JSON válido (${e.message}); no se escribe`); fallos++; continue; }
  if (!dry) fs.writeFileSync(path.join(WEB, "data", "cases", id + ".json"), t);
}
console.log(`\n${aplicados} aplicados, ${pendientes} pendientes de contraste, ${desviados} desviados fuera de la prosa, ${fallos} fallos${dry ? " (dry-run: nada escrito)" : ""}.`);
console.log("Después: node scripts/validate-schema.mjs, node scripts/build-cases.mjs, node scripts/audit-consistency.mjs y npm run caso:check -- <id>.");
if (fallos) process.exit(1);
