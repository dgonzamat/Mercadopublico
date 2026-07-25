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
 * Node plano, sin dependencias — igual que el resto de sondas del repo, para
 * que corra en una sesión remota sin `node_modules`.
 *
 * Uso:  node web/scripts/audit-skills.mjs
 *       node web/scripts/audit-skills.mjs --negative-control   (valida la sonda)
 */

import fs from "fs";
import path from "path";
import os from "os";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const commandsDir = path.join(repoRoot, ".claude", "commands");
const cerebroPath = path.join(commandsDir, "cerebro.md");

/**
 * Skills built-in del harness: no viven en disco, así que no se pueden
 * enumerar. La lista se declara aquí a propósito — si un built-in se renombra
 * o desaparece, el test T-d lo reporta como skill inexistente en vez de fallar
 * silenciosamente en ejecución. Mantenerla es el precio de poder verificarla.
 */
const BUILTIN_SKILLS = new Set([
  "run", "init", "review", "security-review", "simplify", "loop",
  "dataviz", "artifact-design", "artifact-capabilities",
  "update-config", "keybindings-help", "fewer-permission-prompts",
  "claude-api", "session-start-hook", "skill-creator", "webapp-testing",
]);

const findings = [];
const record = (level, test, msg) => findings.push({ level, test, msg });

// ── inventario de skills disponibles ──────────────────────────────────────
const repoCommands = new Set(
  fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)),
);
const userSkillsDir = path.join(os.homedir(), ".claude", "skills");
const userSkills = new Set(
  fs.existsSync(userSkillsDir)
    ? fs.readdirSync(userSkillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory()).map((d) => d.name)
    : [],
);
const skillExists = (name) => {
  const clean = name.replace(/^\//, "");
  return repoCommands.has(clean) || userSkills.has(clean) || BUILTIN_SKILLS.has(clean);
};

const src = fs.readFileSync(cerebroPath, "utf-8");
const fm = src.match(/^---\n([\s\S]*?)\n---/);
const description = (fm?.[1].match(/^description:\s*([\s\S]*?)(?=\nargument-hint:|$)/m)?.[1] ?? "").trim();
const argHint = (fm?.[1].match(/^argument-hint:\s*(.*)$/m)?.[1] ?? "").trim();

// Modos declarados como sección: "### M1 · `caso-nuevo` — ...".
// El cuerpo se corta por índices, NO con un lookahead a `$`: con la flag /m
// `$` casa el fin de CADA línea, así que un `[\s\S]*?` perezoso se detiene en
// la primera y todos los cuerpos salen vacíos. Eso hizo que la sonda reportara
// «ningún modo nombra skills» sobre un archivo donde todos lo hacen — siete
// errores falsos en su primera corrida.
const headingRe = /^### M(\d) · (?:`([a-z-]+)`|sin argumento)[^\n]*$/gm;
const heads = [...src.matchAll(headingRe)].map((m) => ({
  n: m[1],
  name: m[2] ?? "sin argumento",
  start: m.index + m[0].length,
}));
const nextSection = (from) => {
  const m = /^#{2,3} /gm;
  m.lastIndex = from;
  const hit = m.exec(src);
  return hit ? hit.index : src.length;
};
const modeSections = heads.map((h) => ({ ...h, body: src.slice(h.start, nextSection(h.start)) }));

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
const modeTable = src.match(/\| Modo \| Para qué \| Cadena de skills \|\n\|[-| ]+\|\n([\s\S]*?)\n\n/);
if (modeTable) {
  const rows = [...modeTable[1].matchAll(/^\| `?([a-z-]+)`?[^|]*\|/gm)].map((m) => m[1]);
  for (const r of rows)
    if (!namedModes.some((m) => m.name === r))
      record("ERROR", "X1", `\`${r}\` está en la tabla de modos pero no tiene sección \`### M<n>\`.`);
  for (const m of namedModes)
    if (!rows.includes(m.name))
      record("ERROR", "X1", `el modo \`${m.name}\` tiene sección pero falta en la tabla de modos.`);
} else {
  record("WARN", "X1", "no se pudo parsear la tabla de modos — cambió el formato del encabezado.");
}

// X5 · la tabla resumen y la sección del modo no pueden anunciar cadenas
// distintas. La tabla es lo que se lee de un vistazo; si promete un skill que
// la sección no usa (o al revés), el lector se orienta con información falsa.
if (modeTable) {
  for (const row of modeTable[1].split("\n")) {
    const name = row.match(/^\| `?([a-z-]+)`?/)?.[1];
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
const BUDGET = 23000;
if (src.length > BUDGET)
  record("ERROR", "X6", `cerebro.md pesa ${src.length} chars (~${Math.round(src.length / 4)} tokens) y el techo es ${BUDGET}. Mueve narrativa a docs/cerebro-historia.md — NO subas el techo.`);
else if (src.length > BUDGET * 0.95)
  record("WARN", "X6", `cerebro.md en ${src.length}/${BUDGET} chars — rozando el techo de contexto.`);

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
