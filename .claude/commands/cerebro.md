---
description: Orquestador del loop de self-learning — ejecuta el algoritmo de automejora V1++ (articula el estado y gatilla el skill correcto con trinquete, auto-verificación y suelo honesto). El "cerebro" que decide qué disparar.
argument-hint: "[opcional: --auto para gatillar los sub-skills read-only sin preguntar; sin flag articula y propone el disparo]"
---

Estás ejecutando el **cerebro** del repo — el director de orquesta del loop de self-learning. Los skills (`/learn`, `/retro`, `/curar-memoria`, `/innovar`, `/blindar`, `/proximo-caso`) son piezas sueltas que un humano invoca a mano; tú **lees el estado, articulas qué necesita atención y gatillas la pieza correcta**. No haces el trabajo de los sub-skills — decides cuál corre y por qué.

**Objetivo medible.** Minimizas una pérdida ciclo a ciclo mientras crece un contador que solo sube:
```
L = err + drift + unenforced + gaps          (bajar)
G = nº de guardrails enforzados              (subir)
```
`err`=ERRORS de las sondas · `drift`=claims de CLAUDE.md que ya no calzan · `unenforced`=anti-patterns documentados no mecanizados · `gaps`=huecos de cobertura con demanda. La asimetría `L↓ / G↑` es lo que hace que el sistema *compounde*, no solo se mantenga.

Regla de oro (anti-fluff): **cada disparo cita la señal concreta que lo dispara.** Sin señal, no gatilles. "Conviene curar la memoria" está prohibido; "el barrido 1b halló `cases.json «~165KB»` vs 4,3 MB real → `/curar-memoria`" está permitido.

---

## El procedimiento — algoritmo V1++

Ejecuta estos pasos en orden. Cada uno lleva su invariante (por qué está y de qué lección nace).

### 0 · CALIBRATE — verifica los sensores antes de confiar en ellos
Antes de leer señales, confirma que las **sondas** no están rancias. Corre cada una contra un resultado que ya conoces (fixture): p. ej. `test-chart` sobre un `out/` **fresco** (o `rm -rf web/out` primero — un `out/` viejo miente), y `du -h web/data/cases.json` tras `build-cases.mjs` (no confíes en un `cases.json` sin regenerar). *(Lección: el `out/` rancio y el `--limit=-20` de Wayback produjeron conclusiones falsas. «Verifica la sonda contra un caso cuyo resultado ya conoces», hecho invariante.)*

### 1 · SENSE — leer las señales (node-plano desde `web/`, sin red)
```
node web/scripts/validate-schema.mjs                 # schema roto = ERROR duro
node web/scripts/audit-consistency.mjs               # tiers, cobertura, E13/E21, MECE, WARN/NOTE, client comps
node web/scripts/audit-design.mjs                    # WCAG AA, contraste, tier drift, touch targets
grep -noE '~?[0-9][0-9.,]*[ ]?(casos|cases|actores|archivos|client|frameworks|patrones|KB|MB|GB|páginas|países|décadas|call-sites|usos|impresiones)|Next\.js [0-9.]+|React [0-9.]+|[0-9]+\.[0-9]+\.[0-9]+' CLAUDE.md   # drift (barrido 1b)
node -e 'const b=require("./web/data/link-health-baseline.json");const d=(Date.parse(new Date().toISOString().slice(0,10))-Date.parse(b.generatedAt))/864e5;console.log("baseline",b.generatedAt,"deadCount",b.deadCount,"edad",Math.round(d),"d")'   # E28
grep -rl '"use client"' web/components web/app | wc -l   # headroom vs techo 45
```
Deriva: E21/E13 backlog, huecos país×década, fotos de actores. Quédate con los números, no con impresiones.

### 2 · DIAGNOSE — articular
Un pulso compacto: **una línea de veredicto** + verde vs. atención, cada cosa con su señal. Síntesis que un humano lee en 10 s, no un volcado.

### 3 · ε-EXPLORE — si no hay señal, explora antes de rendirte
Si el SENSE no arroja nada accionable, **con baja probabilidad** corre UN barrido amplio que las sondas no cubren (staleness de casos famosos vs. Wikipedia, `país×década`, `/innovar`). *(Lección: malmstrom-1967 solo apareció explorando 8 casos; un greedy puro lo habría saltado. Las sondas solo ven lo que miden — el ε-explore cubre la deuda que aún no miden.)* Si el barrido halla algo, entra al ciclo con esa señal; si no, **TERMINA**.

### 4 · SELECT — elegir la acción de mayor leverage (con umbral)
`s = argmax(impacto × 1/esfuerzo)` sobre los skills disparables por la tabla de despacho, **pero solo si `ΔL_esperado(s) > umbral`**. No dispares por migajas ni golpees el suelo bloqueado.

**Tabla de despacho (señal → skill):**
| Señal concreta | Gatilla |
|---|---|
| `validate-schema`/`audit-*` con **ERRORS** | arréglalo directo; si es reincidente → `/blindar` |
| **DRIFT** numérico en `CLAUDE.md` (1b ≠ repo vivo) | **`/curar-memoria`** (`--fix` si es objetivo) |
| Anti-pattern documentado, **mecanizable y no enforzado** | **`/blindar`** |
| **Hueco de cobertura** país×década/tier con demanda | **`/proximo-caso`** → `/nuevo-caso` |
| Lecciones de la sesión **sin capturar** | **`/retro`** (lote) o `/learn` (una) |
| Baseline de link-health **rancio** (>45 d) o E28 WARN | regenera o investiga por-URL |
| **Todo verde y sin huecos** | **`/innovar`** (oportunidades, no fallos) |
| WARN **bloqueado por entorno** (E21 visual, fotos, fuentes → red/hosting) | **NO gatilles** — anota y sigue |

### 5 · ACT — gatillar
Sin flag: propone el disparo con su señal y **pide OK** antes de aplicar cambios; corre los sub-skills read-only (`/curar-memoria` reporte, `/innovar`) para enriquecer. Con `--auto`: gatilla directo solo los read-only. **Nunca** auto-apliques `--fix`/`--apply` destructivos — esos gates viven en cada sub-skill.

### 6 · VERIFY — confirmar que la métrica se movió bien
Re-corre la sonda de `s`. Si `s` fue **destructivo**, verificación **reforzada** (múltiples ángulos). Si `L` no bajó en la dirección esperada → **revierte** y vuelve a DIAGNOSE.

### 7 · RATCHET con GATE — mecanizar, pero solo lo correcto
Si `s` arregló una clase enforzable, dispara `/blindar`. **GATE**: el guardrail nuevo debe (a) **pasar en el repo sano** (sin falso positivo) **y** (b) **atrapar una violación de prueba real**. Si falla el gate, **descártalo** (`G_bad++`) — un guardrail flaky es net-negativo (rompe builds sanos). *(Lección: «una herramienta con un bug produce malas conclusiones» aplicada a los propios guardrails.)*

### 8 · CAPTURE — escribir la lección
La lección de este ciclo → `M` vía `/learn` (una) o `/retro` (lote), para que el próximo SENSE ya la sepa.

### 9 · CONVERGE — terminación honesta cross-ciclo
Registra `L`. Dos detectores:
- **Oscilación**: K ciclos con `ΔL≈0` pero aún disparando (arreglar A rompe B) → **escala a humano**, no sigas girando.
- **Floor-shift**: un ítem antes **bloqueado por entorno** que ahora pasa (red restaurada, asset subido) → **re-encólalo**. El suelo se mueve; re-ataca la deuda que se desbloqueó.

Si el veredicto es «todo sano, nada urgente y el ε-explore no halló nada», **dilo y termina**. El cerebro que no gatilla sin señal vale tanto como el que gatilla con ella.

---

## Invariantes que lo hacen *auto*mejora (no solo mantención)
1. **Trinquete** (7) — cada fix enforzable se vuelve guardrail → esa clase no reaparece; `L` no-creciente sobre lo enforzable.
2. **Auto-verificante** (0 + 6) — calibra sensores y verifica acciones contra ground truth; nunca concluye de una sonda sin verificarla.
3. **Auto-curante** (8 + `/curar-memoria`) — mantiene `M` honesta para que el SENSE no lea señales rancias.
4. **Meta-recursivo** — `/curar-memoria` audita los skills; `/blindar` mecaniza lecciones sobre el loop; el ε-explore descubre deuda que las sondas no miden. La maquinaria de mejora está sujeta al lazo.
5. **Suelo honesto** — reconoce la deuda bloqueada por entorno y NO la golpea (3 + tabla). Converge a un suelo real, no a busy-work.

## Restricciones
- No commitees ni pushees salvo que el usuario lo pida (los sub-skills heredan esto).
- Señales de §1 = node-plano, sin `node_modules` ni red (mismo ADN que las sondas de build).
- Un disparo, una señal. Si no puedes nombrar la señal, no es un disparo — es relleno.
