---
description: Orquestador del loop de salud y crecimiento del repo UAP Codex. ÚSALO cuando pidan correr el cerebro, revisar el estado del repo, decidir qué atacar o por dónde seguir, buscar deuda o huecos de cobertura, proponer el próximo caso, o cuando digan cosas como «analiza el repo», «qué falta», «dónde estamos», «qué conviene hacer ahora» o abran una sesión de trabajo sin objetivo definido — aunque no nombren el cerebro. ORQUESTA, NO EJECUTA: los skills del loop (/proximo-caso, /nuevo-caso, /blindar, /curar-memoria, /learn, /retro, /innovar) son de delegación obligatoria y hacer su trabajo a mano es una violación, porque se salta la disciplina que codifican. Mantiene de V5 la precedencia del corpus (saltarse el contenido exige probar en esa corrida que la palanca está agotada) y de V4 la verificación dura (control negativo en toda sonda; lo servido se comprueba contra gh-pages).
argument-hint: "[opcional: --auto para gatillar los sub-skills read-only sin preguntar; sin flag articula y propone el disparo]"
---

Estás ejecutando el **cerebro** del repo. Un error de la v1: su objetivo era *puramente defensivo* (minimizar deuda), así que su mejor caso era «nada que arreglar» — un conserje, no un arquitecto. **V2 lo corrigió: el cerebro ATACA impacto.** **V3 cierra dos huecos que se vieron en la práctica**: (a) verificaba frontend *a ojo* (grep + screenshots eyeball-eados), y (b) su propio impacto era *proxy no medido* («¿funciona el cerebro?» sin respuesta cuantitativa). V3 lo resuelve orquestando **skills de librería** en los pasos correctos. **V4 corrige a V3 con lo aprendido al ejecutarlo** (jul 2026): la verificación de navegador que V3 prescribía **no es ejecutable** en la sesión remota por defecto —arranca sin `node_modules`, así que no hay `out/` ni dev server—, y lo que sí funcionó fue mejor: leer el **artefacto desplegado en `gh-pages`**, que verifica lo que el sitio realmente sirve. Y apareció un hueco que V3 no veía: le exigía prueba al guardrail nuevo pero **no a la sonda que verifica**, y dos falsos verdes en una corrida (una que no chequeaba nada, otra que leía un error de API como éxito) pasaron por ahí. De ahí la **regla cero de §5**. **V5 cierra el hueco que ninguna versión anterior vio**: el cerebro seguía eligiendo *qué* atacar por comodidad de verificación. Una sesión entera (jul 2026) produjo cinco PRs —cuatro de metadata y de sí mismo, **cero de corpus**— con todas las sondas en verde; el fallo lo detectó el usuario, no el loop. La causa es que un fix de metadata se comprueba en segundos y un caso nuevo exige investigar y escribir 1.500 palabras ancladas: esa asimetría **no dice nada sobre cuál importa más**. De ahí la **regla de precedencia de §3** — el corpus manda, y saltárselo hay que justificarlo con evidencia de esta corrida. **V6 corrige lo que quedaba: el cerebro decía orquestar y en la práctica ejecutaba.** Una sola regla permisiva —«invoca un skill solo cuando supere al enfoque plano»— dejaba el juicio para el instante en que hacerlo a mano *siempre* parece más barato, así que se resolvía en «no delegues»: en una sesión se escribieron tres reglas de audit a mano sin `/blindar`, no se corrió `/learn` ni `/retro` con ~15 lecciones sobre la mesa, y se editó este archivo tres veces sin `skill-creator`. La corrección es **separar dos clases de skill con reglas opuestas** (arriba): los del loop se delegan siempre, los de librería siguen siendo opt-in.

**Objetivo medible.**
```
maximizar   Impact  −  λ·Deuda
  Impact = valor creado   (contenido con demanda de búsqueda, palancas de SEO/tráfico, profundidad/alcance del corpus)
  Deuda  = err + drift + unenforced + gaps      (err=0 es GATE DURO: no construyas sobre cimiento roto)
```
La deuda se mantiene **bajo un umbral**; **el grueso del presupuesto va a Impact.** El trinquete (`G↑`) sigue, pero es medio, no fin.

Regla de oro (anti-fluff): **cada disparo cita su señal concreta.** Vale para deuda Y para impacto: "hueco Chile×2010s con 40 impresiones/mes en GSC → `/nuevo-caso`" está permitido; "mejorar el contenido" está prohibido.

---

## Skills del loop — DELEGACIÓN OBLIGATORIA

El cerebro **orquesta, no ejecuta**. Si la acción cae en el dominio de uno de estos skills, se invoca; hacer su trabajo a mano es una violación, no un atajo. La tabla es un binding mecánico, no una sugerencia — se consulta, no se delibera:

| Paso | Señal | Skill que DEBE invocarse |
|---|---|---|
| §2 TRIAGE | drift objetivo en `CLAUDE.md` | **`/curar-memoria`** |
| §3 ATTACK | hueco de cobertura | **`/proximo-caso`** → **`/nuevo-caso`** |
| §3 ATTACK | ángulo sin vista que mueva tráfico | **`/innovar`** |
| §6 RATCHET | el fix abrió una clase enforzable | **`/blindar`** — *nunca* escribas una regla de audit a mano |
| §6 RATCHET | la corrida editó un skill del loop | **`skill-creator`** |
| §7 CAPTURE | apareció una lección | **`/learn`** |
| §7 CAPTURE | cierre de corrida | **`/retro`** |

**Incumplido tres veces en una sola sesión (jul 2026)**, que es lo que motivó volverlo obligatorio: E31, E32 y E33 se escribieron a mano dentro del cerebro sin invocar `/blindar` —saltándose su gate doble—; `/learn` y `/retro` no se corrieron pese a ~15 lecciones; y `cerebro.md` se editó tres veces sin llamar a `skill-creator`.

**Al cerrar, declara qué skills del loop invocaste y cuáles hiciste a mano.** Si hiciste el trabajo de uno sin invocarlo, dilo — es el único modo de que la violación sea visible.

---

## Skills de librería — opt-in

Estos sí se invocan **solo cuando superan al enfoque plano** (Karpathy: simplicity first — no los llames por lucir):

| Skill | Paso | Cuándo / para qué |
|---|---|---|
| **`webapp-testing`** (Playwright) | §3 ATTACK-UX · §5 VERIFY | Renderiza e **interactúa** con el sitio: es lo único que las sondas node-plano NO hacen («nunca renderizan un pixel»). En §3 genera la *señal de UX concreta* (fricción real, no corazonada); en §5 asegura un cambio interactivo con aserciones de navegador. **Requiere build** (`out/` o dev server) → en sesión remota fresca, sin `node_modules`, NO está disponible: para lo servido usa el artefacto de `gh-pages` (§5), y reserva este skill para lo genuinamente interactivo cuando haya build. |
| **`skill-creator`** | §6 RATCHET | **Disparador único: esta corrida editó un skill del loop** (`.claude/commands/*.md`). Evals + benchmark de varianza sobre el cambio, y afina el `description` para que dispare bien. Fuera de ese caso no lo llames: «¿funciona el cerebro?» en abstracto es n=1 y montar evals cuesta más de lo que informa. |
| **`dataviz`** | §1 SENSE / articular | Cuando el estado se lee mejor en gráfico que en texto (partición MECE, matriz de cobertura país×década, backlog por tier): un chart validado clarifica la señal. Solo si el visual supera al texto. |
| **`artifact-design`** | §1 articular · reporte de impacto | Empaqueta el estado/análisis de impacto como artifact estilado (dashboard) cuando el output es para revisar/compartir, no un dump de terminal. |

**Analítica externa (GSC/GA4)**: el conector Windsor está **gated por plan** (devuelve ceros) y la allowlist bloquea GSC/GA4 directo — comprobado. El proxy de demanda sigue siendo lo **cacheado** en `CLAUDE.md`; declara la incertidumbre, no finjas tráfico.

---

## El procedimiento — V6 (orquesta-no-ejecuta, corpus-primero, verificado con control negativo)

### 0 · CALIBRATE — sensores frescos
`rm -rf web/out` + regenera `cases.json` antes de medir (un artefacto rancio miente). *(Lección out/ rancio.)*

### 1 · SENSE — leer DOS familias de señales (+ articular)

**a) Deuda** (node-plano, sin red — el cimiento):
```
node web/scripts/validate-schema.mjs · audit-consistency.mjs · audit-design.mjs
# drift 1b — OJO: en regex `...` son «tres caracteres cualesquiera», NO «etcétera».
# La versión con `|...)` matcheaba 97 líneas en vez de 9 y ahogaba la señal en ruido (jul 2026).
grep -noE '~?[0-9][0-9.,]*[ ]?(casos|actores|KB|MB|client components)|Next\.js [0-9.]+' CLAUDE.md
```

**b) Impacto** (dónde crear valor — más blando, decláralo):
- **Cobertura**: huecos país×década / tier (del audit + `lib/regions.ts`).
- **Demanda**: señales cacheadas en `CLAUDE.md` (GSC en vivo NO alcanzable — ver arriba).
- **Profundidad**: casos de alto tráfico con prosa en el **piso** de E13 o desactualizados (candidatos a expansión, patrón malmstrom).
- **Frescura (news-driven)**: el corpus va hasta 2026 pero el mundo sigue — un caso "completo" hoy puede tener un desarrollo nuevo (malmstrom ganó el WSJ 2025 del simulador EMP; Grusch el rebuttal de AARO). Corre `WebSearch` sobre los casos **Tier-S de más peso** buscando desarrollos documentados nuevos → expandir con la fuente primaria. Es la contraparte de descubrimiento del NEWS-SWEEP de `/proximo-caso`: aquel busca casos **nuevos** de frontera, este mantiene **frescos** los existentes. Misma disciplina: la noticia es pista, no fuente; ancla a primaria; institucional-only.
- **SEO estructural**: leaks conocidos (un idioma por URL — cuerpos Y chrome ya resueltos, jul 2026; metadata sin par `_en`; structured data faltante).

**Articular**: si el estado se lee mejor visual, orquesta `dataviz` (chart validado) y/o `artifact-design` (dashboard). Solo cuando el visual gana; si no, texto.

### 2 · TRIAGE del cimiento (deuda primero, pero acotado)
- Si `err>0` → **arréglalo ya** (gate duro). Reincidente → `/blindar`.
- Si `drift` objetivo → `/curar-memoria --fix` (barato, no negocia).
- Deuda **bloqueada por entorno** (E21, fuentes, fotos → red/hosting) → **anota, NO golpees.**
- Con el cimiento bajo umbral, **pasa a §3 — no termines aquí.** (El fallo de la v1 era terminar en «sano».)

### 3 · ATTACK — la acción de mayor Impacto (el núcleo)

**REGLA DE PRECEDENCIA — las dos primeras filas son el disparo POR DEFECTO.** La tabla está ordenada por impacto, pero ordenarla no basta: nada impedía elegir la fila más barata, y eso es exactamente lo que pasó (jul 2026: cinco PRs en una sesión, cuatro de metadata y meta-trabajo, **cero contenido**, con el usuario teniendo que señalarlo). Para atacar una fila que **no** sea corpus (caso nuevo / expansión / frescura) debes declarar las dos cosas:

1. **Qué palanca superior estás saltando**, nombrada.
2. **La evidencia de que está agotada O bloqueada, obtenida EN ESTA CORRIDA.** Para la fila de cobertura, «agotada» significa haber corrido `/proximo-caso` **incluido su NEWS-SWEEP** y volver sin ningún candidato anclable a una fuente primaria. Un recuerdo («el corpus está saturado»), un registro de otra corrida o una corazonada **no cuentan**: el sweep de jul 2026 destapó Siria con 0 casos y los 2010s como década moderna más delgada, justo después de que se declarara el corpus maduro sin haberlo corrido.

**El costo de verificación NO es criterio de impacto.** El sesgo real del cerebro es preferir lo que puede *comprobar barato desde el sandbox* —greps, metadata, sondas node-plano— sobre lo que crea valor. Un fix de metadata se verifica en segundos y un caso nuevo exige investigar, cruzar contra el corpus y escribir 1.500 palabras ancladas; esa asimetría de esfuerzo no dice nada sobre cuál importa más. Si te descubres eligiendo por comodidad de verificación, estás en el fallo.

**Meta-trabajo sobre el propio loop (`.claude/commands/*.md`, `CLAUDE.md`) es OVERHEAD, no Impact.** Es admisible cuando desbloquea una palanca o captura una lección, pero **nunca cuenta como el ATTACK de la corrida**: una corrida cuyo único producto es el cerebro arreglándose a sí mismo no atacó nada. Si la corrida no tocó el corpus, **dilo explícitamente en el reporte** en vez de dejar que los PRs de plumbing parezcan cosecha.

Elegido el objetivo, `argmax(Impact / esfuerzo)` sobre las palancas alcanzables:

| Señal de crecimiento | Acción de alto impacto | ¿Alcanzable aquí? |
|---|---|---|
| Hueco país×década/tier **con demanda** | `/proximo-caso` → **`/nuevo-caso`** | **Sí** (Wikipedia + archive.org) |
| Caso de alto tráfico en el **piso** o desactualizado | **expandir con fuentes primarias** (patrón malmstrom) | **Sí** |
| Leak de **SEO estructural** (idioma/URL, metadata, rich results) | fix de crecimiento (código, lo verifica CI + §5) | **Sí** |
| **Fricción de UX** (flujo de descubrimiento, interacción) | **`webapp-testing`** para HALLAR la fricción real (render + interactúa), luego el fix | **Solo con build** (sin `node_modules` no hay sitio que servir) |
| Ángulo del corpus sin vista que mueva **tráfico** | `/innovar` **solo si crece valor**, no pulido | Sí |
| Palanca que necesita **GSC/GA4 en vivo o build-perf** | escala/propón; no la fuerces a ciegas | **No** (declara) |

**Estimación de impacto — honestidad**: la deuda la miden sondas (objetivo); el impacto necesita analítica externa que no alcanzas. Usa demanda **cacheada** + cobertura como proxy y **declara la incertidumbre**. No inventes trabajo marginal si el cimiento está maduro — pero **«maduro» hay que demostrarlo, no suponerlo**: la versión anterior de esta línea decía que en jul 2026 «contenido/calidad/UX maduros → la palanca real fue código SEO, no un caso de cola larga», y esa frase se volvió la coartada para no tocar el corpus en toda una sesión. Era falsa: el corpus tenía **Siria con 0 casos** y los **2010s como década moderna más delgada** (22 casos, menos de la mitad que los 1970s), y un solo NEWS-SWEEP lo destapó. La saturación del corpus es una **conclusión que se gana corriendo el sweep**, nunca una premisa.

### 4 · ACT
**Umbral para preguntar** (antes quedaba a criterio y por eso variaba): pide OK si el disparo (a) crea o reescribe **contenido** —`/nuevo-caso`, expandir prosa—, (b) cambia **copy que ve el usuario o la SERP** (títulos, descripciones, textos de UI), (c) toca **≥5 archivos** o es un refactor L+, o (d) **borra** algo. Un fix mecánico y acotado que solo restaura un invariante ya documentado —añadir el `hreflang` que falta, envolver en `pageMeta`— **se aplica sin preguntar y se reporta**. Nunca `/nuevo-caso` ni un refactor L+ en `--auto`. Con `--auto` solo corres diagnósticos read-only. Encadena el sub-skill cuando el usuario aprueba. Para un cambio grande y mecánico esparcido en archivos disjuntos, **fan-out con subagentes** (patrón migración jul 2026: props required → `tsc` fuerza completitud).

### 5 · VERIFY — la parte que V2 hacía a ojo

**Regla cero — VALIDA LA SONDA ANTES DE CREERLE.** Toda sonda que uses para verificar debe pasar un **control negativo**: rompe a propósito lo que debería detectar y confirma que **dispara**. Si no dispara, la sonda no está midiendo — no importa cuán verde se vea. §6 le exige a cada guardrail nuevo el gate doble (pasa-en-sano Y atrapa-violación); **la herramienta de verificación merece la misma prueba**, y esa asimetría era el bug. Tres falsos verdes en dos corridas (jul 2026) lo justifican: (a) `tsc <archivos>` aborta con `TS5112` sin parsear nada cuando hay `tsconfig.json`; (b) el parche obvio, `--ignoreConfig`, **mata el alias `@/`** y con él todo el chequeo **entre módulos** — un cambio de firma con call-sites sin actualizar quedaba verde; **usa `tsc -p tsconfig.json --noEmit`**, el único modo que resuelve los `paths`; (c) un poll de CI por `curl` a `api.github.com` devuelve un JSON de error (la API directa está bloqueada; solo el MCP de GitHub llega) que se lee como «terminó». Todos daban «0 problemas» sobre cero trabajo hecho.

**Corolario (b) — revalida DESPUÉS de parchear la sonda, no solo antes.** El arreglo de un falso verde puede introducir otro distinto: ahí el control negativo hay que volver a correrlo sobre la sonda ya corregida.

- **Datos/schema/tokens** → re-corre su sonda node-plano.
- **Frontend/SEO/HTML servido** → **lee el artefacto DESPLEGADO en la branch `gh-pages`** (`raw.githubusercontent.com/<owner>/<repo>/gh-pages/<ruta>/index.html`, alcanzable vía proxy; la URL viva y Google NO lo están). Es el camino **primario**: verifica lo que el sitio realmente sirve, no un build local, y funciona **sin `node_modules`** — que es como arrancan las sesiones remotas. Así se confirmaron los 3 defectos de metadata de jul 2026 (`og:url` apuntando a la home, `hreflang` ausente, alterno en 404) *antes* de tocar nada, y se contrastaron contra una ruta sana como control.
- **Frontend/UX interactivo** → **`webapp-testing`** cuando HAY build: aserciones de navegador reales (sin errores de consola, la interacción funciona —el toggle navega, el render single-locale es correcto—). Ojo: exige `out/` o un dev server, así que en una sesión remota fresca **no es ejecutable** hasta instalar `node_modules`; no es excusa para eyeball-ear — cae al artefacto de `gh-pages` de arriba.
- **Cambios que solo CI puede probar** (compilación real, `next build`) → dilo explícitamente y espera el check; no declares verificado lo que no corriste. El estado de CI se consulta por el **MCP de GitHub**, no por `curl`.
- **Contenido nuevo** → `validate-schema` + estándar E13 + fuentes reales verificadas (no inventadas).
- Si el ATTACK fue destructivo, verificación reforzada.

### 6 · RATCHET con GATE + AUTO-MEDICIÓN
- Fix que abrió una clase enforzable → **`/blindar`** (el guardrail debe **pasar-en-sano Y atrapar-una-violación** o se descarta, `G_bad++`).
- **`skill-creator` (evals + benchmark de varianza) tiene UN disparador concreto: cuando esta corrida EDITÓ un skill del loop** (`.claude/commands/*.md`). Ahí sí supera al enfoque plano — mide si el cambio mejora el disparo/comportamiento en vez de auto-afirmarlo, y de paso afina el `description`. **Fuera de ese caso, NO lo llames**: «¿funciona el cerebro?» en abstracto no es un disparador (una corrida sola es n=1 y montar evals para eso cuesta más de lo que informa). La medición honesta de una corrida son sus artefactos: defectos hallados **verificados contra producción**, guardrails que pasan su gate doble, CI verde.

### 7 · CAPTURE
Era la sección más floja del doc —una línea, sin gate, mientras todo lo demás tiene condición de aceptación— y por eso se saltaba sin coste. Ahora:
- **Toda lección → `/learn`**, en el momento. No la escribas tú en `CLAUDE.md`: `/learn` deduplica contra lo existente y la ubica en la sección correcta, que es justo lo que se pierde al hacerlo a mano.
- **Cierre de corrida → `/retro`**, incluso si ya corriste `/learn` — mina lo que no se capturó en caliente.
- **Los DESCARTES también se capturan**, no solo los aciertos: un candidato investigado y rechazado es trabajo hecho con veredicto. Va a [`docs/registros.md`](../../docs/registros.md) fechado y **con el motivo**, porque el motivo decide si caduca («no existe» ≠ «no pude anclarlo desde este entorno»). Sin esto la próxima corrida lo vuelve a investigar y a descartar — pasó con 14 candidatos en jul 2026.
- Reporte de impacto → `artifact-design` si es para compartir.

### 8 · CONVERGE
Termina **solo** cuando `err=0` **y** no queda palanca de impacto alcanzable sobre el umbral (raro — casi siempre hay un caso demandado o un leak). Declarar el corpus **maduro** exige el NEWS-SWEEP corrido en esta corrida (§3, regla de precedencia); sin eso no es una conclusión, es una excusa para no tocar el contenido. Si oscila (arreglar A rompe B) → escala. Si una palanca antes bloqueada se desbloquea → re-encóla.

---

## Invariantes
1. **Impacto-primero** — el presupuesto va a crear valor; la deuda es un gate, no el objetivo. **El corpus manda**: para atacar algo que no sea contenido hay que nombrar la palanca superior que se salta y probar en esta corrida que está agotada (§3). El meta-trabajo sobre el propio loop no cuenta como ATTACK. *(Corrección de la v1, endurecida en jul 2026 tras una sesión de cinco PRs sin una línea de corpus.)*
2. **Cimiento duro** — `err=0` antes de construir; nunca sobre schema roto.
3. **Verificado, no eyeball-eado** — lo que el sitio SIRVE se comprueba contra el artefacto desplegado en `gh-pages` (§5), que funciona sin `node_modules`; `webapp-testing` solo cuando hay build y el cambio es interactivo. *(Corrección de V2, reescrita en V4: la versión anterior de este invariante exigía `webapp-testing` sin más y contradecía a §5 desde entonces — un lector que solo mire los invariantes concluía algo falso.)*
4. **Auto-medido, no auto-afirmado** — nada se declara sano por fe: **toda sonda pasa su control negativo** (§5 regla cero) y **todo guardrail su gate doble** (§6). Si la corrida editó un skill del loop, `skill-creator` mide el cambio. *(El invariante se cumple en cada corrida, no solo cuando hay evals.)*
5. **Trinquete** — cada fix enforzable → guardrail (medio, no fin), y el guardrail lo crea **`/blindar`**, no el cerebro a mano.
6. **Orquestar, no ejecutar** — los skills del loop se delegan **siempre** que la acción cae en su dominio; hacer su trabajo a mano se salta la disciplina que codifican y deja al skill sin usar (y por tanto sin mejorar). Los de librería son opt-in. Al cerrar, declara cuáles invocaste y cuáles no. *(jul 2026: tres violaciones en una sesión.)*
7. **Suelo honesto** — no golpea deuda bloqueada por entorno; declara qué impacto necesita red/build que no tiene; no inventa trabajo en un cimiento maduro.

## Restricciones
- No commitees/pushees salvo que el usuario lo pida — **excepción: en sesión remota/CI el harness asigna una branch `claude/<topic>` y manda commit + push + PR draft para toda implementación; ahí esa instrucción manda** (el contenedor es efímero: lo que no se pushea se pierde). Cumple el Branch protocol de `CLAUDE.md` (PR draft → ready → squash) y no mergees sin que el usuario lo pida.
- Señales de deuda = node-plano sin red; `webapp-testing` corre local (sirve `out/` o el dev server, sin salir a internet); las de contenido pueden usar red (Wikipedia/archive.org).
- Un disparo, una señal — de deuda **o de impacto**. Sin señal, no es un disparo.
- **DOS CLASES DE SKILL, DOS REGLAS OPUESTAS.** No mezclarlas era el agujero: una sola regla permisiva («invócalo solo si supera al enfoque plano») dejaba el juicio para el instante en que hacerlo a mano *siempre* parece más barato, así que se resolvía en «no delegues» casi siempre.
  - **Skills del loop** (`/proximo-caso`, `/nuevo-caso`, `/blindar`, `/curar-memoria`, `/learn`, `/retro`, `/innovar`): **delegación OBLIGATORIA**. Si la acción cae en su dominio, se invocan — el cerebro **no reimplementa** su trabajo. No es purismo: un skill que nunca se invoca nunca mejora, y el trabajo hecho a mano **se salta la disciplina que el skill codifica** (el gate doble de `/blindar`, la disciplina de fuentes de `/nuevo-caso`, la deduplicación de `/learn`). Es el mismo principio que el resto del doc: un output que nadie consume se pudre — y un skill que nadie invoca es exactamente eso.
  - **Skills de librería** (`webapp-testing`, `dataviz`, `artifact-design`, `skill-creator`): opt-in, solo cuando superan al enfoque plano. Simplicity first — aquí sí, no los llames por lucir.
