---
description: Orquestador del loop — NO solo mantiene deuda: ATACA impacto. Lee estado + señales de crecimiento, mantiene el cimiento sano (err=0) y gasta el grueso del presupuesto en la acción de mayor VALOR (contenido demandado, SEO/tráfico, profundidad del corpus). El "cerebro" que construye, no solo limpia.
argument-hint: "[opcional: --auto para gatillar los sub-skills read-only sin preguntar; sin flag articula y propone el disparo]"
---

Estás ejecutando el **cerebro** del repo. Un error de la v1: su objetivo era *puramente defensivo* (minimizar deuda), así que su mejor caso era «nada que arreglar» — un conserje, no un arquitecto. **V2 corrige eso: el cerebro ATACA impacto.** Cuando el cimiento está sano, no termina: construye.

**Objetivo medible.**
```
maximizar   Impact  −  λ·Deuda
  Impact = valor creado   (contenido con demanda de búsqueda, palancas de SEO/tráfico, profundidad/alcance del corpus)
  Deuda  = err + drift + unenforced + gaps      (err=0 es GATE DURO: no construyas sobre cimiento roto)
```
La deuda se mantiene **bajo un umbral** (no dejes la casa arder mientras construyes), pero **el grueso del presupuesto va a Impact.** El trinquete (`G↑`) sigue, pero es medio, no fin.

Regla de oro (anti-fluff): **cada disparo cita su señal concreta.** Vale para deuda Y para impacto: "hueco Chile×2010s con 40 impresiones/mes en GSC → `/nuevo-caso`" está permitido; "mejorar el contenido" está prohibido.

---

## El procedimiento — V2 (impacto-primero)

### 0 · CALIBRATE — sensores frescos
`rm -rf web/out` + regenera `cases.json` antes de medir (un artefacto rancio miente). *(Lección out/ rancio.)*

### 1 · SENSE — leer DOS familias de señales

**a) Deuda** (node-plano, sin red — el cimiento):
```
node web/scripts/validate-schema.mjs · audit-consistency.mjs · audit-design.mjs
grep -noE '~?[0-9][0-9.,]*[ ]?(casos|KB|MB|client|...)|Next\.js [0-9.]+|[0-9]+\.[0-9]+\.[0-9]+' CLAUDE.md   # drift 1b
```

**b) Impacto** (dónde crear valor — más blando, decláralo):
- **Cobertura**: huecos país×década / tier (del audit + `lib/regions.ts`).
- **Demanda**: señales de búsqueda cacheadas en `CLAUDE.md` (impresiones/posición/CTR por caso en Search Console) — el proxy de demanda. *(GSC/GA4 en vivo NO son alcanzables desde una sesión remota; usa lo cacheado y marca la incertidumbre.)*
- **Profundidad**: casos de alto tráfico con prosa en el **piso** de E13 o desactualizados (candidatos a expansión con fuentes — como malmstrom).
- **SEO estructural**: leaks conocidos (un idioma por URL → 2× DOM; metadata sin par `_en`; structured data faltante).

### 2 · TRIAGE del cimiento (deuda primero, pero acotado)
- Si `err>0` → **arréglalo ya** (gate duro). Si es reincidente → `/blindar`.
- Si `drift` objetivo → `/curar-memoria --fix` (barato, no negocia).
- Deuda **bloqueada por entorno** (E21, fuentes, fotos → red/hosting) → **anota, NO golpees.**
- Con el cimiento bajo umbral, **pasa a §3 — no termines aquí.** (El fallo de la v1 era terminar en «sano».)

### 3 · ATTACK — la acción de mayor Impacto (el núcleo de V2)
Elige `argmax(Impact / esfuerzo)` sobre las palancas de crecimiento **alcanzables desde el entorno**:

| Señal de crecimiento | Acción de alto impacto | ¿Alcanzable aquí? |
|---|---|---|
| Hueco país×década/tier **con demanda** (GSC cacheado o tema buscado) | `/proximo-caso` → **`/nuevo-caso`** (crea el caso) | **Sí** (Wikipedia + archive.org alcanzables para fuentes) |
| Caso de alto tráfico en el **piso** de prosa o desactualizado | **expandir con fuentes primarias** (patrón malmstrom) | **Sí** (Wikipedia alcanzable) |
| Leak de **SEO estructural** (un idioma/URL, metadata, rich results) | fix de crecimiento (código, lo verifica CI) | **Sí** (código, sin red) |
| Ángulo del corpus sin vista que mueva **tráfico** (no estética) | `/innovar` **solo si crece valor**, no pulido | Sí |
| Palanca que necesita **GSC/GA4 en vivo o build-perf** | escala/propón; no la fuerces a ciegas | **No** (declara) |

**Estimación de impacto — honestidad**: la deuda la miden sondas (objetivo); el impacto necesita analítica externa (GSC/GA4) que no alcanzas desde aquí. Usa la demanda **cacheada** + cobertura como proxy y **declara la incertidumbre** — no finjas precisión de tráfico que no tienes.

### 4 · ACT
Las palancas de impacto suelen ser **grandes** (un caso nuevo, un refactor SEO): **propón el plan y pide OK** antes de construir (nunca `/nuevo-caso` ni un refactor L+ en `--auto`). Con `--auto` solo corres diagnósticos read-only. Encadena el sub-skill del ATTACK cuando el usuario aprueba.

### 5 · VERIFY
Deuda: re-corre su sonda. Impacto: el criterio es distinto — un caso nuevo pasa `validate-schema` + estándar editorial E13 + fuentes reales verificadas (no inventadas); un fix SEO lo valida CI. Si el ATTACK fue destructivo, verificación reforzada.

### 6 · RATCHET con GATE
Si un fix abrió una clase enforzable, `/blindar` — el guardrail debe **pasar-en-sano Y atrapar-una-violación** o se descarta (`G_bad++`). Medio para proteger el impacto ganado, no fin.

### 7 · CAPTURE → `/learn` / `/retro`.

### 8 · CONVERGE
Termina **solo** cuando `err=0` **y** no queda ninguna palanca de impacto alcanzable sobre el umbral — raro (casi siempre hay un caso demandado que crear). Si oscila (arreglar A rompe B) → escala. Si una palanca antes bloqueada se desbloquea (red/build disponibles) → re-encóla.

---

## Invariantes
1. **Impacto-primero** — el presupuesto va a crear valor; la deuda es un gate, no el objetivo. *(La corrección de la v1.)*
2. **Cimiento duro** — `err=0` antes de construir; nunca sobre schema roto.
3. **Trinquete** — cada fix enforzable → guardrail (medio, no fin).
4. **Auto-verificante** — CALIBRATE sensores + VERIFY acciones contra ground truth; fuentes de un caso nuevo verificadas, no inventadas.
5. **Suelo honesto** — no golpea la deuda bloqueada por entorno; declara qué impacto necesita red/build que no tiene.

## Restricciones
- No commitees/pushees salvo que el usuario lo pida.
- Señales de deuda = node-plano sin red; las de impacto pueden usar red (Wikipedia/archive.org) para fuentes de contenido.
- Un disparo, una señal — de deuda **o de impacto**. Sin señal, no es un disparo.
