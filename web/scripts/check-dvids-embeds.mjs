#!/usr/bin/env node
/**
 * SONDA VIVA · embeds de DVIDS (no corre en prebuild — necesita red).
 *
 * Por qué existe: el visor admite tres orígenes, y DVIDS es el único de un
 * TERCERO. Los otros dos se verifican offline —E17 cruza los assets
 * same-origin contra el disco, E20 cruza el bucket contra un manifiesto
 * commiteado— pero un iframe a dvidshub.net no se puede verificar sin red, y
 * las sondas de build son node-plain offline a propósito.
 *
 * El riesgo concreto que vigila NO es que el video desaparezca (eso daría 404
 * y se vería), sino que DVIDS empiece a mandar `x-frame-options` o un
 * `frame-ancestors`. Eso deja el iframe en blanco SIN romper nada más: la
 * página sigue en 200, el build sigue verde, y el visor queda mudo. Es
 * exactamente el modo de falla silenciosa por el que el invariante original
 * admitía solo dos orígenes; esta sonda es el precio de la excepción.
 *
 * Uso:  node scripts/check-dvids-embeds.mjs [--json]
 * Sale 1 si algún embed dejó de ser embebible. Pensado para daily-audit.yml,
 * igual que check-links.mjs.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DVIDS_EMBED = "https://www.dvidshub.net/video/embed/";
const asJson = process.argv.includes("--json");

// Fuente de verdad: los casos, no una lista aparte. Una lista paralela se
// desincroniza del corpus en el primer caso nuevo que sume un video.
const casesDir = path.join(root, "data", "cases");
const refs = [];
for (const f of fs.readdirSync(casesDir).filter((n) => n.endsWith(".json"))) {
  const c = JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf8"));
  for (const d of c.documents || []) {
    if (typeof d.src === "string" && d.src.startsWith(DVIDS_EMBED)) {
      refs.push({ caseId: c.id, src: d.src, title: d.title });
    }
  }
}

if (refs.length === 0) {
  console.log("check-dvids: no hay embeds de DVIDS en el corpus — nada que verificar.");
  process.exit(0);
}

/** Un embed está sano si responde 2xx y NO declara política anti-framing. */
async function probe({ caseId, src, title }) {
  try {
    const res = await fetch(src, {
      method: "GET", // HEAD no siempre refleja los headers reales en CloudFront
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    });
    const xfo = res.headers.get("x-frame-options");
    const csp = res.headers.get("content-security-policy") || "";
    const ancestors = /frame-ancestors\s+([^;]+)/i.exec(csp);
    // `frame-ancestors *` permite el framing; cualquier otra lista nos excluye
    // (no estamos en ella) y por eso cuenta como bloqueo.
    const blockedByCsp = ancestors ? ancestors[1].trim() !== "*" : false;
    const ok = res.ok && !xfo && !blockedByCsp;
    return {
      caseId,
      src,
      title,
      ok,
      status: res.status,
      reason: !res.ok
        ? `HTTP ${res.status}`
        : xfo
          ? `x-frame-options: ${xfo}`
          : blockedByCsp
            ? `frame-ancestors: ${ancestors[1].trim()}`
            : null,
    };
  } catch (e) {
    // Un fallo de red no prueba que el embed esté roto — se reporta aparte
    // para no volver la sonda intermitente (misma política que check-links).
    return { caseId, src, title, ok: null, status: 0, reason: `red: ${e.message}` };
  }
}

const results = [];
for (const r of refs) results.push(await probe(r));

const broken = results.filter((r) => r.ok === false);
const unreachable = results.filter((r) => r.ok === null);
const healthy = results.filter((r) => r.ok === true);

if (asJson) {
  console.log(JSON.stringify({ healthy: healthy.length, broken, unreachable }, null, 2));
} else {
  console.log(`\ncheck-dvids · ${refs.length} embeds en el corpus`);
  console.log(`  ✅ embebibles: ${healthy.length}`);
  if (unreachable.length) {
    console.log(`  ❓ inalcanzables (no cuentan como rotos): ${unreachable.length}`);
    for (const r of unreachable) console.log(`     ${r.src} (${r.caseId}) — ${r.reason}`);
  }
  if (broken.length) {
    console.log(`  ❌ YA NO SON EMBEBIBLES: ${broken.length}`);
    for (const r of broken) console.log(`     ${r.src} (${r.caseId}) — ${r.reason}`);
    console.log(
      "\n  El visor de esos casos quedó mudo. Opciones: rehostear si apareció una\n" +
        "  rendition que quepa en el bucket, o degradar el documento a enlace.",
    );
  }
  console.log("");
}

process.exit(broken.length > 0 ? 1 : 0);
