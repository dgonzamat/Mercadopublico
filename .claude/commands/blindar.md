---
description: Promueve una lección documentada a un guardrail automático — lee los anti-patterns de CLAUDE.md, detecta cuáles se pueden enforcar mecánicamente y crea el chequeo (audit/hook). La innovación de la capa reactiva.
argument-hint: "[opcional: --apply para crear el guardrail; sin flag solo propone]"
---

Estás ejecutando el **blindador** del repo. La capa reactiva (`/learn`, `/retro`, `/curar-memoria`) captura lecciones en `CLAUDE.md`, pero una lección documentada **sigue dependiendo de que Claude la lea**. Este comando cierra esa brecha: promueve un anti-pattern de *desaconsejado* a *imposible* — lo convierte en un chequeo automático que rompe el build (o bloquea el edit) si alguien lo viola.

Es la aplicación del principio de Boris Cherny "PostToolUse hooks / pre-allow safe permissions": lo que se puede enforcar, se enforca; la memoria pasiva se vuelve prevención activa.

## 1. Leer los anti-patterns
Lee `## Anti-patterns conocidos` de `CLAUDE.md` (y los invariantes de dominio: MECE M1, schema, E13). Para cada regla, clasifícala:
- **YA ENFORZADA** — un audit/validador ya la chequea (ej. `posterior` suma 1 → `validate-schema.mjs` M1; E13 → `audit-consistency.mjs`). Descártala.
- **ENFORZABLE** — se puede chequear con una sonda barata y determinista (grep/lectura de archivo/AST simple). Candidata.
- **NO MECANIZABLE** — requiere juicio (ej. "no hardcodear cifras" en prosa libre, longitud editorial de calidad). Déjala como doc.

## 2. Diseñar el guardrail (para las ENFORZABLES)
Ejemplos de anti-patterns de este repo que SÍ se enforzan:
- "No importar `fs` desde `lib/data.ts`" → grep: `lib/data.ts` no debe contener `import ... "fs"`.
- "No usar `node:` scheme en imports" → grep `from "node:` bajo `web/{app,components,lib}`.
- "No emitir `Event` JSON-LD" → grep `"@type":\s*"Event"` en `lib/jsonld.ts` / render de casos.
- "No clases Tailwind dinámicas" → grep ``bg-${`` / ``text-${`` en `components/`.
- "No archivos temp en `data/cases/`" → todo `<id>.json` debe tener `id` === filename (ya lo valida el schema; reforzar el patrón de nombre).

**Dónde vive el chequeo** (preferir extender lo existente, no crear ruido):
1. Regla nueva en `audit-consistency.mjs` (corre en prebuild + CI) — el default para chequeos de código/repo.
2. Regla en `validate-schema.mjs` — si es sobre la estructura de un `case`/`researcher`.
3. Un `PostToolUse` hook nuevo — solo si el chequeo debe adelantarse al momento del edit.

Regla anti-fragilidad: el guardrail debe ser **barato y determinista**. Nada de chequeos flaky, de red, o que dependan de `node_modules` (los audits son node plano). Si un anti-pattern solo se puede chequear de forma frágil, NO lo blindes — déjalo como doc.

## 3. Proponer
Tabla: `[ENFORZABLE|YA|NO] · anti-pattern · sonda propuesta · dónde vive`. Ordena por valor (los que más han costado o más se repiten, primero).

## 4. Aplicar (solo con `--apply`)
- Implementa la sonda en el audit/validador elegido, con su mensaje de ERROR claro.
- Corre el audit para confirmar que pasa en el estado actual (no debe romper el build sano) y que **atrapa** una violación de prueba (introdúcela, confírmala, revírtela — y **borra el archivo de prueba**, ver el anti-pattern de temp files).
- Anota en `CLAUDE.md` que el anti-pattern ahora está enforzado (ej. "(enforzado por audit-consistency.mjs)") para no duplicar el chequeo después.

Sin `--apply`, solo propones. No commitees ni pushees salvo que el usuario lo pida.
