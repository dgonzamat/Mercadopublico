#!/usr/bin/env node
/**
 * Auditor permanente — corre antes de cada build (prebuild hook).
 *
 * Verifica que la copy editorial y los datos del corpus sigan consistentes
 * con la source-of-truth (data/cases/*.json + STATS derivado del corpus).
 *
 * SALIDA:
 *   - exit 0  → todo OK o solo WARNINGs
 *   - exit 1  → al menos un ERROR (corta el build en CI)
 *
 * USO:
 *   node scripts/audit-consistency.mjs           # full audit
 *   node scripts/audit-consistency.mjs --warn    # nunca exit ≠ 0
 *
 * REGLAS:
 *   E3  Conteos hardcoded (78/77/79 etc.) en /app y /components deben
 *       coincidir con STATS calculado del corpus.
 *   E4  Términos prohibidos (drift de renames) no deben aparecer en /app
 *       ni en case rationales rendered to user.
 *   E7  Spanglish: los campos ES-first de casos (name, summary) no deben
 *       contener inglés descriptivo — el inglés vive en *_en. Heurística
 *       curada con exenciones para nombres propios y texto entre comillas.
 *   E7b (WARN) Spanglish en PROSA (whatHappened/whyMatters/evidence): detecta
 *       una racha de inglés sin traducir por densidad verbal, robusta a nombres
 *       propios y citas. Cubre el hueco de E7 (que solo ve name/summary).
 *   E9  (WARN) Cobertura investigador↔caso: marca los investigadores de
 *       researchers.json sin mención (por nombre/apellido) en ningún caso.
 *       Heurística por substring, conservadora (ver nota en la regla).
 *   E10 (ERROR) Completitud bilingüe de prosa: campos ES con su par *_en.
 *   E11 (WARN) Campos de nombre propio con español pero sin *_en.
 *   E12 (WARN) Robustez del lede: summary demasiado corto.
 *   E13 (WARN) Estándar editorial: descripción narrativa ≥ ~1 página A4.
 *   E14 (WARN) Taxonomía huérfana: patrones de patterns.json que ningún caso
 *       referencia (vía case.patterns) — candidatos a enlazar o retirar.
 *   E15 (ERROR) JSON-LD prohibido: ningún `@type: "Event"` (Google aplica el
 *       validador de eventos comerciales; usar Article + contentLocation).
 *   E16 (WARN) Presupuesto SSG: nº de client components ("use client") bajo un
 *       techo — protege el "zero JS shipped" del proyecto (crecimiento visible).
 *   E17 (WARN) Visor de documentos: cada asset same-origin embebido
 *       (documents[].src / primaryDocument.url bajo /pursue/) debe existir en
 *       web/public/ — si falta, el iframe/img queda roto. Backlog medible de
 *       subida que se pone en verde al subir los binarios.
 *   M1  (ERROR) Invariante del modelo MECE: cada caso de incidente reparte
 *       el 100% sobre las 6 narrativas (posterior con 6 claves, suma 1);
 *       los casos-documento no llevan posterior.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// ─── 2. CARGA CORPUS ─────────────────────────────────────────────────────

const casesDir = path.join(root, "data", "cases");
const caseFileNames = fs
  .readdirSync(casesDir)
  .filter((f) => f.endsWith(".json"));
const cases = caseFileNames.map((f) =>
  JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8")),
);

// Texto crudo concatenado de todos los expedientes — lo usa RULE E9 para el
// cruce investigador↔caso por nombre (búsqueda de substring conservadora).
const caseCorpusText = caseFileNames
  .map((f) => fs.readFileSync(path.join(casesDir, f), "utf-8"))
  .join("\n");

const researchers = JSON.parse(
  fs.readFileSync(path.join(root, "data", "researchers.json"), "utf-8"),
);

const readJsonList = (file, key) => {
  const data = JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf-8"));
  return Array.isArray(data) ? data : data[key] || [];
};
const patternList = readJsonList("patterns.json", "patterns");
const frameworkList = readJsonList("frameworks.json", "frameworks");

const STATS = {
  cases: cases.length,
  countries: new Set(cases.map((c) => c.country)).size,
  tierS: cases.filter((c) => c.tier === "S").length,
  tierA: cases.filter((c) => c.tier === "A").length,
  tierB: cases.filter((c) => c.tier === "B").length,
  years: Math.max(...cases.map((c) => c.year_start)) - 1947,
  researchers: researchers.length,
  patterns: patternList.length,
  frameworks: frameworkList.length,
};

// ─── 4. REGLAS DE DRIFT ──────────────────────────────────────────────────

/**
/**
 * Phrases that drifted out of the rename history. Forbidden anywhere
 * user-facing (app/ pages + case rationales rendered by the slug page).
 */
const FORBIDDEN_TERMS = [
  { needle: "psicoespiritual", reason: "rename → ontologico-no-materialista (hypothesis layer)" },
  { needle: "algo no humano", reason: "rename → entidades no humanas" },
  { needle: "tratado encubierto", reason: "rename → tratado formal" },
];

/**
 * Files exempt from FORBIDDEN_TERMS scan (framework slug is allowed to
 * preserve the historical theoretical-school name).
 */
const FORBIDDEN_EXEMPT = new Set([
  "data/frameworks.json",
  "data/researchers.json",
]);

// ─── 5. SCAN UTILITIES ───────────────────────────────────────────────────

function walk(dir, exts) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((ext) => e.name.endsWith(ext))) out.push(full);
  }
  return out;
}

const findings = [];
function record(level, file, line, msg) {
  findings.push({ level, file: path.relative(root, file), line, msg });
}

const tsxFiles = walk(path.join(root, "app"), [".tsx"]);

// ─── 7. RULE E3: hardcoded counts in /app + /components ──────────────────

const CANONICAL_COUNTS = new Map([
  [STATS.cases, "STATS.cases"],
  [STATS.countries, "STATS.countries"],
  [STATS.years, "STATS.years"],
  [STATS.tierS, "STATS.tierS"],
  [STATS.tierA, "STATS.tierA"],
  [STATS.tierB, "STATS.tierB"],
  [STATS.patterns, "STATS.patterns"],
  [STATS.researchers, "STATS.researchers"],
  [STATS.frameworks, "STATS.frameworks"],
]);

// Drift detection (±5) solo para los conteos grandes: el ±5 de cuentas
// chicas (patterns 18, frameworks 11) colisiona con números comunes y daría
// falsos positivos. Esas se cazan por match exacto, no por drift.
const DRIFT_BASES = [
  STATS.cases,
  STATS.countries,
  STATS.years,
  STATS.tierS,
  STATS.tierA,
  STATS.tierB,
];
const DRIFT_NUMBERS = new Set();
for (const c of DRIFT_BASES) {
  for (let d = -5; d <= 5; d++) if (d !== 0) DRIFT_NUMBERS.add(c + d);
}
// Don't confuse small numbers (1-10) with stats drift
for (let n = 1; n <= 12; n++) DRIFT_NUMBERS.delete(n);

const sourceFiles = [
  ...tsxFiles,
  ...walk(path.join(root, "components"), [".tsx"]),
];
for (const file of sourceFiles) {
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    // Skip metadata / className / opacity / hex
    if (/className=|tracking-|opacity|min-h-\[|max-w-|#[0-9a-fA-F]{3,8}/.test(line)) return;
    // Skip Vallée 1975 prediction line (date arithmetic, not corpus stat)
    if (/Vallée|Vallee|1975/.test(line)) return;
    // Look for "<number> casos|cases|países|countries|años|years"
    const ctxRe = /\b(\d{2,3})\s+(casos|cases|países|countries|años|years|patrones|patterns|investigadores|researchers|marcos|frameworks)\b/g;
    let m;
    while ((m = ctxRe.exec(line)) !== null) {
      const n = Number(m[1]);
      // Allowed if it matches a canonical value AND uses STATS interpolation
      if (line.includes("STATS.")) continue;
      if (CANONICAL_COUNTS.has(n)) {
        record("WARN", file, lineNo, `hardcoded "${n} ${m[2]}" matches a STATS value — should use \${STATS.*} for drift-resistance`);
      } else if (DRIFT_NUMBERS.has(n)) {
        record("ERROR", file, lineNo, `hardcoded "${n} ${m[2]}" is close to a STATS value but doesn't match — likely drift (current STATS=${JSON.stringify(STATS)})`);
      }
    }
  });
}

// ─── 8. RULE E4: forbidden terms (drift signatures) ──────────────────────

const scanForForbidden = [
  ...tsxFiles,
  ...walk(path.join(root, "data", "cases"), [".json"]),
  ...walk(path.join(root, "components"), [".tsx"]),
];
for (const file of scanForForbidden) {
  const rel = path.relative(root, file);
  if ([...FORBIDDEN_EXEMPT].some((p) => rel.endsWith(p))) continue;
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((line, i) => {
    for (const { needle, reason } of FORBIDDEN_TERMS) {
      if (line.toLowerCase().includes(needle.toLowerCase())) {
        record("WARN", file, i + 1, `forbidden phrase "${needle}" — ${reason}`);
      }
    }
  });
}

// ─── 9c. RULE E9: researcher ↔ case association coverage ─────────────────
//
// No existe un vínculo estructurado investigador↔caso (los casos no tienen
// campo `researchers`). Esta regla mide la red IMPLÍCITA: un investigador se
// considera "asociado" si su nombre completo, o su apellido (≥4 letras),
// aparece como substring en el texto de algún expediente. La búsqueda por
// substring es deliberadamente conservadora: prefiere falsos positivos de
// asociación (no marcar un huérfano dudoso) antes que marcar erróneamente
// como huérfano a alguien que sí está citado. Los huérfanos se reportan en
// un único WARN agregado: son candidatos a enlazar con un caso o a revisar.
const orphanResearchers = [];
for (const r of researchers) {
  const full = (r.name || "").trim();
  const surname = full.split(/\s+/).pop() || "";
  const linked =
    (full.length >= 4 && caseCorpusText.includes(full)) ||
    (surname.length >= 4 && caseCorpusText.includes(surname));
  if (!linked) orphanResearchers.push(r.id);
}
const linkedCount = researchers.length - orphanResearchers.length;
if (orphanResearchers.length > 0) {
  record(
    "WARN",
    path.join(root, "data", "researchers.json"),
    0,
    `${orphanResearchers.length}/${researchers.length} investigadores sin mención en ningún caso (heurística por nombre): ${orphanResearchers.join(", ")} — candidatos a enlazar o revisar`,
  );
}

// ─── 9b. RULE E7: Spanglish in ES-facing case fields ─────────────────────
//
// `name` y `summary` son los campos ES-first que renderiza /cases. Inglés
// descriptivo ahí es drift editorial (el inglés vive en name_en/summary_en).
// Heurística conservadora: lista curada de palabras inglesas comunes en
// títulos UAP que casi nunca aparecen en prosa española. Se exime el texto
// entre comillas (títulos citados) y los nombres propios canónicos.

const SPANGLISH_RE =
  /\b(crash|lights|wave|shutdown|files|hearing|leaked|streaks|highway|island|wartime|rhetoric|summaries|saucer|nests?|weaponized|weaponizada|sighting|witness(es)?|burns?|recovery|the|of|with|from)\b/i;

const SPANGLISH_PROPER_OK = [
  "Phoenix Lights",          // nombre canónico global del evento
  "Ariel School",            // ídem
  "Skinwalker Ranch",        // ídem
  "Hudson Valley",           // topónimo
  "Lake Huron",              // topónimo
  "East Coast",              // topónimo en nombre de caso ya establecido
  "Mystery Drones",          // etiqueta mediática canónica
  "Blue Book",
  "Estimate of the Situation", // título de documento
  "Special Report",            // título de documento (Battelle)
  "Ministry of Supply",        // institución
  "Bombing Trials Unit",       // institución
  "National Press Club",
  "Operation Animal Mutilation", // título de informe
  "Joint Defence Facility",      // institución
  "Eyre Highway",                // topónimo (carretera)
  "University of Queensland",    // institución
  "Department of War",           // institución US (DoD renombrado 2026)
  "National Archives of Australia", // archivo nacional australiano (Turner Report)
  "Task Force on the Declassification of Federal Secrets", // sub-órgano House Oversight (Burlison)
  "Flying Saucer Working Party", // primer estudio oficial del MoD británico (1950)
];

function stripQuotedAndProper(s) {
  let t = s.replace(/'[^']*'|"[^"]*"|«[^»]*»|‘[^’]*’/g, "");
  for (const k of SPANGLISH_PROPER_OK) t = t.split(k).join("");
  return t;
}

for (const c of cases) {
  for (const field of ["name", "summary"]) {
    const v = c[field];
    if (!v) continue;
    const m = stripQuotedAndProper(v).match(SPANGLISH_RE);
    if (m) {
      record(
        "ERROR",
        path.join(casesDir, c.id + ".json"),
        0,
        `E7 spanglish: campo ES "${field}" contiene "${m[0]}" (case ${c.id}) — mover el inglés a ${field}_en o citar entre comillas`,
      );
    }
  }
}

// ─── 9b-bis. RULE E7b: Spanglish in ES-facing PROSE fields (WARN) ────────
//
// E7 solo cubría `name`/`summary` (cortos, alta visibilidad → ERROR). El grueso
// del texto vive en `whatHappened`/`whyMatters`/`evidence`, y ahí puede colarse
// un párrafo en inglés SIN traducir (p. ej. pegar el charter de un documento tal
// cual). La lista-negra de palabras de E7 no sirve para prosa: daría falsos
// positivos con cada título de documento y nombre de institución en inglés.
//
// Detector por RACHA + densidad verbal, robusto a nombres propios y citas:
//   1. Se eximen las citas (comillas simples con apóstrofos internos tolerados,
//      dobles, guillemets) y los nombres propios canónicos.
//   2. Racha = tokens consecutivos que NO son stopword española ni llevan tilde/ñ.
//      En español no se encadenan ~10 palabras sin `de/la/que/en/y/por/el`; en
//      inglés sí. Los nombres propios de instituciones ("Office of the Director
//      of National Intelligence") forman rachas, así que además exigimos…
//   3. …≥4 palabras VERBALES/CONECTORAS (is/was/will/that/to/and/which/by…, pero
//      NO of/the/in) dentro de la racha — presentes en FRASES inglesas, ausentes
//      en listas de nombres propios. Eso separa prosa inglesa real de una lista
//      de agencias/fuentes.
// WARN agregado (mismo patrón que E13): no rompe el build, deja backlog medible.
// Heurística conservadora (como E9): 0 falsos positivos sobre el corpus actual y
// dispara con inglés inyectado — puede promoverse a ERROR si se prueba estable.

const E7B_ES_STOP = new Set(
  "de la el que en y a los se del las un por con no una su para es al lo como mas o este esta fue son entre sobre cuando ya le ha han sus pero sin tras desde hasta fueron era eran dos tres muy tambien donde segun solo ni cada ese esa esos esas estos estas aquel dentro ante bajo hacia durante mientras porque aunque cuyo cuya les nos me te si asi aqui alli ahi otro otra otros otras todo toda todos todas poco mucho gran primer primera cabo vez anos ano".split(
    " ",
  ),
);
// Verbos/auxiliares/conectores ingleses. Excluye a propósito of/the/in/on/at/an:
// esos aparecen en nombres propios de instituciones y no distinguen prosa.
const E7B_VERB_CONN = new Set(
  "is was were are be been being will would shall can could may might must has have had do does did that which who whose and or but to by from with as for not into than then when where while because however although therefore this these those their its it they we also".split(
    " ",
  ),
);
const E7B_RUN_MIN = 10;
const E7B_VERB_MIN = 4;

function e7bStrip(s) {
  // Comillas simples tolerando apóstrofos internos (member's), dobles, guillemets.
  let t = s.replace(
    /'(?:[^']|'(?=[A-Za-z]))*'|"[^"]*"|«[^»]*»|“[^”]*”|‘[^’]*’/g,
    " ",
  );
  for (const k of SPANGLISH_PROPER_OK) t = t.split(k).join(" ");
  return t;
}
function e7bSuspect(text) {
  const toks = e7bStrip(text).match(/[a-záéíóúñü]+/gi) || [];
  let run = [];
  let best = [];
  for (const raw of toks) {
    const w = raw.toLowerCase();
    if (E7B_ES_STOP.has(w) || /[áéíóúñ]/.test(w)) {
      if (run.length > best.length) best = run;
      run = [];
    } else {
      run.push(w);
    }
  }
  if (run.length > best.length) best = run;
  const verbs = best.filter((w) => E7B_VERB_CONN.has(w)).length;
  return best.length >= E7B_RUN_MIN && verbs >= E7B_VERB_MIN;
}

const e7bHits = [];
for (const c of cases) {
  const fields = [
    ["whatHappened", c.whatHappened],
    ["whyMatters", c.whyMatters],
  ];
  if (Array.isArray(c.evidence))
    c.evidence.forEach((e, i) => fields.push([`evidence[${i}]`, e]));
  for (const [f, v] of fields) {
    if (typeof v === "string" && v && e7bSuspect(v)) {
      e7bHits.push(`${c.id}·${f}`);
    }
  }
}
if (e7bHits.length > 0) {
  record(
    "WARN",
    casesDir,
    0,
    `E7b spanglish en prosa: ${e7bHits.length} campo(s) ES con una racha de ` +
      `inglés sin traducir (≥${E7B_RUN_MIN} palabras, ≥${E7B_VERB_MIN} verbales). ` +
      `Traducir al campo o citar entre comillas. Campos: ${e7bHits.join(", ")}`,
  );
}

// ─── 9c. RULE E10: prose bilingual completeness (ERROR) ──────────────────
//
// Calidad como patrón del audit: si un campo de prosa ES-first existe, su
// traducción _en es obligatoria — el toggle de idioma renderiza ambos, y un
// _en ausente deja al lector inglés con texto en español. summary/whatHappened/
// whyMatters son strings; evidence es array. (sources se exime: suele ser
// URLs/nombres propios neutrales.)

const PROSE_PAIRS = [
  ["summary", "summary_en"],
  ["whatHappened", "whatHappened_en"],
  ["whyMatters", "whyMatters_en"],
];
for (const c of cases) {
  const file = path.join(casesDir, c.id + ".json");
  for (const [es, en] of PROSE_PAIRS) {
    if (c[es] && !c[en]) {
      record("ERROR", file, 0, `E10 i18n: campo ES "${es}" sin traducción "${en}" (case ${c.id}) — la prosa debe ser bilingüe`);
    }
  }
  if (Array.isArray(c.evidence) && c.evidence.length && (!Array.isArray(c.evidence_en) || !c.evidence_en.length)) {
    record("ERROR", file, 0, `E10 i18n: "evidence" sin "evidence_en" (case ${c.id}) — la lista de evidencia debe ser bilingüe`);
  }
}

// ─── 9d. RULE E11: proper-noun fields with Spanish but no _en (WARN) ──────
//
// name y location.place pueden ser nombres propios idénticos en EN (Roswell,
// Lake Huron) — ahí _en es innecesario. Pero si contienen español descriptivo
// (Nuevo México, Departamento de Guerra, Cielo sobre…) y falta _en, el modo
// inglés muestra español. Heurística conservadora (sin diacríticos sueltos,
// para no marcar topónimos propios como Pará/Popocatépetl). WARN, no ERROR.

const ES_DESC_RE =
  /\b(sobre|cerca|entre|frente|cielo|fuerzas?|guerra|ministerio|departamento|ej[eé]rcito|a[eé]reo|a[eé]rea|nuevo|nueva|norte|sur|isla|islas|oc[eé]ano|provincias?|distrito|ubicaci[oó]n|reportes?|renombrado|defensa|nacional|c[aá]mara|esc(o|ó)cia|francia|brasil|b[eé]lgica|alemania|jap[oó]n|estado mayor|guerra)\b/i;
for (const c of cases) {
  const file = path.join(casesDir, c.id + ".json");
  if (c.name && !c.name_en && ES_DESC_RE.test(c.name)) {
    record("WARN", file, 0, `E11 i18n: "name" con español "${(c.name.match(ES_DESC_RE) || [])[0]}" sin name_en (case ${c.id})`);
  }
  const place = c.location && c.location.place;
  if (place && !(c.location && c.location.place_en) && ES_DESC_RE.test(place)) {
    record("WARN", file, 0, `E11 i18n: "place" con español "${(place.match(ES_DESC_RE) || [])[0]}" sin place_en (case ${c.id})`);
  }
}

// ─── 9e. RULE E12: lede robustness — summary too short (WARN) ─────────────
//
// El summary es el lede del caso: debe cargar quién/qué/cuándo/dónde, no ser
// una nota telegráfica. Un lede de primer nivel raramente baja de ~180 chars
// sin sacrificar dateline o atribución. WARN, no ERROR — es estándar editorial,
// no error de datos. (Histórico: 6 casos eran stubs <155 chars; reescritos jun
// 2026 a datelines completos.)

const LEDE_MIN = 180;
for (const c of cases) {
  const file = path.join(casesDir, c.id + ".json");
  const len = (c.summary || "").length;
  if (len > 0 && len < LEDE_MIN) {
    record("WARN", file, 0, `E12 lede: summary de ${len} chars (<${LEDE_MIN}) — un lede debe cargar quién/qué/cuándo/dónde (case ${c.id})`);
  }
}

// ─── 9f. RULE E13: description ≥ 1 page (editorial standard, WARN) ────────
//
// Línea editorial (jun 2026): la DESCRIPCIÓN narrativa de cada caso
// —whatHappened + whyMatters— debe alcanzar ~1 página A4 (~550 palabras /
// ~3.500 caracteres) en español. evidence/sources aportan pero NO cuentan
// para la página: el estándar mide prosa, no listas. Se mide el cuerpo ES
// (E10 ya garantiza que el _en exista y sea bilingüe). WARN agregado —no
// ERROR— porque el backlog se expande con investigación caso por caso, no
// rellenando; el conteo deja el progreso medible (mismo patrón que E9).
//
// El expediente entero (incl. evidence/sources) no debe quedar exento: un
// caso con narrativa corta pero listas largas SIGUE bajo el estándar, porque
// la página es prosa. Por eso el umbral aplica solo a whatHappened+whyMatters.

const PAGE_MIN_BODY = 3500;
const shortBodies = [];
for (const c of cases) {
  const bodyLen = ((c.whatHappened || "") + "\n\n" + (c.whyMatters || "")).trim().length;
  if (bodyLen < PAGE_MIN_BODY) {
    shortBodies.push({ id: c.id, tier: c.tier || "?", len: bodyLen });
  }
}
if (shortBodies.length > 0) {
  const byTier = { S: 0, A: 0, B: 0 };
  for (const s of shortBodies) byTier[s.tier] = (byTier[s.tier] || 0) + 1;
  const shortest = [...shortBodies]
    .sort((a, b) => a.len - b.len)
    .slice(0, 12)
    .map((s) => `${s.id}(${s.tier},${s.len})`)
    .join(", ");
  record(
    "WARN",
    casesDir,
    0,
    `E13 longitud: ${shortBodies.length}/${cases.length} casos bajo ~1 página ` +
      `(whatHappened+whyMatters <${PAGE_MIN_BODY} chars ES). Backlog por tier: ` +
      `S×${byTier.S} A×${byTier.A} B×${byTier.B}. Expandir con investigación, ` +
      `prioridad S→A→B. Más cortos: ${shortest}`,
  );
}

// ─── 9g. RULES M1/M2: invariantes del modelo MECE (posterior) ────────────
//
// Modelo MECE (lib/meceModel.ts): cada caso de incidente reparte el
// 100% sobre 6 narrativas mutuamente excluyentes. Invariantes duros:
//   M1 · todo caso category!=="document" DEBE tener `posterior` con las 6
//        claves exactas, sumando 1 (±0.005). ERROR si no.
//   M1 · los documentos pueden traer posterior (= "lean" evidencial). OK.
//   M2 · si la masa mundano_natural ≥ 15%, el caso DEBE declarar `mundanoType`
//        (misid|natural|fraude): la vista expandida abre esa masa por sub-tipo
//        y sin el campo cae en "misid" por default (misclasificación silenciosa).
const MECE_CLASSES_AUDIT = [
  "mundano_natural", "humana_clasificada", "adversaria", "nohumano_encubierto", "nohumano_abierto", "indet",
];
let mecePosteriorCount = 0;
const meceAgg = Object.fromEntries(MECE_CLASSES_AUDIT.map((k) => [k, 0]));
for (const c of cases) {
  const file = path.join(casesDir, c.id + ".json");
  const isDoc = c.category === "document";
  const p = c.posterior;
  // Incidente: posterior obligatorio (P(narrativa|objeto)).
  // Documento: posterior OPCIONAL (= "lean" evidencial; ausente → indet en runtime).
  if (!isDoc && !p) {
    record("ERROR", file, 0, `M1: caso no-documento "${c.id}" sin posterior (modelo MECE)`);
    continue;
  }
  if (!p) continue; // documento sin lean declarado: válido
  const missing = MECE_CLASSES_AUDIT.filter((k) => !(k in p));
  const extra = Object.keys(p).filter((k) => !MECE_CLASSES_AUDIT.includes(k));
  if (missing.length || extra.length) {
    record("ERROR", file, 0, `M1: posterior de "${c.id}" con claves mal (faltan [${missing}], sobran [${extra}])`);
    continue;
  }
  const total = MECE_CLASSES_AUDIT.reduce((acc, k) => acc + (p[k] || 0), 0);
  if (Math.abs(total - 1) > 0.005) {
    record("ERROR", file, 0, `M1: posterior de "${c.id}" suma ${total.toFixed(4)} (debe ser 1)`);
    continue;
  }
  // M2 · clasificación forzada sin default silencioso: si un caso tiene masa
  // mundano_natural significativa (≥15%), en la vista expandida esa masa se
  // abre en misid/natural/fraude según `mundanoType`. Sin el campo, el código
  // cae en "misid" por defecto (lib/meceModel.ts) → misclasificación silenciosa.
  // Se exige declararlo explícitamente.
  const MUNDANO_TYPES = ["misid", "natural", "fraude"];
  if (total > 0 && p.mundano_natural / total >= 0.15 && !MUNDANO_TYPES.includes(c.mundanoType)) {
    record(
      "ERROR",
      file,
      0,
      `M2: "${c.id}" tiene mundano_natural=${(p.mundano_natural / total).toFixed(2)} pero sin mundanoType (caería en "misid" por default) — declarar misid|natural|fraude`,
    );
  }
  if (isDoc) continue;
  mecePosteriorCount++;
  for (const k of MECE_CLASSES_AUDIT) meceAgg[k] += p[k];
}

// ─── 9h. RULE E14: orphan taxonomy — patterns sin caso (WARN) ────────────
//
// Un patrón vive en patterns.json y se referencia desde case.patterns. Un
// patrón que ningún caso usa es taxonomía muerta: o falta enlazarlo a casos
// que lo ejemplifican, o sobra. WARN agregado (mismo patrón que E9/E13). Los
// frameworks NO se referencian a nivel de caso, así que esta regla solo aplica
// a patterns (la integridad referencial de los ids usados la cubre el schema).

const usedPatterns = new Set();
for (const c of cases) for (const p of c.patterns || []) usedPatterns.add(p);
const orphanPatterns = patternList
  .map((p) => p.id || p.slug)
  .filter((id) => id && !usedPatterns.has(id));
if (orphanPatterns.length > 0) {
  record(
    "WARN",
    path.join(root, "data", "patterns.json"),
    0,
    `E14 taxonomía: ${orphanPatterns.length}/${patternList.length} patrones sin ningún caso que los use: ${orphanPatterns.join(", ")} — enlazar a casos que los ejemplifiquen o retirar`,
  );
}

// ─── 9i. RULE E15: JSON-LD prohibido — @type "Event" (ERROR) ─────────────
//
// Anti-pattern documentado (CLAUDE.md): Google aplica el validador de eventos
// comerciales a `Event` y exige organizer/performer/offers. Los casos usan
// Article + contentLocation:Place. Esta regla rompe el build si reaparece un
// JSON-LD `@type: "Event"` en cualquier .ts/.tsx (no caza addEventListener ni
// tipos de React: exige el par `@type … "Event"` propio del JSON-LD).

const EVENT_LD_RE = /["']?@type["']?\s*:\s*["']Event["']/;
const ldScanFiles = [
  ...tsxFiles,
  ...walk(path.join(root, "components"), [".tsx"]),
  ...walk(path.join(root, "lib"), [".ts", ".tsx"]),
];
for (const file of ldScanFiles) {
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((line, i) => {
    if (EVENT_LD_RE.test(line)) {
      record(
        "ERROR",
        file,
        i + 1,
        `E15 JSON-LD: '@type: "Event"' prohibido (Google exige organizer/performer/offers) — usar Article + contentLocation:Place`,
      );
    }
  });
}

// ─── 9j. RULE E16: presupuesto SSG — client components (WARN) ────────────
//
// El proyecto prioriza server components (zero JS shipped). Cada "use client"
// envía JS al cliente. No se prohíben (el explorador BI los necesita), pero se
// vigila el total contra un techo para que el crecimiento sea visible y
// deliberado, no por goteo. WARN, no ERROR.

const CLIENT_BUDGET = 45;
const CLIENT_DIRECTIVE = /^\s*["']use client["']/;
const clientScanFiles = [
  ...walk(path.join(root, "app"), [".tsx", ".ts"]),
  ...walk(path.join(root, "components"), [".tsx", ".ts"]),
];
const clientComponents = clientScanFiles.filter((f) =>
  CLIENT_DIRECTIVE.test(fs.readFileSync(f, "utf-8")),
);
if (clientComponents.length > CLIENT_BUDGET) {
  record(
    "WARN",
    path.join(root, "components"),
    0,
    `E16 SSG: ${clientComponents.length} client components (techo ${CLIENT_BUDGET}) — revisar si alguno puede ser server component; subir el techo solo si el crecimiento es deliberado`,
  );
}

// ─── 9j-bis. RULE E18: guardrails de anti-patterns (enforce lo documentado) ─
//
// Promueve tres anti-patterns de `## Anti-patterns conocidos` (CLAUDE.md) de
// "desaconsejado" a "rompe el build": una violación es ERROR en CI en vez de
// depender de que alguien recuerde la regla. Sondas deterministas y baratas
// (lectura + regex), sin node_modules. La cuarta candidata —clases Tailwind
// dinámicas— se deja como doc: chequearla sin falsos positivos (comentarios,
// strings) es frágil, así que no se blinda.

// 18a — lib/data.ts no debe importar fs (lo bundlea WorldMap.tsx, client → webpack falla)
const dataTsPath = path.join(root, "lib", "data.ts");
if (fs.existsSync(dataTsPath)) {
  const src = fs.readFileSync(dataTsPath, "utf-8");
  if (/\bfrom\s+["']node:fs["']|\bfrom\s+["']fs["']|require\(\s*["']fs["']\s*\)/.test(src)) {
    record("ERROR", dataTsPath, 0, "E18a: lib/data.ts importa fs — lo bundlea un client component (WorldMap.tsx) y webpack falla. Cargar datos vía JSON import, no fs.");
  }
}

// 18b — sin `node:` scheme en imports del código bundleado por Next (app/components/lib).
// scripts/ SÍ usa node: legítimamente (no lo bundlea Next) y queda excluido.
const NODE_SCHEME = /\bfrom\s+["']node:/;
for (const f of [
  ...walk(path.join(root, "app"), [".tsx", ".ts"]),
  ...walk(path.join(root, "components"), [".tsx", ".ts"]),
  ...walk(path.join(root, "lib"), [".tsx", ".ts"]),
]) {
  fs.readFileSync(f, "utf-8").split("\n").forEach((ln, i) => {
    if (NODE_SCHEME.test(ln) && !ln.trimStart().startsWith("//")) {
      record("ERROR", f, i + 1, `E18b: import con \`node:\` scheme (${ln.trim()}) — Next no lo resuelve en el bundle. Usar el especificador sin prefijo (fs, path…).`);
    }
  });
}

// 18c — sin `Event` JSON-LD (Google exige organizer/performer/offers; usar Article + Place)
const EVENT_LD = /["']@type["']\s*:\s*["']Event["']/;
for (const f of [
  ...walk(path.join(root, "app"), [".tsx", ".ts"]),
  ...walk(path.join(root, "lib"), [".tsx", ".ts"]),
]) {
  fs.readFileSync(f, "utf-8").split("\n").forEach((ln, i) => {
    if (EVENT_LD.test(ln)) {
      record("ERROR", f, i + 1, `E18c: JSON-LD "@type":"Event" — Google aplica el validador de eventos comerciales (organizer/performer/offers). Usar Article + contentLocation: Place.`);
    }
  });
}

// ─── 9k. RULE E17: visor de documentos — assets same-origin en disco (WARN) ─
//
// El visor inline (UAPCase.documents[] + primaryDocument) embebe documentos
// auto-hospedados bajo web/public/pursue/ (same-origin, porque war.gov bloquea
// el framing). Un `src`/`url` same-origin que apunta a un archivo inexistente
// renderiza un iframe/img roto. Esta regla cruza cada referencia local contra
// el disco y reporta las que faltan en un WARN agregado: hace medible el
// backlog de subida (mismo patrón que E9/E13) y se pone en verde al subir los
// binarios. Las URLs externas (http/https, p. ej. Commons) se eximen: su
// disponibilidad no es verificable en build.
const publicDir = path.join(root, "public");
const docAssetRefs = []; // {caseId, ref}
for (const c of cases) {
  for (const d of c.documents || []) {
    if (typeof d.src === "string" && d.src.startsWith("/")) docAssetRefs.push({ caseId: c.id, ref: d.src });
  }
  const pdUrl = c.primaryDocument && c.primaryDocument.url;
  if (typeof pdUrl === "string" && pdUrl.startsWith("/")) docAssetRefs.push({ caseId: c.id, ref: pdUrl });
}
const missingAssets = docAssetRefs.filter(
  ({ ref }) => !fs.existsSync(path.join(publicDir, ref)),
);
const presentAssets = docAssetRefs.length - missingAssets.length;
if (missingAssets.length > 0) {
  const list = missingAssets.map((m) => `${m.ref} (${m.caseId})`).join(", ");
  record(
    "WARN",
    publicDir,
    0,
    `E17 visor: ${missingAssets.length}/${docAssetRefs.length} assets de documento same-origin no existen aún en web/public/ — el visor queda roto hasta subirlos: ${list}`,
  );
}

// ─── 10. REPORT ──────────────────────────────────────────────────────────

const errors = findings.filter((f) => f.level === "ERROR");
const warns = findings.filter((f) => f.level === "WARN");
const notes = findings.filter((f) => f.level === "NOTE");

const out = [];
out.push("");
out.push("═══════════════════════════════════════════════════════════════════");
out.push(" UAP Codex · Consistency Audit");
out.push("═══════════════════════════════════════════════════════════════════");
out.push("");
out.push(` Cases:        ${STATS.cases}`);
out.push(` Countries:    ${STATS.countries}`);
out.push(` Years:        ${STATS.years}`);
out.push(` Tier S/A/B:   ${STATS.tierS} / ${STATS.tierA} / ${STATS.tierB}`);
out.push(` Researchers linked to ≥1 case: ${linkedCount} / ${STATS.researchers}`);
out.push(` Patterns usados / total: ${STATS.patterns - orphanPatterns.length} / ${STATS.patterns}`);
out.push(` Client components ("use client"): ${clientComponents.length} / techo ${CLIENT_BUDGET}`);
out.push(` Descripciones ≥1 página (≥${PAGE_MIN_BODY} chars): ${STATS.cases - shortBodies.length} / ${STATS.cases}`);
out.push(` Casos con posterior MECE (no-documento): ${mecePosteriorCount}`);
out.push(` Assets de visor same-origin presentes en disco: ${presentAssets} / ${docAssetRefs.length}`);
{
  const meceTotal = Object.values(meceAgg).reduce((a, b) => a + b, 0) || 1;
  out.push(" MECE · partición del corpus (Σ esperado · %):");
  for (const k of [...MECE_CLASSES_AUDIT].sort((a, b) => meceAgg[b] - meceAgg[a])) {
    out.push(`   ${k.padEnd(16)} ${meceAgg[k].toFixed(1).padStart(6)}  (${(meceAgg[k] / meceTotal * 100).toFixed(1)}%)`);
  }
}
out.push("");
out.push(`─ Findings ─────────────────────────────────────────────`);
out.push(`  ERRORS: ${errors.length}    WARNS: ${warns.length}    NOTES: ${notes.length}`);
out.push("");

if (errors.length > 0) {
  out.push("  🔴 ERRORS (must fix — break the build in CI):");
  for (const f of errors) {
    out.push(`     ${f.file}:${f.line}  ${f.msg}`);
  }
  out.push("");
}
if (warns.length > 0) {
  out.push("  🟡 WARNINGS (review):");
  for (const f of warns.slice(0, 30)) {
    out.push(`     ${f.file}:${f.line}  ${f.msg}`);
  }
  if (warns.length > 30) out.push(`     … and ${warns.length - 30} more`);
  out.push("");
}
if (notes.length > 0) {
  out.push("  ℹ️  NOTES (by-design, non-actionable):");
  for (const f of notes) {
    out.push(`     ${f.file}:${f.line}  ${f.msg}`);
  }
  out.push("");
}
if (errors.length === 0 && warns.length === 0) {
  out.push("  ✅ All consistency checks passed.");
  out.push("");
}
out.push("═══════════════════════════════════════════════════════════════════");
out.push("");

console.log(out.join("\n"));

const warnOnly = process.argv.includes("--warn");
if (errors.length > 0 && !warnOnly) process.exit(1);
