---
description: Retrospectiva de sesión — mina la conversación (y el diff de la sesión) en busca de lecciones no capturadas, las deduplica contra CLAUDE.md y las propone en lote para persistir
argument-hint: "[opcional: --apply para aplicar las lecciones aprobadas; sin flag solo propone]"
---

Estás ejecutando la **retrospectiva de sesión**. Si `/learn` captura *una* corrección en el momento, `/retro` es el cosechador de cierre: barre la sesión completa buscando lo que se aprendió pero **no se persistió en caliente**, y lo convierte en reglas de `CLAUDE.md` en lote. Es la aplicación del "compounding" de Boris Cherny: nada que costó descubrir se pierde al cerrar la sesión.

Reutiliza la disciplina del `## Protocolo de aprendizaje` de `CLAUDE.md` (dónde va cada lección, formato, chequeo de duplicados). No inventes: cada lección debe apoyarse en algo que **realmente pasó** en esta sesión.

## 1. Barrido de fuentes de lección
Revisa la conversación de esta sesión y el trabajo hecho, buscando señales:
- **Correcciones del usuario**: "no, en realidad…", "eso está mal", un rechazo de permiso, un cambio de dirección.
- **Gotchas descubiertos**: algo que falló y hubo que rodear (build roto, API bloqueada por allowlist, JIT que no compila, invariante de audit que saltó, un dato stale).
- **Callejones sin salida**: un enfoque que se probó y se abandonó — vale como lección "no intentar X porque Y".
- **Convenciones que costó descubrir**: un contrato del repo que no estaba escrito y hubo que deducir (num secuencial, posterior=1, node_modules ausente, scripts que corren desde `web/`).
- **Investigación cara**: búsquedas cuyo resultado no debe re-hacerse.

Si hay un diff de la sesión, míralo también: `git diff origin/main...HEAD --stat` y `git log origin/main..HEAD --oneline` orientan sobre qué se tocó.

## 2. Destila cada candidata
Para cada señal, una lección en una frase: **qué** + **por qué** (causa raíz). Descarta las triviales o específicas de una tarea única que no se repetirá — el corpus de reglas vale por ser corto y nítido.

## 3. Deduplica contra CLAUDE.md
Lee `CLAUDE.md`. Para cada candidata decide:
- **NUEVA** → sección destino (Anti-pattern / regla de dominio / registro de investigación fechado).
- **REFINA una existente** → cita la línea a afilar (no dupliques).
- **YA CUBIERTA** → descártala.

## 4. Propón en lote
Tabla priorizada: `[NUEVA|REFINA] · sección destino · lección redactada (formato de la casa) · señal de origen (qué pasó en la sesión)`. Ordena por valor: gotchas reproducibles y contratos del repo primero; matices menores después.

Presenta la tabla y **pide aprobación** antes de tocar nada — el usuario decide cuáles entran. Una retro puede proponer varias; no todas merecen persistir.

## 5. Aplicar (solo con `--apply`, y solo las aprobadas)
- Ediciones quirúrgicas con Edit, una por lección, sin reordenar el resto del archivo.
- Fecha los registros de investigación `(mmm aaaa)`.
- Para lecciones idénticas a una corrección puntual, el efecto es el mismo que correr `/learn` sobre cada una — pero en lote y con la sesión completa como contexto.

Sin `--apply`, solo propones. No commitees ni pushees salvo que el usuario lo pida.
