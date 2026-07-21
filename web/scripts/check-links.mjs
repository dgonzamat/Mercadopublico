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
 *   node scripts/check-links.mjs --baseline   # GATE: falla solo con roturas NUEVAS
 *   node scripts/check-links.mjs --update-baseline  # congela las roturas actuales
 *
 * SALIDA: lista de URLs muertas/redirigidas. exit 0 por defecto (informativo).
 * `--strict` da exit 1 si hay cualquier muerta (rojo permanente mientras el
 * corpus arrastre link rot); `--baseline` es el modo pensado para CI: compara
 * contra data/link-health-baseline.json y solo falla con las NUEVAS.
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
const BASELINE = process.argv.includes("--baseline");
const UPDATE_BASELINE = process.argv.includes("--update-baseline");
const BASELINE_PATH = path.join(root, "data", "link-health-baseline.json");
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
const hardDead = []; // {url, status, origins} — 4xx/5xx: rotura real del recurso
const transient = []; // {url, error, origins} — timeout / dominio caído: puede ser pasajero
const dubious = []; // {url, status, origins} — 403/429: anti-bot, probablemente vivas
const alive = new Set();
let done = 0;

async function worker(queue) {
  while (queue.length) {
    const url = queue.pop();
    const r = await probe(url);
    done++;
    const origins = [...urls.get(url)];
    if (r.status === 0) {
      transient.push({ url, error: r.error, origins });
    } else if (r.status >= 400 && r.status !== 403 && r.status !== 429) {
      hardDead.push({ url, status: r.status, origins });
    } else if (r.status === 403 || r.status === 429) {
      dubious.push({ url, status: r.status, origins });
    } else {
      alive.add(url);
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
const fmt = (d) =>
  `[${d.status ?? d.error}] ${d.url}  (${d.origins.join(", ")})`;

console.log("");
if (hardDead.length) {
  console.log(`🔴 ${hardDead.length} fuentes muertas (4xx/5xx):`);
  for (const d of hardDead) console.log("   ✗ " + fmt(d));
} else {
  console.log("✅ Sin fuentes muertas.");
}
if (transient.length) {
  console.log("");
  console.log(
    `🟠 ${transient.length} inalcanzables (timeout / dominio caído — puede ser pasajero; reverificar antes de reescribir la cita):`,
  );
  for (const d of transient) console.log("   ~ " + fmt(d));
}
if (dubious.length) {
  console.log("");
  console.log(
    `🟡 ${dubious.length} dudosas (403/429 — bloqueo de bot, probablemente vivas; revisar a mano):`,
  );
  for (const d of dubious.slice(0, 40)) console.log("   ? " + fmt(d));
  if (dubious.length > 40) console.log(`   … y ${dubious.length - 40} más`);
}
console.log("");

// ─── Línea base ──────────────────────────────────────────────────────────
// El corpus arrastra decenas de fuentes ya rotas (link rot normal: los
// gobiernos reorganizan sus sitios). Un gate binario sobre `hardDead` sería
// rojo permanente y se ignoraría, así que el guardrail compara contra una
// LÍNEA BASE CONGELADA de las roturas ya conocidas y solo falla con las
// NUEVAS. Se indexa POR URL, no por conteo: si se arregla una cita y se
// rompe otra el total no se mueve, y un gate por conteo no vería nada.
//
// Las `transient` NO entran al gate — un timeout puntual no es link rot y
// haría el check intermitente. Las `dubious` (403) tampoco: son anti-bot.

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try {
    const b = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
    return b && typeof b.dead === "object" ? b : null;
  } catch {
    return null;
  }
}

function writeBaseline() {
  const dead = {};
  for (const d of [...hardDead].sort((a, b) => a.url.localeCompare(b.url))) {
    dead[d.url] = { status: d.status, origins: d.origins.sort() };
  }
  const payload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    note: "Línea base de link rot conocido. Regenerar solo tras arreglar citas: node scripts/check-links.mjs --update-baseline. El gate (--baseline) falla con roturas NUEVAS, no con estas.",
    totalUrls: urls.size,
    deadCount: hardDead.length,
    dead,
  };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `📌 Línea base escrita: ${hardDead.length} fuentes rotas conocidas → ${path.relative(root, BASELINE_PATH)}`,
  );
}

if (UPDATE_BASELINE) {
  if (LIMIT !== Infinity) {
    console.error(
      "✗ --update-baseline requiere una corrida COMPLETA (sin --limit): con un muestreo la línea base omitiría roturas y el gate las reportaría como nuevas.",
    );
    process.exit(2);
  }
  writeBaseline();
  process.exit(0);
}

if (BASELINE) {
  const base = readBaseline();
  if (!base) {
    console.error(
      `✗ Falta o es ilegible la línea base (${path.relative(root, BASELINE_PATH)}). Generarla con: node scripts/check-links.mjs --update-baseline`,
    );
    process.exit(2);
  }
  const known = new Set(Object.keys(base.dead));
  const newRot = hardDead.filter((d) => !known.has(d.url));
  const healed = [...known].filter((u) => alive.has(u));

  console.log(
    `─ Gate de link rot ── línea base ${base.generatedAt}: ${known.size} conocidas · ahora ${hardDead.length} rotas ─`,
  );
  if (healed.length) {
    console.log(
      `✅ ${healed.length} fuente(s) de la línea base revivieron — bajar la línea base con --update-baseline para que el progreso quede fijado:`,
    );
    for (const u of healed) console.log("   ✓ " + u);
    console.log("");
  }
  if (newRot.length) {
    console.log(`🔴 ${newRot.length} fuente(s) rotas NUEVAS (no estaban en la línea base):`);
    for (const d of newRot) console.log("   ✗ " + fmt(d));
    console.log("");
    console.log(
      "Ruta: es link rot normal — mover a Wayback (web.archive.org/web/<url>) conservando la URL original en `note`, no borrar la cita. Si la rotura es legítima y permanente, congélala con --update-baseline.",
    );
    process.exit(1);
  }
  console.log("✅ Sin roturas nuevas respecto a la línea base.");
  console.log("");
}

if (STRICT && hardDead.length) process.exit(1);
