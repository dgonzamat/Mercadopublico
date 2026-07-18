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
| Nº de casos (prosa, ej. "~316") | `ls web/data/cases/*.json \| wc -l` |
| "91 actores" / researchers | `node -e 'console.log(require("./web/data/researchers.json").length)'` |
| "~39 client components (techo 45)" | `grep -rl '"use client"' web/components web/app \| wc -l` |
| "28/91 actores tienen foto" | `node -e 'const r=require("./web/data/researchers.json");console.log(r.filter(x=>x.photo).length+"/"+r.length)'` |
| "11 frameworks" | `node -e 'console.log(require("./web/data/frameworks.json").length)'` |
| "19 patrones" | `node -e 'console.log(require("./web/data/patterns.json").length)'` |
| Tiers S/A/B (subconjuntos citados en E21 y prosa) | `node -e 'const fs=require("fs"),d="web/data/cases",t={};fs.readdirSync(d).filter(f=>f.endsWith(".json")).forEach(f=>{const x=JSON.parse(fs.readFileSync(d+"/"+f));t[x.tier]=(t[x.tier]||0)+1});console.log(t)'` |

Si aparecen cifras nuevas hardcodeadas en `CLAUDE.md` que no están en esta tabla, agrégalas mentalmente al chequeo y — si son estables — sugiere sumar su sonda a este mismo comando (el curador se mantiene a sí mismo).

### 2. Sondas de referencias muertas
- Rutas/archivos citados en `CLAUDE.md` que ya no existen (`scripts/*.mjs`, `lib/*.ts`, componentes). Verifica con `ls`/Glob los paths mencionados.
- Reglas de audit (E13, M1, etc.) que ya no aparecen en `audit-consistency.mjs` / `validate-schema.mjs`.

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
