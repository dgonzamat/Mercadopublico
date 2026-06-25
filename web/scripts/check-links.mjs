#!/usr/bin/env node
/**
 * Link-rot checker — verifica que las URLs de `sources` de casos e
 * investigadores sigan vivas. NO corre en prebuild (depende de la red y de
 * servicios externos): es una herramienta bajo demanda para mantenimiento de
 * citas en un notebook de investigación, donde una fuente muerta degrada el
 * valor probatorio.
 *
 * USO:
 *   node scripts/check-links.mjs              # revisa todas las fuentes
 *   node scripts/check-links.mjs --limit 50   # primeras N URLs (muestreo)
 *   node scripts/check-links.mjs --timeout 8  # timeout por URL en segundos
 *
 * SALIDA: lista de URLs muertas/redirigidas. exit 0 siempre (informativo);
 * úsese --strict para exit 1 si hay muertas (p. ej. en un cron de auditoría).
 *
 * NOTA: muchos sitios (gov, archivos) responden 403 a HEAD o a user-agents no
 * navegador. Se intenta HEAD y, si falla con método/403, GET con un UA de
 * navegador. Un 403/405 tras ambos intentos se marca como DUDOSO, no muerto.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const arg = (flag, def) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const LIMIT = Number(arg("--limit", "0")) || Infinity;
const TIMEOUT_MS = Number(arg("--timeout", "10")) * 1000;
const STRICT = process.argv.includes("--strict");
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0 Safari/537.36";

// ─── Recolectar URLs de fuentes ──────────────────────────────────────────
const casesDir = path.join(root, "data", "cases");
const cases = fs
  .readdirSync(casesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8")));
const researchers = JSON.parse(
  fs.readFileSync(path.join(root, "data", "researchers.json"), "utf-8"),
);

const urls = new Map(); // url → Set(origen)
const addSources = (sources, origin) => {
  for (const s of sources || []) {
    const u = typeof s === "string" ? s : s && s.url;
    if (u && /^https?:\/\//.test(u)) {
      if (!urls.has(u)) urls.set(u, new Set());
      urls.get(u).add(origin);
    }
  }
};
for (const c of cases) addSources(c.sources, `case:${c.id}`);
for (const r of researchers) addSources(r.sources, `researcher:${r.id}`);

const allUrls = [...urls.keys()].slice(0, LIMIT);
console.log(
  `check-links: ${urls.size} URLs únicas en ${cases.length} casos + ${researchers.length} investigadores` +
    (LIMIT !== Infinity ? ` (revisando ${allUrls.length})` : ""),
);

// ─── Chequear una URL (HEAD, fallback GET) ───────────────────────────────
async function probe(url) {
  const tryFetch = async (method) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "user-agent": UA },
      });
      return { status: res.status, finalUrl: res.url };
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let r = await tryFetch("HEAD");
    if (r.status === 405 || r.status === 403 || r.status === 501) {
      r = await tryFetch("GET"); // algunos servidores rechazan HEAD
    }
    return r;
  } catch (e) {
    return { status: 0, error: e.name === "AbortError" ? "timeout" : e.message };
  }
}

// ─── Concurrencia limitada ───────────────────────────────────────────────
const CONCURRENCY = 8;
const dead = [];
const dubious = [];
let done = 0;

async function worker(queue) {
  while (queue.length) {
    const url = queue.pop();
    const r = await probe(url);
    done++;
    const origins = [...urls.get(url)].join(", ");
    if (r.status === 0) {
      dead.push(`✗ [${r.error}] ${url}  (${origins})`);
    } else if (r.status >= 400 && r.status !== 403 && r.status !== 429) {
      dead.push(`✗ [${r.status}] ${url}  (${origins})`);
    } else if (r.status === 403 || r.status === 429) {
      dubious.push(`? [${r.status}] ${url}  (${origins})`);
    }
    if (done % 25 === 0) console.log(`  … ${done}/${allUrls.length}`);
  }
}

const queue = [...allUrls];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () =>
    worker(queue),
  ),
);

// ─── Reporte ─────────────────────────────────────────────────────────────
console.log("");
if (dead.length) {
  console.log(`🔴 ${dead.length} fuentes muertas:`);
  for (const d of dead) console.log("   " + d);
} else {
  console.log("✅ Sin fuentes muertas.");
}
if (dubious.length) {
  console.log("");
  console.log(
    `🟡 ${dubious.length} dudosas (403/429 — bloqueo de bot, probablemente vivas; revisar a mano):`,
  );
  for (const d of dubious.slice(0, 40)) console.log("   " + d);
  if (dubious.length > 40) console.log(`   … y ${dubious.length - 40} más`);
}
console.log("");

if (STRICT && dead.length) process.exit(1);
