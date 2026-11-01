# Lote R1 · revisión del análisis de probabilidad (corrector)

R = /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/reesc-r1

La prosa de estas fichas se acaba de reescribir y verificar contra las fuentes. La clasificación (`posterior`, `mundanoType`, `misidSubtype`, `classBasis`) **no se tocó**, pero en estas fichas cambió la evidencia que recoge la ficha, así que hay que volver a juzgarla. Tu trabajo es **solo la clasificación**: no edites la prosa.

Lee primero:
- /home/user/Mercadopublico/CLAUDE.md, sección «Modelo de probabilidad (MECE)» entera (qué es cada una de las seis narrativas, la regla de leer la evidencia primaria, el porqué de clase con su fuente, `sin_propuesta`, propuesta refutada frente a propuesta débil, `probability` derivada).
- /home/user/Mercadopublico/docs/brief-revision-evidencia.md: cómo encontrar y leer la evidencia primaria, y la regla de omisiones (cuando un documento apoya una lectura, busca en el mismo expediente lo que la contradice).

## Para cada ficha
1. Lee la ficha actual (`/home/user/Mercadopublico/web/data/cases/<id>.json`) y el original (`R/orig/<id>.json`), y el plan del redactor (`R/out/<id>.json` → `plan`, con lo que comprobó en la fuente). Las descargas del redactor están en el scratchpad (`r1-src/`, `r1src/`, `reesc-r1-mine/`).
2. **Lee la evidencia primaria** de lo que decide el reparto (no un resumen). Juzga con las dos direcciones abiertas: el documento decide hacia dónde se mueve.
3. Decide el reparto. Si cambia, justifica cada número con la evidencia. Si no cambia, dilo y por qué. `probability` = `round(100 × (indet + nohumano_encubierto + nohumano_abierto))`, con la aritmética de JavaScript (`Math.round`: el ,5 sube). El `posterior` suma exactamente 1.
4. Revisa `classBasis` (ES, EN, fuente, url): la clase la nombra una fuente que está en `sources` o en el visor, y su texto no puede apoyarse en algo que la propia ficha ya no dice o que la evidencia nueva refuta. Ajusta `mundanoType`/`misidSubtype` si hace falta.
5. Edita **solo** `posterior`, `probability`, `mundanoType`, `misidSubtype`, `classBasis` y `evidenceReviewed` (pon `"2026-11-01"` solo si leíste evidencia primaria). Usa un script Python que cargue el JSON, cambie esos campos y lo escriba con `json.dumps(o, ensure_ascii=False, indent=2) + "\n"`. Copia antes el archivo a `R/post-orig/<id>.json`.
6. Si al leer la evidencia ves un error de hecho en la prosa, **no lo corrijas**: anótalo en tu informe con la cita.
7. Desde /home/user/Mercadopublico/web: `node scripts/build-cases.mjs >/dev/null && node scripts/validate-schema.mjs && node scripts/audit-consistency.mjs --warn` sin ERROR ni WARN de tus fichas.

Salida: `R/posterior/<id>.md` por ficha: evidencia primaria leída (URL o archivo y la frase decisiva), reparto antes → después con el porqué de cada cambio, `classBasis` antes → después, errores de prosa vistos. Un verificador independiente revisará cada cambio contra la fuente.

Prohibido: git checkout/stash/reset/commit, tocar otras fichas o archivos, rutas relativas. Responde con una línea por ficha: probability antes → después y el motivo principal.
