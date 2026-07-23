---
description: Orquestador del loop de self-learning — corre las señales del repo, ARTICULA qué necesita atención y GATILLA el skill correcto (/curar-memoria, /innovar, /blindar, /proximo-caso, /retro). El "cerebro" que decide qué disparar.
argument-hint: "[opcional: --auto para gatillar los skills read-only sin preguntar; sin flag articula y propone el disparo]"
---

Estás ejecutando el **cerebro** del repo — el director de orquesta del loop de self-learning. Los skills del loop (`/learn`, `/retro`, `/curar-memoria`, `/innovar`, `/blindar`, `/proximo-caso`) son piezas sueltas que un humano invoca a mano; falta una capa que **lea el estado del repo, articule qué necesita atención, y gatille la pieza correcta**. Eso eres. No haces el trabajo de los sub-skills — decides cuál corre y por qué.

Regla de oro heredada (anti-fluff): **cada disparo cita la señal concreta que lo dispara.** Sin señal, no gatilles. "Conviene curar la memoria" está prohibido; "el barrido 1b halló `cases.json «~165KB»` vs 4,3 MB real → `/curar-memoria`" está permitido.

## 1. Leer las señales (ground truth, node-plano desde `web/`)

Corre TODO esto y quédate con los números, no con impresiones:

```
# Salud estructural (las 3 sondas de build)
node web/scripts/validate-schema.mjs        # schema roto = ERROR duro
node web/scripts/audit-consistency.mjs       # tiers, cobertura, E13/E21, MECE, WARN/NOTE, client comps
node web/scripts/audit-design.mjs            # WCAG AA, contraste, tier drift, touch targets

# Drift de memoria (el barrido 1b de /curar-memoria — no solo la tabla fija)
grep -noE '~?[0-9][0-9.,]*[ ]?(casos|cases|actores|archivos|client|frameworks|patrones|KB|MB|GB|páginas|países|décadas|call-sites|usos|impresiones)|Next\.js [0-9.]+|React [0-9.]+|[0-9]+\.[0-9]+\.[0-9]+' CLAUDE.md

# Salud de link-health (E28: baseline existe y no está rancio >45 días)
node -e 'const b=require("./web/data/link-health-baseline.json");const d=(Date.parse(new Date().toISOString().slice(0,10))-Date.parse(b.generatedAt))/864e5;console.log("baseline",b.generatedAt,"· deadCount",b.deadCount,"· edad",Math.round(d),"días")'

# Headroom de client components vs techo 45
grep -rl '"use client"' web/components web/app | wc -l
```

Deriva además: E21 visual backlog (del audit), E13 prosa backlog (del audit), huecos de cobertura país×década (del audit o `lib/regions.ts`), fotos de actores (`filter(x=>x.photo)`).

## 2. Articular el estado

Un pulso compacto: **una línea de veredicto** + lo que está verde vs. lo que pide atención, cada cosa con su señal. No un volcado — la síntesis que un humano lee en 10 segundos.

## 3. Tabla de despacho (señal → skill)

Elige el disparo por la señal, no por gusto. Prioriza de arriba abajo:

| Señal concreta | Gatilla |
|---|---|
| `validate-schema`/`audit-*` con **ERRORS** | arréglalo directo; si es un anti-pattern reincidente → `/blindar` |
| **DRIFT** numérico en `CLAUDE.md` (barrido 1b ≠ repo vivo) | **`/curar-memoria`** (con `--fix` si el drift es objetivo) |
| Anti-pattern documentado, **mecanizable y aún no enforzado** | **`/blindar`** |
| **Hueco de cobertura** país×década / tier con demanda | **`/proximo-caso`** → `/nuevo-caso` |
| Lecciones de la sesión **sin capturar** (correcciones, gotchas) | **`/retro`** (lote) o `/learn` (una sola) |
| Baseline de link-health **rancio** (>45 d) o E28 WARN | regenera (`check-links:baseline`) o investiga por-URL |
| **Todo verde y sin huecos** | **`/innovar`** (surfacear oportunidades, no fallos) |
| WARN de backlog **bloqueado por el entorno** (E21 visual, fotos → red/hosting) | **NO gatilles** — anótalo y sigue; no es accionable desde una sesión remota |

Si varias señales disparan, ordena por leverage (impacto × 1/esfuerzo) y nombra la de arriba como el disparo principal; las demás, como cola.

## 4. Gatillar

- **Sin flag**: articula el estado, recomienda **el** disparo principal (con su señal) y **pide aprobación** antes de invocar un sub-skill que aplique cambios. Los sub-skills read-only/diagnósticos (`/curar-memoria` sin `--fix`, `/innovar`) puedes correrlos para enriquecer el reporte, pero no apliques nada sin OK.
- **Con `--auto`**: gatilla directo los sub-skills **read-only** (curar-memoria en modo reporte, innovar) vía la herramienta Skill y encadena su salida. **Nunca** auto-apliques cambios destructivos ni `--fix`/`--apply` — esos gates viven en cada sub-skill y requieren criterio humano.
- Si el veredicto es "todo sano, nada urgente", **dilo y termina** — no fabriques un disparo. El cerebro que no gatilla cuando no hay señal es tan valioso como el que gatilla cuando la hay.

## Restricciones
- No commitees ni pushees salvo que el usuario lo pida (los sub-skills heredan esto).
- Node-plano, sin `node_modules` ni red para las señales de §1 (mismo ADN que las sondas de build).
- Un disparo, una señal. Si no puedes nombrar la señal, no es un disparo — es relleno.
