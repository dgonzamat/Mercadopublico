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
Lee las categorías con más filas en [`docs/hallazgos-verificacion.md`](../../docs/hallazgos-verificacion.md) (y, si existe, `cd web && npm run sondas:frenos`). Son los errores que el verificador halló en las fichas anteriores; escribe con esa lista delante. Las dos más repetidas, hoy: **atribución** (quién dijo o hizo qué, y de qué fecha es el documento que lo recoge) y **afirmaciones de ausencia** («no consta», «nadie halló»: o se respaldan con la búsqueda hecha, o se escriben en forma impersonal, según `/redaccion` §7).

Tres comprobaciones más, de lo que el verificador halló en las seis primeras fichas y ninguna sonda ve. Hazlas al terminar el borrador, con el documento delante:
- **Un documento dice lo que comprobó, no lo que descartó.** «La RAAF descartó helicópteros» pasó por la nota que solo decía «no operaba ningún helicóptero militar; consultado con la DCA». Escribe el alcance exacto.
- **Relee entera cada página citada buscando lo que contradice la ficha.** La nota que citaba la ficha recogía, dos párrafos más abajo, el relato de un testigo que se parecía al de Puddy. Si la ficha afirma que nadie hizo o vio algo, esa frase se prueba contra el documento completo.
- **Un día de la semana y una fecha pueden no cuadrar entre manos del mismo expediente** (lunes 20, martes 25, día 27). Se anota el conflicto; no se elige en silencio.

## 1. Identidad del caso
- **id**: slug kebab-case estable, típicamente `<lugar>-<año>` (ej. `trindade-1958`). Debe ser único y `<id>.json` **tiene que coincidir** con el nombre de archivo (lo valida el schema).
- **num**: la regla vive en `CLAUDE.md` › Workflow de datos (máximo + 1, sin rellenar huecos). Calcúlalo así:
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
Distribución sobre 6 narrativas; la definición y el invariante (suma 1) viven en `CLAUDE.md` › Modelo de probabilidad:
`mundano_natural, humana_clasificada, adversaria, nohumano_encubierto, nohumano_abierto, indet`.
- **OBLIGATORIO** en toda ficha (`incident`, `contactee`, `crop_circle`).
- Es un juicio analítico estructurado, no una frecuencia: reparte según cómo la evidencia distribuye la explicación. Ver `lib/meceModel.ts`.
- **Se asigna según `CLAUDE.md` › Modelo de probabilidad** (solo después de leer la evidencia primaria). Si no la pudiste leer, no clasifiques: dilo y deja el caso sin crear o con la limitación declarada. Al terminar, pon `evidenceReviewed: "AAAA-MM-DD"` (regla E42).
- **Verificación independiente antes de publicar:** otro agente revisa el caso con la sección «New cases: fixed brief» de [`docs/brief-verificacion.md`](../../docs/brief-verificacion.md), sin reescribirla (el registro compara fichas, y un brief distinto en cada una mide el brief y no la ficha) (afirmaciones, eliminaciones y omisiones del mismo expediente). No se fusiona sin ese paso. **La revisión de la clasificación va en esa misma pasada** (categoría G del brief): no se lanza un agente aparte. Solo si el verificador propone cambiar `posterior`, `tier` o `mundanoType`, su propuesta es el primer paso del método de dos pasos de `CLAUDE.md` › Modelo de probabilidad y otro agente la verifica.
- Si el reparto es una misidentificación, pon `misidSubtype` con el objeto concreto: el sitio ya no muestra la categoría «Misidentificación».

## 4. Rich content — estándar editorial (obligatorio para el estándar)
`whatHappened(_en)` + `whyMatters(_en)` deben alcanzar la longitud mínima de `/redaccion` §3 en español E inglés (prosa; `evidence`/`sources` no cuentan; la mide E13). Separa párrafos con `\n\n`.
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

## Orquestación: cuántos agentes y por qué
Por ficha, **dos agentes**: el redactor (o corrector) y el verificador independiente. Los arreglos del verificador los aplica quien orquesta, cada uno con su cita (paso 5c), sin relanzar al redactor. Los lectores del paso 5d van **por tanda**, no por ficha. Existe porque cada agente paga un costo fijo antes de trabajar: medido en nov 2026, un agente vacío que solo responde «OK» gastó ~140k tokens, y un lector que leyó un archivo de 12.000 caracteres, ~154k. El PoC de Puddy usó nueve agentes (dos correctores, un verificador, cuatro lecturas y una revisión de clase), ~1,8 millones de tokens, y el 70 % fue ese costo fijo. Lo que no se toca para ahorrar: la independencia entre redactor y verificador, los lectores Opus y la cita por arreglo.

## 5b. Autochequeo antes del verificador
Antes de lanzar al verificador independiente, corre desde `web/`:
```
npm run caso:check -- <id>
```
Avisa de lo que se puede ver sin abrir una fuente: afirmaciones de ausencia, voz del redactor, párrafos largos y `num` ya ocupado en `origin/main`. Son **avisos, no errores** (salvo el `num`): léelos y corrige lo que sea real. **No sustituye al verificador**: la atribución y las omisiones del mismo documento solo las halla un lector que abra la fuente.

## 5c. Después del verificador: cierre de aprendizaje
Con el informe del verificador en la mano, antes de fusionar:
1. Contrasta cada arreglo con la fuente (regla del repo) y aplícalo **solo si puedes citar la página o la línea que lo sostiene**; la cita va en la fila del registro. Un arreglo sin cita no se aplica: en el PoC de Puddy (nov 2026) se aplicaron dos arreglos del verificador sin volver a la fuente, «civil» en la nota de Gibbs y «el boletín no menciona persecución», y los dos eran erróneos.
2. **Anota los hallazgos** en [`docs/hallazgos-verificacion.md`](../../docs/hallazgos-verificacion.md): una fila por hallazgo, con su categoría y si `caso:check` lo habría marcado.
3. Aplica la regla de cierre de ese archivo: una categoría con filas en **dos o más de las últimas cinco fichas** es candidata a `/blindar`; con una sola, vale una línea de `/learn`.
4. Si la categoría no se puede vigilar con una sonda (atribución, omisiones), añade una línea a la lista de comprobación que lees en el paso 0.5.
5. Si el hallazgo es una regla que **el propio skill** debería hacer cumplir al agente (la forma del título, el orden de los pasos, no escribir una ausencia sin búsqueda), añade o ajusta un caso en [`tools/evals/`](../../tools/evals/README.md) y córrelo tras tocar el skill: es el test unitario del skill, no de la ficha.

## 5d. Prueba del lector antes de fusionar
Una lectura por tanda, al final, con dos agentes lectores (modelo Opus), uno en español y otro en inglés, que leen hasta cinco fichas distintas cada uno (nunca la misma ficha en los dos idiomas: la segunda lectura ya no es la de alguien que no sabe nada). No ven fuentes, guía ni este skill: reciben solo título, lugar, resumen, «Qué pasó» y «Por qué importa», con cada `[[slug]]` cambiado por «↗», y responden el cuestionario del paso 2 de `/auditar-prosa`. Se corrige antes de fusionar lo que `/redaccion` §9 define como deuda: contradicción, recuento que no cuadra, cifra o fecha sin situar, persona sin presentar, texto roto. Cada «incoherencia» se contrasta primero con la fuente: puede ser una divergencia real del registro que el texto debe explicar. Anota lo hallado en el registro con la categoría «lectura». Lo que se corrige tras la lectura se contrasta con la fuente y no pasa por una segunda lectura: en Puddy, la segunda pareja de lectores costó ~310k tokens y la nota siguió en 6/10, aunque cambió el tipo de defecto (ya sin personas sin presentar). Los que quedaron, referentes y cronologías, los atacan al redactar las reglas 9 y 10 de `/redaccion` §3; su efecto se mide en la lectura de la tanda siguiente. Existe porque las seis fichas de la serie de abducciones (nov 2026) se publicaron con el verificador en verde y la auditoría de prosa posterior no aprobó ninguna: personas sin presentar en las seis, recuentos que no cuadraban en cinco.

**El build lo exige** (`audit-consistency.mjs` E63): toda ficha nueva necesita al menos una fila en el registro (o una fila «sin hallazgos»), y desde el `num` 535 un visual embebido o una exención con su barrido en `docs/registros.md`.

## 6. Confirmar
Muestra al usuario: `id`, `num`, `tier`, categoría, longitud de prosa ES/EN (chars), suma del posterior y nº de fuentes. No commitees ni pushees salvo que el usuario lo pida.
