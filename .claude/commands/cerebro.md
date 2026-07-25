---
description: Orquestador del loop — NO solo mantiene deuda: ATACA impacto. Lee estado + señales de crecimiento, mantiene el cimiento sano (err=0) y gasta el grueso del presupuesto en la acción de mayor VALOR. V4 endurece la verificación: toda sonda pasa un control negativo antes de creerle, y lo servido se verifica contra el artefacto desplegado en gh-pages (funciona sin node_modules, que es como arranca una sesión remota), con webapp-testing para lo interactivo cuando hay build.
argument-hint: "[opcional: --auto para gatillar los sub-skills read-only sin preguntar; sin flag articula y propone el disparo]"
---

Estás ejecutando el **cerebro** del repo. Un error de la v1: su objetivo era *puramente defensivo* (minimizar deuda), así que su mejor caso era «nada que arreglar» — un conserje, no un arquitecto. **V2 lo corrigió: el cerebro ATACA impacto.** **V3 cierra dos huecos que se vieron en la práctica**: (a) verificaba frontend *a ojo* (grep + screenshots eyeball-eados), y (b) su propio impacto era *proxy no medido* («¿funciona el cerebro?» sin respuesta cuantitativa). V3 lo resuelve orquestando **skills de librería** en los pasos correctos. **V4 corrige a V3 con lo aprendido al ejecutarlo** (jul 2026): la verificación de navegador que V3 prescribía **no es ejecutable** en la sesión remota por defecto —arranca sin `node_modules`, así que no hay `out/` ni dev server—, y lo que sí funcionó fue mejor: leer el **artefacto desplegado en `gh-pages`**, que verifica lo que el sitio realmente sirve. Y apareció un hueco que V3 no veía: le exigía prueba al guardrail nuevo pero **no a la sonda que verifica**, y dos falsos verdes en una corrida (una que no chequeaba nada, otra que leía un error de API como éxito) pasaron por ahí. De ahí la **regla cero de §5**.

**Objetivo medible.**
```
maximizar   Impact  −  λ·Deuda
  Impact = valor creado   (contenido con demanda de búsqueda, palancas de SEO/tráfico, profundidad/alcance del corpus)
  Deuda  = err + drift + unenforced + gaps      (err=0 es GATE DURO: no construyas sobre cimiento roto)
```
La deuda se mantiene **bajo un umbral**; **el grueso del presupuesto va a Impact.** El trinquete (`G↑`) sigue, pero es medio, no fin.

Regla de oro (anti-fluff): **cada disparo cita su señal concreta.** Vale para deuda Y para impacto: "hueco Chile×2010s con 40 impresiones/mes en GSC → `/nuevo-caso`" está permitido; "mejorar el contenido" está prohibido.

---

## Skills de librería que el cerebro orquesta

El cerebro es un orquestador: no reimplementa lo que un skill ya hace mejor. **Invoca un skill solo cuando supera al enfoque plano** (Karpathy: simplicity first — no lo llames por lucir). Mapa skill → paso → para qué:

| Skill | Paso | Cuándo / para qué |
|---|---|---|
| **`webapp-testing`** (Playwright) | §3 ATTACK-UX · §5 VERIFY | Renderiza e **interactúa** con el sitio: es lo único que las sondas node-plano NO hacen («nunca renderizan un pixel»). En §3 genera la *señal de UX concreta* (fricción real, no corazonada); en §5 asegura un cambio interactivo con aserciones de navegador. **Requiere build** (`out/` o dev server) → en sesión remota fresca, sin `node_modules`, NO está disponible: para lo servido usa el artefacto de `gh-pages` (§5), y reserva este skill para lo genuinamente interactivo cuando haya build. |
| **`skill-creator`** | §6 RATCHET | **Disparador único: esta corrida editó un skill del loop** (`.claude/commands/*.md`). Evals + benchmark de varianza sobre el cambio, y afina el `description` para que dispare bien. Fuera de ese caso no lo llames: «¿funciona el cerebro?» en abstracto es n=1 y montar evals cuesta más de lo que informa. |
| **`dataviz`** | §1 SENSE / articular | Cuando el estado se lee mejor en gráfico que en texto (partición MECE, matriz de cobertura país×década, backlog por tier): un chart validado clarifica la señal. Solo si el visual supera al texto. |
| **`artifact-design`** | §1 articular · reporte de impacto | Empaqueta el estado/análisis de impacto como artifact estilado (dashboard) cuando el output es para revisar/compartir, no un dump de terminal. |

**Analítica externa (GSC/GA4)**: el conector Windsor está **gated por plan** (devuelve ceros) y la allowlist bloquea GSC/GA4 directo — comprobado. El proxy de demanda sigue siendo lo **cacheado** en `CLAUDE.md`; declara la incertidumbre, no finjas tráfico.

---

## El procedimiento — V4 (impacto-primero, verificado con control negativo, auto-medido)

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
Elige `argmax(Impact / esfuerzo)` sobre las palancas alcanzables:

| Señal de crecimiento | Acción de alto impacto | ¿Alcanzable aquí? |
|---|---|---|
| Hueco país×década/tier **con demanda** | `/proximo-caso` → **`/nuevo-caso`** | **Sí** (Wikipedia + archive.org) |
| Caso de alto tráfico en el **piso** o desactualizado | **expandir con fuentes primarias** (patrón malmstrom) | **Sí** |
| Leak de **SEO estructural** (idioma/URL, metadata, rich results) | fix de crecimiento (código, lo verifica CI + §5) | **Sí** |
| **Fricción de UX** (flujo de descubrimiento, interacción) | **`webapp-testing`** para HALLAR la fricción real (render + interactúa), luego el fix | **Solo con build** (sin `node_modules` no hay sitio que servir) |
| Ángulo del corpus sin vista que mueva **tráfico** | `/innovar` **solo si crece valor**, no pulido | Sí |
| Palanca que necesita **GSC/GA4 en vivo o build-perf** | escala/propón; no la fuerces a ciegas | **No** (declara) |

**Estimación de impacto — honestidad**: la deuda la miden sondas (objetivo); el impacto necesita analítica externa que no alcanzas. Usa demanda **cacheada** + cobertura como proxy y **declara la incertidumbre**. *No inventes trabajo marginal si el cimiento está maduro* — reconocerlo ES la salida correcta (lección jul 2026: contenido/calidad/UX maduros → la palanca real fue código SEO, no un caso de cola larga ni un rediseño innecesario).

### 4 · ACT
**Umbral para preguntar** (antes quedaba a criterio y por eso variaba): pide OK si el disparo (a) crea o reescribe **contenido** —`/nuevo-caso`, expandir prosa—, (b) cambia **copy que ve el usuario o la SERP** (títulos, descripciones, textos de UI), (c) toca **≥5 archivos** o es un refactor L+, o (d) **borra** algo. Un fix mecánico y acotado que solo restaura un invariante ya documentado —añadir el `hreflang` que falta, envolver en `pageMeta`— **se aplica sin preguntar y se reporta**. Nunca `/nuevo-caso` ni un refactor L+ en `--auto`. Con `--auto` solo corres diagnósticos read-only. Encadena el sub-skill cuando el usuario aprueba. Para un cambio grande y mecánico esparcido en archivos disjuntos, **fan-out con subagentes** (patrón migración jul 2026: props required → `tsc` fuerza completitud).

### 5 · VERIFY — la parte que V2 hacía a ojo

**Regla cero — VALIDA LA SONDA ANTES DE CREERLE.** Toda sonda que uses para verificar debe pasar un **control negativo**: rompe a propósito lo que debería detectar y confirma que **dispara**. Si no dispara, la sonda no está midiendo — no importa cuán verde se vea. §6 le exige a cada guardrail nuevo el gate doble (pasa-en-sano Y atrapa-violación); **la herramienta de verificación merece la misma prueba**, y esa asimetría era el bug. Dos falsos verdes en una sola corrida (jul 2026) lo justifican: (a) `tsc <archivos>` desde `web/` aborta con `TS5112` sin parsear nada cuando hay `tsconfig.json` — usa `--ignoreConfig`; (b) un poll de CI por `curl` a `api.github.com` devuelve un JSON de error (la API directa está bloqueada; solo el MCP de GitHub llega) que se lee como «terminó». Ambos daban «0 problemas» sobre cero trabajo hecho.

- **Datos/schema/tokens** → re-corre su sonda node-plano.
- **Frontend/SEO/HTML servido** → **lee el artefacto DESPLEGADO en la branch `gh-pages`** (`raw.githubusercontent.com/<owner>/<repo>/gh-pages/<ruta>/index.html`, alcanzable vía proxy; la URL viva y Google NO lo están). Es el camino **primario**: verifica lo que el sitio realmente sirve, no un build local, y funciona **sin `node_modules`** — que es como arrancan las sesiones remotas. Así se confirmaron los 3 defectos de metadata de jul 2026 (`og:url` apuntando a la home, `hreflang` ausente, alterno en 404) *antes* de tocar nada, y se contrastaron contra una ruta sana como control.
- **Frontend/UX interactivo** → **`webapp-testing`** cuando HAY build: aserciones de navegador reales (sin errores de consola, la interacción funciona —el toggle navega, el render single-locale es correcto—). Ojo: exige `out/` o un dev server, así que en una sesión remota fresca **no es ejecutable** hasta instalar `node_modules`; no es excusa para eyeball-ear — cae al artefacto de `gh-pages` de arriba.
- **Cambios que solo CI puede probar** (compilación real, `next build`) → dilo explícitamente y espera el check; no declares verificado lo que no corriste. El estado de CI se consulta por el **MCP de GitHub**, no por `curl`.
- **Contenido nuevo** → `validate-schema` + estándar E13 + fuentes reales verificadas (no inventadas).
- Si el ATTACK fue destructivo, verificación reforzada.

### 6 · RATCHET con GATE + AUTO-MEDICIÓN
- Fix que abrió una clase enforzable → **`/blindar`** (el guardrail debe **pasar-en-sano Y atrapar-una-violación** o se descarta, `G_bad++`).
- **`skill-creator` (evals + benchmark de varianza) tiene UN disparador concreto: cuando esta corrida EDITÓ un skill del loop** (`.claude/commands/*.md`). Ahí sí supera al enfoque plano — mide si el cambio mejora el disparo/comportamiento en vez de auto-afirmarlo, y de paso afina el `description`. **Fuera de ese caso, NO lo llames**: «¿funciona el cerebro?» en abstracto no es un disparador (una corrida sola es n=1 y montar evals para eso cuesta más de lo que informa). La medición honesta de una corrida son sus artefactos: defectos hallados **verificados contra producción**, guardrails que pasan su gate doble, CI verde.

### 7 · CAPTURE → `/learn` / `/retro`. Reporte de impacto → `artifact-design` si es para compartir.

### 8 · CONVERGE
Termina **solo** cuando `err=0` **y** no queda palanca de impacto alcanzable sobre el umbral (raro — casi siempre hay un caso demandado o un leak). En un corpus **maduro**, la salida honesta es reconocerlo y redirigir a la palanca de mayor impacto real, no fabricar trabajo. Si oscila (arreglar A rompe B) → escala. Si una palanca antes bloqueada se desbloquea → re-encóla.

---

## Invariantes
1. **Impacto-primero** — el presupuesto va a crear valor; la deuda es un gate, no el objetivo. *(Corrección de la v1.)*
2. **Cimiento duro** — `err=0` antes de construir; nunca sobre schema roto.
3. **Verificado, no eyeball-eado** — un cambio de frontend se asegura con `webapp-testing`, no con un screenshot mirado a ojo. *(Corrección de V2.)*
4. **Auto-medido, no auto-afirmado** — nada se declara sano por fe: **toda sonda pasa su control negativo** (§5 regla cero) y **todo guardrail su gate doble** (§6). Si la corrida editó un skill del loop, `skill-creator` mide el cambio. *(El invariante se cumple en cada corrida, no solo cuando hay evals.)*
5. **Trinquete** — cada fix enforzable → guardrail (medio, no fin).
6. **Suelo honesto** — no golpea deuda bloqueada por entorno; declara qué impacto necesita red/build que no tiene; no inventa trabajo en un cimiento maduro.

## Restricciones
- No commitees/pushees salvo que el usuario lo pida — **excepción: en sesión remota/CI el harness asigna una branch `claude/<topic>` y manda commit + push + PR draft para toda implementación; ahí esa instrucción manda** (el contenedor es efímero: lo que no se pushea se pierde). Cumple el Branch protocol de `CLAUDE.md` (PR draft → ready → squash) y no mergees sin que el usuario lo pida.
- Señales de deuda = node-plano sin red; `webapp-testing` corre local (sirve `out/` o el dev server, sin salir a internet); las de contenido pueden usar red (Wikipedia/archive.org).
- Un disparo, una señal — de deuda **o de impacto**. Sin señal, no es un disparo.
- **Un skill se invoca solo cuando supera al enfoque plano** — no por lucir. Simplicity first.
