// hallazgos-resumen.mjs — resumen del registro de hallazgos del verificador
// (docs/hallazgos-verificacion.md) para el paso 0.5 de /nuevo-caso. Existe
// porque el redactor leía la tabla entera (9,5 mil tokens en nov 2026, y crece
// con cada tanda) para saber solo qué categorías se repiten en las últimas fichas.
//
// Uso (desde web/): npm run hallazgos:resumen [-- N]   (N fichas recientes; 5 por defecto)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const N = Number(process.argv[2]) || 5;
const filas = fs.readFileSync(path.join(ROOT, "docs", "hallazgos-verificacion.md"), "utf8")
  .split("\n").filter((l) => /^\| [a-z0-9-]+ \|/.test(l))
  .map((l) => l.split("|").map((s) => s.trim())).map(([, ficha, cat]) => ({ ficha, cat }));
const orden = [...new Set(filas.map((f) => f.ficha))];
const ultimas = orden.slice(-N);
const cuenta = {};
for (const { ficha, cat } of filas.filter((f) => ultimas.includes(f.ficha))) {
  (cuenta[cat] ??= { filas: 0, fichas: new Set() }).filas++;
  cuenta[cat].fichas.add(ficha);
}
console.log(`Últimas ${ultimas.length} fichas: ${ultimas.join(", ")}\n`);
console.log("Categoría        Filas  Fichas");
for (const [cat, v] of Object.entries(cuenta).sort((a, b) => b[1].fichas.size - a[1].fichas.size || b[1].filas - a[1].filas))
  console.log(`${cat.padEnd(16)} ${String(v.filas).padStart(5)}  ${v.fichas.size} de ${ultimas.length}`);
console.log("\nCada fila, con su cita: docs/hallazgos-verificacion.md (búscala por la ficha).");
