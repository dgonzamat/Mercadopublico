---
description: Crea un caso UAP nuevo cumpliendo el schema UAPCase, num secuencial, posterior MECE=1 y el estándar editorial (~550 palabras ES+EN), con investigación de fuentes primarias
argument-hint: "[nombre del caso + año/país/pista de qué pasó; ej: 'Trindade Brasil 1958, foto naval del portaaviones']"
---

Estás creando un **caso nuevo** para el corpus UAP Codex. La fuente de verdad es un archivo `web/data/cases/<id>.json` (uno por caso); el build agregado lo recoge después. Un caso nuevo **nace cumpliendo el estándar** — no se admite un stub telegráfico. Sigue el schema de `lib/types.ts` y las reglas de `CLAUDE.md` (secciones *Schema UAPCase*, *Línea editorial* y *Modelo MECE*).

`$ARGUMENTS` trae el caso a crear. Si falta info clave (país, año, qué pasó), pregunta antes de inventar.

## 0. Investigación primero (no relleno)
El estándar es prosa con **investigación caso por caso, fuentes primarias**. Antes de escribir: busca el caso (WebSearch), identifica ≥2-3 fuentes verificables (informe oficial, prensa de la época, investigación seria) y extrae los hechos. Si no puedes documentarlo, dilo — es mejor no crear el caso que rellenarlo.

**Redacción:** todo el texto de la ficha (ES y EN) sigue el skill `/redaccion` (`.claude/commands/redaccion.md`): léelo antes de escribir y repasa su lista final («Antes de entregar») antes de entregar.

## 0.5 Antes de redactar: lee lo que ya falló
Lee las categorías con más filas en [`docs/hallazgos-verificacion.md`](../../docs/hallazgos-verificacion.md) (y, si existe, `cd web && npm run sondas:frenos`). Son los errores que el verificador halló en las fichas anteriores; escribe con esa lista delante. Las dos más repetidas, hoy: **atribución** (quién dijo o hizo qué, y de qué fecha es el documento que lo recoge) y **afirmaciones de ausencia** («no consta», «nadie halló»: o se respaldan con la búsqueda hecha, o se escriben como «no lo tenemos»).

## 1. Identidad del caso
- **id**: slug kebab-case estable, típicamente `<lugar>-<año>` (ej. `trindade-1958`). Debe ser único y `<id>.json` **tiene que coincidir** con el nombre de archivo (lo valida el schema).
- **num**: secuencial único = (num máximo actual) + 1. Calcúlalo, **no rellenes huecos**:
  ```
  node -e 'const fs=require("fs");const d="web/data/cases";console.log(Math.max(...fs.readdirSync(d).filter(f=>f.endsWith(".json")).map(f=>JSON.parse(fs.readFileSync(d+"/"+f)).num))+1)'
  ```
- Verifica que el `id` no exista ya (`ls web/data/cases/<id>.json`).

## 2. Campos obligatorios (todos)
`id, num, name, year_start, country, country_name, flag, location{lat,lng}, tier, probability, summary, summary_en, patterns, category`.
- **flag**: emoji de bandera de país (dos indicadores regionales, ej. 🇧🇷).
- **location**: `{lat, lng}` reales del ancla terrestre — lat ∈ [-90,90], lng ∈ [-180,180], **nunca (0,0)** (null island). Opcional `place`.
- **tier**: `S` | `A` | `B`. **category**: `incident` | `contactee` | `crop_circle` (no hay `document`: un documento va embebido en `documents[]` del caso o actor que respalda).
- **probability**: number (0-100), **derivado, no a mano**: `round(100 × (indet + nohumano_encubierto + nohumano_abierto))` del `posterior` (audit E43, ERROR si difiere).
- **patterns**: array de ids que **deben existir** en `data/patterns.json` (verifícalos; array vacío `[]` es válido si ninguno aplica).

## 3. posterior (modelo MECE) — invariante de validate-schema.mjs (antigua M1)
Distribución sobre 6 narrativas que **suma 1** (tolerancia ±0.005):
`mundano_natural, humana_clasificada, adversaria, nohumano_encubierto, nohumano_abierto, indet`.
- **OBLIGATORIO** en toda ficha (`incident`, `contactee`, `crop_circle`).
- Es un juicio analítico estructurado, no una frecuencia: reparte según cómo la evidencia distribuye la explicación. Ver `lib/meceModel.ts`.
- **Se asigna después de leer la evidencia primaria** (el documento, no un resumen). Si no la pudiste leer, no clasifiques: dilo y deja el caso sin crear o con la limitación declarada. Al terminar, pon `evidenceReviewed: "AAAA-MM-DD"` con la fecha de la lectura (regla E42).
- **Verificación independiente antes de publicar:** otro agente revisa el caso con [`docs/brief-verificacion.md`](../../docs/brief-verificacion.md) (afirmaciones, eliminaciones y omisiones del mismo expediente). No se fusiona sin ese paso.
- Si el reparto es una misidentificación, pon `misidSubtype` con el objeto concreto: el sitio ya no muestra la categoría «Misidentificación».

## 4. Rich content — estándar editorial (obligatorio para el estándar)
`whatHappened(_en)` + `whyMatters(_en)` deben sumar **≥ ~550 palabras / ~3.500 caracteres, en español E inglés** (prosa; `evidence`/`sources` NO cuentan para la página). Separa párrafos con `\n\n`.
- `whatHappened` / `whatHappened_en`: cronología + contexto documentado.
- `whyMatters` / `whyMatters_en`: significancia analítica.
- `evidence` / `evidence_en`: array de 3-8 ítems documentados.
- `sources` / `sources_en`: array de `{name, url?, note?}`, **≥1 fuente** (obligatorio por schema). El `_en` suele reusar los mismos objetos.

Escribe la versión ES y traduce a EN con fidelidad (no resumas la EN por debajo del umbral — el auditor E13 mide ambas).

## 5. Escribir y validar
- Escribe `web/data/cases/<id>.json` con la herramienta Write. **El hook `PostToolUse` valida el schema al instante** — si algo falla (posterior≠1, pattern inexistente, coordenada placeholder, falta fuente), corrígelo antes de seguir.
- Regenera el agregado y corre las auditorías (node plano, no requieren `node_modules`):
  ```
  cd web && node scripts/build-cases.mjs && node scripts/validate-schema.mjs && node scripts/audit-consistency.mjs --warn
  ```
- `audit-consistency.mjs` (regla **E13**) reporta si la prosa quedó bajo el umbral; ajústala hasta pasar.

## 5b. Autochequeo antes del verificador
Antes de lanzar al verificador independiente, corre desde `web/`:
```
npm run caso:check -- <id>
```
Avisa de lo que se puede ver sin abrir una fuente: afirmaciones de ausencia, voz del redactor, párrafos largos y `num` ya ocupado en `origin/main`. Son **avisos, no errores** (salvo el `num`): léelos y corrige lo que sea real. **No sustituye al verificador**: la atribución y las omisiones del mismo documento solo las halla un lector que abra la fuente.

## 5c. Después del verificador: cierre de aprendizaje
Con el informe del verificador en la mano, antes de fusionar:
1. Contrasta cada arreglo con la fuente (regla del repo) y aplícalo.
2. **Anota los hallazgos** en [`docs/hallazgos-verificacion.md`](../../docs/hallazgos-verificacion.md): una fila por hallazgo, con su categoría y si `caso:check` lo habría marcado.
3. Aplica la regla de cierre de ese archivo: una categoría con filas en **dos o más de las últimas cinco fichas** es candidata a `/blindar`; con una sola, vale una línea de `/learn`.
4. Si la categoría no se puede vigilar con una sonda (atribución, omisiones), añade una línea a la lista de comprobación que lees en el paso 0.5.
5. Si el hallazgo es una regla que **el propio skill** debería hacer cumplir al agente (la forma del título, el orden de los pasos, no escribir una ausencia sin búsqueda), añade o ajusta un caso en [`tools/evals/`](../../tools/evals/README.md) y córrelo tras tocar el skill: es el test unitario del skill, no de la ficha.

## 6. Confirmar
Muestra al usuario: `id`, `num`, `tier`, categoría, longitud de prosa ES/EN (chars), suma del posterior y nº de fuentes. No commitees ni pushees salvo que el usuario lo pida.
