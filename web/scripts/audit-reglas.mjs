#!/usr/bin/env node
// audit-reglas.mjs — sonda del mapa MECE de reglas (CLAUDE.md, «Mapa de reglas»).
//
// Cada regla vive en un solo hogar; los demás archivos apuntan a él. Esta sonda
// busca, para cada regla registrada, las líneas de otros archivos que la
// mencionan: si la línea nombra el hogar, es un PUNTERO (correcto); si no, es
// una POSIBLE COPIA, que hay que leer y, si repite la regla, cambiar por un
// puntero. Es un informe para /curar-memoria, no un gate del build: mide
// prosa y da falsos positivos (un ejemplo que cita la regla no es una copia).
// Además comprueba que el hogar de cada regla la contiene (si no, el mapa
// apunta a un sitio vacío) y que las 10 categorías tienen al menos una regla.
//
// Nació el 18 nov 2026: la regla de las ausencias decía «no lo tenemos» en
// CLAUDE.md y /redaccion prohibía la voz del redactor; una ficha cumplió una
// y violó la otra. Uso (desde web/): node scripts/audit-reglas.mjs [--copias]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const soloCopias = process.argv.includes("--copias");
const FILES = [
  "CLAUDE.md",
  ...fs.readdirSync(path.join(ROOT, ".claude/commands")).filter((f) => f.endsWith(".md")).map((f) => ".claude/commands/" + f),
  ...fs.readdirSync(path.join(ROOT, "docs")).filter((f) => /^brief-.*\.md$|^hallazgos-verificacion\.md$/.test(f)).map((f) => "docs/" + f),
];
const CATS = ["evidencia", "clasificacion", "escritura", "datos", "visuales", "seleccion", "proceso", "codigo", "operacion", "memoria"];

// hogar: archivo; seccion: encabezado que delimita el hogar dentro de CLAUDE.md
// (null = todo el archivo); puntero: lo que debe nombrar una línea ajena para
// contar como puntero al hogar.
const C = { file: "CLAUDE.md" };
const RED = { file: ".claude/commands/redaccion.md", seccion: null, puntero: /\/redaccion|redaccion\.md/ };
const REGLAS = [
  { id: "ausencia-impersonal", cat: "escritura", hogar: RED, re: /impersonal, «no se conoce|forma impersonal/i },
  { id: "voz-del-redactor", cat: "escritura", hogar: RED, re: /«este expediente», «esta ficha»/i },
  { id: "convencional-no-mundano", cat: "escritura", hogar: RED, re: /«convencional»|prosaico.*mundano|mundano.*prosaico/i },
  { id: "lexico-espana", cat: "escritura", hogar: RED, re: /coche\s*→\s*auto/i },
  { id: "titulo-65", cat: "escritura", hogar: RED, re: /≤ ?65 caracteres|65 caracteres/ },
  { id: "longitud-3500", cat: "escritura", hogar: RED, re: /3\.?500 caracteres|550 palabras/ },
  { id: "enlaces-slug", cat: "escritura", hogar: RED, re: /Enlaces a otros casos: `\[\[slug\]\]`|se enlaza con `\[\[slug\]\]`/ },
  { id: "comillas", cat: "escritura", hogar: RED, re: /comillas «»|«» y, dentro/ },
  { id: "criterio-deuda", cat: "escritura", hogar: RED, re: /\*\*Es deuda\*\*|es deuda lo que/i },
  { id: "persona-sin-presentar", cat: "escritura", hogar: { ...RED, puntero: /\/redaccion|criterio de cierre|CLAUDE\.md|paso 5d|«lectura»/i }, re: /sin presentar|se presenta la primera vez/i },
  { id: "fuente-primaria-antes", cat: "clasificacion", hogar: { ...C, seccion: "## Modelo de probabilidad (MECE)", puntero: /Modelo de probabilidad|CLAUDE\.md/ }, re: /solo después de leer la evidencia primaria|se asigna después de leer/i },
  { id: "posterior-suma-1", cat: "clasificacion", hogar: { ...C, seccion: "## Modelo de probabilidad (MECE)", puntero: /Modelo de probabilidad|CLAUDE\.md|validate-schema/ }, re: /suma 1|suma=1/ },
  { id: "probability-derivada", cat: "clasificacion", hogar: { ...C, seccion: "## Modelo de probabilidad (MECE)", puntero: /Modelo de probabilidad|CLAUDE\.md|E43/ }, re: /indet \+ nohumano_encubierto \+ nohumano_abierto/ },
  { id: "dos-agentes", cat: "clasificacion", hogar: { ...C, seccion: "## Modelo de probabilidad (MECE)", puntero: /Modelo de probabilidad|CLAUDE\.md|brief-verificacion/ }, re: /dos pasos, dos agentes|método de dos agentes/i },
  { id: "ausencia-por-busqueda", cat: "evidencia", hogar: { ...C, seccion: "## Evidencia (qué es cierto y cómo se comprueba)", puntero: /Evidencia|CLAUDE\.md/ }, re: /afirmar una ausencia|«no existe»/i },
  { id: "tarjeta-blue-book", cat: "evidencia", hogar: { ...C, seccion: "## Evidencia (qué es cierto y cómo se comprueba)", puntero: /Evidencia|CLAUDE\.md/ }, re: /tarjeta de Blue Book/i },
  { id: "num-secuencial", cat: "datos", hogar: { ...C, seccion: "## Workflow de datos para casos", puntero: /CLAUDE\.md|Schema|Workflow/ }, re: /`num` único secuencial|secuencial único/i },
  { id: "visual-E21", cat: "visuales", hogar: { ...C, seccion: "### Visor de documentos (`documents[]` / `primaryDocument`)", puntero: /Visor|CLAUDE\.md/ }, re: /Cobertura de visual|regla E21/i },
  { id: "seleccion-anti-relleno", cat: "seleccion", hogar: { file: ".claude/commands/proximo-caso.md", seccion: null, puntero: /\/proximo-caso/ }, re: /anti-relleno/i },
  { id: "referente-antecedente", cat: "escritura", hogar: RED, re: /antecedente inequívoco/i },
  { id: "cronologias-completas", cat: "escritura", hogar: RED, re: /cronologías completas/i },
  { id: "agentes-por-ficha", cat: "proceso", hogar: { file: ".claude/commands/nuevo-caso.md", seccion: null, puntero: /\/nuevo-caso|nuevo-caso\.md/ }, re: /~140k tokens/ },
  { id: "registro-hallazgos", cat: "proceso", hogar: { file: ".claude/commands/nuevo-caso.md", seccion: null, puntero: /\/nuevo-caso|nuevo-caso\.md/ }, re: /Anota los hallazgos/i },
  { id: "basePath-local", cat: "codigo", hogar: { ...C, seccion: "## Deploy", puntero: /Deploy|CLAUDE\.md/ }, re: /basePath/ },
  { id: "skip-ci-squash", cat: "operacion", hogar: { ...C, seccion: "## Branch protocol", puntero: /Branch protocol|CLAUDE\.md/ }, re: /\[skip ci\]/ },
  { id: "formato-leccion", cat: "memoria", hogar: { ...C, seccion: "## Protocolo de aprendizaje (self-learning)", puntero: /Protocolo de aprendizaje|CLAUDE\.md/ }, re: /una línea, imperativa/i },
];

const text = Object.fromEntries(FILES.map((f) => [f, fs.readFileSync(path.join(ROOT, f), "utf8")]));
// tramos [ini, fin) de una sección de CLAUDE.md por su encabezado
const seccion = (f, h) => {
  const t = text[f];
  if (!h) return [0, t.length];
  const i = t.indexOf("\n" + h + "\n");
  if (i < 0) return null;
  const nivel = h.match(/^#+/)[0];
  const rest = t.slice(i + h.length + 2);
  const m = rest.search(new RegExp(`\\n#{1,${nivel.length}} `));
  return [i, m < 0 ? t.length : i + h.length + 2 + m];
};

let copias = 0, punteros = 0, vacios = 0;
const out = [];
for (const r of REGLAS) {
  const tramo = seccion(r.hogar.file, r.hogar.seccion);
  const hogarTxt = tramo ? text[r.hogar.file].slice(...tramo) : "";
  if (!tramo || !r.re.test(hogarTxt)) { vacios++; out.push(`✗ ${r.id} (${r.cat}): su hogar ${r.hogar.file}${r.hogar.seccion ? " › " + r.hogar.seccion : ""} no la contiene`); }
  for (const f of FILES) {
    const t = text[f];
    let off = 0;
    for (const line of t.split("\n")) {
      const ini = off; off += line.length + 1;
      if (!r.re.test(line)) continue;
      // filas de tabla (datos del registro) y frontmatter de skills: no son reglas
      if (/^\s*\|/.test(line) || /^description:/.test(line)) continue;
      const enHogar = f === r.hogar.file && tramo && ini >= tramo[0] && ini < tramo[1];
      if (enHogar) continue;
      const esPuntero = r.hogar.puntero && r.hogar.puntero.test(line);
      if (esPuntero) { punteros++; if (!soloCopias) out.push(`  · puntero  ${r.id} en ${f}`); }
      else { copias++; out.push(`  ? copia    ${r.id} en ${f}: ${line.trim().slice(0, 150)}`); }
    }
  }
}
const sinRegla = CATS.filter((c) => !REGLAS.some((r) => r.cat === c));
console.log(`Mapa MECE de reglas: ${REGLAS.length} reglas registradas en ${CATS.length - sinRegla.length}/${CATS.length} categorías · ${punteros} punteros · ${copias} posibles copias · ${vacios} hogares vacíos`);
if (sinRegla.length) console.log(`✗ categorías sin ninguna regla registrada (exhaustividad): ${sinRegla.join(", ")}`);
for (const l of out) console.log(l);
console.log("Una «posible copia» se lee: si repite la regla, se cambia por un puntero al hogar; si solo la cita como ejemplo, se deja.");
