---
description: Audita CLAUDE.md contra el repo vivo — detecta cifras/afirmaciones desactualizadas, reglas duplicadas o contradictorias y propone consolidaciones (mitad de mantención del loop de self-learning)
argument-hint: "[opcional: --fix para aplicar los arreglos obvios; sin flag solo reporta]"
---

Estás ejecutando el **curador de memoria** del repo. Si `/learn` es la mitad que *captura* aprendizajes, este comando es la mitad que los *mantiene sanos*: aplica el "ruthlessly edit over time" de Boris Cherny, pero de forma **auto-verificable** — no confía en la prosa de `CLAUDE.md`, la contrasta contra el estado real del repo.

Nace de una lección real: el comentario "~304 archivos JSON" driftó a 316 sin que nadie lo notara (jul 2026). La memoria append-only se pudre; este comando la mantiene honesta.

Innovación clave: **las afirmaciones numéricas de `CLAUDE.md` son verificables** — así que verifícalas contra ground truth en vez de creerles.

## Pasos

### 1. Sondas de drift numérico (auto-verificable)
Corre cada sonda y compárala con la cifra que `CLAUDE.md` afirma a mano. Reporta cada divergencia como **DRIFT**.

| Afirmación en CLAUDE.md | Sonda de ground truth |
|---|---|
| Nº de casos (prosa, ej. "~327") | `ls web/data/cases/*.json \| wc -l` |
| "91 actores" / researchers | `node -e 'console.log(require("./web/data/researchers.json").length)'` |
| "~42 client components (techo 45)" | `grep -rl '"use client"' web/components web/app \| wc -l` |
| "28/91 actores tienen foto" | `node -e 'const r=require("./web/data/researchers.json");console.log(r.filter(x=>x.photo).length+"/"+r.length)'` |
| "11 frameworks" | `node -e 'console.log(require("./web/data/frameworks.json").length)'` |
| "19 patrones" | `node -e 'console.log(require("./web/data/patterns.json").length)'` |
| Tiers S/A/B (subconjuntos citados en E21 y prosa) | `node -e 'const fs=require("fs"),d="web/data/cases",t={};fs.readdirSync(d).filter(f=>f.endsWith(".json")).forEach(f=>{const x=JSON.parse(fs.readFileSync(d+"/"+f));t[x.tier]=(t[x.tier]||0)+1});console.log(t)'` |
| Tamaño de `cases.json` (ej. "~4 MB") | `node web/scripts/build-cases.mjs >/dev/null && du -h web/data/cases.json \| cut -f1` |
| Versiones del stack (ej. "Next.js 16.2.9", "React 18.3.1") | `node -e 'const p=require("./web/package.json");console.log("next",p.dependencies.next,"\| react",p.dependencies.react)'` |

### 1b. Auto-descubrimiento (no confíes solo en la tabla fija)
La tabla de arriba cubre los claims frecuentes, pero es una **lista fija** — un claim nuevo hardcodeado (un tamaño, una versión, un conteo de call-sites) driftea **invisible** si nadie lo añade. Lección real (jul 2026): `cases.json «~165KB»→4 MB` y `Next «14.2.35»→16.2.9` driftaron sin estar en la tabla y solo se cazaron grepeando a mano. Así que **barre TODO número/versión hardcodeado** y verifica cada uno, no solo los de la tabla:

```
grep -noE '~?[0-9][0-9.,]*[ ]?(casos|cases|actores|archivos|client|frameworks|patrones|KB|MB|GB|páginas|países|décadas|call-sites|usos|impresiones)|Next\.js [0-9.]+|React [0-9.]+|[0-9]+\.[0-9]+\.[0-9]+' CLAUDE.md
```

Cada línea que salga es un claim que **puede** driftear: contrástalo contra el repo vivo (si no está en la tabla, deriva su ground truth ad-hoc). Los que sean estables y recurrentes, súmalos como fila nueva a la tabla (el curador se mantiene a sí mismo).

### 2. Sondas de referencias muertas
- Rutas/archivos citados en `CLAUDE.md` que ya no existen (`scripts/*.mjs`, `lib/*.ts`, componentes). Verifica con `ls`/Glob los paths mencionados.
- Reglas de audit (E13, M1, etc.) que ya no aparecen en `audit-consistency.mjs` / `validate-schema.mjs`.
- **Los propios skills** (`.claude/commands/*.md`): el curador solía auditar solo `CLAUDE.md`, pero los skills tienen sus propios números y paths que también se pudren (jul 2026: la tabla de este mismo comando citaba «~316»/«~39 client», ya rancios cuando el corpus era 327/42). Corre el barrido de 1b y la verificación de paths **también** sobre `.claude/commands/*.md`.

### 3. Pasada cualitativa
Lee `CLAUDE.md` completo y marca:
- **DUPLICADO**: dos reglas que dicen lo mismo → propón fusión.
- **CONTRADICCIÓN**: dos reglas que chocan → señálalo, no lo resuelvas solo.
- **OBSOLETO**: reglas sobre código/flujo que ya no existe.
- **SIN PORQUÉ**: reglas sin causa raíz (candidatas a afilar o borrar).

### 4. Reporte
Tabla priorizada: `[tipo] · ubicación (línea) · qué dice · qué es en realidad · arreglo propuesto`. DRIFT numérico primero (es objetivo), cualitativo después.

### 5. Aplicar (solo con `--fix`, y solo lo inequívoco)
- **Aplica** los DRIFT numéricos y referencias muertas: son objetivos. Al reescribir una cifra, márcala aproximada + fechada `(mmm aaaa)` o remítela a la fuente derivada — no reintroduzcas un número que volverá a driftear (ver el anti-pattern de conteos hardcodeados).
- **NO apliques** solo las contradicciones ni los borrados de reglas con matices — esos requieren criterio humano: repórtalos y pide validación.
- Ediciones quirúrgicas con Edit, sin reordenar el resto del archivo.

Sin `--fix`, solo reporta. No commitees ni pushees salvo que el usuario lo pida.
