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
 * fichas, ES+EN) su antigua puntuación no se correlacionó con la nota del lector
 * (Spearman ≈ 0). El globo chino, el peor según la sonda, fue el mejor leído
 * (7–8/10); Panamá y Goulburn, con 0 puntos, sacaron 5–6 y había que
 * reescribirlas. Lo que falla en las fichas es la SELECCIÓN (transcribir el
 * registro) y la COHERENCIA (recuentos que no cuadran, citas que contradicen
 * la frase), y eso no se mide contando. Por eso la muestra del skill se elige
 * al azar por tier, no por esta puntuación.
 *
 * Para qué sirve: localizar DEFECTOS CONCRETOS con su texto —frases que
 * apilan datos o pasan de 50 palabras, vocabulario de España y citas largas en
 * inglés sin traducir dentro del español— para que el redactor los arregle.
 * La puntuación 0–100 y el ranking de fichas se quitaron en nov 2026: no
 * predecían nada (ver arriba) y se usaban para elegir muestras.
 *
 * Es INFORME, no gate: sale siempre con 0 (salvo el control negativo).
 * Node plano, sin dependencias.
 *
 * Uso:  node scripts/audit-prosa.mjs                 fichas con defectos, con su texto
 *       node scripts/audit-prosa.mjs --id kinross-incident-1953
 *       node scripts/audit-prosa.mjs --json salida.json
 *       node scripts/audit-prosa.mjs --negative-control
 */
import fs from "fs";
import path from "path";

const CASES = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data", "cases");
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

// Una frase se señala si pasa de LARGA palabras o carga DENSA datos sueltos.
const LARGA = 50, DENSA = 8;

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
  const ss = [...sentences(p), ...sentences(s)];
  const m = { frases: [], citasIngles: [], espana: [] };
  // Las frases que peor se leen, con su texto: un número sin la frase no se arregla.
  m.frases = ss.map((f) => ({ palabras: words(f), datos: datos(f).n, f }))
    .filter((x) => x.palabras > LARGA || x.datos >= DENSA)
    .map((x) => `[${x.palabras} palabras · ${x.datos} datos] ${x.f.slice(0, 220)}${x.f.length > 220 ? "…" : ""}`);
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
  m.total = m.frases.length + m.citasIngles.length + m.espana.length;
  return m;
}

export function loadCases() {
  return fs.readdirSync(CASES).filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(CASES, f), "utf8")));
}

export function auditCase(o) {
  const es = measure(`${o.whatHappened || ""}\n\n${o.whyMatters || ""}`, o.summary, "es");
  const en = measure(`${o.whatHappened_en || ""}\n\n${o.whyMatters_en || ""}`, o.summary_en, "en");
  return { id: o.id, tier: o.tier, es, en, total: es.total + en.total };
}

// ── control negativo: la sonda debe separar una frase apilada de una llana ──
if (args.includes("--negative-control")) {
  const bad = measure("La noche del 23 de noviembre de 1953, en plena tensión defensiva de la Guerra Fría sobre los Grandes Lagos, una estación de radar de tierra del Mando de Defensa Aérea (ADC), de las que guiaban a los cazas hacia los aviones sospechosos (GCI, intercepción controlada desde tierra), siguió sobre el lago Superior un avión que no cuadraba con ningún plan de vuelo y que vio desde su coche.", "", "es");
  const good = measure("La noche del 23 de noviembre de 1953, un radar militar de Michigan detectó sobre el lago Superior un avión que no seguía ninguna ruta prevista. El controlador pensó que era un avión canadiense. Desde la base de Kinross despegó un caza para identificarlo.", "", "es");
  const abbr = sentences("Lo dijo el Dr. Hynek en EE. UU. el mismo día. Luego se fue.");
  const q = measure("El informe dice «the coins can be easily explained by fraud perpetrated by the officers» y nada más.", "", "es");
  const ok = bad.frases.length === 1 && good.frases.length === 0 && good.total === 0 && bad.espana.length === 1 && abbr.length === 2 && q.citasIngles.length === 1;
  console.log(ok ? "✅ control negativo: la sonda discrimina" : `❌ control negativo falló: malo=${bad.frases.length} bueno=${good.total} españa=${bad.espana} frases=${abbr.length}`);
  process.exit(ok ? 0 : 1);
}

const results = loadCases().map(auditCase).sort((a, b) => a.id.localeCompare(b.id));
const id = arg("--id");
if (id) {
  const r = results.find((x) => x.id === id);
  if (!r) { console.error(`no existe la ficha ${id}`); process.exit(1); }
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
if (arg("--json")) fs.writeFileSync(arg("--json"), JSON.stringify(results, null, 2) + "\n");

const conDefectos = results.filter((r) => r.total > 0);
console.log("═".repeat(78));
console.log(`audit-prosa · defectos concretos: frases de más de ${LARGA} palabras o con ${DENSA}+ datos, vocabulario de España y citas largas en inglés sin traducir`);
console.log("═".repeat(78));
for (const r of conDefectos) {
  console.log(`\n${r.id} (${r.tier})`);
  for (const [lang, m] of [["ES", r.es], ["EN", r.en]]) {
    for (const f of m.frases) console.log(`  ${lang} frase ${f}`);
    for (const e of m.espana) console.log(`  ${lang} España: ${e}`);
    for (const c of m.citasIngles) console.log(`  ${lang} cita en inglés sin traducir: ${c}…`);
  }
}
console.log("─".repeat(78));
console.log(`fichas: ${results.length} · con algún defecto: ${conDefectos.length}`);
