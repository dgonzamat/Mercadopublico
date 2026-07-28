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
import crypto from "crypto";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import {
  repoRoot, readCerebro, parseModes, parseModeTable,
  readRuns, runMetrics, requiredLogFields,
} from "../../web/scripts/lib/cerebro-contract.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

/* Node NO recarga módulos: si editas este archivo con el panel corriendo, el
   proceso sigue disparando los PROMPTS VIEJOS mientras `index.html` —que se
   relee en cada request— ya muestra lo nuevo. La UI se actualiza y el motor no,
   así que una corrida parece probar un cambio que nunca cargó. Pasó de verdad
   (jul 2026): una corrida de `mejoras-tec` "ignoró" una regla de ámbito recién
   escrita, y la regla simplemente no estaba en memoria. Sellamos una HUELLA del
   contenido al arrancar y la comparamos en `/api/state`.

   La huella es de contenido, no `mtime`: el propio panel hace `checkout` y
   `merge` sobre el repo, y eso reescribe archivos con contenido idéntico. Con
   `mtime` el primer merge disparaba la alarma sin que el código cambiara — un
   aviso que salta cuando no debe se aprende a ignorar, y entonces no avisa
   cuando importa. */
const archivoPropio = fileURLToPath(import.meta.url);
const huellaPropia = () => {
  try { return crypto.createHash("sha1").update(fs.readFileSync(archivoPropio)).digest("hex"); }
  catch { return ""; }
};
const selloArranque = huellaPropia();
const servidorObsoleto = () => huellaPropia() !== selloArranque;

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

/** Minutos tras los que el panel corta una corrida. Ver el tope en `dispararCerebro`. */
const TIMEOUT_MIN = Number(process.env.CEREBRO_PANEL_TIMEOUT_MIN ?? 20);

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

/**
 * PERSISTENCIA DE CORRIDAS. Los jobs vivían solo en memoria — y reiniciar el
 * panel es parte del flujo, porque Node no recarga módulos. Si una corrida
 * terminaba y reiniciabas antes de commitear, `/api/diff?id=` devolvía 404 y los
 * archivos que había escrito quedaban HUÉRFANOS en el árbol: sin checkpoint que
 * los reclamara ni forma de saber de qué corrida salieron.
 *
 * Se guarda lo justo para reconstruir el checkpoint y las métricas: nada de
 * `salida` ni `eventos` (crecen sin techo y no hacen falta para decidir), y
 * nunca el `prompt`, que puede llevar la señal completa.
 */
/**
 * ATERRIZAJES. La métrica «commiteadas» contaba solo `job.commit`, que se marca
 * en el checkpoint de una corrida — y NO en la tarjeta Repo, que es por donde
 * pasan la mayoría de los aterrizajes. Resultado: el panel declaraba «0
 * commiteadas» con cinco commits suyos ya en `main`. Una métrica que subestima
 * el valor del loop es tan dañina como una que lo infla: lleva a apagarlo.
 * Aquí se registra TODO lo que el panel manda al repo, venga de donde venga.
 */
const aterrizajes = [];
const ARCHIVO_ATERRIZAJES = path.join(here, "aterrizajes.json");

function registrarAterrizaje(entrada) {
  aterrizajes.push({ ts: new Date().toISOString(), ...entrada });
  try { fs.writeFileSync(ARCHIVO_ATERRIZAJES, JSON.stringify(aterrizajes.slice(-200))); }
  catch (e) { bitacora(`no se pudo guardar aterrizajes.json: ${e.message}`); }
}

function cargarAterrizajes() {
  try {
    if (fs.existsSync(ARCHIVO_ATERRIZAJES))
      aterrizajes.push(...JSON.parse(fs.readFileSync(ARCHIVO_ATERRIZAJES, "utf8")));
  } catch (e) { bitacora(`no se pudo leer aterrizajes.json: ${e.message}`); }
}

const ARCHIVO_JOBS = path.join(here, "jobs.json");
const CAMPOS_PERSISTIDOS = ["id", "modo", "contexto", "estado", "inicio", "fin", "exit",
  "resultado", "tokens", "coste_usd", "bloqueo", "commit", "descartado", "mergeado"];

function guardarJobs() {
  try {
    const lista = [...jobs.values()].slice(-50).map((j) => {
      // Los eventos NO se persisten (crecen sin techo), pero sí CUÁNTOS hubo:
      // sin ese número, al recuperar el job del disco el ticker sale vacío y el
      // panel afirma «sin herramientas todavía» junto a un resumen de 56 turnos.
      const o = { archivos: [...(j.archivos ?? [])], eventosPerdidos: (j.eventos ?? []).length };
      for (const k of CAMPOS_PERSISTIDOS) if (j[k] !== undefined) o[k] = j[k];
      return o;
    });
    fs.writeFileSync(ARCHIVO_JOBS, JSON.stringify(lista));
  } catch (e) { bitacora(`no se pudo guardar jobs.json: ${e.message}`); }
}

function cargarJobs() {
  try {
    if (!fs.existsSync(ARCHIVO_JOBS)) return;
    for (const o of JSON.parse(fs.readFileSync(ARCHIVO_JOBS, "utf8"))) {
      // Una corrida "corriendo" en disco es una que murió con el panel: su
      // proceso ya no existe, así que decirlo es más honesto que resucitarla.
      jobs.set(o.id, {
        ...o,
        archivos: new Set(o.archivos ?? []),
        salida: "", eventos: [], prompt: "",
        eventosPerdidos: o.eventosPerdidos ?? 0,   // hubo N, ya no los tenemos
        estado: o.estado === "corriendo" ? "roto" : o.estado,
        bloqueo: o.estado === "corriendo"
          ? "El panel se reinició mientras esta corrida estaba viva; su proceso ya no existe."
          : o.bloqueo ?? null,
      });
      const n = Number(String(o.id).replace(/\D/g, ""));
      if (n > seq) seq = n;   // no reusar ids: colisionarían con los de disco
    }
  } catch (e) { bitacora(`no se pudo leer jobs.json: ${e.message}`); }
}
let seq = 0;

// Cadena visible por modo para el flowchart. Los `backticks` marcan nodos que
// el cliente enciende (al leer el .md del skill o correr la tool). Refleja el
// flujo LEAN real — `parseModeTable` devuelve vacío, así que se declara aquí.
const CADENA_FLUJO = {
  "caso-nuevo": "WebSearch → `/proximo-caso` → `/nuevo-caso`",
  "bugs": "`security-review` · `review` · `/blindar`",
  "mejoras-ux": "`/innovar`",
  "mejoras-tec": "`simplify` · `/blindar`",
  "frescura": "WebSearch → `/nuevo-caso` → `/learn`",
};

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
      cadena: CADENA_FLUJO[s.name] ?? fila?.cadena ?? "",
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
          id: b.id,                 // para casar con su tool_result (la SALIDA)
          tool: b.name,
          detalle: `${b.name} ${input}`.slice(0, 400),
          resultado: null,          // se llena cuando llega el tool_result
        });
      }
    }
  }
  // Resultado de cada tool (la SALIDA): casa por tool_use_id con su evento y
  // muestra QUÉ DEVOLVIÓ la acción — así el flujo es entrada → salida real.
  if (e.type === "user") {
    for (const b of e.message?.content ?? []) {
      if (b.type !== "tool_result") continue;
      const ev = job.eventos.find((x) => x.id === b.tool_use_id);
      if (!ev) continue;
      const txt = typeof b.content === "string" ? b.content
        : Array.isArray(b.content) ? b.content.map((c) => c?.text || "").join(" ") : "";
      // 300 caracteres cortaban justo donde empieza lo interesante de un error.
      // La UI muestra los primeros 160 y abre el resto con un clic, así que aquí
      // se guarda con margen suficiente para que ese clic sirva de algo.
      ev.resultado = ((b.is_error ? "⚠ " : "") + String(txt).replace(/\s+/g, " ").trim()).slice(0, 1200);
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

  /* CONSUMO — el dato que faltaba. El panel gasta dinero de verdad en cada
     disparo y hasta ahora solo mostraba el coste AL FINAL: durante la corrida,
     que es cuando puedes decidir cortarla, no había ningún número. Se acumula en
     vivo desde el `usage` de cada mensaje del asistente y, al cerrar, se
     reemplaza por el total autoritativo del evento `result` (sumar por turno
     aproxima, pero solo el result cuadra con la factura). */
  if (e.type === "assistant" && e.message?.usage) {
    const u = e.message.usage;
    job.tokens.entrada += u.input_tokens || 0;
    job.tokens.salida += u.output_tokens || 0;
    job.tokens.cache_lectura += u.cache_read_input_tokens || 0;
    job.tokens.cache_creacion += u.cache_creation_input_tokens || 0;
    job.tokens.parcial = true;   // en vivo: aún no es el total de la factura
  }

  if (e.type === "result") {
    job.resultado = {
      subtype: e.subtype, duracion_ms: e.duration_ms,
      coste_usd: e.total_cost_usd, turnos: e.num_turns,
    };
    const u = e.usage;
    if (u) job.tokens = {
      entrada: u.input_tokens || 0,
      salida: u.output_tokens || 0,
      cache_lectura: u.cache_read_input_tokens || 0,
      cache_creacion: u.cache_creation_input_tokens || 0,
      parcial: false,
    };
    else job.tokens.parcial = false;
    job.coste_usd = e.total_cost_usd ?? null;
    if (e.result && !job.salida.includes(e.result)) job.salida += "\n" + e.result;
  }
}

/**
 * MÉTRICAS OBSERVADAS. Las de `cerebro-runs.jsonl` las escribe el cerebro sobre
 * sí mismo: son su relato, y su campo `coste` es prosa, no un número. Estas las
 * mide el panel — duración, tokens, dinero y archivos realmente escritos — así
 * que no dependen de que la corrida se autoevalúe con honestidad.
 *
 * Las tres que importan y antes no existían:
 *  · `conCambio` / terminadas — la proporción de corridas que dejaron un CAMBIO
 *    en vez de un informe. Es el fallo que más cuesta detectar leyendo salidas:
 *    una corrida puede razonar espléndidamente durante 14 minutos y no tocar
 *    nada. Aquí sale como número.
 *  · `costePorCambio` — lo que cuesta de verdad un cambio útil, contando las
 *    corridas que no produjeron ninguno. Es el único ROI honesto.
 *  · `descartadas` — cambios producidos y luego tirados en la revisión. Dinero
 *    gastado en trabajo que no te convenció: si sube, el problema es el prompt,
 *    no el presupuesto.
 */
function metricasSesion() {
  const tokens = { entrada: 0, salida: 0, cache_lectura: 0, cache_creacion: 0 };
  let coste = 0, terminadas = 0, conCambio = 0, descartadas = 0;
  // Los commits salen del registro de aterrizajes, no de los jobs: el panel
  // commitea también fuera del checkpoint y esos también son valor entregado.
  const commiteadas = aterrizajes.filter((a) => a.tipo === "commit").length;
  const mergeadas = aterrizajes.filter((a) => a.tipo === "merge").length;
  const archivosAterrizados = aterrizajes
    .filter((a) => a.tipo === "commit")
    .reduce((n, a) => n + (a.archivos || 0), 0);
  let msTotal = 0, conDuracion = 0, parcial = false;
  for (const j of jobs.values()) {
    for (const k of Object.keys(tokens)) tokens[k] += j.tokens?.[k] || 0;
    if (j.tokens?.parcial) parcial = true;
    if (typeof j.coste_usd === "number") coste += j.coste_usd;
    if (j.estado !== "corriendo") terminadas++;
    if (j.archivos?.size) conCambio++;
    if (j.descartado) descartadas++;
    const ms = j.resultado?.duracion_ms;
    if (typeof ms === "number") { msTotal += ms; conDuracion++; }
  }
  // Todo lo que entra al modelo: fresco, servido desde caché y ESCRITO a caché.
  // Dejar fuera `cache_creacion` daba un 99,99% incompatible con la factura —
  // esos tokens se pagan (más caros, además): son entrada que no vino de caché.
  const entradaTotal = tokens.entrada + tokens.cache_lectura + tokens.cache_creacion;
  return {
    corridas: jobs.size, terminadas, conCambio,
    commiteadas, mergeadas, descartadas, archivosAterrizados,
    tokens, tokensTotal: tokens.entrada + tokens.salida + tokens.cache_lectura + tokens.cache_creacion,
    parcial, coste_usd: coste,
    // Reparte TODO el gasto entre los cambios útiles: las corridas estériles
    // también se pagan, así que tienen que aparecer en el precio.
    costePorCambio: conCambio > 0 ? coste / conCambio : null,
    // Cuánto del contexto se sirvió desde caché. Es la palanca más directa
    // sobre la factura: un prompt que no cachea se paga entero en cada turno.
    cacheRatio: entradaTotal > 0 ? tokens.cache_lectura / entradaTotal : null,
    msTotal, msMedia: conDuracion > 0 ? msTotal / conDuracion : null,
  };
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

/**
 * REVISIÓN MECÁNICA DEL CAMBIO. Una regla en el prompt es blanda: el modelo puede
 * razonar en contra y sonar convincente. Esto lo comprueba el panel sobre el diff
 * real, así que no se puede argumentar.
 *
 * Nace de un fallo concreto: una corrida sustituyó unas barras por un donut que
 * YA se renderizaba en otras tres vistas, y de paso borró la frase del propio
 * archivo que explicaba por qué esa página era distinta. El diff era impecable
 * línea por línea — el error estaba en la premisa. Dos señales lo habrían
 * delatado antes de aprobar, y las dos son detectables sin entender el cambio:
 *
 *   · DEROGACIÓN — el cambio borra texto que explicaba una decisión. Si el repo
 *     dice por qué algo es así, quitarlo sin citarlo es derogar sin discutir.
 *   · SUPERFICIE — el cambio añade un componente que ya vive en otras vistas.
 *     No es malo por sí solo; es que casi nunca es la mejora que parece.
 *
 * Son AVISOS, no bloqueos: el panel no sabe si la decisión es correcta, sabe que
 * merece una mirada antes del OK.
 */
const MARCAS_INTENCION = /\b(a propósito|deliberad|por eso|la razón|no es un|en vez de|vive en|OJO|IMPORTANTE|NUNCA|SIEMPRE|porque el|pasó de verdad|costó un)\b/i;

async function revisarCambios(archivos) {
  const avisos = [];
  for (const f of archivos) {
    const st = (await git(["status", "--porcelain", "--", f])).out;
    if (st.startsWith("??")) continue;             // alta: no deroga nada
    const d = (await git(["diff", "-U0", "--", f])).out;
    if (!d) continue;

    // ── derogación: líneas BORRADAS que explicaban algo ──
    // Una explicación MOVIDA no es una explicación derogada: al reestructurar un
    // archivo, el diff borra el comentario de un sitio y lo añade en otro. Sin
    // esta comprobación el aviso saltaba en cada refactor y se aprendía a
    // ignorar — que es la única forma de que un detector deje de servir.
    const lineas = d.split("\n");
    const añadidas = new Set(lineas
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .map((l) => l.slice(1).trim()));
    /* Igualdad exacta no basta. En los casos del corpus la prosa vive en UNA
       línea de JSON larguísima: añadirle un párrafo al final hace que git borre
       la línea entera y añada la versión ampliada, y el aviso saltaba como si se
       hubiera derogado todo lo anterior —cuando el texto sigue ahí, íntegro—.
       Si lo borrado SOBREVIVE dentro de algo añadido, es una ampliación. */
    const añadidasTexto = [...añadidas].join("\n");
    /* Se compara por PREFIJO, no por la línea entera: el texto nuevo se inserta
       ANTES del cierre (`…texto viejo\n\ntexto nuevo",`), así que lo borrado no
       es subcadena contigua de lo añadido aunque esté íntegro dentro. Un prefijo
       largo (200 caracteres) es identificación de sobra y no genera colisiones. */
    const sobrevive = (l) =>
      añadidas.has(l) || añadidasTexto.includes(l.slice(0, Math.min(200, l.length)));
    const borradas = lineas
      .filter((l) => l.startsWith("-") && !l.startsWith("---"))
      .map((l) => l.slice(1).trim())
      .filter((l) => l.length > 40 && MARCAS_INTENCION.test(l) && !sobrevive(l));
    for (const l of borradas.slice(0, 3))
      avisos.push({
        tipo: "derogacion", archivo: f,
        texto: l.length > 240 ? l.slice(0, 240) + "…" : l,
        que: "Este cambio BORRA texto que explicaba una decisión. Si la derogas, que sea a sabiendas: "
           + "lee qué decía y decide si tu razón es mejor.",
      });

    /* ── eco: el MISMO dato pintado dos veces en la misma vista ──
       El detector de «superficie» mira imports añadidos, y así cazó un donut que
       ya vivía en otras tres vistas. Pero el patrón se repitió en una forma que
       no ve: un componente que PASA un valor a su hijo y además lo pinta él.
       Pasó con el contador del explorador —`filteredCount={filtered.length}` al
       FilterPanel y `{filtered.length}` sobre la tabla—: el mismo número dos
       veces en pantalla. El hallazgo era bueno, la ejecución de más; y es el
       tercer caso hoy del mismo error. Se acota a valores de CONTEO (`.length`,
       `…Count`, `…Total`) a propósito: un detector ancho grita con todo y se
       aprende a ignorar, que es la única forma de que deje de servir. */
    if (/\.(tsx|jsx)$/.test(f)) {
      const añadido = d.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n");
      const pintados = [...añadido.matchAll(/\{([a-zA-Z_$][\w$]*(?:\.[\w$]+)*(?:\.length)?)\}/g)]
        .map((m) => m[1])
        .filter((e) => /\.length$|Count$|Total$/.test(e));
      const actual = fs.readFileSync(path.join(repoRoot, f), "utf8");
      for (const expr of [...new Set(pintados)]) {
        const comoProp = actual.match(new RegExp(`(\\w+)=\\{${expr.replace(/[.$]/g, "\\$&")}\\}`));
        if (!comoProp) continue;
        avisos.push({
          tipo: "eco", archivo: f, texto: `${expr} · ya viaja como prop \`${comoProp[1]}\``,
          que: `Este cambio pinta «${expr}», que el mismo archivo ya pasa a un hijo como `
             + `\`${comoProp[1]}\`. Puede ser correcto (p. ej. si el hijo se pierde de vista al `
             + `hacer scroll), pero comprueba que no acabes con el mismo número dos veces en pantalla.`,
        });
      }
    }

    // ── superficie: componentes añadidos que ya se renderizan en otras vistas ──
    const nuevos = [...d.matchAll(/^\+.*from\s+["']@\/components\/([\w-]+)["']/gm)].map((m) => m[1]);
    for (const comp of [...new Set(nuevos)]) {
      const r = await git(["grep", "-l", "-e", `components/${comp}`, "--", "web/*.tsx", "web/**/*.tsx"]);
      const donde = (r.out || "").split("\n").filter((x) => x && !x.endsWith(`/${comp}.tsx`) && x !== f);
      if (donde.length >= 2)
        avisos.push({
          tipo: "superficie", archivo: f, texto: `${comp} → ${donde.join(", ")}`,
          que: `«${comp}» ya se usa en ${donde.length} sitio(s). Replicarlo aquí uniforma la interfaz, `
             + `pero comprueba primero si esta vista existía para enseñar algo que las otras no enseñan.`,
        });
    }
  }
  return avisos;
}

/**
 * RECOMENDACIÓN. Señalar sin recomendar deja el trabajo a medias: el panel sabe
 * cosas que tú tendrías que deducir —si hay avisos, si el cambio sale publicado,
 * si trae mockup— y callárselas para «no influir» es una falsa neutralidad.
 *
 * Recomienda sobre lo que PUEDE comprobar: forma, alcance y señales del diff.
 * Nunca dice «esto es correcto», porque eso no lo sabe — y lo declara, para que
 * un «commitear» suyo no se lea como un visto bueno técnico que no ha dado.
 */
function recomendar(archivos, avisos) {
  if (!archivos.length)
    return { accion: "nada", texto: "No hay nada que aterrizar." };

  const publica = archivos.filter((f) => f.startsWith("web/"));
  const conMockup = archivos.some((f) => /mockups\/.+\.html?$/i.test(f));

  /* El deploy se dispara con CUALQUIER push a main, pero solo publica lo que
     sale de `npm run build` dentro de `web/`. Un cambio en `tools/` provoca una
     reconstrucción idéntica: ruido, no publicación. Decirle «esto publica» a
     los dos por igual entrena a ignorar el aviso justo cuando sí importa. */
  const base = publica.length
    ? `Toca ${publica.length} archivo(s) de \`web/\`: al mergear, esto SE PUBLICA en uapcodex.org.`
    : "Solo toca `tools/`, que no entra en el build: el deploy se disparará, "
      + "pero republica el sitio idéntico. Nada llega a los lectores.";
  const limite = "El panel comprueba forma y alcance, no si el cambio es correcto: "
    + "eso sigue siendo tuyo.";

  if (avisos.length)
    return {
      accion: "revisar",
      texto: `**Revísalo antes de aprobar.** ${avisos.length} señal(es) en el diff`
        + `${conMockup ? " (hay mockup: ábrelo, se juzga mirándolo)" : ""}. ${base} ${limite}`,
    };

  return {
    accion: "commitear",
    texto: `**Commitear en rama.** Sin señales en el diff`
      + `${conMockup ? ", y trae mockup para revisar" : ""}. ${base} ${limite}`,
  };
}

/** Commitea SOLO `archivos` en una rama (nunca directo a main/master). */
async function commitArchivos(archivos, message, etiqueta) {
  /* Fuera lo GITIGNOREADO antes de tocar nada. Los mockups de revisión están en
     `.gitignore` y `git add` sobre un archivo ignorado FALLA — y como el mockup
     es obligatorio en todo modo que toque archivos, cada checkpoint acababa con
     la rama creada, el add roto y el commit sin hacer. El panel se quedaba sin
     ofrecer commit y el usuario, varado en una rama vacía. */
  const commitables = [];
  for (const f of archivos)
    if ((await git(["check-ignore", "-q", "--", f])).code !== 0) commitables.push(f);
  if (!commitables.length)
    return { error: "los archivos de esta corrida están todos gitignoreados (p. ej. solo el mockup): no hay nada que commitear" };

  const rama = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).out;
  let ramaUsada = rama;
  if (["main", "master"].includes(rama)) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    ramaUsada = `claude/cerebro-${etiqueta || "cambios"}-${ts}`;
    const r = await git(["checkout", "-b", ramaUsada]);
    if (r.code !== 0) return { error: `no se pudo crear la rama: ${r.err}` };
  }
  // A partir de aquí, cualquier fallo devuelve a la rama de partida: dejar al
  // usuario en una rama recién creada y vacía es peor que no haber empezado.
  const abortar = async (error) => {
    if (ramaUsada !== rama) {
      await git(["checkout", rama]);
      await git(["branch", "-D", ramaUsada]);
    }
    return { error };
  };
  const add = await git(["add", "--", ...commitables]);
  if (add.code !== 0) return abortar(`git add falló: ${add.err}`);
  // Para un solo archivo el path ES la descripción; «1 archivo(s)» no lo es.
  // (Con varios, la UI exige mensaje antes de llegar aquí.)
  const msg = (message && String(message).trim())
    || (commitables.length === 1 ? `cerebro: ${commitables[0]}` : `cerebro: ${commitables.length} archivo(s)`);
  const commit = await git(["commit", "-m", msg]);
  if (commit.code !== 0) return abortar(`git commit falló: ${commit.err || commit.out}`);
  const hash = (await git(["rev-parse", "--short", "HEAD"])).out;
  // Un solo punto de registro: da igual si vino del checkpoint o de la tarjeta
  // Repo, todo commit del panel cuenta como valor entregado.
  registrarAterrizaje({ tipo: "commit", hash, rama: ramaUsada, archivos: commitables.length });
  const ignorados = archivos.length - commitables.length;
  return {
    ok: true, rama: ramaUsada, hash, archivos: commitables,
    salida: commit.out + (ignorados ? `\n(${ignorados} archivo(s) gitignoreado(s) fuera del commit: el mockup de revisión no se versiona)` : ""),
  };
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
/**
 * Pasos específicos de `caso-nuevo`. Antes esto era un prompt ENTERO y paralelo,
 * así que el modo se saltaba el ámbito, el presupuesto, la regla de precedencia
 * y el formato de cierre — no por decisión, sino porque vivía en otra función.
 * Ahora es un apéndice del prompt común: las reglas se escriben una vez y las
 * cumplen todos los modos por igual.
 */
function pasosCasoNuevo() {
  return [
    `## Prioridad 1 — Analizar y elegir el caso (NEWS-SWEEP)`,
    `0. Read \`.claude/commands/proximo-caso.md\` (la disciplina de selección/NEWS-SWEEP) — obligatorio,`,
    `   aunque ya sepas cómo elegir; así el panel refleja el paso /proximo-caso.`,
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
}

/**
 * Objetivo + cadena por modo. La tabla de `cerebro.md` no es parseable hoy
 * (parseModeTable devuelve vacío), así que va corta y explícita aquí. Es la base
 * de los prompts lean: misma lógica que caso-nuevo — foco, inline, sin ceremonia.
 */
const CADENAS = {
  bugs: {
    obj: "encontrar defectos técnicos y de UI/UX reales",
    cadena: "revisa el código con criterio; para UI inspecciona el marcado (prueba la app solo si YA está corriendo); security-review sobre la anon key de Supabase y funciones SECURITY DEFINER; /blindar si el defecto abre una clase enforzable",
    ambito: "el código del SITIO bajo `web/` (componentes, rutas, `scripts/`, `scripts/lib/`)",
  },
  "mejoras-ux": {
    obj: "detectar oportunidades de UI/UX (no defectos) de alto leverage",
    cadena: "aplica /innovar sobre UNA fricción concreta observada en el marcado/rutas, propón el cambio con su señal (sin fluff) y DEJA SU MOCKUP (ver abajo)",
    ambito: "el código del SITIO bajo `web/` (componentes, rutas, estilos)",
    // Un cambio de UX no se aprueba leyendo un diff de `.tsx`: se aprueba
    // mirándolo. El panel sabe renderizar un .html en la vista previa del
    // checkpoint, así que la corrida tiene que dejarle algo que renderizar —
    // si no, el usuario firma a ciegas y la revisión es un trámite.
    entregable: "En este modo el mockup es la parte que más importa: reproduce la pantalla real "
      + "(mismo marcado y espaciados que el componente), no un esquema — una fricción de UI se aprueba "
      + "o se rechaza por cómo se ve, y un diagrama aproximado esconde justo lo que hay que juzgar.",
  },
  "mejoras-tec": {
    obj: "mejorar calidad de código: reuso, simplificación, eficiencia",
    cadena: "aplica simplify sobre UN objetivo del ámbito declarado abajo y DEJA EL CAMBIO HECHO (no un informe); /blindar si se abre una clase enforzable",
    ambito: "el código del SITIO bajo `web/` (componentes, rutas, `scripts/`, `scripts/lib/`)",
  },
  frescura: {
    obj: "mantener vivos los casos: desarrollos nuevos sobre casos existentes",
    cadena: "WebSearch de desarrollos recientes sobre casos del corpus → actualiza o propón con la disciplina de fuentes de nuevo-caso.md → /learn",
    // Aquí el corpus SÍ es el objetivo: es el único modo al que le toca.
    ambito: "el CORPUS bajo `web/data/cases/` — actualizar casos existentes",
    corpus: true,
  },
  "caso-nuevo": {
    obj: "crear UN caso nuevo, real y anclable, para el corpus",
    cadena: "/proximo-caso (NEWS-SWEEP) para elegir el evento → /nuevo-caso para escribirlo → validar",
    ambito: "un archivo NUEVO en `web/data/cases/`. No modifiques casos existentes: eso es `frescura`",
    corpus: true,
  },
  /* NO hay entrada para `curar-memoria`: `cerebro.md` lo declara como skill del
     LOOP —el que se delega desde el gate cuando aparece drift—, no como modo, y
     `/api/fire` valida contra ese contrato. Añadirlo aquí habría sido una
     entrada muerta: un modo que la tabla ofrece y el panel rechaza. El contrato
     sale de un solo sitio, y ese sitio es el skill. */
  "": {
    obj: "diagnóstico: sondear el estado y RECOMENDAR el modo de mayor leverage",
    cadena: "corre las 3 sondas, lee las métricas y propón qué modo conviene y por qué — NO gatilles nada",
    ambito: "NADA. Este modo solo observa: no escribas ni modifiques ningún archivo, solo recomienda",
    // El diagnóstico recomendaba acciones que el panel no ofrece, y quien lo lee
    // se queda sin poder actuar. Que recomiende de la lista real.
    extra: "Recomienda SOLO uno de los modos que el panel puede disparar: **caso-nuevo, bugs, "
      + "mejoras-ux, mejoras-tec, frescura**. Los skills del loop (`/curar-memoria`, `/blindar`, "
      + "`/learn`, `/retro`) NO son modos: no se pueden gatillar desde el panel. Si lo que de verdad "
      + "hace falta es uno de ellos —p. ej. drift en `CLAUDE.md`—, dilo así: «acción FUERA del panel: "
      + "<qué> — requiere una sesión normal», con los cambios concretos ya identificados para que "
      + "quien la haga no tenga que volver a diagnosticar. No disfraces esa recomendación de modo.",
  },
};

/** Skills que SÍ existen como comando del repo, leídos del disco (no inventados). */
function skillsDelRepo() {
  try {
    return fs.readdirSync(path.join(repoRoot, ".claude", "commands"))
      .filter((f) => f.endsWith(".md") && f !== "cerebro.md")
      .map((f) => f.replace(/\.md$/, ""))
      .sort();
  } catch { return []; }
}

/** Prompt lean genérico (misma lógica que caso-nuevo) para los demás modos. */
function promptLean(modo, contexto) {
  const spec = CADENAS[modo] ?? CADENAS[""];
  const nombre = modo || "diagnóstico";
  const p = [
    `Ejecuta el modo \`${nombre}\` del cerebro UAP Codex, en headless y EFICIENTE (mínimo procesamiento).`,
    `SlashCommand está deshabilitada, así que los skills se ejecutan INLINE con Bash/Read/Write/Edit/WebSearch.`,
    ``,
    // Antes esto decía «para CADA skill lee su .md», y para `simplify` eso era
    // pedir un archivo que no existe: es un skill de librería, no del repo. La
    // corrida lo buscaba, no lo hallaba e improvisaba — y el nodo nunca se
    // encendía. La lista sale del disco, así que el prompt no puede mentir
    // sobre qué existe.
    `**Skills DEL REPO** (tienen \`.md\`, es OBLIGATORIO leerlo con Read antes de ejecutarlos —aunque ya`,
    `sepas qué hacen—; sin ese Read el panel no puede reflejar el flujo y el nodo queda apagado):`,
    `  ${skillsDelRepo().map((s) => "/" + s).join(", ") || "(ninguno)"}.`,
    `**Skills DE LIBRERÍA** (simplify, security-review, review, webapp-testing…): NO tienen \`.md\` en este`,
    `repo. No los busques ni los des por rotos: aplica su disciplina directamente y dilo en el cierre.`,
    ``,
    `Si un skill necesita un prerequisito headless inexistente (Playwright sin navegador, app sin`,
    `node_modules…), sáltalo y decláralo — no lo simules.`,
    ``,
    `## Objetivo`,
    spec.obj + ".",
    `## Cadena (lean)`,
    spec.cadena + ".",
    // Regla propia del modo, si la tiene. Va pegada al objetivo: es lo que hace
    // distinto a ESTE modo, no una nota al pie.
    ...(spec.extra ? [``, `## Específico de este modo (obligatorio)`, spec.extra] : []),
    ``,
    /* MOCKUP OBLIGATORIO. Un cambio que solo se puede revisar leyendo un diff
       obliga a quien aprueba a reconstruir mentalmente el antes y el después. El
       panel sabe renderizar HTML en la vista previa del checkpoint, así que la
       corrida deja lo que hay que mirar. Aplica a TODO cambio, no solo a UX: un
       refactor también tiene un antes y un después que enseñar. */
    /* Obligatorio solo si el cambio se VE. Lo hice universal y `frescura` acabó
       maquetando un antes/después de dos párrafos de prosa: puro trámite. Un
       entregable que a veces no aporta nada enseña a producirlo por cumplir, y
       entonces deja de significar algo cuando sí importa. */
    `## Mockup del cambio (obligatorio si el cambio SE VE)`,
    `Si esta corrida toca la interfaz —componentes, rutas, estilos, marcado— deja un mockup`,
    `autocontenible en \`tools/cerebro-panel/mockups/<slug>.html\`. El panel lo renderiza en el`,
    `checkpoint para que el cambio se apruebe VIÉNDOLO, no reconstruyéndolo de un diff.`,
    `Si el cambio NO es visual (datos de un caso, un script, una utilidad), **no lo hagas**: ahí el`,
    `diff ya lo dice todo y una maqueta de prosa es teatro. Dilo en el cierre en una línea.`,
    `- **Sin JavaScript y sin recursos externos**: se sirve en un iframe \`sandbox\` que no ejecuta scripts.`,
    `- Muestra **ANTES y DESPUÉS** lado a lado, con la paleta del sitio`,
    `  (\`--bg:#f7f2e8; --panel:#ede6d4; --border:#c4b89d; --text:#1a1a1a; --muted:#615a4d; --accent:#c41e3a; --ok:#1e6b3a\`).`,
    `- Si el cambio es de **UI**, el mockup es la interfaz renderizada. Si es de **código**, es el fragmento`,
    `  antes/después con una línea que explique qué mejora y por qué — no el diff entero.`,
    `- Es parte del entregable, no un extra: sin él solo hay texto que aprobar.`,
    ...(spec.entregable ? [spec.entregable] : []),
    ``,
    // El ámbito tiene que ser EXPLÍCITO o el modo se vuelve circular: skills como
    // `simplify` se definen sobre "el código cambiado", y en headless lo único
    // cambiado suele ser trabajo en curso de otra sesión — el cerebro termina
    // auditando ediciones a medias en vez del sitio. Pasó de verdad (jul 2026):
    // `mejoras-tec` revisó el diff sin commitear del propio panel y cerró en 0.
    /* TODAS estas reglas van para TODOS los modos. Antes colgaban del campo
       `ambito`, que solo tenían tres de los seis: `frescura`, `caso-nuevo` y
       `diagnóstico` corrían sin presupuesto y sin la regla de precedencia por
       puro accidente de cómo estaba escrito el condicional. Un modo que se
       comporta distinto que sus hermanos sin que nadie lo decidiera no es un
       diseño, es una fuga — y solo se nota cuando ese modo se desmanda. */
    ...[
      `## Ámbito — SOBRE QUÉ corre esta cadena (obligatorio)`,
      `- El objetivo es ${spec.ambito}.`,
      `- **PROHIBIDO** tomar el árbol sucio (\`git status\`/\`git diff\` sin commitear) como el objetivo:`,
      `  esos cambios son trabajo en curso de otra sesión, no el encargo. Si el árbol está limpio, el`,
      `  ámbito sigue siendo el de arriba — no te quedes sin objetivo.`,
      `- Si un skill se define sobre "el código cambiado" (p. ej. simplify), aquí eso NO aplica: su`,
      `  objetivo es el ámbito declarado.`,
      `- \`tools/\` (panel y utilidades del repo) queda FUERA salvo que la señal lo nombre.`,
      // Una corrida de `mejoras-ux` se fue al backlog E21 (un caso Tier S sin
      // imagen) y lo trató como fricción de interfaz. No lo es: es una carencia
      // de CONTENIDO. El modo hacía lo que le salía al paso en vez de lo que
      // declara, y la fricción de UI que sí había detectado se quedó sin tocar.
      // Los modos de CORPUS (`frescura`, `caso-nuevo`) tienen `web/data/` como
      // objetivo, así que para ellos esta exclusión sería una contradicción.
      ...(spec.corpus ? [
        `- El CÓDIGO del sitio (\`web/components\`, \`web/app\`, \`web/lib\`) queda FUERA: un defecto o una`,
        `  fricción de interfaz que veas de paso se declara en el cierre para \`bugs\`/\`mejoras-ux\`, no se`,
        `  arregla aquí.`,
      ] : [
        `- \`web/data/\` (el corpus) queda FUERA. Una carencia de CONTENIDO —un caso sin visual, un E21 de`,
        `  cobertura, una fuente que falta— no es un defecto de código ni una fricción de interfaz: es`,
        `  trabajo de \`caso-nuevo\` o \`frescura\`. Si al explorar te topas con una, decláralo en el cierre`,
        `  como hallazgo para otro modo y NO la ataques aquí.`,
      ]),
      `- Si la señal trae una ruta o archivo, ESE es el ámbito y manda sobre lo anterior.`,
      ``,
      /* Homogeneizar es el instinto por defecto de cualquier pase de reuso, y casi
         siempre acierta. Pero una corrida de `mejoras-ux` sustituyó unas barras
         por un donut que YA existía en otras tres vistas, borrando de paso la
         frase del propio archivo que explicaba por qué esa página era distinta.
         El dato estaba delante: lo trató como deuda en vez de como decisión. */
      `## Lo que el código explica, MANDA`,
      `- Antes de uniformar algo, lee el comentario o la prosa que lo rodea. Si el repo **explica por qué**`,
      `  algo es distinto (otra métrica, otra vista, otra convención), eso es una DECISIÓN tomada, no deuda`,
      `  técnica pendiente. Homogeneizarla es una regresión, por muy limpio que quede.`,
      `- Puedes proponer cambiarla, pero entonces cita la explicación que derogas y da una razón mejor.`,
      `  Borrarla sin nombrarla está prohibido.`,
      `- Antes de añadir un componente o patrón, comprueba **dónde vive ya** (\`grep -rl\`). Si ya se`,
      `  renderiza en otras vistas, replicarlo otra vez casi nunca es la mejora: pregúntate si esa vista`,
      `  existía justamente para enseñar algo que las demás no enseñan.`,
      ``,
      // Un ámbito ancho sin presupuesto se censa en vez de trabajarse: la primera
      // corrida con `web/` como ámbito gastó 45 acciones contando páginas y
      // midiendo `.next` sin tocar un archivo. Declarar DÓNDE mirar no basta;
      // hay que declarar cuándo dejar de mirar y en qué termina la corrida.
      `## Presupuesto — cuándo dejar de mirar (obligatorio)`,
      `- En los primeros ~10 pasos ELIGE UN objetivo concreto (un archivo, o un patrón en pocos archivos)`,
      `  y decláralo en una línea: \`objetivo: <ruta> — <por qué ese>\`. El resto del ámbito queda fuera`,
      `  de ESTA corrida; ya habrá otras.`,
      `- **PROHIBIDO inventariar**: contar archivos, medir el build, listar ocurrencias (\`wc -l\`, \`du\`,`,
      `  \`find | head\`) NO son hallazgos y no acercan el objetivo. Si te sorprendes haciendo censos, ya`,
      `  te pasaste — corta y elige.`,
      `- La corrida termina de UNA de dos formas, nunca en un informe: (a) el cambio **aplicado** con`,
      `  Edit/Write sobre ese objetivo, o (b) \`sin objetivo que supere el umbral\` y paras ahí mismo.`,
      `  Una lista de oportunidades que no aplicaste NO es un resultado.`,
      ``,
    ],
    // Los pasos propios del modo, si los tiene. Van DESPUÉS de las reglas
    // comunes: primero cómo se trabaja aquí, luego qué hace este modo en
    // concreto — nunca al revés, o lo específico parece derogar lo común.
    ...(modo === "caso-nuevo" ? [...pasosCasoNuevo(), ``] : []),
    `## Orden y eficiencia (obligatorio)`,
    `- 1º GATE, EN ESTE ORDEN: (a) **calibrate** — \`cd web && rm -rf out && node scripts/build-cases.mjs\`;`,
    `  (b) las 3 sondas UNA vez (validate-schema, audit-consistency, audit-design) para confirmar err=0.`,
    `  NO corras curar-memoria salvo que el drift SEA el objetivo.`,
    `- 2º la CADENA: para cada skill, Read su .md (obligatorio, ver arriba) y luego ejecútalo inline.`,
    `- Ve directo al objetivo; no releas ni inyectes contexto innecesario.`,
    `- Cierre ligero: reporta hallazgos/cambios concretos, cada uno con su señal. NO ejecutes la ceremonia`,
    `  de log/automejora/skill scan salvo que se pida.`,
    `- Regla de oro: cada hallazgo/cambio cita su señal concreta; NUNCA inventes trabajo ni cifras.`,
    ``,
    // El cierre de la corrida anterior se contradecía solo ("Skills invocados:
    // Ninguno" junto a "Skills a mano: simplify, blindar"): en headless NO hay
    // dos formas de correr un skill, así que la distinción no existe.
    `## Cómo reportar los skills (obligatorio)`,
    `- En headless TODO skill se ejecuta inline: no existe "invocado" vs "a mano". Un skill está`,
    `  **ejecutado** si leíste su \`.md\` y aplicaste su disciplina; si no, está **omitido**.`,
    `- Cierra con una línea por skill de la cadena: \`<skill>: ejecutado — <qué miró>\` u \`omitido — <por qué>\`.`,
    `  Nada de listas paralelas que se contradigan.`,
    `- Un hallazgo que decides NO arreglar se reporta igual, con el motivo. Si el motivo es que el arreglo`,
    `  cuesta más que el problema, dilo con la comparación concreta — no con la etiqueta sola.`,
  ];
  if (contexto) p.push(``, `## Señal / foco de esta corrida`, contexto);
  return p.join("\n");
}

/** Un solo camino para todos los modos: mismas reglas, distinto objetivo. */
function promptDeModo(modo, contexto) {
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
    // Consumo en vivo: se llena desde el `usage` de cada mensaje y se cierra con
    // el total del evento `result`. `parcial` avisa de que aún no es la factura.
    tokens: { entrada: 0, salida: 0, cache_lectura: 0, cache_creacion: 0, parcial: false },
    coste_usd: null,
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
  /* TOPE DE DURACIÓN. Una corrida sin objetivo claro no se atasca: se pone a
     inventariar y sigue horas. La de `mejoras-tec` llevaba 14 minutos y 45
     acciones sin tocar un archivo, y nada la habría parado — la maté a mano.
     El tope no juzga la calidad, solo impide que el gasto sea ilimitado. */
  job._timeout = setTimeout(() => {
    if (job.estado !== "corriendo") return;
    job.bloqueo = `Cortada por el panel al superar ${TIMEOUT_MIN} min. `
      + `Si el modo necesita más, dispáralo con una señal acotada o sube CEREBRO_PANEL_TIMEOUT_MIN.`;
    try { child.kill("SIGTERM"); } catch { /* ya murió */ }
  }, TIMEOUT_MIN * 60_000);
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
    clearTimeout(job._timeout);
    if (resto.trim()) eventoDeLinea(resto, job);
    job.exit = code;
    job.estado = code === 0 ? "listo" : "fallo";
    job.fin = new Date().toISOString();
    guardarJobs();
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

/* El polling pedía el job ENTERO cada 1,5 s: la `salida` acumulada y TODOS los
   eventos con su resultado. En una corrida de 45 acciones ya iban cientos de KB
   por tick, creciendo — y la UI solo pinta los últimos 40. Se acota aquí, en el
   serializador, para no tener que cambiar el protocolo: quien necesite el resto
   tiene la salida cruda del propio proceso. */
const MAX_EVENTOS = 60;
const MAX_SALIDA = 24000;
const publico = ({ _child, _corridasAntes, _timeout, archivos, eventos, salida, prompt, ...j }) => ({
  ...j,
  archivos: [...(archivos ?? [])],
  eventos: (eventos ?? []).slice(-MAX_EVENTOS),
  eventosTotal: (eventos ?? []).length,
  salida: (salida ?? "").length > MAX_SALIDA
    ? `…[recortado: ${(salida.length - MAX_SALIDA).toLocaleString("es")} caracteres antes]\n`
      + salida.slice(-MAX_SALIDA)
    : (salida ?? ""),
  // El prompt es grande y constante: viaja solo si se pide explícitamente.
  promptLargo: (prompt ?? "").length,
});

// ── HTTP ──────────────────────────────────────────────────────────────────
const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};

/* Al pasar del tope hacía `req.destroy()` y se quedaba esperando un `end` que ya
   no iba a llegar: la promesa NUNCA resolvía y el handler quedaba colgado para
   siempre — el navegador girando sin recibir nada ni poder detectar el fallo.
   Ahora se resuelve con el error explícito. */
const LIMITE_CUERPO = 1e5;
const leerCuerpo = (req) =>
  new Promise((resolve, reject) => {
    let b = "", cortado = false;
    req.on("data", (d) => {
      if (cortado) return;
      b += d;
      if (b.length > LIMITE_CUERPO) {
        cortado = true; req.destroy();
        reject(Object.assign(new Error("cuerpo demasiado grande"), { http: 413 }));
      }
    });
    req.on("end", () => {
      if (cortado) return;
      try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); }
    });
    req.on("error", () => { if (!cortado) resolve({}); });
  });

/**
 * ¿La petición viene del propio panel? Escuchar solo en loopback protege de la
 * RED, no del NAVEGADOR: cualquier web que visites puede mandarle un POST a
 * 127.0.0.1. Un `fetch` con `content-type: application/json` lo corta el
 * preflight de CORS, pero un `<form enctype="text/plain">` NO hace preflight y
 * puede fabricar un cuerpo que `JSON.parse` acepta — el truco clásico contra
 * APIs JSON que no miran el content-type. Con `/api/fire` detrás, eso es una
 * página cualquiera lanzando Claude con permisos de edición sobre tu repo.
 *
 * Se exige que `Origin` (si viene) sea el propio panel y que el content-type sea
 * JSON: las dos cosas que un formulario cross-origin no puede falsificar.
 */
function mismoOrigen(req) {
  const propios = [`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`];
  const origen = req.headers.origin;
  if (origen && !propios.includes(origen)) return false;
  const ct = String(req.headers["content-type"] || "");
  return ct.includes("application/json");
}

async function manejar(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "POST" && !mismoOrigen(req))
    return json(res, 403, { error: "petición rechazada: no viene del panel" });

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
      obsoleto: servidorObsoleto(),
      timeoutMin: TIMEOUT_MIN,
      // Lo que el panel MIDE, frente a lo que el cerebro cuenta de sí mismo.
      sesion: metricasSesion(),
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
    // El prompt no viaja en cada tick (es grande y constante), pero poder LEER
    // el que se disparó de verdad es la única forma de comprobar que una regla
    // nueva llegó al modelo — sin esto se depura adivinando.
    const p = url.searchParams.get("prompt")
      ? { prompt: job.prompt } : null;
    return json(res, 200, { ...publico(job), ...p });
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
      // Un archivo gitignoreado (p. ej. el mockup de revisión) no produce estado
      // en `git status`, así que salía etiquetado «sin cambios» — falso: existe,
      // es nuevo y es justo lo que hay que MIRAR. Simplemente no se commitea.
      const ignorado = !st && (await git(["check-ignore", "-q", "--", f])).code === 0;
      estados.push({
        archivo: f, ignorado,
        estado: ignorado ? "no versionado" : st ? st.slice(0, 2).trim() : "sin cambios",
      });
    }
    const stat = archivos.length ? (await git(["diff", "--stat", "--", ...archivos])).out : "";
    const revision = await revisarCambios(archivos);
    return json(res, 200, {
      rama, cambios: archivos.length, archivos: estados, stat,
      commit: job.commit ?? null, descartado: !!job.descartado,
      mergeado: !!job.mergeado,
      // Lo que el panel comprueba por su cuenta antes de que apruebes.
      revision, recomendacion: recomendar(archivos, revision),
    });
  }

  /* EL CAMBIO, ANTES DE APROBARLO. El checkpoint listaba nombres de archivo: para
     saber QUÉ había hecho la corrida tenías que irte a la terminal, o commitear a
     ciegas. Un panel que te pide aprobar sin enseñarte qué apruebas convierte la
     revisión en un trámite. Aquí sale el diff real, archivo por archivo.
     Un archivo nuevo no tiene contra qué diferenciarse, así que se compara con el
     vacío (`--no-index`) para que se vea entero como alta. */
  /* Sirve un archivo del repo para la vista previa del mockup. SOLO html/svg —
     lo que tiene sentido renderizar— y siempre dentro del repo (`sanear` corta
     los `..`). El iframe que lo consume va con `sandbox` sin `allow-scripts`:
     este contenido lo escribió un agente, así que se mira, no se ejecuta.
     `X-Content-Type-Options` evita que el navegador adivine otro tipo. */
  if (url.pathname === "/archivo") {
    const [archivo] = sanear([url.searchParams.get("archivo") || ""]);
    if (!archivo || !/\.(html?|svg)$/i.test(archivo))
      return json(res, 400, { error: "solo se previsualizan .html y .svg del repo" });
    try {
      const cuerpo = fs.readFileSync(path.join(repoRoot, archivo));
      res.writeHead(200, {
        "content-type": archivo.toLowerCase().endsWith(".svg")
          ? "image/svg+xml; charset=utf-8" : "text/html; charset=utf-8",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'",
      });
      return res.end(cuerpo);
    } catch (e) { return json(res, 404, { error: `no se pudo leer ${archivo}` }); }
  }

  if (url.pathname === "/api/filediff") {
    const [archivo] = sanear([url.searchParams.get("archivo") || ""]);
    if (!archivo) return json(res, 400, { error: "archivo inválido" });
    const st = (await git(["status", "--porcelain", "--", archivo])).out;
    const nuevo = st.startsWith("??");
    const r = nuevo
      ? await git(["diff", "--no-index", "--", "/dev/null", archivo])
      : await git(["diff", "--", archivo]);
    // `--no-index` devuelve 1 cuando HAY diferencias: eso no es un fallo.
    const salida = r.out || r.err || "";
    return json(res, 200, {
      archivo, nuevo,
      diff: salida.length > 60000 ? salida.slice(0, 60000) + "\n…[diff recortado]" : salida,
      vacio: !salida.trim(),
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
    guardarJobs();
    return json(res, 200, r);
  }

  if (url.pathname === "/api/discard" && req.method === "POST") {
    const { id } = await leerCuerpo(req);
    const job = jobs.get(id);
    if (!job) return json(res, 404, { error: "job no encontrado" });
    if (job.commit) return json(res, 409, { error: "ya fue commiteada; no se puede descartar" });
    job.descartado = true;
    guardarJobs();
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
    const rutas = archivos.map((a) => a.archivo);
    const revision = await revisarCambios(rutas);
    return json(res, 200, { rama, archivos, revision, recomendacion: recomendar(rutas, revision) });
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

  // Mergea la rama commiteada a `main` (ff-only) y pushea. Completa el flujo:
  // commit-en-rama (revisado) → merge a main → deploy. ff-only evita commits de
  // merge y falla claro si main avanzó (en vez de un merge sucio).
  if (url.pathname === "/api/merge" && req.method === "POST") {
    const { rama, id } = await leerCuerpo(req);
    const actual = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).out;
    const branch = (rama && String(rama).trim()) || actual;
    if (["main", "master"].includes(branch))
      return json(res, 400, { error: "esa es la rama base; no hay nada que mergear" });
    // `fetch` ANTES del ff-only: sin esto el merge local pasaba y fallaba el
    // PUSH, dejando `main` local adelantado y el diagnóstico llegando tarde.
    // Comprobado contra el remoto, si `main` avanzó se dice aquí y no se toca
    // nada. `fetch` puede fallar sin red: eso no debe bloquear el aterrizaje.
    const fe = await git(["fetch", "origin", "main"]);
    if (fe.code === 0) {
      const detras = (await git(["rev-list", "--count", "main..origin/main"])).out;
      if (detras && detras !== "0")
        return json(res, 409, {
          error: `main local está ${detras} commit(s) detrás de origin/main. `
            + `Haz \`git pull --ff-only\` antes de aterrizar: si mergeo ahora, el push fallará.`,
        });
    }
    const co = await git(["checkout", "main"]);
    if (co.code !== 0) return json(res, 500, { error: `checkout main falló: ${co.err}` });
    const mg = await git(["merge", "--ff-only", branch]);
    if (mg.code !== 0) {
      await git(["checkout", branch]);   // no dejar al usuario en main a medias
      return json(res, 409, { error: `merge --ff-only falló (¿main avanzó en el remoto?): ${mg.err || mg.out}` });
    }
    const ph = await git(["push", "origin", "main"]);
    if (ph.code !== 0) return json(res, 500, { error: `mergeó pero el push falló: ${ph.err || ph.out}`, merged: true });
    const hash = (await git(["rev-parse", "--short", "HEAD"])).out;
    const job = id && jobs.get(id);
    registrarAterrizaje({ tipo: "merge", hash, rama: branch });
    if (job) { job.mergeado = true; guardarJobs(); }   // enciende el nodo MERGE
    // La rama era un andamio para revisar antes de publicar; cumplido el push ya
    // no aporta nada y se acumulaba una por aterrizaje. `-d` (no `-D`) solo borra
    // si está realmente mergeada: si algo quedó fuera, la rama sobrevive y el
    // aviso queda en la salida en vez de perderse trabajo en silencio.
    const br = await git(["branch", "-d", branch]);
    const limpieza = br.code === 0 ? br.out : `(rama ${branch} conservada: ${br.err || br.out})`;
    return json(res, 200, {
      ok: true, rama: branch, hash,
      salida: `${mg.out}\n${ph.err}\n${limpieza}`.trim(),
    });
  }

  json(res, 404, { error: "no existe" });
}

/* Sin este envoltorio, un throw en cualquier rama dejaba la petición SIN
   RESPUESTA: el navegador esperando para siempre y, como `fetch` no rechaza, ni
   siquiera saltaba el banner de «sin conexión». La red de `unhandledRejection`
   salva el proceso, no la petición. Un 500 con el motivo es infinitamente mejor
   que un silencio. */
const server = http.createServer((req, res) => {
  manejar(req, res).catch((e) => {
    if (e?.http) {                       // fallo esperado (413…): no es un bug
      if (!res.headersSent) json(res, e.http, { error: e.message });
      return res.end();
    }
    logError(`fallo en ${req.method} ${req.url}`, e);
    if (!res.headersSent) json(res, 500, { error: `fallo del panel: ${e?.message || e}` });
    else res.end();
  });
});

// Red de seguridad: un error async no manejado en un handler mataría el panel
// en silencio (el "se cayó"). Con estos oyentes el proceso NO muere: registra el
// fallo en terminal y en `tools/cerebro-panel/panel.log` (gitignored) y sigue vivo.
function bitacora(linea) {
  try {
    fs.appendFileSync(path.join(here, "panel.log"),
      `[${new Date().toISOString()}] ${linea}\n`);
  } catch { /* no romper por no poder loguear */ }
}
function logError(tag, e) {
  process.stderr.write(`\n  ⚠ [panel] ${tag} — ver tools/cerebro-panel/panel.log\n`);
  bitacora(`${tag}: ${e?.stack || e}`);
}
process.on("uncaughtException", (e) => logError("excepción no capturada", e));
process.on("unhandledRejection", (e) => logError("promesa rechazada sin manejar", e));

/* CICLO DE VIDA — por qué esto existe:
   el panel "se caía" y no había forma de saber si había reventado, si alguien
   cerró la ventana o si lo mató el árbol de procesos de quien lo lanzó. Sin
   registro, cada muerte costaba una investigación desde cero. Ahora el arranque
   y CADA salida ordenada quedan escritos, así que la próxima vez la pregunta se
   responde leyendo `panel.log`:
     · hay línea de señal  → alguien/algo lo apagó (ventana cerrada, kill, Ctrl+C);
     · hay línea de excepción → reventó por código;
     · NO hay línea de cierre tras la de arranque → muerte dura (TerminateProcess:
       el harness o el árbol de procesos del lanzador), y ahí la solución es
       lanzarlo desacoplado — para eso está `start.ps1`. */
// Sin acentos ni `·` a propósito: este log se lee en apuros con `Get-Content` o
// el Bloc de notas, que en Windows asumen ANSI y lo mostrarían como mojibake.
for (const s of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"])
  process.on(s, () => { bitacora(`apagado por ${s} | pid ${process.pid}`); process.exit(0); });
process.on("exit", (code) => bitacora(`salida del proceso | code ${code} | pid ${process.pid}`));

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
cargarJobs();          // checkpoints que sobrevivieron al reinicio
cargarAterrizajes();   // y lo que el panel ya mandó al repo

server.listen(PORT, "127.0.0.1", () => {
  bitacora(`arrancado | pid ${process.pid} | puerto ${PORT} | permisos ${PERMISSION_MODE} | jobs ${jobs.size}`);
  console.log(`\n  cerebro-panel  ·  http://127.0.0.1:${PORT}`);
  console.log(`  repo: ${repoRoot}`);
  console.log(`  permisos al disparar: --permission-mode ${PERMISSION_MODE}`);
  console.log(`  (CEREBRO_PANEL_PERMISSION_MODE para cambiarlo)\n`);
});
