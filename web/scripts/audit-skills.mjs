#!/usr/bin/env node
/**
 * audit-skills.mjs — sonda de contrato de los skills del loop.
 *
 * Las tres sondas de prebuild vigilan el CORPUS (schema, consistencia, diseño).
 * Ninguna mira `.claude/`, y se notó: el invariante 3 de `cerebro.md` contradijo
 * a su propia sección de verificación durante dos versiones, y al renombrar las
 * secciones quedaron referencias `§N` apuntando a nada. Ambos defectos eran
 * mecánicamente detectables y sobrevivieron porque nadie los buscaba.
 *
 * Da UN TEST POR TRIGGER del cerebro y varios transversales. El más importante
 * es T-d: que cada skill nombrado en una cadena EXISTA de verdad. Un
 * orquestador que delega en algo inexistente falla en ejecución, no en lectura,
 * y ahí ya es tarde.
 *
 * X7/X8 cubren el CIERRE OBLIGATORIO: que el cerebro declare sus tres salidas
 * (log, automejora, skill scan) y que `docs/cerebro-runs.jsonl` cumpla el
 * contrato que el propio skill define — los campos se EXTRAEN de cerebro.md,
 * no se hardcodean, para que doc y sonda no puedan divergir.
 *
 * Node plano, sin dependencias — igual que el resto de sondas del repo, para
 * que corra en una sesión remota sin `node_modules`.
 *
 * Uso:  node web/scripts/audit-skills.mjs
 *       node web/scripts/audit-skills.mjs --negative-control   (valida la sonda)
 */

import fs from "fs";
import path from "path";
import {
  repoRoot, commandsDir, runsPath, readCerebro, skillInventory, frontmatter,
  parseModes, parseModeTable, parseCierre, requiredLogFields,
} from "./lib/cerebro-contract.mjs";

const findings = [];
const record = (level, test, msg) => findings.push({ level, test, msg });

// El parser del contrato vive en `lib/cerebro-contract.mjs` y lo comparte el
// panel de control (`tools/cerebro-panel`). Un segundo parser sería un segundo
// contrato: el panel ofrecería modos que esta sonda no conoce.
const { repoCommands, userSkills, exists: skillExists } = skillInventory();

const src = readCerebro();
const { description, argHint } = frontmatter(src);
const modeSections = parseModes(src);
const namedModes = modeSections.filter((m) => m.name !== "sin argumento");

// ── UN TEST POR TRIGGER ───────────────────────────────────────────────────
if (namedModes.length === 0) {
  record("ERROR", "T-0", "no se detectó ningún modo con sección `### M<n> · \\`<modo>\\``; el cerebro dejó de ser un despachador o cambió su formato.");
}

for (const mode of namedModes) {
  const T = `trigger:${mode.name}`;

  // T-b · el modo es descubrible: debe estar en description Y en argument-hint.
  // Un modo que existe pero no se anuncia es un modo que nadie va a invocar.
  if (!description.includes(mode.name))
    record("ERROR", T, `el modo \`${mode.name}\` tiene sección pero NO aparece en el \`description\` → nadie lo va a descubrir.`);
  if (!argHint.includes(mode.name))
    record("ERROR", T, `el modo \`${mode.name}\` no aparece en \`argument-hint\` → no se ofrece al invocar.`);

  // T-c · el modo declara una cadena, no prosa suelta.
  const skillRefs = [...mode.body.matchAll(/\*\*`(\/?[a-z][a-z0-9-]*)`\*\*/g)].map((m) => m[1]);
  if (skillRefs.length === 0)
    record("ERROR", T, `el modo \`${mode.name}\` no nombra ningún skill → es ejecución disfrazada de orquestación.`);

  // T-d · EL TEST FUERTE: cada skill de la cadena existe.
  for (const ref of new Set(skillRefs)) {
    if (!skillExists(ref))
      record("ERROR", T, `el modo \`${mode.name}\` delega en \`${ref}\`, que NO existe (ni comando del repo, ni skill de usuario, ni built-in declarado).`);
  }

  // T-f · TODO modo cierra el loop. Antes esto variaba por modo —solo 1 de 5
  // tenía `/learn`, 2 tenían `/blindar`, `mejoras-ux` ninguno— y un modo que
  // no cierra deja el aprendizaje dentro de la sesión, que se acaba.
  for (const must of ["/blindar", "/learn", "/retro"]) {
    if (!mode.body.includes(must))
      record("ERROR", T, `el modo \`${mode.name}\` no cierra con \`${must}\` → el trabajo se hace y el aprendizaje se pierde.`);
  }

  // T-e · delegación real: al menos un skill del loop o de librería, no solo sondas.
  if (skillRefs.length > 0 && skillRefs.every((r) => !skillExists(r)))
    record("ERROR", T, `el modo \`${mode.name}\` no tiene ninguna delegación resoluble.`);
}

// ── TRANSVERSALES ─────────────────────────────────────────────────────────

// X1 · la tabla de modos y las secciones no divergen.
const modeTable = parseModeTable(src);
if (modeTable) {
  // Se compara contra TODAS las secciones, incluida M0 (`sin argumento`): el
  // modo diagnóstico también puede quedar huérfano.
  const rows = modeTable.rows.map((r) => r.name);
  for (const r of rows)
    if (!modeSections.some((m) => m.name === r))
      record("ERROR", "X1", `\`${r}\` está en la tabla de modos pero no tiene sección \`### M<n>\`.`);
  for (const m of modeSections)
    if (!rows.includes(m.name))
      record("ERROR", "X1", `el modo \`${m.name}\` tiene sección pero falta en la tabla de modos.`);
} else {
  record("WARN", "X1", "no se pudo parsear la tabla de modos — cambió el formato del encabezado.");
}

// X5 · la tabla resumen y la sección del modo no pueden anunciar cadenas
// distintas. La tabla es lo que se lee de un vistazo; si promete un skill que
// la sección no usa (o al revés), el lector se orienta con información falsa.
if (modeTable) {
  for (const { name, raw: row } of modeTable.rows) {
    const mode = namedModes.find((m) => m.name === name);
    if (!mode) continue;
    const inRow = new Set([...row.matchAll(/`(\/?[a-z][a-z0-9-]*)`/g)].map((m) => m[1]).filter((r) => r !== name && skillExists(r)));
    const inBody = new Set([...mode.body.matchAll(/`(\/?[a-z][a-z0-9-]*)`/g)].map((m) => m[1]));
    for (const sk of inRow)
      if (!inBody.has(sk))
        record("ERROR", "X5", `el modo \`${name}\`: la tabla resumen anuncia \`${sk}\` pero la sección no lo usa → el resumen miente.`);
  }
}

// X2 · referencias internas colgando. Al renombrar secciones en V7 quedaron
// varias `§N` apuntando a nada; el invariante 3 citaba una §5 inexistente.
for (const f of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"))) {
  const body = fs.readFileSync(path.join(commandsDir, f), "utf-8");
  const secs = new Set([...body.matchAll(/^#{2,3} .*?§?(\d)/gm)].map((m) => m[1]));
  const refs = [...body.matchAll(/§(\d)/g)].map((m) => m[1]);
  for (const r of new Set(refs))
    if (!secs.has(r))
      record("ERROR", "X2", `${f}: referencia a §${r} y no existe una sección con ese número.`);
}

// X3 · todo skill nombrado en CUALQUIER comando del repo existe.
for (const f of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"))) {
  const body = fs.readFileSync(path.join(commandsDir, f), "utf-8");
  for (const m of new Set([...body.matchAll(/\*\*`(\/[a-z][a-z0-9-]*)`\*\*/g)].map((x) => x[1]))) {
    if (!skillExists(m))
      record("ERROR", "X3", `${f}: nombra \`${m}\`, que no existe.`);
  }
}

// X4 · todo skill DEL LOOP nombrado en cerebro.md está en la tabla de
// delegación obligatoria. Si aparece en una cadena pero no en la tabla, la
// obligación no lo cubre y vuelve a ser opcional de facto.
const delegTable = src.match(/## Skills del loop — DELEGACIÓN OBLIGATORIA[\s\S]*?\n\n(\|[\s\S]*?)\n\n/);
const delegated = new Set(
  delegTable ? [...delegTable[1].matchAll(/`(\/[a-z-]+|skill-creator)`/g)].map((m) => m[1].replace(/^\//, "")) : [],
);
const loopSkills = [...repoCommands].filter((c) => c !== "cerebro");
for (const s of loopSkills) {
  if (new RegExp(`\`/${s}\``).test(src) && !delegated.has(s))
    record("ERROR", "X4", `\`/${s}\` se nombra en cerebro.md pero NO está en la tabla de delegación obligatoria → sigue siendo opcional de facto.`);
}

// X6 · presupuesto de contexto. El skill se carga ENTERO cada vez que
// dispara, así que cada línea se paga en todas las corridas. La disciplina es
// progressive disclosure: la instrucción vive aquí, la arqueología en
// `docs/cerebro-historia.md`. El techo existe para que el archivo no vuelva a
// engordar con relato — cuando se roce, se extrae, no se sube el número.
// Unidad: CARACTERES (`src.length`), no bytes. Con acentos y guiones largos
// `wc -c` da ~2,5% más y confunde al comparar a ojo contra este número.
const BUDGET = 23000;
if (src.length > BUDGET)
  record("ERROR", "X6", `cerebro.md pesa ${src.length} chars (~${Math.round(src.length / 4)} tokens) y el techo es ${BUDGET}. Mueve narrativa a docs/cerebro-historia.md — NO subas el techo.`);
else if (src.length > BUDGET * 0.95)
  record("WARN", "X6", `cerebro.md en ${src.length}/${BUDGET} chars — rozando el techo de contexto.`);

// X7 · el CIERRE OBLIGATORIO existe y declara sus tres salidas. Es lo que
// convierte una corrida en aprendizaje del loop en vez de en un PR suelto: sin
// log no hay métrica de sí mismo, sin automejora el modo no evoluciona, sin
// skill scan el inventario no crece.
const cierre = parseCierre(src);
if (!cierre) {
  record("ERROR", "X7", "cerebro.md no tiene sección `### CIERRE OBLIGATORIO` → las corridas no dejan rastro obligatorio.");
} else {
  for (const [tag, re] of [
    ["LOG", /\*\*1 · LOG\*\*/],
    ["AUTOMEJORA", /\*\*2 · AUTOMEJORA\*\*/],
    ["SKILL SCAN", /\*\*3 · SKILL SCAN\*\*/],
  ]) {
    if (!re.test(cierre.body))
      record("ERROR", "X7", `el CIERRE OBLIGATORIO no declara la salida **${tag}** → esa obligación se pierde.`);
  }
}

// X8 · el log de corridas existe, parsea y cumple SU PROPIO contrato. Los
// campos NO se hardcodean aquí: se extraen del bullet LOG de cerebro.md, para
// que doc y sonda no puedan divergir — si mañana se añade un campo al skill, la
// sonda lo exige sola. (Si se hardcodearan, la sonda quedaría verde sobre un
// contrato que ya cambió, que es exactamente el falso verde que este repo
// persigue.)
const requiredFields = requiredLogFields(src);

if (!fs.existsSync(runsPath)) {
  record("ERROR", "X8", "falta `docs/cerebro-runs.jsonl` → el cerebro exige log de corridas y no hay dónde escribirlo.");
} else if (requiredFields.length < 8) {
  record("WARN", "X8", `solo se extrajeron ${requiredFields.length} campos obligatorios del bullet LOG — cambió su formato y la sonda casi no está exigiendo nada.`);
} else {
  const lines = fs.readFileSync(runsPath, "utf-8").split("\n").filter((l) => l.trim());
  if (lines.length === 0)
    record("WARN", "X8", "`docs/cerebro-runs.jsonl` está vacío — ninguna corrida ha dejado rastro todavía.");
  lines.forEach((line, i) => {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      record("ERROR", "X8", `línea ${i + 1} de cerebro-runs.jsonl no es JSON válido.`);
      return;
    }
    const missing = requiredFields.filter((f) => !(f in entry));
    if (missing.length)
      record("ERROR", "X8", `corrida ${entry.fecha ?? `línea ${i + 1}`} (${entry.modo ?? "?"}): faltan campos obligatorios: ${missing.join(", ")}.`);
    // La tasa candidatos→verificados es la métrica del loop; si no cuadra, no
    // mide nada. Un descarte no registrado es un candidato que se evapora.
    const { candidatos: c, verificados: v, descartados: d } = entry;
    if ([c, v, d].every((n) => typeof n === "number") && c !== v + d)
      record("ERROR", "X8", `corrida ${entry.fecha}: candidatos=${c} ≠ verificados(${v}) + descartados(${d}) → la tasa del loop no cuadra.`);
  });
}

// X9 · el panel de control consume el contrato compartido, no uno propio.
// `tools/cerebro-panel` ofrece botones por modo; si parseara `cerebro.md` por su
// cuenta acabaría ofreciendo modos que esta sonda no conoce (o al revés) y nadie
// se enteraría — la misma divergencia doc↔sonda que X8 existe para impedir.
const panelPath = path.join(repoRoot, "tools", "cerebro-panel", "server.mjs");
if (fs.existsSync(panelPath)) {
  const panel = fs.readFileSync(panelPath, "utf-8");
  if (!/from\s+["'].*lib\/cerebro-contract\.mjs["']/.test(panel))
    record("ERROR", "X9", "el panel no importa `lib/cerebro-contract.mjs` → está leyendo el contrato por su cuenta.");
  if (/### M\(\?:?\\d\)|### M\(\\d\)/.test(panel))
    record("ERROR", "X9", "el panel tiene su propio regex de secciones `### M<n>` → segundo parser, segundo contrato.");
}

// ── control negativo ──────────────────────────────────────────────────────
if (process.argv.includes("--negative-control")) {
  const before = findings.length;
  if (skillExists("/skill-que-no-existe"))
    record("ERROR", "NC", "skillExists devuelve true para un skill inventado — la sonda no discrimina.");
  if (!skillExists("/nuevo-caso"))
    record("ERROR", "NC", "skillExists devuelve false para /nuevo-caso, que sí existe — la sonda da falsos positivos.");
  // El parser es la parte que falló en la primera versión, así que también se
  // controla: si los cuerpos salen vacíos la sonda «no ve» nada y todo pasa.
  const totalRefs = modeSections.reduce(
    (a, m) => a + [...m.body.matchAll(/\*\*`(\/?[a-z][a-z0-9-]*)`\*\*/g)].length, 0);
  if (totalRefs < namedModes.length)
    record("ERROR", "NC", `el parser extrajo ${totalRefs} referencias a skills en ${modeSections.length} modos — sospechosamente pocas: probablemente los cuerpos salen vacíos y la sonda no está midiendo nada.`);
  // Mismo modo de fallo para X8: si la extracción de campos sale vacía, cada
  // entrada del log pasa trivialmente y el contrato queda sin exigir.
  for (const must of ["candidatos", "verificados", "descartados", "automejora", "skill_scan"])
    if (!requiredFields.includes(must))
      record("ERROR", "NC", `X8 no extrajo el campo \`${must}\` del bullet LOG — está exigiendo un contrato incompleto.`);
  // Y que sí detecte una entrada incompleta (control positivo del detector).
  if (requiredFields.filter((f) => !(f in { fecha: 1 })).length === 0)
    record("ERROR", "NC", "X8 considera completa una entrada con un solo campo — el detector de faltantes no discrimina.");
  console.log(
    findings.length === before
      ? "  control negativo: ✅ la sonda distingue skills reales de inventados"
      : "  control negativo: ❌ la sonda NO discrimina",
  );
}

// ── reporte ───────────────────────────────────────────────────────────────
const errors = findings.filter((f) => f.level === "ERROR");
const warns = findings.filter((f) => f.level === "WARN");

console.log("═".repeat(67));
console.log(" Skills del loop · auditoría de contrato");
console.log("═".repeat(67));
console.log(`  comandos del repo: ${repoCommands.size}   skills de usuario: ${userSkills.size}`);
console.log(`  modos del cerebro: ${namedModes.length}  (${namedModes.map((m) => m.name).join(", ")})`);
console.log(`\n  ERRORS: ${errors.length}    WARNS: ${warns.length}\n`);
for (const f of [...errors, ...warns])
  console.log(`  ${f.level === "ERROR" ? "🔴" : "🟡"} [${f.test}] ${f.msg}`);
if (errors.length === 0 && warns.length === 0) console.log("  ✅ contrato íntegro.");
console.log("═".repeat(67));

process.exit(errors.length > 0 ? 1 : 0);
