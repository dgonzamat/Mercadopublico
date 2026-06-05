#!/usr/bin/env node
/**
 * Discovery diario de candidatos a casos UAP nuevos.
 *
 * Monitorea 3 fuentes estructuradas (API limpia, sin scrape frágil):
 *
 *   1. arXiv  → papers con UAP/UFO/anomalous-aerial-phenomena en abstract
 *   2. GitHub → repos públicos con topic UFO/UAP creados recientemente
 *   3. Hugging Face → datasets nuevos con keywords UAP/UFO
 *
 * Output:
 *   - exit 0 si NO hay candidatos del último día → workflow termina sin issue
 *   - exit 0 imprimiendo JSON en /tmp/discover.json si hay candidatos
 *   - el workflow lee ese JSON y abre un issue agrupado
 *
 * NO usa LLM. NO requiere API keys. Solo detecta novedades; el juicio
 * editorial (entra al corpus o no) lo hace la rutina cowork sobre el
 * issue que abre este workflow.
 */
import fs from "node:fs";

const HOURS_WINDOW = 30;          // mira items de las últimas 30h (cron diario + margen)
const cutoff = new Date(Date.now() - HOURS_WINDOW * 3600 * 1000);

const candidates = [];

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}
async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.text();
}

// ─── 1. arXiv ──────────────────────────────────────────────────────────────
try {
  const query = encodeURIComponent(
    'abs:"UAP" OR abs:"UFO" OR abs:"unidentified aerial phenomena" OR abs:"anomalous aerial phenomena"',
  );
  const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=20`;
  const xml = await fetchText(url);
  const entries = xml.split("<entry>").slice(1);
  for (const e of entries) {
    const get = (tag) => {
      const m = e.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : "";
    };
    const published = new Date(get("published"));
    if (published < cutoff) continue;
    candidates.push({
      source: "arXiv",
      title: get("title").replace(/\s+/g, " "),
      url: (e.match(/<id>([^<]+)<\/id>/) || [])[1] || "",
      date: published.toISOString().slice(0, 10),
      note: get("summary").slice(0, 220).replace(/\s+/g, " ") + "…",
    });
  }
} catch (err) {
  console.error("arXiv:", err.message);
}

// ─── 2. GitHub repos ─────────────────────────────────────────────────────────────────
try {
  const since = cutoff.toISOString().slice(0, 10);
  const queries = [
    `topic:ufo+pushed:>${since}`,
    `topic:uap+pushed:>${since}`,
    `UAP+FOIA+in:name,description+pushed:>${since}`,
  ];
  for (const q of queries) {
    const url = `https://api.github.com/search/repositories?q=${q}&sort=updated&per_page=10`;
    const data = await fetchJSON(url, {
      headers: { Accept: "application/vnd.github+json" },
    });
    for (const repo of data.items || []) {
      const updated = new Date(repo.updated_at);
      if (updated < cutoff) continue;
      candidates.push({
        source: "GitHub",
        title: `${repo.full_name} — ${repo.description || "(sin descripción)"}`,
        url: repo.html_url,
        date: updated.toISOString().slice(0, 10),
        note: `★${repo.stargazers_count} · lang ${repo.language || "n/a"}`,
      });
    }
  }
} catch (err) {
  console.error("GitHub:", err.message);
}

// ─── 3. Hugging Face datasets ─────────────────────────────────────────────────────────────
try {
  for (const term of ["UAP", "UFO"]) {
    const url = `https://huggingface.co/api/datasets?search=${term}&sort=lastModified&direction=-1&limit=10`;
    const data = await fetchJSON(url);
    for (const ds of data) {
      const updated = new Date(ds.lastModified || ds.createdAt || 0);
      if (updated < cutoff) continue;
      candidates.push({
        source: "HuggingFace",
        title: ds.id,
        url: `https://huggingface.co/datasets/${ds.id}`,
        date: updated.toISOString().slice(0, 10),
        note: `downloads: ${ds.downloads || 0}`,
      });
    }
  }
} catch (err) {
  console.error("HuggingFace:", err.message);
}

// ─── Dedupe por URL y output ───────────────────────────────────────────────────────────
const seen = new Set();
const unique = candidates.filter((c) =>
  c.url && !seen.has(c.url) && seen.add(c.url),
);

console.log(`Discovered ${unique.length} candidates in last ${HOURS_WINDOW}h`);
for (const c of unique) console.log(`  [${c.source}] ${c.date} ${c.title.slice(0, 80)}`);

fs.writeFileSync("/tmp/discover.json", JSON.stringify(unique, null, 2));
