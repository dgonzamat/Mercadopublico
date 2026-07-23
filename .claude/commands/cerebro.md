---
description: Orquestador del loop — NO solo mantiene deuda: ATACA impacto. Lee estado + señales de crecimiento, mantiene el cimiento sano (err=0) y gasta el grueso del presupuesto en la acción de mayor VALOR. V3 potencia el loop con skills de librería — verificación de navegador real (webapp-testing), auto-evaluación cuantitativa (skill-creator) y articulación visual (dataviz/artifact-design) — para no eyeball-ear ni auto-afirmar sin medir.
argument-hint: "[opcional: --auto para gatillar los sub-skills read-only sin preguntar; sin flag articula y propone el disparo]"
---

Estás ejecutando el **cerebro** del repo. Un error de la v1: su objetivo era *puramente defensivo* (minimizar deuda), así que su mejor caso era «nada que arreglar» — un conserje, no un arquitecto. **V2 lo corrigió: el cerebro ATACA impacto.** **V3 cierra dos huecos que se vieron en la práctica**: (a) verificaba frontend *a ojo* (grep + screenshots eyeball-eados), y (b) su propio impacto era *proxy no medido* («¿funciona el cerebro?» sin respuesta cuantitativa). V3 lo resuelve orquestando **skills de librería** en los pasos correctos.

**Objetivo medible.**
```
maximizar   Impact  −  λ·Deuda
  Impact = valor creado   (contenido con demanda de búsqueda, palancas de SEO/tráfico, profundidad/alcance del corpus)
  Deuda  = err + drift + unenforced + gaps      (err=0 es GATE DURO: no construyas sobre cimiento roto)
```
La deuda se mantiene **bajo un umbral**; **el grueso del presupuesto va a Impact.** El trinquete (`G↑`) sigue, pero es medio, no fin.

Regla de oro (anti-fluff): **cada disparo cita su señal concreta.** Vale para deuda Y para impacto: "hueco Chile×2010s con 40 impresiones/mes en GSC → `/nuevo-caso`" está permitido; "mejorar el contenido" está prohibido.

---

## Skills de librería que el cerebro orquesta (la potencia de V3)

El cerebro es un orquestador: no reimplementa lo que un skill ya hace mejor. **Invoca un skill solo cuando supera al enfoque plano** (Karpathy: simplicity first — no lo llames por lucir). Mapa skill → paso → para qué:

| Skill | Paso | Cuándo / para qué |
|---|---|---|
| **`webapp-testing`** (Playwright) | §3 ATTACK-UX · §5 VERIFY | Renderiza e **interactúa** con el sitio: es lo único que las sondas node-plano NO hacen («nunca renderizan un pixel»). En §3 genera la *señal de UX concreta* (fricción real, no corazonada). En §5 **asegura** un cambio de frontend con aserciones de navegador (sin errores de consola, la interacción funciona, el DOM es el esperado) — no eyeball-eando un screenshot. |
| **`skill-creator`** | §6 RATCHET · auto-medición | Corre **evals + benchmark de varianza** sobre un skill (incl. este cerebro y los del loop). Convierte «¿funciona?» en un número. Cuando un fix toca un skill del loop, o cuando dudas si el cerebro entrega impacto, mídelo con evals en vez de auto-afirmar. También optimiza el `description` para que dispare bien. |
| **`dataviz`** | §1 SENSE / articular | Cuando el estado se lee mejor en gráfico que en texto (partición MECE, matriz de cobertura país×década, backlog por tier): un chart validado clarifica la señal. Solo si el visual supera al texto. |
| **`artifact-design`** | §1 articular · reporte de impacto | Empaqueta el estado/análisis de impacto como artifact estilado (dashboard) cuando el output es para revisar/compartir, no un dump de terminal. |

**Analítica externa (GSC/GA4)**: el conector Windsor está **gated por plan** (devuelve ceros) y la allowlist bloquea GSC/GA4 directo — comprobado. El proxy de demanda sigue siendo lo **cacheado** en `CLAUDE.md`; declara la incertidumbre, no finjas tráfico.

---

## El procedimiento — V3 (impacto-primero, verificado, auto-medido)

### 0 · CALIBRATE — sensores frescos
`rm -rf web/out` + regenera `cases.json` antes de medir (un artefacto rancio miente). *(Lección out/ rancio.)*

### 1 · SENSE — leer DOS familias de señales (+ articular)

**a) Deuda** (node-plano, sin red — el cimiento):
```
node web/scripts/validate-schema.mjs · audit-consistency.mjs · audit-design.mjs
grep -noE '~?[0-9][0-9.,]*[ ]?(casos|KB|MB|client|...)|Next\.js [0-9.]+|[0-9]+\.[0-9]+\.[0-9]+' CLAUDE.md   # drift 1b
```

**b) Impacto** (dónde crear valor — más blando, decláralo):
- **Cobertura**: huecos país×década / tier (del audit + `lib/regions.ts`).
- **Demanda**: señales cacheadas en `CLAUDE.md` (GSC en vivo NO alcanzable — ver arriba).
- **Profundidad**: casos de alto tráfico con prosa en el **piso** de E13 o desactualizados (candidatos a expansión, patrón malmstrom).
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
| **Fricción de UX** (flujo de descubrimiento, interacción) | **`webapp-testing`** para HALLAR la fricción real (render + interactúa), luego el fix | **Sí** (Playwright local) |
| Ángulo del corpus sin vista que mueva **tráfico** | `/innovar` **solo si crece valor**, no pulido | Sí |
| Palanca que necesita **GSC/GA4 en vivo o build-perf** | escala/propón; no la fuerces a ciegas | **No** (declara) |

**Estimación de impacto — honestidad**: la deuda la miden sondas (objetivo); el impacto necesita analítica externa que no alcanzas. Usa demanda **cacheada** + cobertura como proxy y **declara la incertidumbre**. *No inventes trabajo marginal si el cimiento está maduro* — reconocerlo ES la salida correcta (lección jul 2026: contenido/calidad/UX maduros → la palanca real fue código SEO, no un caso de cola larga ni un rediseño innecesario).

### 4 · ACT
Las palancas suelen ser **grandes**: **propón el plan y pide OK** antes de construir (nunca `/nuevo-caso` ni un refactor L+ en `--auto`). Con `--auto` solo corres diagnósticos read-only. Encadena el sub-skill cuando el usuario aprueba. Para un cambio grande y mecánico esparcido en archivos disjuntos, **fan-out con subagentes** (patrón migración jul 2026: props required → `tsc` fuerza completitud).

### 5 · VERIFY — la parte que V2 hacía a ojo
- **Datos/schema/tokens** → re-corre su sonda node-plano.
- **Frontend/UX** → **`webapp-testing`**: aserciones de navegador reales (sin errores de consola, la interacción funciona —p.ej. el toggle navega, el render single-locale es correcto—, el DOM/HTML estático es el esperado). *Antes se verificaba con grep + screenshot eyeball-eado; ahora se asegura.*
- **Contenido nuevo** → `validate-schema` + estándar E13 + fuentes reales verificadas (no inventadas).
- Si el ATTACK fue destructivo, verificación reforzada.

### 6 · RATCHET con GATE + AUTO-MEDICIÓN
- Fix que abrió una clase enforzable → **`/blindar`** (el guardrail debe **pasar-en-sano Y atrapar-una-violación** o se descarta, `G_bad++`).
- Fix que toca un **skill del loop**, o duda de si **este cerebro entrega impacto** → **`skill-creator`**: evals + benchmark de varianza. Convierte la pregunta «¿funciona el cerebro?» en un número, en vez de auto-afirmarlo (cierra el hueco n=1). Optimiza el `description` del skill tocado para que dispare bien.

### 7 · CAPTURE → `/learn` / `/retro`. Reporte de impacto → `artifact-design` si es para compartir.

### 8 · CONVERGE
Termina **solo** cuando `err=0` **y** no queda palanca de impacto alcanzable sobre el umbral (raro — casi siempre hay un caso demandado o un leak). En un corpus **maduro**, la salida honesta es reconocerlo y redirigir a la palanca de mayor impacto real, no fabricar trabajo. Si oscila (arreglar A rompe B) → escala. Si una palanca antes bloqueada se desbloquea → re-encóla.

---

## Invariantes
1. **Impacto-primero** — el presupuesto va a crear valor; la deuda es un gate, no el objetivo. *(Corrección de la v1.)*
2. **Cimiento duro** — `err=0` antes de construir; nunca sobre schema roto.
3. **Verificado, no eyeball-eado** — un cambio de frontend se asegura con `webapp-testing`, no con un screenshot mirado a ojo. *(Corrección de V2.)*
4. **Auto-medido, no auto-afirmado** — el impacto del propio loop y de sus skills se mide con `skill-creator` (evals), no se declara sano por fe. *(La potencia de V3.)*
5. **Trinquete** — cada fix enforzable → guardrail (medio, no fin).
6. **Suelo honesto** — no golpea deuda bloqueada por entorno; declara qué impacto necesita red/build que no tiene; no inventa trabajo en un cimiento maduro.

## Restricciones
- No commitees/pushees salvo que el usuario lo pida.
- Señales de deuda = node-plano sin red; `webapp-testing` corre local (sirve `out/` o el dev server, sin salir a internet); las de contenido pueden usar red (Wikipedia/archive.org).
- Un disparo, una señal — de deuda **o de impacto**. Sin señal, no es un disparo.
- **Un skill se invoca solo cuando supera al enfoque plano** — no por lucir. Simplicity first.
