/**
 * cerebro-contract.mjs — lectura única del contrato del cerebro.
 *
 * `cerebro.md` es la fuente de verdad de qué modos existen, qué cadena declara
 * cada uno y qué campos exige el log de corridas. DOS consumidores lo leen:
 * la sonda `audit-skills.mjs` (que lo verifica) y el panel de control
 * (`tools/cerebro-panel`, que lo muestra y lo dispara).
 *
 * Viven aquí y no duplicados porque un segundo parser es un segundo contrato:
 * el panel ofrecería un modo que la sonda no conoce, o exigiría campos que el
 * skill ya no pide, y nadie se enteraría. Es la misma razón por la que X8
 * EXTRAE los campos del doc en vez de hardcodearlos — hacerlo bien en la sonda
 * y mal en el panel no habría arreglado nada.
 *
 * Node plano, sin dependencias.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
export const commandsDir = path.join(repoRoot, ".claude", "commands");
export const cerebroPath = path.join(commandsDir, "cerebro.md");
export const runsPath = path.join(repoRoot, "docs", "cerebro-runs.jsonl");

/**
 * Skills built-in del harness: no viven en disco, así que no se pueden
 * enumerar. La lista se declara a propósito — si un built-in se renombra o
 * desaparece, se reporta como skill inexistente en vez de fallar silenciosamente
 * en ejecución. Mantenerla es el precio de poder verificarla.
 */
export const BUILTIN_SKILLS = new Set([
  "run", "init", "review", "security-review", "simplify", "loop",
  "dataviz", "artifact-design", "artifact-capabilities",
  "update-config", "keybindings-help", "fewer-permission-prompts",
  "claude-api", "session-start-hook", "skill-creator", "webapp-testing",
]);

export const readCerebro = () => fs.readFileSync(cerebroPath, "utf-8");

export function skillInventory() {
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
  const exists = (name) => {
    const clean = name.replace(/^\//, "");
    return repoCommands.has(clean) || userSkills.has(clean) || BUILTIN_SKILLS.has(clean);
  };
  return { repoCommands, userSkills, exists };
}

export function frontmatter(src) {
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  return {
    description: (fm?.[1].match(/^description:\s*([\s\S]*?)(?=\nargument-hint:|$)/m)?.[1] ?? "").trim(),
    argHint: (fm?.[1].match(/^argument-hint:\s*(.*)$/m)?.[1] ?? "").trim(),
  };
}

/**
 * Modos declarados como sección: "### M1 · `caso-nuevo` — ...".
 *
 * El cuerpo se corta por ÍNDICES, no con un lookahead a `$`: con la flag /m
 * `$` casa el fin de CADA línea, así que un `[\s\S]*?` perezoso se detiene en la
 * primera y todos los cuerpos salen vacíos. Eso hizo que la sonda reportara
 * «ningún modo nombra skills» sobre un archivo donde todos lo hacen — siete
 * errores falsos en su primera corrida.
 */
export function parseModes(src) {
  const headingRe = /^### M(\d) · (?:`([a-z-]+)`|sin argumento)[^\n]*$/gm;
  const heads = [...src.matchAll(headingRe)].map((m) => ({
    n: m[1],
    name: m[2] ?? "sin argumento",
    start: m.index + m[0].length,
  }));
  const nextSection = (from) => {
    const re = /^#{2,3} /gm;
    re.lastIndex = from;
    const hit = re.exec(src);
    return hit ? hit.index : src.length;
  };
  return heads.map((h) => ({ ...h, body: src.slice(h.start, nextSection(h.start)) }));
}

/** La tabla resumen de modos: `| Modo | Para qué | Cadena de skills |`. */
export function parseModeTable(src) {
  const table = src.match(/\| Modo \| Para qué \| Cadena de skills \|\n\|[-| ]+\|\n([\s\S]*?)\n\n/);
  if (!table) return null;
  const rows = table[1].split("\n").map((line) => {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) return null;
    return {
      // El modo diagnóstico se escribe `*(sin argumento)*`; normalizarlo lo
      // vuelve comparable con el nombre que `parseModes` da a su sección M0.
      // El regex anterior (`^\| \`?([a-z-]+)\`?`) simplemente no lo casaba, así
      // que X1 nunca comprobó que esa fila tuviera sección — ceguera, no diseño.
      name: cells[0].replace(/[`*]/g, "").replace(/^\((.*)\)$/, "$1").trim(),
      proposito: cells[1],
      cadena: cells[2],
      raw: line,
    };
  }).filter(Boolean);
  return { rows, raw: table[1] };
}

/** La sección CIERRE OBLIGATORIO y su bullet LOG. */
export function parseCierre(src) {
  const cierre = src.match(/### CIERRE OBLIGATORIO[^\n]*\n([\s\S]*?)(?=\n---|\n## )/);
  if (!cierre) return null;
  const logBullet = cierre[1].match(/\*\*1 · LOG\*\*([\s\S]*?)(?=\n\n)/)?.[1] ?? "";
  return { body: cierre[1], logBullet };
}

/**
 * Campos obligatorios del log, EXTRAÍDOS del bullet LOG — nunca hardcodeados.
 * Si mañana el contrato gana un campo en el doc, sonda y panel lo exigen solos.
 */
export function requiredLogFields(src) {
  const cierre = parseCierre(src);
  if (!cierre) return [];
  return [...new Set(
    [...cierre.logBullet.matchAll(/`([^`]+)`/g)]
      .map((m) => m[1])
      .filter((t) => /^[a-zñ_]+$/.test(t)),
  )];
}

/** Lee el log de corridas. Devuelve entradas parseadas y líneas corruptas. */
export function readRuns() {
  if (!fs.existsSync(runsPath)) return { corridas: [], corruptas: [], existe: false };
  const lines = fs.readFileSync(runsPath, "utf-8").split("\n").filter((l) => l.trim());
  const corridas = [];
  const corruptas = [];
  lines.forEach((line, i) => {
    try {
      corridas.push({ ...JSON.parse(line), _linea: i + 1 });
    } catch {
      corruptas.push(i + 1);
    }
  });
  return { corridas, corruptas, existe: true };
}

/**
 * Métricas del loop sobre sí mismo. La tasa candidatos→verificados es la única
 * honesta que tiene: cuenta cuánto de lo que el cerebro propone sobrevive a la
 * verificación. Una tasa alta con pocos candidatos es un cerebro tímido; una
 * baja con muchos es uno que fabrica trabajo.
 */
export function runMetrics(corridas) {
  const sum = (k) => corridas.reduce((a, c) => a + (typeof c[k] === "number" ? c[k] : 0), 0);
  const candidatos = sum("candidatos");
  const verificados = sum("verificados");
  const porModo = {};
  const skillsInvocados = {};
  let aMano = 0;
  for (const c of corridas) {
    porModo[c.modo] = (porModo[c.modo] ?? 0) + 1;
    for (const s of c.skills_invocados ?? []) skillsInvocados[s] = (skillsInvocados[s] ?? 0) + 1;
    aMano += (c.skills_a_mano ?? []).length;
  }
  return {
    corridas: corridas.length,
    candidatos,
    verificados,
    descartados: sum("descartados"),
    tasa: candidatos > 0 ? verificados / candidatos : null,
    porModo,
    skillsInvocados,
    delegaciones: Object.values(skillsInvocados).reduce((a, b) => a + b, 0),
    aMano,
  };
}
