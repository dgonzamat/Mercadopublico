#!/usr/bin/env node
/**
 * cerebro-panel · servidor del panel de control del cerebro.
 *
 * QUÉ ES: una UI **externa al sitio** (no vive en `web/`, no se despliega a
 * GitHub Pages, no toca `output: export`) para ver el flujo del cerebro,
 * dispararlo, y ver/corregir los defectos que las sondas detectan.
 *
 * POR QUÉ ES UN SERVIDOR Y NO UNA PÁGINA: disparar un trigger es lanzar
 * `claude -p "/cerebro <modo>"`, y eso necesita un proceso. Una página estática
 * —o un artifact— puede mostrar el log, pero no puede correr nada ni leer el
 * repo. El panel corre en TU máquina, junto al CLI que ya usas.
 *
 * NO REIMPLEMENTA NADA:
 *   · el contrato (modos, cadenas, campos del log) sale de
 *     `web/scripts/lib/cerebro-contract.mjs`, el mismo módulo que consume la
 *     sonda `audit-skills.mjs` — panel y sonda no pueden discrepar sobre qué
 *     modos existen;
 *   · la salud sale de las cuatro sondas node-plano del repo, ejecutadas como
 *     subprocesos. El panel las corre y las muestra; no vuelve a auditar.
 *
 * SEGURIDAD (es un panel que ejecuta cosas — léelo):
 *   · escucha SOLO en 127.0.0.1;
 *   · `spawn` sin shell, así que no hay interpolación de comandos;
 *   · el modo se valida contra la lista derivada de `cerebro.md`: no se puede
 *     pedir un modo que el skill no declara;
 *   · el contexto libre se recorta y viaja como argumento, nunca como shell.
 *
 * Node plano, cero dependencias — igual que el resto de scripts del repo.
 *
 * Uso:  node tools/cerebro-panel/server.mjs [--port 4180] [--no-open]
 */

import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import {
  repoRoot, readCerebro, parseModes, parseModeTable,
  readRuns, runMetrics, requiredLogFields,
} from "../../web/scripts/lib/cerebro-contract.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const argOf = (flag, def) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const PORT = Number(argOf("--port", process.env.CEREBRO_PANEL_PORT ?? 4180));

/**
 * Modo de permisos del CLI al disparar. `acceptEdits` es el default porque el
 * panel existe para que el cerebro ARREGLE, no solo mire: con `manual` cada
 * corrida se cuelga esperando una confirmación que nadie va a dar (el panel no
 * es una terminal interactiva). Sube o baja esto a conciencia — está expuesto
 * en la UI a propósito, para que nunca dispares sin saber con qué permisos.
 */
const PERMISSION_MODE = process.env.CEREBRO_PANEL_PERMISSION_MODE ?? "acceptEdits";

/**
 * Token OAuth de SUSCRIPCIÓN para el disparo headless. Sin él, `claude -p` se
 * factura contra créditos de API (Console) y muere con "Credit balance is too
 * low" AUNQUE tengas Max: la suscripción cubre el Claude Code interactivo, no el
 * headless. `claude setup-token` (requires Claude subscription) genera un token
 * ligado a tu plan que SÍ cubre headless. Se busca en el entorno o en un archivo
 * local gitignoreado — nunca se loguea ni se expone por la API.
 */
const TOKEN_FILE = path.join(here, ".claude-oauth-token");
function subscriptionToken() {
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN?.trim()) return process.env.CLAUDE_CODE_OAUTH_TOKEN.trim();
  try { const t = fs.readFileSync(TOKEN_FILE, "utf8").trim(); if (t) return t; } catch { /* sin archivo */ }
  return null;
}

/**
 * Entorno para el `claude` headless. (1) Quita cualquier API key, que forzaría
 * facturación por créditos. (2) Limpia el estado de la sesión padre si el panel
 * se lanzó dentro de otro Claude Code (CLAUDECODE, scopes, ids de sesión), que
 * confunde a un `claude` anidado. (3) Si hay token de suscripción, lo inyecta
 * para que la corrida corra bajo tu plan Max.
 */
function envDisparo() {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  for (const k of ["CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT", "CLAUDE_CODE_SESSION_ID",
    "CLAUDE_CODE_HOST_SESSION_ID", "CLAUDE_CODE_CHILD_SESSION", "CLAUDE_CODE_OAUTH_SCOPES",
    "CLAUDE_CODE_SDK_HAS_OAUTH_REFRESH", "CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH", "CLAUDE_PID"])
    delete env[k];
  const tok = subscriptionToken();
  if (tok) env.CLAUDE_CODE_OAUTH_TOKEN = tok;
  return env;
}

// ── sondas del repo · se ejecutan, no se reimplementan ────────────────────
const SONDAS = [
  { id: "schema", label: "Schema", args: ["scripts/validate-schema.mjs"],
    que: "estructura de casos y actores" },
  { id: "consistencia", label: "Consistencia", args: ["scripts/audit-consistency.mjs"],
    que: "drift editorial, MECE, hreflang, metadata, fuentes" },
  { id: "diseno", label: "Diseño", args: ["scripts/audit-design.mjs"],
    que: "contraste AA, color de tier, touch targets" },
  { id: "skills", label: "Contrato de skills", args: ["scripts/audit-skills.mjs", "--negative-control"],
    que: "los modos del cerebro existen, se anuncian y delegan en skills reales" },
];

// ── estado en memoria ─────────────────────────────────────────────────────
const jobs = new Map();
let seq = 0;

const contrato = () => {
  const src = readCerebro();
  const secciones = parseModes(src);
  const tabla = parseModeTable(src);
  const modos = secciones.map((s) => {
    const fila = tabla?.rows.find((r) => r.name === s.name);
    return {
      n: s.n,
      name: s.name,
      // M0 se declara `sin argumento`: se dispara sin pasar modo.
      arg: s.name === "sin argumento" ? "" : s.name,
      proposito: fila?.proposito ?? "",
      cadena: fila?.cadena ?? "",
    };
  });
  return { modos, camposLog: requiredLogFields(src) };
};

/**
 * Extrae hallazgos de la salida de una sonda. Hay DOS formatos en el repo:
 *   · inline  — `  🔴 [X7] mensaje`            (audit-skills)
 *   · bloque  — `  🟡 WARNINGS (review):` y luego líneas indentadas
 *               (audit-consistency)
 *
 * La primera versión de este parser solo entendía el inline, así que reportó
 * «0 warns» sobre un `audit-consistency` que declaraba `WARNS: 1` — verde y
 * ciego, el falso verde exacto que este repo persigue. De ahí la reconciliación
 * de abajo: la sonda declara sus totales y el panel los contrasta con lo que
 * logró extraer. Si no cuadran, el panel lo dice en vez de callarse.
 */
function extraerHallazgos(out) {
  const errores = [], warns = [];
  let bloque = null;
  const limpio = (l) => l.trim().replace(/^(?:🔴|🟡)\s*/u, "");
  for (const l of out.split("\n")) {
    if (/🔴\s*ERRORS?\b/iu.test(l)) { bloque = errores; continue; }
    if (/🟡\s*(?:WARNINGS?|WARNS?)\b/iu.test(l)) { bloque = warns; continue; }
    if (l.includes("🔴")) { errores.push(limpio(l)); bloque = null; continue; }
    if (l.includes("🟡")) { warns.push(limpio(l)); bloque = null; continue; }
    if (bloque) {
      if (/^\s{3,}\S/.test(l)) bloque.push(limpio(l));
      else if (!l.trim()) bloque = null;
    }
  }
  // Contadores que la propia sonda imprime — la fuente autoritativa.
  const num = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const decE = num(/ERRORS?:\s*(\d+)/), decW = num(/WARNS?:\s*(\d+)/);
  const desync = [];
  if (decE !== null && decE !== errores.length)
    desync.push(`la sonda declara ${decE} error(es) y el panel extrajo ${errores.length}`);
  if (decW !== null && decW !== warns.length)
    desync.push(`la sonda declara ${decW} warn(s) y el panel extrajo ${warns.length}`);
  return { errores, warns, decE, decW, desync };
}

/** Corre una sonda y devuelve sus hallazgos. */
function correrSonda(sonda) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, sonda.args, {
      cwd: path.join(repoRoot, "web"),
      env: { ...process.env, NO_COLOR: "1" },
    });
    // setEncoding usa StringDecoder, que retiene secuencias UTF-8 partidas
    // entre chunks. Sin esto un emoji a caballo entre dos `data` sale como `�`.
    let out = "";
    p.stdout.setEncoding("utf8");
    p.stderr.setEncoding("utf8");
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("error", (e) =>
      resolve({ ...sonda, estado: "roto", exit: null, errores: [], warns: [],
                salida: `no se pudo ejecutar: ${e.message}` }));
    p.on("close", (code) => {
      const { errores, warns, decE, decW, desync } = extraerHallazgos(out);
      // El estado NO se decide por lo que el panel logró extraer, sino por el
      // exit code y por los totales que la sonda declara. Así un parser que se
      // quede corto degrada a «hay warns que no supe leer», nunca a «todo ok».
      const hayWarn = (decW ?? warns.length) > 0;
      resolve({
        id: sonda.id, label: sonda.label, que: sonda.que,
        estado: code === 0 ? (hayWarn ? "warn" : "ok") : "error",
        exit: code, errores, warns, desync, salida: out.trimEnd(),
      });
    });
  });
}

/**
 * Traduce una línea NDJSON de `--output-format stream-json` a un evento del
 * panel. Lo que importa para el flowchart son los `tool_use`: cada invocación
 * de skill, cada sonda corrida, cada búsqueda. De ahí sale el movimiento —
 * sin esto el panel solo tendría texto y no sabría POR DÓNDE va la corrida.
 */
function eventoDeLinea(linea, job) {
  let e;
  try { e = JSON.parse(linea); } catch { return; }

  if (e.type === "assistant") {
    for (const b of e.message?.content ?? []) {
      if (b.type === "text" && b.text?.trim()) job.salida += b.text;
      if (b.type === "tool_use") {
        // `detalle` es lo que el cliente matchea contra los nodos: nombre de la
        // herramienta + su input aplanado (el skill invocado, el script corrido).
        const input = JSON.stringify(b.input ?? {});
        // Rastrear archivos ESCRITOS para el checkpoint de commit — solo estos.
        const fp = b.input?.file_path || b.input?.notebook_path;
        if (fp && /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(b.name)) job.archivos.add(fp);
        job.eventos.push({
          t: new Date().toISOString(),
          tool: b.name,
          detalle: `${b.name} ${input}`.slice(0, 400),
        });
      }
    }
  }
  // Una corrida puede terminar en verde SIN haber hecho nada, porque se quedó
  // pidiendo una aprobación que en el panel nadie va a dar (no es una terminal
  // interactiva). Sin esta detección el job aparece «listo» y el flowchart
  // apenas encendido, y no se entiende por qué. Pasó en el primer disparo con
  // permisos reales: el workspace no estaba confiado, así que las 21 entradas
  // de `.claude/settings.json` se ignoraron y el gate murió en el primer Bash.
  const BLOQUEOS = [
    [/has not been trusted/i, "El workspace no está confiado, así que el allowlist de `.claude/settings.json` se ignora. Corre Claude Code interactivamente una vez en el repo y acepta el diálogo de confianza."],
    [/necesita aprobación|needs? (your )?(permission|approval)|requires approval/i, "La corrida se quedó esperando una aprobación que el panel no puede dar. Amplía el allowlist del repo o usa un `--permission-mode` que no pregunte."],
    [/credit balance is too low/i, "El disparo headless se está facturando contra créditos de API, no contra tu plan Max. Genera un token de suscripción con `claude setup-token` y guárdalo en `tools/cerebro-panel/.claude-oauth-token` (o lanza el panel con CLAUDE_CODE_OAUTH_TOKEN=<token>)."],
  ];
  for (const [re, msg] of BLOQUEOS)
    if (!job.bloqueo && re.test(job.salida)) job.bloqueo = msg;

  if (e.type === "result") {
    job.resultado = {
      subtype: e.subtype, duracion_ms: e.duration_ms,
      coste_usd: e.total_cost_usd, turnos: e.num_turns,
    };
    if (e.result && !job.salida.includes(e.result)) job.salida += "\n" + e.result;
  }
}

/** Busca un ejecutable en el PATH, respetando PATHEXT en Windows. */
function which(cmd) {
  const exts = process.platform === "win32"
    ? (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";")
    : [""];
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    for (const ext of exts) {
      const full = path.join(dir, cmd + ext);
      try { if (fs.statSync(full).isFile()) return full; } catch { /* siguiente */ }
    }
  }
  return null;
}

/**
 * Cómo lanzar `claude` SIN shell. En POSIX `claude` en el PATH es un binario o
 * un script con shebang que `spawn` ejecuta directo. En Windows `claude` es un
 * shim `.cmd`/`.ps1` de npm que Node NO puede spawnear sin `shell:true`; y meter
 * un shell reintroduciría justo la inyección de comandos que este panel evita a
 * propósito (el prompt es texto libre). Así que resolvemos el `cli.js` real y lo
 * lanzamos con `node` — es EXACTAMENTE lo que hace el propio shim por dentro
 * (`node <dir>\node_modules\@anthropic-ai\claude-code\cli.js %*`). Igual que las
 * sondas, que ya lanzan `process.execPath`. Cero shell, cross-platform.
 */
function resolveClaude() {
  if (process.platform !== "win32") return { file: "claude", pre: [] };
  const shim = which("claude");
  if (shim) {
    const cli = path.join(path.dirname(shim), "node_modules",
      "@anthropic-ai", "claude-code", "cli.js");
    if (fs.existsSync(cli)) return { file: process.execPath, pre: [cli] };
  }
  // Sin resolución: degradamos al spawn directo (fallará con ENOENT si era un
  // shim, como antes) — NUNCA a shell:true, que reintroduciría inyección.
  return { file: "claude", pre: [] };
}

// ── git (sin shell) para el checkpoint de commit ──────────────────────────
let _gitBin = null;
const gitBin = () => (_gitBin ??= which("git") || "git");
/** Corre git en el repo y devuelve {code, out, err}. Sin shell → sin inyección. */
function git(args) {
  return new Promise((resolve) => {
    const p = spawn(gitBin(), args, { cwd: repoRoot, env: process.env });
    let out = "", err = "";
    p.stdout.setEncoding("utf8"); p.stderr.setEncoding("utf8");
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => resolve({ code: -1, out, err: String(e.message) }));
    p.on("close", (code) => resolve({ code, out: out.trimEnd(), err: err.trimEnd() }));
  });
}
/** Normaliza rutas a relativas-al-repo y descarta las que se escapan del repo.
 *  Toda operación git del panel se acota a lo que sale de aquí — nunca al árbol. */
function sanear(lista) {
  return (Array.isArray(lista) ? lista : [...(lista ?? [])])
    .map((f) => path.relative(repoRoot, path.resolve(repoRoot, String(f))).replace(/\\/g, "/"))
    .filter((f) => f && !f.startsWith(".."));
}
const archivosDelJob = (job) => sanear([...(job.archivos ?? [])]);

/** Commitea SOLO `archivos` en una rama (nunca directo a main/master). */
async function commitArchivos(archivos, message, etiqueta) {
  const rama = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).out;
  let ramaUsada = rama;
  if (["main", "master"].includes(rama)) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    ramaUsada = `claude/cerebro-${etiqueta || "cambios"}-${ts}`;
    const r = await git(["checkout", "-b", ramaUsada]);
    if (r.code !== 0) return { error: `no se pudo crear la rama: ${r.err}` };
  }
  const add = await git(["add", "--", ...archivos]);
  if (add.code !== 0) return { error: `git add falló: ${add.err}` };
  const msg = (message && String(message).trim()) || `cerebro: ${archivos.length} archivo(s)`;
  const commit = await git(["commit", "-m", msg]);
  if (commit.code !== 0) return { error: `git commit falló: ${commit.err || commit.out}` };
  const hash = (await git(["rev-parse", "--short", "HEAD"])).out;
  return { ok: true, rama: ramaUsada, hash, archivos, salida: commit.out };
}

/** Revierte (versionados) o borra (nuevos) SOLO `archivos`. */
async function descartarArchivos(archivos) {
  const revertidos = [], eliminados = [];
  for (const f of archivos) {
    const st = (await git(["status", "--porcelain", "--", f])).out;
    if (st.startsWith("??")) {
      try { fs.rmSync(path.join(repoRoot, f), { force: true }); eliminados.push(f); } catch { /* ya no existe */ }
    } else if (st) {
      await git(["checkout", "--", f]); revertidos.push(f);
    }
  }
  return { revertidos, eliminados };
}

/**
 * PROMPTS DE DISPARO (lean). En headless `-p` la tool SlashCommand se corta tras
 * el primer slash-command, así que NO usamos `/cerebro <modo>`: cada disparo lleva
 * un prompt corto y enfocado que ordena ejecutar los skills INLINE (leer su
 * `.claude/commands/<skill>.md` y aplicarlo con Bash/Read/Write/WebSearch). Para NO
 * gastar procesamiento no inyectamos todo `cerebro.md` ni corremos la ceremonia
 * (gate pesado, curar-memoria, learn/retro/log) salvo lo esencial de cada modo.
 */

/**
 * Prompt LEAN para `caso-nuevo` — minimiza procesamiento. En vez de inyectar todo
 * `cerebro.md` y correr gate + cierre completos (caros y no esenciales para crear
 * un caso), va directo a las DOS prioridades: (1) analizar/elegir un caso real vía
 * NEWS-SWEEP, (2) su aplicabilidad en el modelo (el posterior MECE). Lee la
 * disciplina viva (`nuevo-caso.md` + un caso plantilla) en vez de hornearla, para
 * no duplicar el contrato. Salta gate/curar-memoria/learn/retro/cierre.
 */
function promptCasoNuevoLean(contexto) {
  const p = [
    `Tarea: crear UN caso nuevo para el corpus UAP Codex (repo actual), en headless y EFICIENTE.`,
    `La tool SlashCommand está deshabilitada; trabaja con Bash/Read/Write/Edit/WebSearch.`,
    `Para AHORRAR procesamiento NO corras: rm -rf out, audit-consistency, audit-design, curar-memoria,`,
    `learn, retro, ni el cierre/log del cerebro. Esto es SOLO crear el caso — sin ceremonia.`,
    ``,
    `## Prioridad 1 — Analizar y elegir el caso (NEWS-SWEEP)`,
    `1. Usa **WebSearch** para hallar 1 evento UAP institucional, real y documentado (audiencia del`,
    `   Congreso, informe AARO/GAO/NASA, desclasificación, acción legal, incidente con fuente oficial),`,
    `   preferentemente reciente (2024-2026) o un hueco claro de cobertura.`,
    `2. Cruza el candidato contra el corpus para NO duplicar: \`grep -ril "<término>" web/data/cases/\`.`,
    `3. Elige el de mayor leverage. Regla dura: **NO inventar.** Si no hay candidato anclable con ≥2`,
    `   fuentes verificables, dilo y TERMINA sin crear nada (resultado honesto, no fracaso).`,
    ``,
    `## Prioridad 2 — Aplicabilidad en el modelo (posterior MECE)`,
    `4. Lee \`.claude/commands/nuevo-caso.md\` (disciplina) y \`web/data/cases/latakia-p8a-2016.json\``,
    `   (plantilla de formato exacto).`,
    `5. num siguiente = \`node -e 'const fs=require("fs");const d="web/data/cases";console.log(Math.max(...fs.readdirSync(d).filter(f=>f.endsWith(".json")).map(f=>JSON.parse(fs.readFileSync(d+"/"+f)).num))+1)'\``,
    `6. Escribe \`web/data/cases/<id>.json\` cumpliendo el schema UAPCase. LO CRÍTICO es el **posterior**`,
    `   MECE: distribución sobre las 6 narrativas (mundano_natural, humana_clasificada, adversaria,`,
    `   nohumano_encubierto, nohumano_abierto, indet) que **suma 1 (±0.005)**, razonada según cómo la`,
    `   evidencia reparte la explicación — ése es el aporte del caso al modelo. Prosa ~550 palabras ES+EN,`,
    `   ≥1 fuente real.`,
    `7. Valida (barato, y atrapa defectos del CASO — no es ceremonia):`,
    `   \`cd web && node scripts/build-cases.mjs && node scripts/validate-schema.mjs && node scripts/audit-consistency.mjs --warn\`.`,
    `   Corrige lo que rompa: schema (posterior≠1, coordenada placeholder) Y las reglas del caso —sobre todo`,
    `   **M2** (si mundano_natural≥0.15, declara \`mundanoType\`: misid|natural|fraude) y **E13** (prosa ES y EN`,
    `   ≥~3.500 chars)—. Revalida hasta que queden limpias.`,
    ``,
    `Al terminar reporta: id, num, tier, categoría, suma del posterior, nº de fuentes y el evento elegido`,
    `(o el descarte honesto si no hubo candidato).`,
  ];
  if (contexto) p.push(``, `## Señal / foco de esta corrida`, contexto);
  return p.join("\n");
}

/**
 * Objetivo + cadena por modo. La tabla de `cerebro.md` no es parseable hoy
 * (parseModeTable devuelve vacío), así que va corta y explícita aquí. Es la base
 * de los prompts lean: misma lógica que caso-nuevo — foco, inline, sin ceremonia.
 */
const CADENAS = {
  bugs: {
    obj: "encontrar defectos técnicos y de UI/UX reales",
    cadena: "revisa el código/diff con criterio; para UI inspecciona el marcado (prueba la app solo si YA está corriendo); security-review sobre la anon key de Supabase y funciones SECURITY DEFINER; /blindar si el defecto abre una clase enforzable",
  },
  "mejoras-ux": {
    obj: "detectar oportunidades de UI/UX (no defectos) de alto leverage",
    cadena: "aplica /innovar sobre UNA fricción concreta observada en el marcado/rutas y propón el cambio con su señal (sin fluff)",
  },
  "mejoras-tec": {
    obj: "mejorar calidad de código: reuso, simplificación, eficiencia",
    cadena: "aplica simplify sobre el código cambiado; /blindar si se abre una clase enforzable",
  },
  frescura: {
    obj: "mantener vivos los casos: desarrollos nuevos sobre casos existentes",
    cadena: "WebSearch de desarrollos recientes sobre casos del corpus → actualiza o propón con la disciplina de fuentes de nuevo-caso.md → /learn",
  },
  "": {
    obj: "diagnóstico: sondear el estado y RECOMENDAR el modo de mayor leverage",
    cadena: "corre las 3 sondas, lee las métricas y propón qué modo conviene y por qué — NO gatilles nada",
  },
};

/** Prompt lean genérico (misma lógica que caso-nuevo) para los demás modos. */
function promptLean(modo, contexto) {
  const spec = CADENAS[modo] ?? CADENAS[""];
  const nombre = modo || "diagnóstico";
  const p = [
    `Ejecuta el modo \`${nombre}\` del cerebro UAP Codex, en headless y EFICIENTE (mínimo procesamiento).`,
    `SlashCommand está deshabilitada: para cualquier skill (/proximo-caso, /nuevo-caso, /innovar, /blindar,`,
    `simplify, security-review, review…) LEE su \`.claude/commands/<skill>.md\` y aplícalo INLINE con`,
    `Bash/Read/Write/Edit/WebSearch. Si un skill necesita un prerequisito que no existe en headless`,
    `(webapp-testing/Playwright sin navegador, app sin node_modules…), sáltalo y decláralo — no lo simules.`,
    ``,
    `## Objetivo`,
    spec.obj + ".",
    `## Cadena (lean)`,
    spec.cadena + ".",
    ``,
    `## Eficiencia (obligatorio)`,
    `- Gate mínimo: corre las 3 sondas node (validate-schema, audit-consistency, audit-design) UNA vez para`,
    `  confirmar err=0; NO corras curar-memoria salvo que el drift SEA el objetivo.`,
    `- Ve directo al objetivo; no releas ni inyectes contexto innecesario.`,
    `- Cierre ligero: reporta hallazgos/cambios concretos, cada uno con su señal. NO ejecutes la ceremonia`,
    `  de log/automejora/skill scan salvo que se pida.`,
    `- Regla de oro: cada hallazgo/cambio cita su señal concreta; NUNCA inventes trabajo ni cifras.`,
  ];
  if (contexto) p.push(``, `## Señal / foco de esta corrida`, contexto);
  return p.join("\n");
}

/** Enruta cada modo a su prompt lean. */
function promptDeModo(modo, contexto) {
  if (modo === "caso-nuevo") return promptCasoNuevoLean(contexto);
  return promptLean(modo, contexto);
}

/** Dispara el modo del cerebro como corrida headless. Devuelve el id del job. */
function dispararCerebro(modo, contexto) {
  const id = `job-${++seq}`;
  const prompt = promptDeModo(modo, contexto);
  // stream-json: permite ver la orquestación MOVERSE. `--verbose` es obligatorio
  // con stream-json en -p. `--disallowedTools SlashCommand`: fuerza ejecución
  // inline de la cadena (ver promptDeModo) en vez del encadenamiento roto.
  // `--allowedTools WebSearch WebFetch`: sin esto, WebSearch queda bloqueada en
  // headless (acceptEdits auto-aprueba ediciones, NO WebSearch) y el NEWS-SWEEP
  // de `/proximo-caso` muere → caso-nuevo nunca crea un caso. Verificado: con el
  // flag, webSearchRequests>0 y sin permission_denials (jul 2026).
  const args = ["-p", prompt, "--permission-mode", PERMISSION_MODE,
                "--allowedTools", "WebSearch", "WebFetch",
                "--disallowedTools", "SlashCommand",
                "--output-format", "stream-json", "--verbose"];
  const job = {
    id, modo, contexto: contexto || null, prompt,
    estado: "corriendo", inicio: new Date().toISOString(), fin: null,
    exit: null, salida: "", eventos: [], resultado: null, bloqueo: null,
    // Corridas registradas ANTES de disparar: al cerrar se compara para saber
    // si esta corrida cumplió el cierre obligatorio (log, automejora, skill scan).
    _corridasAntes: readRuns().corridas.length,
    rastro: null,
    archivos: new Set(),   // rutas que la corrida escribe → base del checkpoint
  };
  jobs.set(id, job);

  let child;
  try {
    // stdin CERRADO, no heredado: `claude -p` espera 3 s a que llegue algo por
    // stdin antes de rendirse ("no stdin data received in 3s"). El prompt viaja
    // en argv, así que no hay nada que mandarle — cerrarlo ahorra ese stall en
    // cada disparo. Visto en el primer disparo real desde el panel.
    const { file, pre } = resolveClaude();
    child = spawn(file, [...pre, ...args], {
      cwd: repoRoot, env: envDisparo(), stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    job.estado = "roto";
    job.salida = `no se pudo lanzar el CLI \`claude\`: ${e.message}`;
    job.fin = new Date().toISOString();
    return job;
  }
  job._child = child;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  // NDJSON: un `data` puede traer media línea, así que se acumula y solo se
  // parsea lo que ya tiene salto. Sin esto se pierden eventos a mitad de chunk.
  let resto = "";
  child.stdout.on("data", (d) => {
    resto += d;
    const lineas = resto.split("\n");
    resto = lineas.pop();
    for (const l of lineas) if (l.trim()) eventoDeLinea(l, job);
  });
  child.stderr.on("data", (d) => (job.salida += d));
  child.on("error", (e) => {
    job.estado = "roto";
    job.salida += `\n[panel] fallo al ejecutar: ${e.message}`;
    job.fin = new Date().toISOString();
  });
  child.on("close", (code) => {
    if (resto.trim()) eventoDeLinea(resto, job);
    job.exit = code;
    job.estado = code === 0 ? "listo" : "fallo";
    job.fin = new Date().toISOString();
    // ¿La corrida cumplió el cierre obligatorio? No se pregunta: se comprueba
    // contra el log. Una corrida que no dejó entrada no cerró, por muy bien que
    // haya narrado su propio final.
    const { corridas } = readRuns();
    const nueva = corridas.length > job._corridasAntes ? corridas[corridas.length - 1] : null;
    job.rastro = {
      log: !!nueva,
      automejora: !!nueva?.automejora,
      skill_scan: !!nueva?.skill_scan,
    };
  });
  return job;
}

const publico = ({ _child, _corridasAntes, archivos, ...j }) =>
  ({ ...j, archivos: [...(archivos ?? [])] });

// ── HTTP ──────────────────────────────────────────────────────────────────
const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};

const leerCuerpo = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (d) => {
      b += d;
      if (b.length > 1e5) req.destroy();
    });
    req.on("end", () => {
      try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); }
    });
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.join(here, "index.html")));
  }

  // Sin esto el navegador pide /favicon.ico y ensucia la consola con un 404.
  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === "/api/state") {
    const { modos, camposLog } = contrato();
    const { corridas, corruptas, existe } = readRuns();
    // Cada corrida se marca contra el contrato vigente: una entrada vieja a la
    // que le falten campos nuevos se ve como incompleta, no se esconde.
    const marcadas = corridas.map((c) => ({
      ...c,
      _faltantes: camposLog.filter((f) => !(f in c)),
    }));
    return json(res, 200, {
      modos, camposLog, logExiste: existe, corruptas,
      corridas: marcadas.slice().reverse(),
      metricas: runMetrics(corridas),
      permisos: PERMISSION_MODE,
      // Solo si HAY token, nunca el valor: el panel avisa qué bolsillo paga el
      // disparo headless (suscripción vs créditos de API).
      auth: subscriptionToken() ? "suscripción (token)" : "sin token · headless → créditos de API",
      repo: repoRoot,
    });
  }

  if (url.pathname === "/api/health") {
    const sondas = await Promise.all(SONDAS.map(correrSonda));
    return json(res, 200, {
      sondas,
      errores: sondas.reduce((a, s) => a + s.errores.length, 0),
      warns: sondas.reduce((a, s) => a + s.warns.length, 0),
      cimientoRoto: sondas.some((s) => s.estado === "error"),
      cuando: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/fire" && req.method === "POST") {
    const { modo = "", contexto = "" } = await leerCuerpo(req);
    const { modos } = contrato();
    // El modo DEBE existir en cerebro.md. No hay disparo libre: si el skill no
    // lo declara, el panel no lo ofrece y tampoco lo acepta.
    const elegido = modos.find((m) => m.arg === modo || (modo === "" && m.arg === ""));
    if (!elegido)
      return json(res, 400, { error: `modo desconocido: "${modo}". Declarados: ${modos.map((m) => m.arg || "(diagnóstico)").join(", ")}` });
    const job = dispararCerebro(elegido.arg, String(contexto).slice(0, 2000));
    return json(res, 202, publico(job));
  }

  if (url.pathname === "/api/job") {
    const job = jobs.get(url.searchParams.get("id"));
    if (!job) return json(res, 404, { error: "job no encontrado" });
    return json(res, 200, publico(job));
  }

  if (url.pathname === "/api/jobs")
    return json(res, 200, { jobs: [...jobs.values()].map(publico).reverse() });

  if (url.pathname === "/api/stop" && req.method === "POST") {
    const { id } = await leerCuerpo(req);
    const job = jobs.get(id);
    if (!job) return json(res, 404, { error: "job no encontrado" });
    job._child?.kill("SIGTERM");
    job.estado = "cancelado";
    job.fin = new Date().toISOString();
    return json(res, 200, publico(job));
  }

  // ── Checkpoint de commit ────────────────────────────────────────────────
  // El panel NO deja que la corrida "aterrice" sola en el repo: al terminar,
  // muestra qué archivos tocó y tú decides commitear (en rama) o descartar —
  // SIEMPRE acotado a esos archivos, nunca al árbol completo.
  if (url.pathname === "/api/diff") {
    const job = jobs.get(url.searchParams.get("id"));
    if (!job) return json(res, 404, { error: "job no encontrado" });
    const archivos = archivosDelJob(job);
    const rama = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).out;
    const estados = [];
    for (const f of archivos) {
      const st = (await git(["status", "--porcelain", "--", f])).out;
      estados.push({ archivo: f, estado: st ? st.slice(0, 2).trim() : "sin cambios" });
    }
    const stat = archivos.length ? (await git(["diff", "--stat", "--", ...archivos])).out : "";
    return json(res, 200, {
      rama, cambios: archivos.length, archivos: estados, stat,
      commit: job.commit ?? null, descartado: !!job.descartado,
    });
  }

  if (url.pathname === "/api/commit" && req.method === "POST") {
    const { id, message } = await leerCuerpo(req);
    const job = jobs.get(id);
    if (!job) return json(res, 404, { error: "job no encontrado" });
    if (job.commit) return json(res, 409, { error: "esta corrida ya fue commiteada" });
    const archivos = archivosDelJob(job);
    if (!archivos.length) return json(res, 400, { error: "la corrida no tocó archivos versionables" });
    const r = await commitArchivos(archivos, message, job.modo || "diagnostico");
    if (r.error) return json(res, 500, { error: r.error });
    job.commit = { rama: r.rama, hash: r.hash, archivos };
    return json(res, 200, r);
  }

  if (url.pathname === "/api/discard" && req.method === "POST") {
    const { id } = await leerCuerpo(req);
    const job = jobs.get(id);
    if (!job) return json(res, 404, { error: "job no encontrado" });
    if (job.commit) return json(res, 409, { error: "ya fue commiteada; no se puede descartar" });
    job.descartado = true;
    return json(res, 200, { ok: true, ...(await descartarArchivos(archivosDelJob(job))) });
  }

  // ── Repo · commit del estado actual (no atado a una corrida) ─────────────
  // Para commitear desde el panel lo que ya hay sin trackear (p. ej. un caso
  // creado por una corrida vieja, o cambios manuales). Mismo mini-git acotado.
  if (url.pathname === "/api/repo") {
    const rama = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).out;
    const st = (await git(["status", "--porcelain"])).out;
    const archivos = st.split("\n").filter(Boolean).map((l) => ({
      estado: l.slice(0, 2).trim(),
      archivo: l.slice(3).trim().replace(/^"|"$/g, ""),
    }));
    return json(res, 200, { rama, archivos });
  }

  if (url.pathname === "/api/repo-commit" && req.method === "POST") {
    const { message, archivos } = await leerCuerpo(req);
    const files = sanear(archivos);
    if (!files.length) return json(res, 400, { error: "sin archivos válidos para commitear" });
    const r = await commitArchivos(files, message, "cambios");
    return json(res, r.error ? 500 : 200, r);
  }

  if (url.pathname === "/api/repo-discard" && req.method === "POST") {
    const { archivos } = await leerCuerpo(req);
    const files = sanear(archivos);
    if (!files.length) return json(res, 400, { error: "sin archivos válidos" });
    return json(res, 200, { ok: true, ...(await descartarArchivos(files)) });
  }

  json(res, 404, { error: "no existe" });
});

// Red de seguridad: un error async no manejado en un handler mataría el panel
// en silencio (el "se cayó"). Con estos oyentes el proceso NO muere: registra el
// fallo en terminal y en `tools/cerebro-panel/panel.log` (gitignored) y sigue vivo.
function logError(tag, e) {
  process.stderr.write(`\n  ⚠ [panel] ${tag} — ver tools/cerebro-panel/panel.log\n`);
  try {
    fs.appendFileSync(path.join(here, "panel.log"),
      `[${new Date().toISOString()}] ${tag}: ${e?.stack || e}\n`);
  } catch { /* no romper por no poder loguear */ }
}
process.on("uncaughtException", (e) => logError("excepción no capturada", e));
process.on("unhandledRejection", (e) => logError("promesa rechazada sin manejar", e));

// Sin esto, un puerto ocupado emite un 'error' NO manejado y el proceso muere
// con un stack de EADDRINUSE — el "se cayó" al relanzar con otro panel vivo.
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`\n  ⚠ El puerto ${PORT} ya está en uso — probablemente YA hay un panel corriendo.`);
    console.error(`  Abre  http://127.0.0.1:${PORT}   (o usa otro puerto: --port 4181)\n`);
  } else {
    console.error(`\n  ⚠ No se pudo iniciar el panel: ${e.message}\n`);
  }
  process.exit(1);
});

// Solo loopback: el panel ejecuta `claude` con permisos de edición sobre el
// repo. Exponerlo a la red sería dar una shell.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  cerebro-panel  ·  http://127.0.0.1:${PORT}`);
  console.log(`  repo: ${repoRoot}`);
  console.log(`  permisos al disparar: --permission-mode ${PERMISSION_MODE}`);
  console.log(`  (CEREBRO_PANEL_PERMISSION_MODE para cambiarlo)\n`);
});
