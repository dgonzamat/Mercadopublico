#!/usr/bin/env node
/**
 * Validador de schema — corre antes de cada build (prebuild hook), junto al
 * auditor de consistencia. Mientras audit-consistency.mjs vigila el DRIFT
 * editorial (porcentajes, conteos, copy), este script vigila la INTEGRIDAD
 * ESTRUCTURAL de las dos fuentes de verdad del corpus:
 *
 *   - data/researchers.json   (array de Researcher, ver lib/types.ts)
 *   - data/cases/*.json       (un UAPCase por archivo)
 *
 * Chequea campos obligatorios, tipos, enums, unicidad de ids/num y la
 * integridad referencial (framework → frameworks.json, patterns → patterns.json).
 * Además valida: MAPA (coordenadas en rango, sin placeholder 0,0),
 * BIBLIOGRAFÍA (todo caso/investigador cita ≥1 fuente, urls bien formadas) y
 * FOTOS (si hay foto, URL válida + licencia de atribución). En las fichas,
 * además: claves de primer nivel solo de la lista blanca (CASE_KEYS), pares
 * name_en / location.place_en obligatorios y `posterior` MECE obligatorio con
 * 6 claves que suman 1 (absorbió E11, E37 y la mitad de M1, nov 2026).
 *
 * SALIDA:
 *   - exit 0  → schema OK
 *   - exit 1  → al menos un error de schema (corta el build en CI)
 *
 * USO:
 *   node scripts/validate-schema.mjs           # falla en error
 *   node scripts/validate-schema.mjs --warn    # nunca exit ≠ 0
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logProbeHits } from "./lib/probe-log.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf-8"));

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

// Taxonomía prosaica: se PARSEA de lib/meceClasses.ts (node-plain, no puede
// importar TS) en vez de duplicarla — un segundo diccionario sería un segundo
// origen de verdad. Si el parseo rinde de menos, se aborta: una sonda que no
// entiende su fuente no debe dar verde.
const MECE_CLASSES_SRC = fs.readFileSync(path.join(root, "lib", "meceClasses.ts"), "utf-8");
const MISID_SUBTYPE_KEYS = (() => {
  const m = MECE_CLASSES_SRC.match(/export const MISID_SUBTYPES[\s\S]*?\n\];/);
  return m ? [...m[0].matchAll(/\{ key: "(\w+)"/g)].map((x) => x[1]) : [];
})();
const OBJECT_DETAILS = (() => {
  const m = MECE_CLASSES_SRC.match(/export const OBJECT_DETAILS[\s\S]*?\n\};/);
  const out = {};
  if (!m) return out;
  let cur = null;
  for (const line of m[0].split("\n")) {
    const cls = line.match(/^  (\w+): \[/);
    if (cls) { cur = cls[1]; out[cur] = []; continue; }
    const k = line.match(/\{ key: "(\w+)"/);
    if (k && cur) out[cur].push(k[1]);
  }
  return out;
})();
if (MISID_SUBTYPE_KEYS.length < 4 || Object.keys(OBJECT_DETAILS).length < 5) {
  console.error(`validate-schema: no se pudo parsear la taxonomía de lib/meceClasses.ts (MISID_SUBTYPES=${MISID_SUBTYPE_KEYS.length}, OBJECT_DETAILS=${Object.keys(OBJECT_DETAILS).length})`);
  process.exit(1);
}

const isStr = (v) => typeof v === "string" && v.length > 0;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isArr = (v) => Array.isArray(v);
// URL http(s) válida, o ruta absoluta bajo /public (para fotos locales).
const SUPA_PURSUE = "https://hgbvdqckoosxesixhepr.supabase.co/storage/v1/object/public/pursue/";
const DVIDS_EMBED = "https://www.dvidshub.net/video/embed/";
// Reproductor oficial de Facebook (nov 2026, decisión del dueño): solo para el
// video ORIGINAL que publicó el propio testigo cuando es el único registro del
// suceso (Anchorage 2026). Lo primero no se puede comprobar aquí; lo que sí,
// que apunte a facebook.com y que vaya como prueba, para que el visor no se
// llene de reposts de redes. El componente lo carga solo al pulsar.
const FACEBOOK_EMBED = "https://www.facebook.com/plugins/video.php?href=";
const isFacebookVideo = (v) => {
  if (typeof v !== "string" || !v.startsWith(FACEBOOK_EMBED)) return false;
  const href = decodeURIComponent(v.slice(FACEBOOK_EMBED.length).split("&")[0]);
  return /^https:\/\/www\.facebook\.com\/(reel\/\d+|watch\/\?v=\d+|[\w.]+\/videos\/\d+)\/?$/.test(href);
};
// Reproductor de X (nov 2026): el mismo criterio, para el video oficial que una
// institución publicó solo en X (vuelo 15 de Starship, Secretaría de Prensa
// de El Salvador). El id del post es numérico; nada más se admite.
const X_EMBED = "https://platform.twitter.com/embed/Tweet.html?id=";
const isXVideo = (v) => typeof v === "string" && v.startsWith(X_EMBED) && /^\d+(&theme=light)?$/.test(v.slice(X_EMBED.length));
const isHttpUrl = (v) => typeof v === "string" && /^https?:\/\/\S+$/.test(v);
// Bandera: dos símbolos indicadores regionales (emoji de país, p. ej. 🇦🇷).
const isFlag = (v) =>
  typeof v === "string" && /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(v);
const isPhotoRef = (v) => isHttpUrl(v) || (typeof v === "string" && v.startsWith("/"));

// ─── 1. Conjuntos de referencia ──────────────────────────────────────────

const frameworkIds = new Set(read("data/frameworks.json").map((f) => f.id));
const patternIds = new Set(read("data/patterns.json").map((p) => p.id));

// ─── 2. researchers.json ─────────────────────────────────────────────────

const SECTIONS = new Set(["A", "B", "C", "D", "E", "F"]);
const researchers = read("data/researchers.json");
const seenResearcherIds = new Set();

researchers.forEach((r, i) => {
  const w = `researchers[${i}]${r.id ? ` (${r.id})` : ""}`;
  validateDocEmbeds(w, r.documents);
  if (!isStr(r.id)) err(w, "id obligatorio (string)");
  else if (seenResearcherIds.has(r.id)) err(w, `id duplicado "${r.id}"`);
  else seenResearcherIds.add(r.id);

  if (!isStr(r.name)) err(w, "name obligatorio (string)");
  if (!isStr(r.flag)) err(w, "flag obligatorio (bandera de nacionalidad)");
  else if (!isFlag(r.flag))
    err(w, `flag debe ser un emoji de bandera de país (indicadores regionales): "${r.flag}"`);
  if (r.born !== undefined && !isNum(r.born)) err(w, "born debe ser number");
  if (r.death !== undefined && !isNum(r.death)) err(w, "death debe ser number");
  if (!SECTIONS.has(r.section)) err(w, `section inválida "${r.section}" (A–F)`);
  if (!isStr(r.section_label)) err(w, "section_label obligatorio (string)");
  if (!isStr(r.section_label_en)) err(w, "section_label_en obligatorio (string)");
  if (!isStr(r.credentials)) err(w, "credentials obligatorio (string)");
  if (!isStr(r.credentials_en)) err(w, "credentials_en obligatorio (string)");
  if (!isStr(r.bio_short)) err(w, "bio_short obligatorio (string)");
  if (!isStr(r.bio_short_en)) err(w, "bio_short_en obligatorio (string)");

  if (r.framework !== undefined && !frameworkIds.has(r.framework))
    err(w, `framework "${r.framework}" no existe en frameworks.json`);

  if (!isArr(r.works)) err(w, "works debe ser array");
  else
    r.works.forEach((wk, j) => {
      if (!isNum(wk.year)) err(`${w}.works[${j}]`, "year obligatorio (number)");
      if (!isStr(wk.title)) err(`${w}.works[${j}]`, "title obligatorio (string)");
      if (wk.title_en !== undefined && !isStr(wk.title_en))
        err(`${w}.works[${j}]`, "title_en debe ser string");
      if (!isStr(wk.contribution))
        err(`${w}.works[${j}]`, "contribution obligatorio (string)");
      if (!isStr(wk.contribution_en))
        err(`${w}.works[${j}]`, "contribution_en obligatorio (string)");
    });

  // FOTOS: si hay foto debe ser URL http(s) o ruta /public, y exigir licencia
  // (cumplimiento de atribución: solo se usan imágenes PD/CC).
  for (const f of ["photo_credit", "photo_license"])
    if (r[f] !== undefined && !isStr(r[f])) err(w, `${f} debe ser string`);
  if (r.photo !== undefined) {
    if (!isPhotoRef(r.photo))
      err(w, `photo debe ser URL http(s) o ruta /public: "${r.photo}"`);
    if (!isStr(r.photo_license))
      err(w, "photo presente requiere photo_license (atribución PD/CC)");
  }

  // BIBLIOGRAFÍA: sources obligatorio (al menos una fuente verificable)
  if (!isArr(r.sources) || r.sources.length === 0) {
    err(w, "sources obligatorio (bibliografía): al menos una fuente");
  } else {
    r.sources.forEach((s, j) => {
      if (!isStr(s.name)) err(`${w}.sources[${j}]`, "name obligatorio (string)");
      for (const f of ["name_en", "note", "note_en"])
        if (s[f] !== undefined && !isStr(s[f]))
          err(`${w}.sources[${j}]`, `${f} debe ser string`);
      if (s.url !== undefined && !isHttpUrl(s.url))
        err(`${w}.sources[${j}]`, `url malformada: "${s.url}"`);
    });
  }
});

// ─── 3. data/cases/*.json ────────────────────────────────────────────────

const TIERS = new Set(["S", "A", "B"]);
// Sin "document": desde el 15 oct 2026 ningún documento tiene ficha propia; vive
// embebido en el visor del caso o del actor que respalda (decisión del dueño).
const CATEGORIES = new Set(["incident", "contactee", "crop_circle"]);
// Claves de primer nivel admitidas en una ficha: las de `UAPCase` (lib/types.ts)
// que el corpus usa. Una clave fuera de la lista es un campo que ningún render
// lee —el caso de `sources_en`, 89 fichas con 81 traducciones que nunca se
// publicaban (sep 2026)— o un error de tecleo que deja el campo real vacío.
// `relatedCases` queda fuera: solo existía para las fichas-documento.
const CASE_KEYS = new Set([
  "id", "num", "name", "name_en", "year_start", "year_end", "country", "country_name", "flag",
  "location", "tier", "pursueReleases", "mundanoType", "misidSubtype", "objectDetail",
  "evidenceReviewed", "classBasis", "epistemicStatus", "probability", "summary", "summary_en",
  "seoTitle", "seoDescription", "seoTitle_en", "seoDescription_en", "featuredDoc", "documents",
  "patterns", "entityMorphology", "category", "whatHappened", "whatHappened_en", "whyMatters",
  "whyMatters_en", "evidence", "evidence_en", "sources", "primaryDocument", "posterior",
]);
const casesDir = path.join(root, "data", "cases");
const caseFiles = fs.readdirSync(casesDir).filter((f) => f.endsWith(".json"));
const seenCaseIds = new Set();
const seenNums = new Set();

// Visor de documentos (DocEmbed[]): lo usan los casos y los actores.
function validateDocEmbeds(w, docs) {
  if (docs !== undefined) {
    if (!isArr(docs)) err(w, "documents debe ser array (DocEmbed[])");
    else
      docs.forEach((d, j) => {
        const dw = `${w}.documents[${j}]`;
        const isDvids = isStr(d.src) && d.src.startsWith(DVIDS_EMBED);
        const isFb = isFacebookVideo(d.src) || isXVideo(d.src);
        if (!isStr(d.src)) err(dw, "src obligatorio (string)");
        else if (d.type === "link") {
          // Tarjeta sin visor: el src es el original, fuera del sitio.
          if (!isHttpUrl(d.src)) err(dw, `type "link" exige src http(s): "${d.src}"`);
          if (!isStr(d.description)) err(dw, `type "link" exige description (es lo único que muestra)`);
        } else if (!d.src.startsWith("/pursue/") && !d.src.startsWith(SUPA_PURSUE) && !isDvids && !isFb)
          err(dw, `src debe ser same-origin (/pursue/), el bucket Supabase pursue, o el player de DVIDS (war.gov no se puede embeber): "${d.src}"`);
        if (!["pdf", "image", "video", "link"].includes(d.type))
          err(dw, `type inválido "${d.type}" (pdf|image|video|link)`);
        // El origen DVIDS es exclusivo de "video", y "video" es exclusivo de
        // DVIDS: sin este cruce, un PDF podría apuntar al player (iframe roto)
        // o un "video" a /pursue (binario que no cabe, justo lo que evitamos).
        if (isDvids && d.type !== "video")
          err(dw, `el player de DVIDS solo admite type "video", no "${d.type}": "${d.src}"`);
        if (d.type === "video" && !isDvids && !isFb)
          err(dw, `type "video" exige src del player de DVIDS (${DVIDS_EMBED}<id>) o el reproductor de Facebook o de X de un video original (${FACEBOOK_EMBED}<url del video>, ${X_EMBED}<id del post>): "${d.src}"`);
        if (isFb && (d.type !== "video" || d.role !== "prueba"))
          err(dw, `el reproductor de Facebook o de X solo admite type "video" con role "prueba" (el video original del testigo): "${d.src}"`);
        if (d.type === "video" && isDvids && !/^\d+$/.test(d.src.slice(DVIDS_EMBED.length)))
          err(dw, `src de DVIDS debe terminar en el id numérico del video: "${d.src}"`);
        if (isStr(d.src) && d.type === "pdf" && !/\.pdf$/i.test(d.src))
          err(dw, `type "pdf" exige src con extensión .pdf: "${d.src}"`);
        if (isStr(d.src) && d.type === "image" && !/\.(jpe?g|png|webp|gif)$/i.test(d.src))
          err(dw, `type "image" exige src con extensión de imagen (.jpg/.png/.webp/.gif): "${d.src}"`);
        if (!isStr(d.title)) err(dw, "title obligatorio (string)");
        for (const f of ["title_en", "description", "description_en", "source", "source_en", "license"])
          if (d[f] !== undefined && !isStr(d[f])) err(dw, `${f} debe ser string`);
        if (d.fallbackUrl !== undefined && !isHttpUrl(d.fallbackUrl))
          err(dw, `fallbackUrl malformada: "${d.fallbackUrl}"`);
        if (d.page !== undefined && (!Number.isInteger(d.page) || d.page < 1 || d.type !== "pdf"))
          err(dw, `page debe ser un entero ≥ 1 y solo vale en documentos pdf: ${JSON.stringify(d.page)}`);
      });
  }
}

// JSON.parse acepta claves repetidas y se queda con la última, así que un
// editor que inserta un campo sin quitar el viejo (dos redactores dejaron hasta
// cuatro `description` en un documento, oct 2026) pasa todas las sondas.
function dupKeys(text) {
  const dups = [];
  const stack = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      const top = stack[stack.length - 1];
      if (top && top.obj && top.expectKey) {
        const k = text.slice(i + 1, j);
        if (top.keys.has(k)) dups.push(k);
        top.keys.add(k);
        top.expectKey = false;
      }
      i = j;
    } else if (ch === "{") stack.push({ obj: true, keys: new Set(), expectKey: true });
    else if (ch === "[") stack.push({ obj: false });
    else if (ch === "}" || ch === "]") stack.pop();
    else if (ch === ",") {
      const top = stack[stack.length - 1];
      if (top && top.obj) top.expectKey = true;
    }
  }
  return dups;
}

for (const file of caseFiles) {
  const w = `cases/${file}`;
  let c;
  try {
    const rawCase = fs.readFileSync(path.join(casesDir, file), "utf-8");
    c = JSON.parse(rawCase);
    const dups = dupKeys(rawCase);
    if (dups.length) err(w, `clave duplicada en el JSON (gana la última): ${[...new Set(dups)].join(", ")}`);
  } catch (e) {
    err(w, `JSON inválido: ${e.message}`);
    continue;
  }

  if (!isStr(c.id)) err(w, "id obligatorio (string)");
  else if (seenCaseIds.has(c.id)) err(w, `id duplicado "${c.id}"`);
  else seenCaseIds.add(c.id);
  if (isStr(c.id) && `${c.id}.json` !== file)
    err(w, `id "${c.id}" no coincide con el nombre de archivo`);

  if (!isNum(c.num)) err(w, "num obligatorio (number)");
  else if (seenNums.has(c.num)) err(w, `num duplicado ${c.num}`);
  else seenNums.add(c.num);

  const unknownKeys = Object.keys(c).filter((k) => !CASE_KEYS.has(k));
  if (unknownKeys.length)
    err(w, `claves no reconocidas [${unknownKeys}] — ningún render las lee; si es un campo nuevo, añádelo a UAPCase (lib/types.ts) y a CASE_KEYS`);

  if (!isStr(c.name)) err(w, "name obligatorio (string)");
  if (!isStr(c.name_en)) err(w, "name_en obligatorio (string): el sitio es inglés-primario");
  if (!isNum(c.year_start)) err(w, "year_start obligatorio (number)");
  if (!isStr(c.country)) err(w, "country obligatorio (string)");
  if (!isStr(c.country_name)) err(w, "country_name obligatorio (string)");
  if (!isStr(c.flag)) err(w, "flag obligatorio (string)");
  if (!TIERS.has(c.tier)) err(w, `tier inválido "${c.tier}" (S/A/B)`);
  if (
    c.epistemicStatus !== undefined &&
    c.epistemicStatus !== "documented"
  )
    err(w, `epistemicStatus inválido "${c.epistemicStatus}" (no hay «en desarrollo» ni «proyectado»: el caso se arma con lo que se sabe y se amplía después)`);
  if (!CATEGORIES.has(c.category)) err(w, `category inválida "${c.category}"`);
  if (!isNum(c.probability)) err(w, "probability obligatorio (number)");
  // posterior (modelo MECE): obligatorio en toda ficha (ya no hay documentos),
  // con las 6 claves numéricas y suma ≈ 1. Es P(narrativa|objeto). Antes lo
  // repetía M1 en audit-consistency; desde nov 2026 vive solo aquí.
  if (c.posterior === undefined || c.posterior === null || typeof c.posterior !== "object" || Array.isArray(c.posterior)) {
    err(w, "posterior obligatorio (objeto con las 6 narrativas MECE)");
  } else {
    const MECE_KEYS = ["mundano_natural", "humana_clasificada", "adversaria", "nohumano_encubierto", "nohumano_abierto", "indet"];
    const miss = MECE_KEYS.filter((k) => typeof c.posterior[k] !== "number");
    const extra = Object.keys(c.posterior).filter((k) => !MECE_KEYS.includes(k));
    if (miss.length || extra.length)
      err(w, `posterior con claves inválidas (faltan/no-numéricas [${miss}], sobran [${extra}])`);
    else {
      const tot = MECE_KEYS.reduce((acc, k) => acc + c.posterior[k], 0);
      if (Math.abs(tot - 1) > 0.005) err(w, `posterior suma ${tot.toFixed(4)} (debe ser 1)`);
    }
  }
  // mundanoType (opcional): sub-tipo de la explicación prosaica.
  const MUNDANO_TYPES = ["misid", "natural", "fraude", "instrumento", "psicosocial", "sin_propuesta", "folclore"];
  if (c.mundanoType !== undefined && !MUNDANO_TYPES.includes(c.mundanoType)) {
    err(w, `mundanoType inválido "${c.mundanoType}" (${MUNDANO_TYPES.join("|")})`);
  }
  // misidSubtype (opcional): con qué objeto conocido se confundió. Solo válido en
  // casos misid (drill-down bajo «Misidentificación»).
  if (c.misidSubtype !== undefined) {
    if (!MISID_SUBTYPE_KEYS.includes(c.misidSubtype)) {
      err(w, `misidSubtype inválido "${c.misidSubtype}" (${MISID_SUBTYPE_KEYS.join("|")})`);
    } else if (c.mundanoType !== "misid") {
      err(w, `misidSubtype presente pero mundanoType no es "misid" (es "${c.mundanoType ?? "ausente"}") — el subtipo solo aplica a misidentificaciones`);
    }
  }
  // objectDetail (opcional): detalle de segundo nivel de la clase prosaica. La
  // clase es misidSubtype (misid) o "natural"; fraude y los casos sin
  // mundanoType no admiten detalle. Los valores por clase salen de
  // OBJECT_DETAILS en lib/meceClasses.ts (parseado arriba, fuente única).
  if (c.objectDetail !== undefined) {
    const cls = c.mundanoType === "misid" ? c.misidSubtype ?? "terrestre_otros" : c.mundanoType && c.mundanoType !== "fraude" ? c.mundanoType : null;
    const allowed = cls ? OBJECT_DETAILS[cls] : undefined;
    if (!cls) {
      err(w, `objectDetail "${c.objectDetail}" presente pero el caso no es misid ni natural (mundanoType "${c.mundanoType ?? "ausente"}") — fraude y los casos sin mundanoType no llevan detalle`);
    } else if (!allowed) {
      err(w, `objectDetail "${c.objectDetail}" no admitido: la clase "${cls}" no tiene detalle de segundo nivel`);
    } else if (!allowed.includes(c.objectDetail)) {
      err(w, `objectDetail inválido "${c.objectDetail}" para la clase "${cls}" (${allowed.join("|")})`);
    }
  }
  // classBasis (opcional): por qué la clase prosaica es esa, con su fuente.
  if (c.classBasis !== undefined) {
    const b = c.classBasis;
    if (typeof b !== "object" || b === null) err(w, "classBasis debe ser un objeto {es, en, source, source_en?, url?}");
    else {
      for (const k of ["es", "en", "source"]) if (typeof b[k] !== "string" || !b[k].trim()) err(w, `classBasis.${k} vacío o ausente`);
      if (b.source_en !== undefined && (typeof b.source_en !== "string" || !b.source_en.trim())) err(w, "classBasis.source_en vacío");
      if (b.url !== undefined && !/^https?:\/\//.test(b.url) && !String(b.url).startsWith("/")) err(w, `classBasis.url inválida "${b.url}"`);
      const extra = Object.keys(b).filter((k) => !["es", "en", "source", "source_en", "url"].includes(k));
      if (extra.length) err(w, `classBasis con claves no válidas [${extra}]`);
    }
  }
  // evidenceReviewed (opcional): fecha ISO en que la clasificación se contrastó
  // con la evidencia primaria.
  if (c.evidenceReviewed !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(c.evidenceReviewed))) {
    err(w, `evidenceReviewed inválido "${c.evidenceReviewed}" (AAAA-MM-DD)`);
  }
  if (!isStr(c.summary)) err(w, "summary obligatorio (string)");
  if (!isStr(c.summary_en)) err(w, "summary_en obligatorio (string)");

  // MAPA: coordenadas presentes, en rango y no placeholder (0,0 = null island)
  if (!c.location || !isNum(c.location.lat) || !isNum(c.location.lng)) {
    err(w, "location.{lat,lng} obligatorio (number)");
  } else {
    const { lat, lng } = c.location;
    if (lat < -90 || lat > 90) err(w, `location.lat fuera de rango [-90,90]: ${lat}`);
    if (lng < -180 || lng > 180)
      err(w, `location.lng fuera de rango [-180,180]: ${lng}`);
    if (lat === 0 && lng === 0)
      err(w, "location (0,0) — coordenadas placeholder (null island); usar el ancla terrestre real");
    if (!["exact", "approx", "none"].includes(c.location.precision))
      err(w, `location.precision debe ser exact, approx o none (es ${JSON.stringify(c.location.precision)})`);
    if (!isStr(c.location.place_en))
      err(w, "location.place_en obligatorio (string): el sitio es inglés-primario");
  }

  if (!isArr(c.patterns)) err(w, "patterns debe ser array");
  else
    c.patterns.forEach((p) => {
      if (!patternIds.has(p))
        err(w, `pattern "${p}" no existe en patterns.json`);
    });

  // VISOR DE DOCUMENTOS (DocEmbed[]): documentos primarios embebidos inline.
  // Invariante clave del diseño: `src` debe ser embebible — war.gov bloquea el
  // framing/fetch de terceros, así que solo se admiten dos orígenes que SÍ se
  // embeben con garantía: (1) same-origin bajo /pursue/ (≤30MB, en el repo) y
  // (2) el bucket público Supabase `pursue` (archivos 30-50MB / partes de los
  // grandes, que GitHub no puede alojar). El tipo decide el render (iframe para
  // pdf, img para imagen), así que la extensión debe ser coherente.
  // (3) el player de DVIDS — el mirror oficial del DoD — SOLO para type
  // "video": los videos PURSUE pesan >150MB sin renditions menores, así que
  // rehostearlos es imposible bajo los techos de arriba. `/video/embed/<id>`
  // responde sin `x-frame-options` ni `frame-ancestors` (el resto del sitio va
  // con DENY: el embed es deliberado). La garantía perdida la cubre la sonda
  // viva `check-dvids-embeds.mjs`, no el build (que es offline a propósito).
  validateDocEmbeds(w, c.documents);

  // BIBLIOGRAFÍA: todo caso debe citar al menos una fuente; url bien formada
  if (!isArr(c.sources) || c.sources.length === 0) {
    err(w, "sources obligatorio (bibliografía): al menos una fuente");
  } else {
    c.sources.forEach((s, j) => {
      if (!isStr(s.name)) err(`${w}.sources[${j}]`, "name obligatorio (string)");
      if (s.url !== undefined && !isHttpUrl(s.url))
        err(`${w}.sources[${j}]`, `url malformada: "${s.url}"`);
    });
  }
}

// ─── 4. Reporte ──────────────────────────────────────────────────────────

console.log(
  `\nUAP Codex · Schema validation` +
    `\n  researchers: ${researchers.length}   cases: ${caseFiles.length}` +
    `\n  errores de schema: ${errors.length}\n`,
);
logProbeHits(
  "validate-schema",
  errors.map((e) => {
    const [where, ...rest] = e.split(": ");
    const rule = rest.join(": ").replace(/"[^"]*"/g, '"…"').replace(/\d+(\.\d+)?/g, "N").slice(0, 60);
    return { rule, where: where.replace(/\.json[.[].*$/, ".json") };
  }),
);
if (errors.length > 0) {
  console.log("  🔴 ERRORES:");
  for (const e of errors) console.log(`     ${e}`);
  console.log("");
  if (!process.argv.includes("--warn")) process.exit(1);
} else {
  console.log("  ✅ Schema válido.\n");
}
