#!/usr/bin/env node
/**
 * Resolutor de link rot vía Wayback Machine — convierte la línea base de
 * fuentes rotas (`data/link-health-baseline.json`) en reemplazos concretos.
 *
 * Por qué existe: arreglar las citas muertas a mano es N tareas de
 * investigación idénticas (buscar la URL en Wayback, sustituirla, conservar
 * la original). Eso es mecanizable; lo que NO lo es es decidir si el
 * snapshot que devuelve Wayback es realmente el documento citado. Por eso el
 * script separa las dos cosas: propone en lote, un humano revisa el archivo
 * de propuestas, y solo entonces se aplica.
 *
 * USO:
 *   node scripts/suggest-wayback.mjs             # propone → data/wayback-proposals.json
 *   node scripts/suggest-wayback.mjs --apply     # aplica las propuestas ya revisadas
 *
 * FLUJO:
 *   1. Correr sin flags. Consulta la API de disponibilidad de Wayback por
 *      cada URL rota de la línea base y escribe las propuestas.
 *   2. REVISAR data/wayback-proposals.json a mano: poner `"approved": false`
 *      en las que no correspondan al documento citado (Wayback a veces
 *      archiva una página de error o un redirect genérico del dominio).
 *   3. Correr con --apply. Solo toca las `approved !== false`.
 *   4. `npm run check-links:baseline` para recongelar la línea base ya sin
 *      las arregladas — el contador baja y el progreso queda fijado.
 *
 * INVARIANTE: la URL original NUNCA se borra, se preserva en `note`/`note_en`.
 * Una cita es un dato histórico: dónde estaba el documento importa aunque el
 * servidor ya no responda. Además `audit-consistency.mjs` E26 exige que toda
 * `note` (ES) tenga su par `note_en`, así que se escriben siempre las dos.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const APPLY = process.argv.includes("--apply");
const BASELINE_PATH = path.join(root, "data", "link-health-baseline.json");
const PROPOSALS_PATH = path.join(root, "data", "wayback-proposals.json");
const casesDir = path.join(root, "data", "cases");
const researchersPath = path.join(root, "data", "researchers.json");

const arg = (flag, def) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const TIMEOUT_MS = Number(arg("--timeout", "15")) * 1000;

// ─── Modo PROPONER ───────────────────────────────────────────────────────

/**
 * Consulta la CDX API, NO `/wayback/available`: esta última devuelve 200 con
 * `archived_snapshots: {}` aunque existan capturas (falso "sin snapshot" en
 * 43 de 55 URLs al probarla, jul 2026). CDX lista las capturas reales con su
 * statuscode, que además es lo que permite distinguir link rot de una cita
 * que nunca fue válida.
 *
 * Devuelve una de tres clases:
 *   {kind:"rot"}    hay captura 200 → reemplazo mecánico
 *   {kind:"bad"}    hay capturas, pero ninguna 200 → la URL ya estaba rota
 *                   cuando se archivó: la cita es errónea, no se pudrió
 *   {kind:"never"}  cero capturas → Wayback no ayuda, investigación manual
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * archive.org corta conexiones bajo carga: con concurrencia 4 y sin
 * reintentos, 39 de 55 consultas fallaron con `fetch failed`/timeout y se
 * habrían leído como "sin captura" — un falso negativo que mandaría a
 * investigación manual URLs perfectamente archivadas. De ahí el backoff.
 */
async function askWayback(url, attempt = 0) {
  const MAX_ATTEMPTS = 4;
  // limit=-200, no -20: las últimas capturas de una página muerta son todas
  // 404 y la última BUENA puede estar años atrás (nationalarchives murió
  // después de 2023; con -20 no se alcanzaba y se elegía basura).
  const api =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&fl=timestamp,original,statuscode&limit=-200`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const retry = async (reason) => {
    if (attempt + 1 >= MAX_ATTEMPTS) return { kind: "error", reason };
    await sleep(1500 * 2 ** attempt); // 1,5s · 3s · 6s
    return askWayback(url, attempt + 1);
  };
  try {
    const res = await fetch(api, { signal: ctrl.signal });
    if (res.status === 429 || res.status >= 500)
      return await retry(`CDX ${res.status}`);
    if (!res.ok) return { kind: "error", reason: `CDX ${res.status}` };
    const rows = JSON.parse(await res.text());
    // Primera fila = cabeceras; sin filas de datos = nunca se archivó.
    const data = Array.isArray(rows) ? rows.slice(1) : [];
    if (!data.length) return { kind: "never" };
    // SOLO 200 explícito. Los "-" son revisit records ("mismo contenido que
    // la captura anterior") y si aquella era un 404, el revisit también lo
    // es — aceptarlos hizo que se propusieran 4 reemplazos rotos (jul 2026).
    const ok = data.filter(([, , sc]) => sc === "200");
    if (!ok.length)
      return { kind: "bad", codes: [...new Set(data.map(([, , sc]) => sc))] };
    // Las filas van de más antigua a más reciente: la última 200 es la
    // captura viva más fresca. Se usa `original` (la URL tal como Wayback
    // la archivó), no la consultada: difieren en esquema/barra final y el
    // replay exige la forma exacta.
    const [timestamp, original] = ok[ok.length - 1];
    return {
      kind: "rot",
      url: `https://web.archive.org/web/${timestamp}/${original}`,
      timestamp,
      captures: data.length,
    };
  } catch (e) {
    // `fetch failed` y timeout son la firma del throttling, no de ausencia
    // de datos — reintentar antes de declarar nada.
    return await retry(e.name === "AbortError" ? "timeout" : e.message);
  } finally {
    clearTimeout(timer);
  }
}

/** Comprueba que una URL de replay de Wayback responda de verdad. */
async function verify(url) {
  const UA =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0 Safari/537.36";
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "user-agent": UA },
        signal: ctrl.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * 2 ** attempt);
        continue; // throttling, no veredicto
      }
      return res.status < 400;
    } catch {
      await sleep(2000 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  return false; // sin confirmación ⇒ no se propone
}

async function propose() {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(
      "✗ Falta data/link-health-baseline.json. Generarla con: npm run check-links:baseline",
    );
    process.exit(2);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
  const entries = Object.entries(baseline.dead);
  console.log(
    `suggest-wayback: consultando Wayback por ${entries.length} fuentes rotas…`,
  );

  // Concurrencia 2 + pausa entre consultas: archive.org tira la conexión
  // bajo carga y la lista es de decenas, no de miles — la lentitud no
  // importa, los falsos "sin captura" sí.
  const CONCURRENCY = 2;
  const proposals = [];
  const queue = [...entries];
  let done = 0;

  async function worker() {
    while (queue.length) {
      const [url, meta] = queue.shift();
      let snap = await askWayback(url);
      await sleep(400); // no encadenar consultas sin respirar
      // VERIFICAR el reemplazo antes de proponerlo. Confiar en el índice CDX
      // sin comprobar el replay produjo 4 propuestas rotas que habrían
      // sustituido citas muertas por otras igual de muertas — el peor
      // resultado posible: la línea base baja y la evidencia no mejora.
      if (snap.kind === "rot") {
        const live = await verify(snap.url);
        if (!live) snap = { kind: "bad", codes: ["replay roto"] };
        await sleep(400);
      }
      done++;
      if (done % 10 === 0) console.log(`  … ${done}/${entries.length}`);
      const base = { original: url, status: meta.status, origins: meta.origins };
      if (snap.kind === "rot") {
        proposals.push({
          ...base,
          kind: "rot",
          found: true,
          approved: true, // poner false a mano para descartar
          wayback: snap.url,
          snapshotDate: `${snap.timestamp.slice(0, 4)}-${snap.timestamp.slice(4, 6)}-${snap.timestamp.slice(6, 8)}`,
          captures: snap.captures,
        });
      } else {
        proposals.push({
          ...base,
          kind: snap.kind,
          found: false,
          reason:
            snap.kind === "bad"
              ? `capturada solo con ${snap.codes.join("/")} — la URL ya estaba rota al archivarse: cita probablemente errónea, no link rot`
              : snap.kind === "never"
                ? "sin ninguna captura en Wayback — requiere investigación manual"
                : snap.reason,
        });
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
  );

  // Ordenar por leverage: primero las citadas por más casos — arreglar una
  // URL compartida cierra varias citas de un golpe.
  proposals.sort(
    (a, b) =>
      b.origins.length - a.origins.length ||
      a.original.localeCompare(b.original),
  );

  const found = proposals.filter((p) => p.kind === "rot");
  const bad = proposals.filter((p) => p.kind === "bad");
  const never = proposals.filter((p) => p.kind === "never");
  const errored = proposals.filter((p) => p.kind === "error");

  fs.writeFileSync(
    PROPOSALS_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString().slice(0, 10),
        note: "REVISAR a mano antes de aplicar: poner \"approved\": false en las propuestas cuyo snapshot no sea el documento citado. Luego: node scripts/suggest-wayback.mjs --apply",
        total: proposals.length,
        withSnapshot: found.length,
        byKind: { rot: found.length, bad: bad.length, never: never.length },
        proposals,
      },
      null,
      2,
    ) + "\n",
  );

  console.log("");
  console.log(`─ ${proposals.length} fuentes rotas, en tres clases ─`);
  console.log(`  🔧 ${found.length} link rot con captura 200 → reemplazo mecánico`);
  console.log(`  ⚠️  ${bad.length} capturadas solo con error → la cita nunca fue válida`);
  console.log(`  🔍 ${never.length} sin ninguna captura → investigación manual`);
  if (errored.length) console.log(`  ✗ ${errored.length} la CDX API falló (reintentar)`);

  if (found.length) {
    console.log("");
    console.log("🔧 Arreglables, por leverage (nº de casos que citan la URL):");
    for (const p of found.slice(0, 10)) {
      console.log(
        `   · ${p.origins.length}× ${p.original}\n       → ${p.wayback} (${p.snapshotDate})`,
      );
    }
    if (found.length > 10) console.log(`   … y ${found.length - 10} más`);
  }
  if (bad.length) {
    console.log("");
    console.log(
      "⚠️  Cita probablemente errónea — Wayback la archivó ya rota, así que no se «pudrió»:",
    );
    for (const p of bad) console.log(`   · ${p.origins.length}× ${p.original}`);
  }
  if (never.length) {
    console.log("");
    console.log("🔍 Sin captura en Wayback — investigación manual:");
    for (const p of never) console.log(`   · ${p.origins.length}× ${p.original}`);
  }
  console.log("");
  console.log(
    `📝 Propuestas → ${path.relative(root, PROPOSALS_PATH)}\n   REVISARLAS y luego: node scripts/suggest-wayback.mjs --apply`,
  );
}

// ─── Modo APLICAR ────────────────────────────────────────────────────────

/** Inyecta la URL original en note/note_en sin pisar una nota existente. */
function preserveOriginal(source, originalUrl) {
  const es = `Original (enlace caído): ${originalUrl}`;
  const en = `Original (dead link): ${originalUrl}`;
  // Capturar AMBAS antes de mutar: escribir note primero y leer note_en
  // después haría que la nota inglesa heredara la española ya modificada.
  const prevEs = source.note;
  const prevEn = source.note_en;
  source.note = prevEs ? `${prevEs} · ${es}` : es;
  // E26: toda `note` (ES) necesita su par `note_en`, así que se escribe
  // siempre — si la fuente tenía note sin par, este es el momento de cerrarlo.
  source.note_en = prevEn ? `${prevEn} · ${en}` : en;
  return source;
}

function apply() {
  if (!fs.existsSync(PROPOSALS_PATH)) {
    console.error(
      "✗ Falta data/wayback-proposals.json. Generarlo primero: node scripts/suggest-wayback.mjs",
    );
    process.exit(2);
  }
  const { proposals } = JSON.parse(fs.readFileSync(PROPOSALS_PATH, "utf-8"));
  const active = proposals.filter((p) => p.found && p.approved !== false);
  const skipped = proposals.filter((p) => p.found && p.approved === false);

  if (!active.length) {
    console.log("Nada que aplicar (ninguna propuesta aprobada).");
    return;
  }

  const byUrl = new Map(active.map((p) => [p.original, p]));
  let edits = 0;
  const touched = new Set();

  const patchSources = (obj) => {
    let changed = false;
    for (const s of obj.sources || []) {
      if (!s || typeof s.url !== "string") continue;
      const p = byUrl.get(s.url);
      if (!p) continue;
      preserveOriginal(s, s.url);
      s.url = p.wayback;
      changed = true;
      edits++;
    }
    return changed;
  };

  for (const f of fs.readdirSync(casesDir).filter((n) => n.endsWith(".json"))) {
    const fp = path.join(casesDir, f);
    const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
    if (patchSources(data)) {
      fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n");
      touched.add(`case:${data.id}`);
    }
  }

  const researchers = JSON.parse(fs.readFileSync(researchersPath, "utf-8"));
  let rChanged = false;
  for (const r of researchers) if (patchSources(r)) { rChanged = true; touched.add(`researcher:${r.id}`); }
  if (rChanged)
    fs.writeFileSync(researchersPath, JSON.stringify(researchers, null, 2) + "\n");

  console.log(`✅ ${edits} cita(s) reapuntadas a Wayback en ${touched.size} archivo(s).`);
  if (skipped.length) console.log(`   (${skipped.length} descartadas a mano con approved:false)`);
  console.log("");
  console.log("Siguiente paso — recongelar la línea base ya sin las arregladas:");
  console.log("   npm run check-links:baseline");
}

if (APPLY) apply();
else await propose();
