#!/usr/bin/env node
/**
 * audit-skills.mjs — sonda de los skills del repositorio (`.claude/commands/`).
 *
 * Las sondas de prebuild vigilan el corpus; esta mira `.claude/`. Comprueba una
 * sola cosa (X3): que todo skill nombrado como `/nombre` en un comando del repo
 * exista, sea comando del repo, skill de usuario o skill integrado. Un comando
 * que remite a un skill inexistente falla al usarlo, no al leerlo. Las rutas del
 * sitio se escriben igual (`/cobertura`), así que se descartan las que existen
 * en `web/app/`, y `EXTERNAL_REFS` lista las citas a comandos ajenos.
 *
 * Hasta el 17 nov 2026 también vigilaba el contrato del orquestador `/cerebro`
 * (modos, cierre, log de corridas, panel y flujo de GitHub, reglas X1–X10). Se
 * retiró con el orquestador por decisión del dueño: tres corridas en cuatro
 * meses, y el trabajo real se hacía con los skills sueltos.
 *
 * Node plano, sin dependencias, para que corra sin `node_modules`.
 *
 * Uso:  node web/scripts/audit-skills.mjs
 *       node web/scripts/audit-skills.mjs --negative-control   (valida la sonda)
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const commandsDir = path.join(repoRoot, ".claude", "commands");

// Skills integrados del harness que un comando puede nombrar sin que exista un
// archivo en el repo.
const BUILTIN_SKILLS = new Set([
  "run", "init", "review", "security-review", "simplify", "loop",
  "dataviz", "artifact-design", "artifact-capabilities",
  "update-config", "keybindings-help", "fewer-permission-prompts",
  "claude-api", "session-start-hook", "skill-creator", "webapp-testing",
]);

// Comandos de otros que los comandos citan como referencia, no como skill.
const EXTERNAL_REFS = new Set(["techdebt"]);
const appRoutes = new Set(
  fs.readdirSync(path.join(repoRoot, "web", "app"), { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name),
);

const repoCommands = new Set(
  fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)),
);
const userSkillsDir = path.join(os.homedir(), ".claude", "skills");
const userSkills = new Set(
  fs.existsSync(userSkillsDir)
    ? fs.readdirSync(userSkillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    : [],
);
const skillExists = (name) => {
  const clean = name.replace(/^\//, "");
  return repoCommands.has(clean) || userSkills.has(clean) || BUILTIN_SKILLS.has(clean);
};

const findings = [];
const record = (level, test, msg) => findings.push({ level, test, msg });

// X3 · todo skill nombrado en CUALQUIER comando del repo existe.
let refs = 0;
for (const f of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"))) {
  const body = fs.readFileSync(path.join(commandsDir, f), "utf-8");
  for (const m of new Set([...body.matchAll(/`(\/[a-z][a-z0-9-]*)`/g)].map((x) => x[1]))) {
    const name = m.slice(1);
    if (appRoutes.has(name) || EXTERNAL_REFS.has(name)) continue;
    refs++;
    if (!skillExists(m)) record("ERROR", "X3", `${f}: nombra \`${m}\`, que no existe.`);
  }
}

// ── control negativo ──────────────────────────────────────────────────────
if (process.argv.includes("--negative-control")) {
  const before = findings.length;
  if (skillExists("/skill-que-no-existe"))
    record("ERROR", "NC", "skillExists devuelve true para un skill inventado: la sonda no discrimina.");
  if (!skillExists("/nuevo-caso"))
    record("ERROR", "NC", "skillExists devuelve false para /nuevo-caso, que sí existe: la sonda da falsos positivos.");
  // Si el patrón deja de casar, la sonda no ve ninguna referencia y todo pasa.
  if (refs === 0)
    record("ERROR", "NC", "no se encontró ninguna referencia `/skill` en los comandos: el patrón dejó de casar y la sonda no mide nada.");
  console.log(
    findings.length === before
      ? "  control negativo: ✅ la sonda distingue skills reales de inventados"
      : "  control negativo: ❌ la sonda NO discrimina",
  );
}

// ── reporte ───────────────────────────────────────────────────────────────
const errors = findings.filter((f) => f.level === "ERROR");
console.log("═".repeat(67));
console.log(" Skills del repositorio · referencias entre comandos");
console.log("═".repeat(67));
console.log(`  comandos del repo: ${repoCommands.size}   skills de usuario: ${userSkills.size}   referencias: ${refs}`);
console.log(`\n  ERRORS: ${errors.length}    WARNS: 0\n`);
for (const f of errors) console.log(`  🔴 [${f.test}] ${f.msg}`);
if (errors.length === 0) console.log("  ✅ todas las referencias apuntan a skills que existen.");
console.log("═".repeat(67));

process.exit(errors.length > 0 ? 1 : 0);
