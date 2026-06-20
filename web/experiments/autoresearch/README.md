# AutoResearch · UAP Codex calibration

> ⚠️ **ARCHIVADO / OBSOLETO (jun 2026).** Este experimento operaba sobre el
> modelo de calibración **log-odds** (`lib/hypothesisMapping.ts`, campo
> `evidenceContribution`), reemplazado por el modelo **MECE** (`lib/meceModel.ts`,
> posterior por caso). Su sandbox (`lib/hypothesisMapping.ts`) ya no existe, así
> que `eval.mjs` **no corre**. Se conserva solo como registro histórico del
> enfoque anterior; no refleja el modelo vigente.

Mini-laboratorio AutoResearch sobre el modelo de calibración log-odds que
calcula los % efectivos de cada hipótesis en `/probabilidades`.

Inspirado en [karpathy/autoresearch](https://github.com/karpathy/autoresearch)
(mar 2026): un agente de coding modifica código fuente, mide vía evaluador
inmutable, y commitea solo si la métrica compuesta mejora.

## Lo que hay aquí

| Archivo | Inmutable | Quién lo toca | Rol |
|---|---|---|---|
| `program.md` | sí | Solo humano | Directrices y restricciones del experimento |
| `eval.mjs` | sí | Solo humano | Evaluador. Calcula score compuesto |
| `baseline.json` | sí (auto) | Generado por `eval.mjs --baseline` | Score del modelo en `main` al setup |
| `README.md` | — | Solo humano | Este archivo |

El **sandbox** que el agente puede modificar vive fuera de este directorio:
`web/lib/hypothesisMapping.ts` (sólo `STRENGTH_WEIGHT`, `PRESSURE_SHIFT_FACTOR`
y `PATTERN_TO_HYPOTHESIS`). Restricciones completas en `program.md`.

## Baseline actual

```json
{
  "score": 13,
  "components": {
    "auditErrors": 0,
    "auditWarns": 0,
    "bandJumps": 3,
    "coverageGaps": 2,
    "extremeDrift": 0
  }
}
```

13 es el número a batir. Cualquier iteración con `score < 13` y `auditErrors = 0`
es candidata a commit.

### De dónde viene el 13

- **bandJumps = 3** (peso 3 × 3 = 9 pts):
  - `programas-clasificados` prior 88 (very-likely) → effective ~96 (almost-certain)
  - `fenomenos-naturales` prior 70 (probable) → effective 43.5 (even-chance)
  - `entidades-no-humanas` prior 28 (unlikely) → effective 50.4 (even-chance)
- **coverageGaps = 2** (peso 2 × 2 = 4 pts):
  - `ontologico-no-materialista` con 1 contribution declarada
  - `tratado-greys` con 0 contributions
- **Subtotal**: 9 + 4 = **13**

Los band jumps de `fenomenos-naturales` y `entidades-no-humanas` son
**editorialmente esperados** (la prosa los discute) — el agente no debería
intentar "arreglarlos" mecánicamente moviendo weights. El band jump de
`programas-clasificados` también es esperado (el corpus tiene evidencia
institucional sólida que justifica el shift).

Los coverage gaps son **estructurales**: `ontologico-no-materialista` y
`tratado-greys` tienen poca evidencia documental por la naturaleza de las
hipótesis. Tampoco son fáciles de cerrar mecánicamente.

**Implicación**: el score 13 puede ser cerca del óptimo dado el estado
editorial actual. Una iteración exitosa probablemente requiere o (a)
ajustar weights para reducir un band jump específico que SÍ sea
sobreajuste, o (b) ampliar el sandbox para tocar también priors
(decisión humana, no del agente).

## Cómo correr una iteración

```bash
cd web

# 1. Score actual (debería coincidir con baseline.json al partir)
node experiments/autoresearch/eval.mjs > /tmp/before.json
jq .score /tmp/before.json

# 2. Modificar el sandbox (lib/hypothesisMapping.ts)
#    Cambiar STRENGTH_WEIGHT, PRESSURE_SHIFT_FACTOR o PATTERN_TO_HYPOTHESIS

# 3. Rebuild + medir
node scripts/build-cases.mjs
node experiments/autoresearch/eval.mjs > /tmp/after.json
jq .score /tmp/after.json

# 4. Comparar
diff <(jq .components /tmp/before.json) <(jq .components /tmp/after.json)

# 5a. Si auditErrors > 0 → revertir SIEMPRE
# 5b. Si score nuevo < score viejo → candidato a commit (review humano)
# 5c. Si score nuevo ≥ score viejo → revertir
git checkout lib/hypothesisMapping.ts  # rollback
```

## Cómo automatizar (futuro)

El loop manual es para humanos. Para automatizar como Karpathy:

```bash
# pseudocódigo
while true; do
  current_score=$(node experiments/autoresearch/eval.mjs | jq .score)
  claude_code <<< "Lee program.md. Lee baseline.json. Propón un cambio a STRENGTH_WEIGHT o PRESSURE_SHIFT_FACTOR en lib/hypothesisMapping.ts respetando todas las restricciones de program.md. Aplícalo."
  new_score=$(node experiments/autoresearch/eval.mjs | jq .score)
  new_errors=$(node experiments/autoresearch/eval.mjs | jq .components.auditErrors)
  if [[ $new_errors -gt 0 ]] || [[ $new_score -ge $current_score ]]; then
    git checkout lib/hypothesisMapping.ts
  else
    git commit -am "autoresearch: score $current_score → $new_score"
  fi
done
```

Esta sesión NO ejecutó iteraciones — solo dejó el harness. La métrica
inicial (13) sirve como punto de referencia para futuras corridas.

## Notas honestas

- **El score no es la verdad**: es una proxy. La calidad editorial real
  requiere review humano del PR final.
- **El modelo actual puede estar cerca del óptimo**: los band jumps reflejan
  evidencia documentada, no error. AutoResearch puede converger sin mejoras.
  Eso también es información útil.
- **El sandbox es estrecho a propósito**: no permitir al agente tocar
  priors (`lib/hypotheses.ts`) ni el corpus (`data/cases/*`) protege el
  juicio editorial humano.
- **Las restricciones de `program.md` son hard constraints**: el agente
  que las viole produce propuestas inválidas — el evaluador debería
  rechazarlas (futuro: añadir checks de restricciones a `eval.mjs`).
