#!/usr/bin/env node
/**
 * audit-prosa.mjs — sonda de LEGIBILIDAD de las fichas (ES y EN).
 *
 * Nació de un falso verde (nov 2026): la capa 2 cerró con audit-consistency en
 * «ERRORS 0, WARNS 0» y la prosa seguía mal. Esas reglas miden FORMA (comillas,
 * límites, muletillas); ninguna mide si una frase se entiende a la primera. La
 * primera frase del resumen de Skinwalker tenía ~60 palabras y seis siglas, y la
 * de Kinross 1953 pasaba de 80 con dos siglas glosadas dentro.
 *
 * Esta sonda NO juzga calidad —eso lo hace el skill /auditar-prosa con un
 * lector— y TAMPOCO la predice: en la prueba con lectores de nov 2026 (10
 * fichas, ES+EN) su puntuación no se correlacionó con la nota del lector
 * (Spearman ≈ 0). El globo chino, el peor según la sonda, fue el mejor leído
 * (7–8/10); Panamá y Goulburn, con 0 puntos, sacaron 5–6 y había que
 * reescribirlas. Lo que falla en las fichas es la SELECCIÓN (transcribir el
 * registro) y la COHERENCIA (recuentos que no cuadran, citas que contradicen
 * la frase), y eso no se mide contando. Por eso la muestra del skill se elige
 * al azar por tier, no por esta puntuación.
 *
 * Para qué sirve: localizar DEFECTOS CONCRETOS con su texto (`--id` lista las
 * frases más cargadas), vocabulario de España, citas largas en inglés sin
 * traducir dentro del español, y medir la tendencia del archivo entre dos
 * fechas.
 *
 * Métricas por ficha e idioma (prosa = whatHappened + whyMatters, sin citas):
 *   frase media (palabras), % de frases > 40 palabras, frase más larga,
 *   paréntesis por frase, siglas distintas por 1.000 palabras,
 *   primera frase del resumen (palabras) y siglas del resumen,
 *   y en ES: vocabulario de España (la norma es el español latinoamericano culto).
 *
 * Es INFORME, no gate: sale con 0 salvo `--max-score N` (CI opcional).
 * Node plano, sin dependencias.
 *
 * Uso:  node scripts/audit-prosa.mjs                 ranking (peores 25) + resumen
 *       node scripts/audit-prosa.mjs --top 60
 *       node scripts/audit-prosa.mjs --id kinross-incident-1953
 *       node scripts/audit-prosa.mjs --json salida.json
 *       node scripts/audit-prosa.mjs --negative-control
 */
import fs from "fs";
import path from "path";

const CASES = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data", "cases");
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

// Umbrales: una frase cómoda en el móvil ronda 15–25 palabras; la prensa de
// calidad alterna y admite alguna de hasta ~35. Más de 40 casi siempre apila.
export const LIMITS = { mean: 25, long: 40, longPct: 15, paren: 0.35, sigla: 12, sumFirst: 30, sumSiglas: 2,
  // densidad: datos sueltos por frase, % de frases con ≥ 6 datos, horas por párrafo
  datos: 3, densa: 6, densasPct: 15, horasParrafo: 3 };

// Pesos. Calibrados contra la prueba con lectores de nov 2026 (10 fichas, ES+EN);
// ver el comentario de DENSIDAD.
export const W = JSON.parse(process.env.PROSA_W || "null") || { media: 15, largas: 5, paren: 5, sigla: 5, res: 10, resSig: 5, datos: 30, densas: 15, horas: 10 };

// Vocabulario de España con equivalente latinoamericano. Conservador: solo
// palabras que en América suenan claramente peninsulares en prosa periodística.
export const PENINSULAR = {
  // «finca» no entra: es normal en Argentina, Colombia o Centroamérica.
  pliego: "bases (de la licitación)", ordenador: "computadora",
  coche: "auto", coches: "autos", aparcar: "estacionar", aparcado: "estacionado",
  vosotros: "ustedes", zumo: "jugo", "de aquí a": "hasta", "teléfono móvil": "celular", // «unidad móvil» es correcto
  mesilla: "mesita de noche", farola: "poste de luz", "cárabo": "búho / lechuza",
};

const unquote = (t) => t.replace(/«[^»]*»|"[^"]*"|“[^”]*”/g, " «cita» ").replace(/\[\[[^\]]+\]\]/g, "el caso");
const ABBR = /\b(?:EE|UU|Sr|Sra|Dr|Dra|St|Mr|Mrs|Dr|Lt|Col|Gen|Sgt|Capt|U\.S|No|n\.º|aprox|p|pp|etc|vs|Jr|Inc|Co|Ft|Mt)\.\s*$/;
export function sentences(text) {
  const out = []; let buf = "";
  for (const part of text.split(/(?<=[.!?;]["»”’]?)\s+(?=[«"“¿¡A-ZÁÉÍÓÚÑ0-9])/)) {
    buf = buf ? buf + " " + part : part;
    if (ABBR.test(buf)) continue;
    out.push(buf.trim()); buf = "";
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter((s) => s.split(/\s+/).length > 2);
}
const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const SIGLA = /\b[A-Z][A-Z0-9]{1,}(?:-[A-Z0-9]+)?\b/g;
const NOT_SIGLA = new Set(["EE", "UU", "II", "III", "IV", "VI", "VII", "XX", "XIX", "XXI", "TV", "OK", "UFO", "UAP", "OVNI", "OVNIS", "US", "USA", "UK"]);
const siglas = (t) => new Set((t.match(SIGLA) || []).filter((s) => !NOT_SIGLA.has(s)));

// DENSIDAD DE DATOS. La prueba con lectores (nov 2026) mostró que la longitud
// de la frase casi no predice la nota: Panamá 1958 tenía frases cortas y sacó
// 5/10 por transcribir el registro hora por hora (8 horas en un párrafo), y el
// globo chino, con frases largas pero de un solo hilo, sacó 7–8. Lo que cansa
// es cuántos datos sueltos carga cada frase: horas, cifras, siglas, nombres.
const HORA = /\b\d{1,2}[:.]\d{2}\b(?:\s*(?:a\.?\s?m\.?|p\.?\s?m\.?|h\b|horas?\b|hours?\b|Z\b))?/gi;
const CIFRA = /\b\d[\d.,]*\b/g;
// Palabra con mayúscula que no abre la frase: nombre de persona, lugar, unidad
// u oficina. Se cuentan como datos que el lector tiene que retener.
const PROPIO = /(?<=[\p{L},;:)]\s)[A-ZÁÉÍÓÚÑ][\p{Ll}]+/gu;
const CONECTOR = new Set(["El", "La", "Los", "Las", "Un", "Una", "En", "De", "Del", "Al", "Y", "The", "A", "An", "In", "Of", "And", "On", "At", "He", "She", "It", "They", "Él", "Ella"]);
export function datos(f) {
  const horas = (f.match(HORA) || []).length;
  const cifras = (f.replace(HORA, " ").match(CIFRA) || []).length;
  const props = (f.match(PROPIO) || []).filter((w) => !CONECTOR.has(w)).length;
  return { horas, n: horas + cifras + siglasEn(f) + props };
}
const siglasEn = (f) => (f.match(SIGLA) || []).filter((x) => !NOT_SIGLA.has(x)).length;

export function measure(prose, summary, lang) {
  const p = unquote(prose), s = unquote(summary || "");
  const ss = sentences(p), lens = ss.map(words);
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const m = {
    frases: ss.length,
    media: +(total / (ss.length || 1)).toFixed(1),
    largasPct: Math.round((100 * lens.filter((n) => n > LIMITS.long).length) / (ss.length || 1)),
    maxima: Math.max(0, ...lens),
    parenPorFrase: +(((p.match(/\(/g) || []).length) / (ss.length || 1)).toFixed(2),
    siglasPorMil: Math.round((1000 * siglas(p).size) / total),
    datosPorFrase: 0, densasPct: 0, maxHorasParrafo: 0, peores: [],
    resumen1: 0,
    citasIngles: [],
    resumenSiglas: siglas(s).size,
    espana: [],
  };
  const ds = ss.map(datos);
  m.datosPorFrase = +(ds.reduce((a, d) => a + d.n, 0) / (ss.length || 1)).toFixed(1);
  m.densasPct = Math.round((100 * ds.filter((d) => d.n >= LIMITS.densa).length) / (ss.length || 1));
  m.maxHorasParrafo = Math.max(0, ...p.split(/\n\n/).map((par) => (par.match(HORA) || []).length));
  // Las frases que peor se leen, con su texto: un número sin la frase no se arregla.
  m.peores = ss.map((f, i) => ({ palabras: lens[i], datos: ds[i].n, f }))
    .filter((x) => x.palabras > 50 || x.datos >= 8)
    .sort((a, b) => b.datos + b.palabras / 10 - (a.datos + a.palabras / 10)).slice(0, 5)
    .map((x) => `[${x.palabras} palabras · ${x.datos} datos] ${x.f.slice(0, 220)}${x.f.length > 220 ? "…" : ""}`);
  // La 1ª frase del resumen solo pesa si además apila datos: un resumen largo
  // con un solo hilo se lee bien (globo chino, 7–8/10 con 38 palabras).
  const r1 = sentences(s)[0] || "";
  m.resumen1 = datos(r1).n >= 5 ? words(r1) : 0;
  if (lang === "es") {
    // Cita en inglés de más de 8 palabras dentro del español, sin traducir:
    // la guía pide traducirla o glosarla (Skinwalker traía varias, nov 2026).
    const EN = /\b(?:the|and|of|was|were|have|has|that|with|which|not|be|by|it|for)\b/gi;
    for (const q of `${prose}\n${summary || ""}`.match(/«[^»]{40,}»/g) || []) {
      if (words(q) > 8 && (q.match(EN) || []).length >= 2) m.citasIngles.push(q.slice(0, 90));
    }
    for (const [w, alt] of Object.entries(PENINSULAR)) {
      const re = new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`, "iu");
      if (re.test(p) || re.test(s)) m.espana.push(`${w} → ${alt}`);
    }
  }
// Puntuación 0–100: cuánto se excede cada umbral (0 = dentro de todos).
  const over = (v, lim, w) => Math.max(0, (v - lim) / lim) * w;
  m.score = Math.min(100, Math.round(
    over(m.media, LIMITS.mean, W.media) + over(m.largasPct, LIMITS.longPct, W.largas) +
    over(m.parenPorFrase, LIMITS.paren, W.paren) + over(m.siglasPorMil, LIMITS.sigla, W.sigla) +
    over(m.resumen1, LIMITS.sumFirst, W.res) + over(m.resumenSiglas, LIMITS.sumSiglas, W.resSig) +
    over(m.datosPorFrase, LIMITS.datos, W.datos) + over(m.densasPct, LIMITS.densasPct, W.densas) +
    over(m.maxHorasParrafo, LIMITS.horasParrafo, W.horas) +
    m.espana.length * 3 + m.citasIngles.length * 3));
  return m;
}

export function loadCases() {
  return fs.readdirSync(CASES).filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(CASES, f), "utf8")))
    .filter((o) => o.category !== "document");
}

export function auditCase(o) {
  const es = measure(`${o.whatHappened || ""}\n\n${o.whyMatters || ""}`, o.summary, "es");
  const en = measure(`${o.whatHappened_en || ""}\n\n${o.whyMatters_en || ""}`, o.summary_en, "en");
  return { id: o.id, tier: o.tier, es, en, score: Math.max(es.score, en.score) };
}

// ── control negativo: la sonda debe separar una frase apilada de una llana ──
if (args.includes("--negative-control")) {
  const bad = measure("La noche del 23 de noviembre de 1953, en plena tensión defensiva de la Guerra Fría sobre los Grandes Lagos, una estación de radar de tierra del Mando de Defensa Aérea (ADC), de las que guiaban a los cazas hacia los aviones sospechosos (GCI, intercepción controlada desde tierra), siguió sobre el lago Superior un avión que no cuadraba con ningún plan de vuelo y que vio desde su coche.", "", "es");
  const good = measure("La noche del 23 de noviembre de 1953, un radar militar de Michigan detectó sobre el lago Superior un avión que no seguía ninguna ruta prevista. El controlador pensó que era un avión canadiense. Desde la base de Kinross despegó un caza para identificarlo.", "", "es");
  const abbr = sentences("Lo dijo el Dr. Hynek en EE. UU. el mismo día. Luego se fue.");
  const q = measure("El informe dice «the coins can be easily explained by fraud perpetrated by the officers» y nada más.", "", "es");
  const ok = bad.score > 30 && good.score === 0 && bad.espana.length === 1 && abbr.length === 2 && q.citasIngles.length === 1;
  console.log(ok ? "✅ control negativo: la sonda discrimina" : `❌ control negativo falló: malo=${bad.score} bueno=${good.score} españa=${bad.espana} frases=${abbr.length}`);
  process.exit(ok ? 0 : 1);
}

const results = loadCases().map(auditCase).sort((a, b) => b.score - a.score);
const id = arg("--id");
if (id) {
  const r = results.find((x) => x.id === id);
  if (!r) { console.error(`no existe la ficha ${id}`); process.exit(1); }
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
if (arg("--json")) fs.writeFileSync(arg("--json"), JSON.stringify(results, null, 2) + "\n");

const top = +arg("--top", 25);
const pad = (v, n) => String(v).padStart(n);
console.log("═".repeat(78));
console.log("audit-prosa · carga de datos y defectos concretos (NO predice la nota del lector: ver cabecera)");
console.log(`umbrales: frase media ≤ ${LIMITS.mean} · frases > ${LIMITS.long} palabras ≤ ${LIMITS.longPct}% · paréntesis/frase ≤ ${LIMITS.paren} · siglas/1.000 ≤ ${LIMITS.sigla} · 1ª frase del resumen ≤ ${LIMITS.sumFirst} · siglas del resumen ≤ ${LIMITS.sumSiglas}`);
console.log("═".repeat(78));
console.log(" pts  tier  ficha                                     ES media/larg%/1ªres   EN media/larg%/1ªres");
for (const r of results.slice(0, top)) {
  console.log(`${pad(r.score, 4)}  ${pad(r.tier, 4)}  ${r.id.padEnd(40).slice(0, 40)}  ${pad(r.es.media, 5)}/${pad(r.es.largasPct, 3)}%/${pad(r.es.resumen1, 3)}       ${pad(r.en.media, 5)}/${pad(r.en.largasPct, 3)}%/${pad(r.en.resumen1, 3)}${r.es.espana.length ? "   ES: " + r.es.espana.join(", ") : ""}`);
}
const med = (k, l) => { const v = results.map((r) => r[l][k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
const byTier = {};
for (const r of results) { byTier[r.tier] ??= [0, 0]; byTier[r.tier][1]++; if (r.score > 0) byTier[r.tier][0]++; }
console.log("─".repeat(78));
console.log(`fichas: ${results.length} · fuera de algún umbral: ${results.filter((r) => r.score > 0).length} (${Object.entries(byTier).sort().map(([t, [a, b]]) => `${t} ${a}/${b}`).join(" · ")})`);
console.log(`medianas ES: frase ${med("media", "es")} · 1ª frase del resumen ${med("resumen1", "es")} · siglas del resumen ${med("resumenSiglas", "es")}`);
console.log(`medianas EN: frase ${med("media", "en")} · 1ª frase del resumen ${med("resumen1", "en")} · siglas del resumen ${med("resumenSiglas", "en")}`);
console.log(`vocabulario de España en ES: ${results.filter((r) => r.es.espana.length).length} fichas · citas largas en inglés sin traducir en ES: ${results.filter((r) => r.es.citasIngles.length).length} fichas`);
const max = arg("--max-score");
if (max && results[0].score > +max) { console.log(`❌ ${results.filter((r) => r.score > +max).length} fichas superan ${max} puntos`); process.exit(1); }
