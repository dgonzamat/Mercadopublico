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
import {
  repoRoot, readCerebro, parseModes, parseModeTable,
  readRuns, runMetrics, requiredLogFields,
} from "../../web/scripts/lib/cerebro-contract.mjs";

const here = path.dirname(new URL(import.meta.url).pathname);
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
        job.eventos.push({
          t: new Date().toISOString(),
          tool: b.name,
          detalle: `${b.name} ${input}`.slice(0, 400),
        });
      }
    }
  }
  if (e.type === "result") {
    job.resultado = {
      subtype: e.subtype, duracion_ms: e.duration_ms,
      coste_usd: e.total_cost_usd, turnos: e.num_turns,
    };
    if (e.result && !job.salida.includes(e.result)) job.salida += "\n" + e.result;
  }
}

/** Dispara `claude -p "/cerebro <modo>"`. Devuelve el id del job. */
function dispararCerebro(modo, contexto) {
  const id = `job-${++seq}`;
  const prompt = contexto
    ? `/cerebro ${modo}\n\nContexto del panel (hallazgo a atacar):\n${contexto}`
    : `/cerebro ${modo}`;
  // stream-json en vez de texto: es lo que permite ver la orquestación MOVERSE.
  // `--verbose` es obligatorio con stream-json en modo -p.
  const args = ["-p", prompt, "--permission-mode", PERMISSION_MODE,
                "--output-format", "stream-json", "--verbose"];
  const job = {
    id, modo, contexto: contexto || null, prompt,
    estado: "corriendo", inicio: new Date().toISOString(), fin: null,
    exit: null, salida: "", eventos: [], resultado: null,
    // Corridas registradas ANTES de disparar: al cerrar se compara para saber
    // si esta corrida cumplió el cierre obligatorio (log, automejora, skill scan).
    _corridasAntes: readRuns().corridas.length,
    rastro: null,
  };
  jobs.set(id, job);

  let child;
  try {
    // stdin CERRADO, no heredado: `claude -p` espera 3 s a que llegue algo por
    // stdin antes de rendirse ("no stdin data received in 3s"). El prompt viaja
    // en argv, así que no hay nada que mandarle — cerrarlo ahorra ese stall en
    // cada disparo. Visto en el primer disparo real desde el panel.
    child = spawn("claude", args, {
      cwd: repoRoot, env: process.env, stdio: ["ignore", "pipe", "pipe"],
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

const publico = ({ _child, _corridasAntes, ...j }) => j;

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

  json(res, 404, { error: "no existe" });
});

// Solo loopback: el panel ejecuta `claude` con permisos de edición sobre el
// repo. Exponerlo a la red sería dar una shell.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  cerebro-panel  ·  http://127.0.0.1:${PORT}`);
  console.log(`  repo: ${repoRoot}`);
  console.log(`  permisos al disparar: --permission-mode ${PERMISSION_MODE}`);
  console.log(`  (CEREBRO_PANEL_PERMISSION_MODE para cambiarlo)\n`);
});
