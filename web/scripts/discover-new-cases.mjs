#!/usr/bin/env node
/**
 * Discovery diario de candidatos a casos UAP nuevos.
 *
 * Monitorea fuentes donde SÍ ocurren los hechos que el corpus documenta:
 * documentos institucionales, prensa de defensa y literatura científica.
 *
 *   1. Federal Register → avisos/reglas de agencias federales que mencionan UAP
 *   2. Prensa de defensa y del área (RSS) → DefenseScoop, The Debrief, Liberation Times
 *   3. arXiv → papers con UAP/UFO/anomalous-aerial-phenomena en abstract
 *
 * Por qué estas fuentes y no otras (sep 2026): el detector monitoreaba antes
 * repos de GitHub y datasets de Hugging Face. Esas fuentes no pueden producir
 * candidatos por construcción —un repo no es un avistamiento, un testimonio ni
 * un documento desclasificado—: en trece días generaron ~100 candidatos y
 * ninguno era un evento UAP (visualizadores, archivos de releases PURSUE ya
 * conocidos, un editor de fuentes que caía por su nombre, proyectos de Docker
 * sin relación). Es el mismo antipatrón de fatiga de alerta que ya forzó a
 * consolidar el issue de link rot, en versión peor: no es que la señal sea
 * ruidosa, es que la fuente no contiene la señal. Todos los hallazgos reales
 * de las últimas semanas —la suscripción de AARO al archivo NUFOHRC, la
 * declaración del ICIG sobre la filtración del testimonio de Borland, la guía
 * de la ODNI sobre NDAs— salieron de prensa de defensa y avisos federales.
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

// Términos que marcan un item como relevante. Deliberadamente ESTRECHOS: las
// fuentes generalistas (DefenseScoop cubre toda la defensa, The Debrief toda
// la ciencia) traen mayoría de material ajeno, y un filtro laxo reproduce el
// problema que este rediseño vino a resolver. Sin "extraterrestrial" ni
// "anomaly" sueltos, que arrastran astrobiología y detección de fallas; sin
// "pursue" suelto, que es una palabra inglesa común antes que el task force.
const UAP_TERMS = [
  /\bUAPs?\b/i,
  /\bUFOs?\b/i,
  /\bAARO\b/i,
  /unidentified\s+(anomalous|aerial|flying)\b/i,
  /anomalous\s+phenomena\b/i,
  /non-?human\s+intelligence\b/i,
];
const isRelevant = (text) => UAP_TERMS.some((re) => re.test(text));

// Matcher ESTRICTO para literatura científica. En arXiv los acrónimos sueltos
// no sirven porque están tomados por otros campos: en astronomía de rayos X
// "UFO" es *ultra-fast outflow* (domina los resultados: PDS 456, NGC 4151,
// vientos de disco en AGN), en automoción es una plataforma robótica de
// pruebas, y en machine learning "UAP" es *universal adversarial
// perturbation*. La búsqueda de arXiv no está fallando —devuelve exactamente
// lo que se le pide—, el acrónimo es genuinamente ambiguo. Un paper realmente
// sobre el tema deletrea la forma expandida al menos una vez en el abstract,
// porque tiene que definir el término; eso es lo que se exige aquí.
//
// Medido sobre 25 resultados reales (sep 2026): conserva 1, descarta 24.
// COSTO ACEPTADO: descarta también investigación adyacente que no nombra el
// término, como los transitorios anómalos de POSS-1 (línea de Villarroel).
// Es deliberado, no un descuido: un falso negativo ocasional en literatura
// —que rara vez se vuelve caso— cuesta menos que reinstalar el ruido que este
// rediseño vino a eliminar. Si algún día importa recuperarlos, la vía es
// sumar un término expandido más, no relajar el acrónimo.
const UAP_TERMS_STRICT = [
  /unidentified\s+(anomalous|aerial|flying)\b/i,
  /anomalous\s+aerial\s+phenomena\b/i,
  /\bAARO\b/,
  /Galileo\s+Project\b/i,
  /non-?human\s+intelligence\b/i,
];
const isRelevantStrict = (text) => UAP_TERMS_STRICT.some((re) => re.test(text));

// ─── Saneamiento de contenido externo ────────────────────────────────────────
// Títulos y URLs vienen de fuentes públicas que no controlamos y terminan
// interpolados en el markdown del issue que abre el workflow. Neutralizamos:
//   - URLs: solo https hacia los hosts esperados (una fuente comprometida no
//     puede hacer que el issue enlace a un dominio arbitrario u otro esquema).
//   - Texto: sin saltos de línea ni caracteres que rompan la sintaxis de link
//     markdown `[título](url)` o abran bloques de código en el issue.
const ALLOWED_HOSTS = new Set([
  "arxiv.org",
  "export.arxiv.org",
  "www.federalregister.gov",
  "federalregister.gov",
  "defensescoop.com",
  "www.defensescoop.com",
  "thedebrief.org",
  "www.thedebrief.org",
  "liberationtimes.com",
  "www.liberationtimes.com",
]);
function safeUrl(raw) {
  try {
    const u = new URL(raw);
    if (!ALLOWED_HOSTS.has(u.hostname)) return "";
    u.protocol = "https:"; // arXiv emite ids http://; servimos siempre https
    return u.href;
  } catch {
    return "";
  }
}
function safeText(raw) {
  return String(raw)
    .replace(/[\[\]`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
// Los feeds emiten entidades HTML y bloques CDATA en los títulos.
function decodeEntities(raw) {
  return String(raw)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}
async function fetchText(url) {
  const r = await fetch(url, { headers: { "User-Agent": "uap-codex-discover/1.0" } });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.text();
}

// ─── 1. Federal Register ─────────────────────────────────────────────────────
// La fuente institucional: avisos, reglas y notices de agencias federales.
// Es donde aparece por escrito lo que una agencia decide hacer con el tema.
//
// OJO: `conditions[term]` es búsqueda de texto completo con ranking difuso —
// consultada por "unidentified anomalous phenomena" devuelve como primer
// resultado una regla sobre mamíferos marinos. Por eso se re-filtra del lado
// del cliente exigiendo un término real en título o abstract. Confiar en el
// ranking de la fuente es justamente cómo se llenó de ruido el detector viejo.
try {
  const url =
    "https://www.federalregister.gov/api/v1/documents.json" +
    "?per_page=40&order=newest" +
    "&conditions%5Bterm%5D=" + encodeURIComponent("unidentified anomalous phenomena");
  const data = await fetchJSON(url);
  const dayCutoff = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  for (const doc of data.results || []) {
    // publication_date es una fecha sin hora: se compara por día, no por timestamp.
    if (!doc.publication_date || doc.publication_date < dayCutoff) continue;
    if (!isRelevant(`${doc.title || ""} ${doc.abstract || ""}`)) continue;
    const agency = (doc.agencies || []).map((a) => a.name).filter(Boolean).join(", ");
    candidates.push({
      source: "Federal Register",
      title: doc.title || doc.document_number,
      url: doc.html_url,
      date: doc.publication_date,
      note: [doc.type, agency].filter(Boolean).join(" · "),
    });
  }
} catch (err) {
  console.error("Federal Register:", err.message);
}

// ─── 2. Prensa de defensa y del área (RSS) ───────────────────────────────────
// DefenseScoop y The Debrief son generalistas en su rubro, así que se filtran
// por término. Liberation Times cubre UAP en exclusiva: filtrarla por palabra
// clave descartaría notas cuyo titular no la nombra —la propia nota sobre la
// declaración del ICIG habría quedado en el borde—, así que entra completa.
const FEEDS = [
  { source: "DefenseScoop", url: "https://defensescoop.com/feed/", filter: true },
  { source: "The Debrief", url: "https://thedebrief.org/feed/", filter: true },
  { source: "Liberation Times", url: "https://www.liberationtimes.com/home?format=rss", filter: false },
];
for (const feed of FEEDS) {
  try {
    const xml = await fetchText(feed.url);
    const items = xml.split(/<item[\s>]/).slice(1);
    for (const item of items) {
      const get = (tag) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
        return m ? decodeEntities(m[1]).trim() : "";
      };
      const published = new Date(get("pubDate"));
      if (!(published instanceof Date) || Number.isNaN(published.getTime())) continue;
      if (published < cutoff) continue;
      const title = get("title");
      if (feed.filter && !isRelevant(title)) continue;
      candidates.push({
        source: feed.source,
        title,
        url: get("link"),
        date: published.toISOString().slice(0, 10),
        // Sin extracto del cuerpo: el titular y el enlace bastan para decidir
        // si vale abrir la nota, y evita arrastrar texto ajeno al issue.
        note: null,
      });
    }
  } catch (err) {
    console.error(`${feed.source}:`, err.message);
  }
}

// ─── 3. arXiv ────────────────────────────────────────────────────────────────
// Se re-filtra con el matcher ESTRICTO (ver arriba): aquí el problema no es
// el ranking de la fuente sino la colisión de acrónimos con otros campos.
try {
  const query = encodeURIComponent(
    'abs:"UAP" OR abs:"UFO" OR abs:"unidentified aerial phenomena" OR abs:"anomalous aerial phenomena"',
  );
  const url = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=20`;
  const xml = await fetchText(url);
  const entries = xml.split("<entry>").slice(1);
  for (const e of entries) {
    const get = (tag) => {
      const m = e.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : "";
    };
    const published = new Date(get("published"));
    if (published < cutoff) continue;
    const summary = get("summary");
    if (!isRelevantStrict(`${get("title")} ${summary}`)) continue;
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

// ─── Saneamiento, dedupe por URL y output ────────────────────────────────────
const seen = new Set();
const unique = candidates
  .map((c) => ({
    ...c,
    title: safeText(c.title),
    note: c.note ? safeText(c.note) : c.note,
    url: safeUrl(c.url),
  }))
  .filter((c) => c.url && c.title && !seen.has(c.url) && seen.add(c.url));

console.log(`Discovered ${unique.length} candidates in last ${HOURS_WINDOW}h`);
for (const c of unique) console.log(`  [${c.source}] ${c.date} ${c.title.slice(0, 80)}`);

fs.writeFileSync("/tmp/discover.json", JSON.stringify(unique, null, 2));
