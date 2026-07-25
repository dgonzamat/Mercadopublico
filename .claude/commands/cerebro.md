---
description: Orquestador del loop de salud y crecimiento del repo UAP Codex, con MODOS que tú eliges — nunca corre solo. ÚSALO cuando pidan correr el cerebro, crear un caso nuevo, buscar bugs técnicos o de UI/UX —incluido «algo está roto», «no se ve bien», «revisar el código», «hay un problema en el sitio»—, buscar mejoras de UI/UX o de código, refrescar casos existentes, revisar el estado del repo o decidir por dónde seguir, y también ante «analiza el repo», «qué falta», «dónde estamos» o «qué conviene hacer ahora» — aunque no nombren el cerebro. Modos: caso-nuevo | bugs | mejoras-ux | mejoras-tec | frescura | (sin argumento = diagnostica, elige y gatilla). ORQUESTA, NO EJECUTA: cada modo es una cadena de skills; los del loop (/proximo-caso, /nuevo-caso, /blindar, /curar-memoria, /learn, /retro, /innovar) son de delegación obligatoria y hacer su trabajo a mano es una violación.
argument-hint: "[modo: caso-nuevo | bugs | mejoras-ux | mejoras-tec | frescura · sin argumento = diagnostica, elige y gatilla]"
---

Estás ejecutando el **cerebro** del repo: un **despachador de modos** que orquesta skills — no ejecuta su trabajo. Corre solo cuando lo invocas, con el modo que le das.

*Por qué es así (V1→V7, los cuatro errores que lo formaron): [`docs/cerebro-historia.md`](../../docs/cerebro-historia.md). No hace falta leerlo para correr una corrida.*
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

| Dónde | Señal | Skill que DEBE invocarse |
|---|---|---|
| Gate común | drift objetivo en `CLAUDE.md` | **`/curar-memoria`** |
| M1 `caso-nuevo` | hueco de cobertura | **`/proximo-caso`** → **`/nuevo-caso`** |
| M3 `mejoras-ux` | oportunidad sin vista que la sirva | **`/innovar`** |
| M5 `frescura` | desarrollo nuevo sobre un caso | **`/nuevo-caso`** (su disciplina de fuentes) |
| RATCHET | el fix abrió una clase enforzable | **`/blindar`** — *nunca* escribas una regla de audit a mano |
| RATCHET | la corrida editó un skill del loop | **`skill-creator`** |
| CAPTURE | apareció una lección o un descarte | **`/learn`** |
| CAPTURE | cierre de corrida | **`/retro`** |

*Se volvió obligatorio tras tres incumplimientos en una sola sesión (jul 2026 — detalle en la historia).*

**Al cerrar, declara qué skills del loop invocaste y cuáles hiciste a mano.** Si hiciste el trabajo de uno sin invocarlo, dilo — es el único modo de que la violación sea visible.

---

## Skills de librería — opt-in

Estos sí se invocan **solo cuando superan al enfoque plano** (Karpathy: simplicity first — no los llames por lucir):

| Skill | Paso | Cuándo / para qué |
|---|---|---|
| **`run`** | M2 · M3 · VERIFY | Levanta la app. **Llave de todo lo interactivo**: sin build no hay render, y encadenado `run` → `webapp-testing` los modos de UI/UX pasan de inspeccionar marcado a observar el sitio. |
| **`webapp-testing`** (Playwright) | M2 · M3 · VERIFY | Renderiza e **interactúa** — lo único que las sondas node-plano no hacen. Da la señal de fricción real y asegura cambios interactivos. Encadénalo tras **`run`**; sin build, cae a `gh-pages`. |
| **`security-review`** | M2 · bugs | Revisión de seguridad del diff. Dimensión sin cubrir sobre un repo con anon key de Supabase y funciones `SECURITY DEFINER` en producción. |
| **`review`** | M2 · antes de mergear | Segunda mirada sobre el PR; complementa a las sondas, que solo ven lo mecanizado. |
| **`simplify`** | M4 · mejoras-tec | Reuso, simplificación, eficiencia. **No caza bugs por diseño** — por eso `mejoras-tec` es un modo aparte de `bugs`. |
| **`skill-creator`** | RATCHET | **Disparador único: la corrida editó un skill del loop.** Evals sobre el cambio y afina el `description`. Fuera de ahí no lo llames: «¿funciona el cerebro?» en abstracto es n=1. |
| **`dataviz`** | M0 · M3 · articular | Cuando el estado se lee mejor en gráfico que en texto (MECE, cobertura país×década, backlog por tier). Solo si el visual gana. |
| **`artifact-design`** | M0 · M3 · CAPTURE | Empaqueta el estado/análisis de impacto como artifact estilado (dashboard) cuando el output es para revisar/compartir, no un dump de terminal. |

**Analítica externa (GSC/GA4)**: el conector Windsor está **gated por plan** (devuelve ceros) y la allowlist bloquea GSC/GA4 directo — comprobado. El proxy de demanda sigue siendo lo **cacheado** en `CLAUDE.md`; declara la incertidumbre, no finjas tráfico.

---

## Los MODOS — tú eliges, el cerebro despacha

El cerebro **no decide solo cuándo correr ni sobre qué**. Se invoca con un modo explícito; cada modo es una cadena de skills distinta. Sin argumento cae al modo diagnóstico, que sondea y **te pregunta qué disparar**.

| Modo | Para qué | Cadena de skills |
|---|---|---|
| `caso-nuevo` | crecer el corpus | `/proximo-caso` → `/nuevo-caso` → `/learn` → `/retro` |
| `bugs` | defectos técnicos y de UI/UX | `run` → `webapp-testing` · `security-review` · `review` · `/blindar` |
| `mejoras-ux` | oportunidades de UI/UX | `run` → `webapp-testing` → `/innovar` · `dataviz`/`artifact-design` |
| `mejoras-tec` | calidad de código | `simplify` · `/blindar` |
| `frescura` | mantener vivos los casos | WebSearch + `gh-pages` → `/nuevo-caso` (disciplina) → `/learn` |
| *(sin argumento)* | diagnóstico | sondas → elige modo → **lo gatilla** |

**Toda cadena cierra igual**, sea cual sea el modo: **`/blindar`** si se abrió una clase enforzable, **`/learn`** para lecciones y descartes, **`/retro`** al cerrar.

---

### Gate común a TODO modo

Antes de cualquier cosa, sea cual sea el modo:

1. **CALIBRATE** — `rm -rf web/out` + regenera `cases.json`. Un artefacto rancio miente. *(Lección out/ rancio.)*
2. **Cimiento** — `validate-schema.mjs`, `audit-consistency.mjs`, `audit-design.mjs`. Si `err>0` **se arregla ya**: no se construye sobre schema roto, da igual lo que hayas pedido. Reincidente → **`/blindar`**.
3. **Drift** en `CLAUDE.md` → **`/curar-memoria`**. El cerebro no audita la memoria a mano.
   ```
   # OJO: en regex `...` son «tres caracteres cualesquiera», NO «etcétera».
   # La versión con `|...)` matcheaba 97 líneas en vez de 9 y ahogaba la señal (jul 2026).
   grep -noE '~?[0-9][0-9.,]*[ ]?(casos|actores|KB|MB|client components)|Next\.js [0-9.]+' CLAUDE.md
   ```
4. Deuda **bloqueada por entorno** (E21, fuentes rotas, fotos) → **anota, NO golpees** — pero «bloqueada» caduca: si el registro que lo afirma es de otra corrida, reverifica antes de darlo por bloqueado.

---

### M1 · `caso-nuevo` — crecer el corpus

**Cadena — empieza por `/proximo-caso`:** `/proximo-caso` → `/nuevo-caso` → cierre.

| Paso | Skill | Qué aporta |
|---|---|---|
| Elegir el hueco | **`/proximo-caso`** | Mide cobertura país×década/tier **y corre el NEWS-SWEEP**. No vuelvas a buscar por tu cuenta: ese es su trabajo |
| Crear | **`/nuevo-caso`** | Schema `UAPCase`, `num` secuencial, `posterior` MECE=1, estándar E13 (~550 palabras ES+EN) y disciplina de fuentes primarias |
| Descartes | **`/learn`** → [`docs/registros.md`](../../docs/registros.md) | Cada candidato rechazado, fechado y **con motivo** |
| Cierre | **`/retro`** | Lo que no se capturó en caliente |
| **Cierre** | **`/blindar`** · **`/learn`** · **`/retro`** | Clase enforzable → guardrail; lecciones **y descartes** → memoria; cierre → cosecha. |

**Salida honesta posible: «no hay candidato anclable»** — con los descartes registrados es un resultado, no un fracaso. Ojo con el visual: sin `documents[]`/`primaryDocument` el caso engorda el backlog E21; revisa `web/public/pursue/` antes.

---

### M2 · `bugs` — defectos técnicos y de UI/UX

**Cadena — empieza por `run`:** `run` → `webapp-testing` → `security-review` → `review` → cierre.

| Frente | Skill / vía | Qué aporta |
|---|---|---|
| Lo que el sitio SIRVE | `gh-pages` (ver VERIFY) | De ahí salieron `og:url` a la home, `hreflang` a un 404, títulos en español y JSON-LD sin localizar |
| Levantar la app | **`run`** | **Desbloquea lo que V4 daba por imposible**: sin `node_modules` no había forma de renderizar, y este skill existe justamente para instalar y arrancar el proyecto |
| UI/UX real | **`webapp-testing`** | Interacción y consola de verdad — no inspección de marcado |
| Seguridad | **`security-review`** | Dimensión **nunca mirada** por el cerebro, sobre un repo con anon key de Supabase y funciones `SECURITY DEFINER` en producción |
| Diff a mergear | **`review`** | Segunda mirada antes del merge |
| Trinquete | **`/blindar`** | Si el defecto abre una clase enforzable |
| **Cierre** | **`/blindar`** · **`/learn`** · **`/retro`** | Clase enforzable → guardrail; lecciones **y descartes** → memoria; cierre → cosecha. |

Aplica la **regla cero** de VERIFY a toda sonda que uses aquí — es el modo donde más falsos verdes han aparecido.

---

### M3 · `mejoras-ux` — oportunidades, no defectos

**Cadena — empieza por `run`:** `run` → `webapp-testing` → `/innovar` → cierre.

| Paso | Skill | Qué aporta |
|---|---|---|
| Hallar fricción | **`run`** → **`webapp-testing`** | Sin esto es corazonada; con esto es señal observada |
| Lo medible | `audit-design.mjs` | Contraste AA, touch targets, drift de color de tier |
| Priorizar | **`/innovar`** acotado a UI/UX | Backlog por leverage, no lista de deseos |
| Articular | **`dataviz`** / **`artifact-design`** | Solo si el visual gana al texto |
| **Cierre** | **`/blindar`** · **`/learn`** · **`/retro`** | Clase enforzable → guardrail; lecciones **y descartes** → memoria; cierre → cosecha. |

**Este modo necesita MÁS disciplina, no menos** — es el más fácil de llenar de trabajo inventado: **una mejora sin fricción observada es pulido, y el pulido no entra.** Antes de proponer una vista, lista `app/*/page.tsx` y grepea `lib/`.

---

### M4 · `mejoras-tec` — calidad de código

**Cadena — empieza por `simplify`:** `simplify` → cierre.

| Paso | Skill | Qué aporta |
|---|---|---|
| Simplificar | **`simplify`** | Reuso, eficiencia, limpieza de altitud. **Explícitamente NO caza bugs** — por eso es un modo distinto de `bugs` |
| Trinquete | **`/blindar`** | Si la limpieza revela una clase enforzable |
| **Cierre** | **`/blindar`** · **`/learn`** · **`/retro`** | Clase enforzable → guardrail; lecciones **y descartes** → memoria; cierre → cosecha. |

Cuidado con el anti-pattern de bundle: al tocar imports, traza el grafo desde cada `"use client"` antes de concluir nada.

---

### M5 · `frescura` — mantener vivos los casos

**Cadena — empieza por el barrido:** `WebSearch` + `gh-pages` → `/nuevo-caso` → cierre.

El corpus va hasta 2026 pero el mundo sigue: un caso «completo» hoy puede tener un desarrollo nuevo. Es la contraparte de `caso-nuevo` — aquel **crea**, este **mantiene**.

| Paso | Vía | Qué aporta |
|---|---|---|
| Barrido | `WebSearch` sobre Tier-S de más peso | Desarrollos documentados nuevos |
| Contraste | `gh-pages` + el propio caso | ¿ya está cubierto? |
| Aplicar | **`/nuevo-caso`** (su disciplina de fuentes) | Mismo anclaje a primaria |
| Descartes | **`/learn`** → registros | Los ~14 de jul 2026 se habrían salvado |
| **Cierre** | **`/blindar`** · **`/learn`** · **`/retro`** | Clase enforzable → guardrail; lecciones **y descartes** → memoria; cierre → cosecha. |

**La noticia es pista, no fuente.** Ancla a primaria o descarta — la tasa histórica de descarte ronda el 75%, y este dominio está lleno de detalle fabricado. Si el juicio del caso cambia, **mueve el `posterior`**: registrar evidencia nueva sin dejarla pesar es incoherente.

---

### M0 · sin argumento — diagnostica, ELIGE y gatilla

Corre el gate, lee las señales de impacto (cobertura, demanda cacheada, profundidad E13, frescura, SEO estructural) y **elige el modo que más rinde, lo anuncia con su señal y lo GATILLA**.

**No devuelvas la pregunta.** Si mediste las señales ya sabes cuál rinde más: decidir es el trabajo, no la consulta. Anuncia en una línea *qué* disparas y *por qué señal*, y encadena.

El umbral de ACT sigue vigente para lo que toca contenido, copy, ≥5 archivos o borra — pero **elegir el modo NO es una de esas cosas**: es tu decisión, no suya.

**Aquí —y SOLO aquí— vive la regla de precedencia**: existe para corregir el sesgo del cerebro a elegir lo que se comprueba barato. Cuando eliges tú el modo, sobra.

En diagnóstico, entonces: si vas a proponer algo que no sea corpus, nombra la palanca superior que saltas y prueba **en esta corrida** que está agotada. «Agotada» para cobertura = `/proximo-caso` corrido, sin candidato anclable. Un recuerdo o un registro de otra corrida no cuentan.

**Honestidad**: la deuda la miden sondas; el impacto no —GSC no es alcanzable—, así que usa cobertura y demanda cacheada como proxy y **declara la incertidumbre**. «Corpus maduro» se gana corriendo el sweep, nunca se supone.

**Meta-trabajo sobre el propio loop es OVERHEAD, no Impact** — admisible cuando desbloquea una palanca, pero nunca cuenta como el ataque de la corrida. Si no se tocó el corpus, dilo en el reporte.

**Encadenamiento entre modos**: si un modo destapa trabajo de otro, anúncialo y encadena en la misma corrida — devolverlo como sugerencia tira el contexto que costó levantar.

---

## Reglas transversales — aplican en TODO modo

### ACT — umbral para preguntar
Pide OK si el disparo (a) crea o reescribe **contenido**, (b) cambia **copy que ve el usuario o la SERP**, (c) toca **≥5 archivos** o es un refactor L+, o (d) **borra** algo. Un fix mecánico y acotado que solo restaura un invariante ya documentado —añadir el `hreflang` que falta, envolver en `pageMeta`— **se aplica sin preguntar y se reporta**. Nunca `/nuevo-caso` ni un refactor L+ en `--auto`. Para un cambio grande y mecánico esparcido en archivos disjuntos, fan-out con subagentes.

### VERIFY

**Regla cero — VALIDA LA SONDA ANTES DE CREERLE.** Toda sonda que uses debe pasar un **control negativo**: rompe a propósito lo que debería detectar y confirma que **dispara**. Si no dispara, no está midiendo — no importa cuán verde se vea. A cada guardrail nuevo se le exige el gate doble; **la herramienta de verificación merece la misma prueba**, y esa asimetría era el bug. Recetas que ya costaron un falso verde cada una: **`tsc -p tsconfig.json --noEmit`** (por archivos aborta con `TS5112` sin parsear; `--ignoreConfig` mata el alias `@/` y con él todo el chequeo entre módulos); estado de CI por el **MCP de GitHub**, nunca `curl` (la API directa devuelve un JSON de error que se lee como éxito).

**Corolario — revalida DESPUÉS de parchear la sonda.** El arreglo de un falso verde puede introducir otro distinto.

- **Datos/schema/tokens** → re-corre su sonda node-plano.
- **Lo que el sitio SIRVE** → **artefacto desplegado en `gh-pages`** (`raw.githubusercontent.com/<owner>/<repo>/gh-pages/<ruta>/index.html`, alcanzable vía proxy; la URL viva y Google NO). Camino primario: verifica lo servido, no un build local, y funciona sin `node_modules`. Contrasta siempre contra una ruta sana como control.
- **UI/UX interactivo** → **`run`** para levantar la app, luego **`webapp-testing`**.
- **Lo que solo CI puede probar** (`next build`) → dilo y espera el check. Estado de CI por el **MCP de GitHub**, no por `curl`.
- **Contenido nuevo** → `validate-schema` + E13 + fuentes verificadas.

### RATCHET
- Fix que abrió una clase enforzable → **`/blindar`** (el guardrail debe **pasar-en-sano Y atrapar-una-violación** o se descarta).
- La corrida editó un skill del loop → **`skill-creator`**. Fuera de ese caso no lo llames: «¿funciona el cerebro?» en abstracto es n=1.

### CAPTURE
- **Toda lección → `/learn`**, en el momento. No la escribas tú en `CLAUDE.md`: `/learn` deduplica y la ubica.
- **Cierre → `/retro`**, aunque ya hayas corrido `/learn`.
- **Los DESCARTES se capturan igual que los aciertos** → [`docs/registros.md`](../../docs/registros.md), fechados y **con motivo** — el motivo decide si caducan («no existe» ≠ «no pude anclarlo desde este entorno»).
- Reporte para compartir → **`artifact-design`**.

### CONVERGE
Termina cuando el modo pedido está agotado y `err=0`. **Declara qué skills del loop invocaste y cuáles hiciste a mano** — si hiciste el trabajo de uno sin invocarlo, dilo. Si oscila (arreglar A rompe B) → escala.

---

## Invariantes
1. **Impacto-primero** — el presupuesto va a crear valor; la deuda es un gate, no el objetivo. En el modo **diagnóstico** el corpus manda y saltárselo exige probar en esa corrida que la palanca está agotada; en los modos explícitos **manda tu elección** — la precedencia corregía el sesgo del cerebro al elegir, y cuando eliges tú, sobra. El meta-trabajo sobre el propio loop nunca cuenta como ataque. *(Corrección de la v1, endurecida en V5, acotada a diagnóstico en V7.)*
2. **Cimiento duro** — `err=0` antes de construir; nunca sobre schema roto.
3. **Verificado, no eyeball-eado** — lo que el sitio SIRVE se comprueba contra el artefacto desplegado en `gh-pages` (VERIFY), que funciona sin `node_modules`; `webapp-testing` tras **`run`**, cuando el cambio es interactivo. *(Corrección de V2, reescrita en V4: la versión anterior de este invariante exigía `webapp-testing` sin más y contradecía a VERIFY desde entonces — un lector que solo mire los invariantes concluía algo falso.)*
4. **Auto-medido, no auto-afirmado** — nada se declara sano por fe: **toda sonda pasa su control negativo** (regla cero de VERIFY) y **todo guardrail su gate doble** (RATCHET). Si la corrida editó un skill del loop, `skill-creator` mide el cambio. *(El invariante se cumple en cada corrida, no solo cuando hay evals.)*
5. **Trinquete** — cada fix enforzable → guardrail (medio, no fin), y el guardrail lo crea **`/blindar`**, no el cerebro a mano.
6. **Orquestar, no ejecutar** — los skills del loop se delegan **siempre** que la acción cae en su dominio; hacer su trabajo a mano se salta la disciplina que codifican y deja al skill sin usar (y por tanto sin mejorar). Los de librería son opt-in. Al cerrar, declara cuáles invocaste y cuáles no. *(jul 2026: tres violaciones en una sesión.)*
7. **Suelo honesto** — no golpea deuda bloqueada por entorno; declara qué impacto necesita red/build que no tiene; no inventa trabajo en un cimiento maduro.

## Restricciones
- No commitees/pushees salvo que el usuario lo pida — **excepción: en sesión remota/CI el harness asigna una branch `claude/<topic>` y manda commit + push + PR draft para toda implementación; ahí esa instrucción manda** (el contenedor es efímero: lo que no se pushea se pierde). Cumple el Branch protocol de `CLAUDE.md` (PR draft → ready → squash) y no mergees sin que el usuario lo pida.
- Señales de deuda = node-plano sin red; `run` + `webapp-testing` corren local (sin salir a internet); las de contenido pueden usar red (Wikipedia/archive.org).
- **El cerebro no se autoconvoca, pero sí se autodirige.** No hay cron, hook ni cola que lo lance: arranca cuando lo invocas. Pero una vez dentro **decide y ejecuta** — elige modo, lo gatilla y encadena a otro si el trabajo lo destapa. Lo que no hace es devolverte la pregunta que su propio diagnóstico ya respondió. La automatización del repo (`daily-audit`, `discover-cases`) produce insumos que los modos LEEN, nunca gatillos que disparen trabajo por su cuenta.
- Un disparo, una señal — de deuda **o de impacto**. Sin señal, no es un disparo.
- **DOS CLASES DE SKILL, DOS REGLAS OPUESTAS.** No mezclarlas era el agujero: una sola regla permisiva («invócalo solo si supera al enfoque plano») dejaba el juicio para el instante en que hacerlo a mano *siempre* parece más barato, así que se resolvía en «no delegues» casi siempre.
  - **Skills del loop** (`/proximo-caso`, `/nuevo-caso`, `/blindar`, `/curar-memoria`, `/learn`, `/retro`, `/innovar`): **delegación OBLIGATORIA**. Si la acción cae en su dominio, se invocan — el cerebro **no reimplementa** su trabajo. No es purismo: un skill que nunca se invoca nunca mejora, y el trabajo hecho a mano **se salta la disciplina que el skill codifica** (el gate doble de `/blindar`, la disciplina de fuentes de `/nuevo-caso`, la deduplicación de `/learn`). Es el mismo principio que el resto del doc: un output que nadie consume se pudre — y un skill que nadie invoca es exactamente eso.
  - **Skills de librería** (`webapp-testing`, `dataviz`, `artifact-design`, `skill-creator`): opt-in, solo cuando superan al enfoque plano. Simplicity first — aquí sí, no los llames por lucir.
