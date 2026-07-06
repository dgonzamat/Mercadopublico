---
description: Crea un caso UAP nuevo cumpliendo el schema UAPCase, num secuencial, posterior MECE=1 y el estándar editorial (~550 palabras ES+EN), con investigación de fuentes primarias
argument-hint: "[nombre del caso + año/país/pista de qué pasó; ej: 'Trindade Brasil 1958, foto naval del portaaviones']"
---

Estás creando un **caso nuevo** para el corpus UAP Codex. La fuente de verdad es un archivo `web/data/cases/<id>.json` (uno por caso); el build agregado lo recoge después. Un caso nuevo **nace cumpliendo el estándar** — no se admite un stub telegráfico. Sigue el schema de `lib/types.ts` y las reglas de `CLAUDE.md` (secciones *Schema UAPCase*, *Línea editorial* y *Modelo MECE*).

`$ARGUMENTS` trae el caso a crear. Si falta info clave (país, año, qué pasó), pregunta antes de inventar.

## 0. Investigación primero (no relleno)
El estándar es prosa con **investigación caso por caso, fuentes primarias**. Antes de escribir: busca el caso (WebSearch), identifica ≥2-3 fuentes verificables (informe oficial, prensa de la época, investigación seria) y extrae los hechos. Si no puedes documentarlo, dilo — es mejor no crear el caso que rellenarlo.

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
- **tier**: `S` | `A` | `B`. **category**: `incident` | `document` | `contactee` | `crop_circle`.
- **probability**: number (0-100).
- **patterns**: array de ids que **deben existir** en `data/patterns.json` (verifícalos; array vacío `[]` es válido si ninguno aplica).

## 3. posterior (modelo MECE) — invariante M1
Distribución sobre 6 narrativas que **suma 1** (tolerancia ±0.005):
`mundano_natural, humana_clasificada, adversaria, nohumano_encubierto, nohumano_abierto, indet`.
- **OBLIGATORIO** en `incident`, `contactee`, `crop_circle` (todo lo no-documento).
- En `document` es opcional (es el "lean" evidencial, no P(objeto)).
- Es un juicio analítico estructurado, no una frecuencia: reparte según cómo la evidencia distribuye la explicación. Ver `lib/meceModel.ts`.

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

## 6. Confirmar
Muestra al usuario: `id`, `num`, `tier`, categoría, longitud de prosa ES/EN (chars), suma del posterior y nº de fuentes. No commitees ni pushees salvo que el usuario lo pida.
