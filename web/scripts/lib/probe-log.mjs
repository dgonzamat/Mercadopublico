/**
 * probe-log.mjs — registro de lo que las sondas FRENAN en local.
 *
 * Los fallos de la integración continua quedan en los logs de GitHub, pero lo
 * que una sonda frena antes de un commit (el hook de validación al editar una
 * ficha, las auditorías que se corren antes de publicar) no deja rastro. Sin
 * ese rastro no se puede saber qué regla da valor: la medición del 17 nov 2026
 * sobre 2.345 corridas de CI solo vio las reglas de estructura, y las de prosa
 * —que frenaron párrafos largos en tres fichas esa misma semana— no aparecían.
 *
 * Cada ERROR se anota una sola vez por día, sonda, regla y archivo en
 * `data/probe-hits.jsonl` (versionado, para que sobreviva a las sesiones).
 * No escribe en CI (`CI` definido) ni con `PROBE_LOG=0`, que es lo que debe
 * usar un control negativo para no ensuciar el registro.
 * Resumen: `npm run sondas:frenos`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LOG = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "probe-hits.jsonl");

/** @param {string} probe  @param {{rule: string, where: string}[]} hits */
export function logProbeHits(probe, hits) {
  if (!hits.length || process.env.CI || process.env.PROBE_LOG === "0") return;
  try {
    const date = new Date().toISOString().slice(0, 10);
    const seen = new Set();
    if (fs.existsSync(LOG)) {
      for (const l of fs.readFileSync(LOG, "utf8").split("\n")) {
        if (!l.startsWith(`{"date":"${date}"`)) continue;
        try {
          const r = JSON.parse(l);
          seen.add(`${r.probe}|${r.rule}|${r.where}`);
        } catch {}
      }
    }
    const lines = [];
    for (const h of hits) {
      const key = `${probe}|${h.rule}|${h.where}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(JSON.stringify({ date, probe, rule: h.rule, where: h.where }));
    }
    if (lines.length) fs.appendFileSync(LOG, lines.join("\n") + "\n");
  } catch {
    // El registro nunca debe romper la sonda que lo llama.
  }
}

/** Identificador de regla dentro de un mensaje de audit-consistency (E59, E7b, M2…). */
export const ruleOf = (msg) => (msg.match(/\b(E\d+[a-d]?|M\d|D\d)\b/) || [])[1] ?? "sin-id";
