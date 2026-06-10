# AutoResearch · Calibration loop · UAP Codex

Mini-laboratorio AutoResearch para iterar el modelo de calibración log-odds que
calcula los efectivos % de cada hipótesis en `/probabilidades`.

Inspirado en `karpathy/autoresearch` (mar 2026): un agente de coding modifica
código fuente, mide vía evaluador inmutable, y commitea solo si la métrica
mejora.

## Contrato de tres archivos

| Archivo | Quién lo toca | Rol |
|---|---|---|
| `program.md` | Solo humano | Directrices de research, restricciones, target editorial |
| `eval.mjs` | Inmutable | Calcula la métrica compuesta |
| `lib/hypothesisMapping.ts` | Solo el agente | Sandbox modificable |

El agente NUNCA toca `program.md` ni `eval.mjs`. Si necesita razonar sobre el
problema, lo hace en su contexto, no editando el contrato.

## Cuál es el sandbox

El agente solo modifica:

- `STRENGTH_WEIGHT` (línea ~147 de `lib/hypothesisMapping.ts`)
- `PRESSURE_SHIFT_FACTOR` (línea ~190)
- `PATTERN_TO_HYPOTHESIS` (líneas ~16-35)

El agente NUNCA modifica:

- `lib/hypotheses.ts` (priors editoriales humanos)
- `data/cases/*.json` (corpus)
- `lib/icd203.ts` (bandas ICD-203)
- Las funciones `effectiveCalibration`, `pressureFor`, `evidenceCountFor`
  (cambiar la fórmula matemática rompe el modelo)

## Métrica compuesta

Score total (menor = mejor):

```
score = audit_errors × 10
      + audit_warns × 1
      + band_jumps × 3
      + coverage_gaps × 2
      + extreme_drift × 1
```

Donde:

- `audit_errors`: errores del audit-consistency.mjs (fail-fast). Si > 0, la
  propuesta NO se commitea — algo se rompió.
- `audit_warns`: warnings del audit. Tolerables pero indeseados.
- `band_jumps`: número de hipótesis cuyo effective cruza una banda ICD-203
  diferente a la del prior. Cada jump invalida la prosa estática que asume
  una banda específica.
- `coverage_gaps`: hipótesis primitivas con menos de 3 evidenceContribution
  declaradas en el corpus. Una hipótesis sub-evidenciada es brittle.
- `extreme_drift`: número de hipótesis cuyo |effective − prior| > 35pp.
  Sospecha de sobre-ajuste del modelo: el corpus no debería empujar tan
  lejos del juicio editorial.

## Cómo correr el loop

```bash
# 1. Establecer baseline (una vez)
cd web
node experiments/autoresearch/eval.mjs --baseline > experiments/autoresearch/baseline.json

# 2. Loop manual (cada iteración)
node experiments/autoresearch/eval.mjs           # antes del cambio
# ... agente modifica lib/hypothesisMapping.ts ...
node experiments/autoresearch/eval.mjs           # después del cambio

# Si score nuevo < baseline → commit
# Si score nuevo ≥ baseline → git checkout lib/hypothesisMapping.ts
```

Para automatizar como en Karpathy/autoresearch, envolver el loop en un script
que invoque a Claude/Codex por API. Esta sesión solo deja el framework + una
demo manual.

## Restricciones editoriales (no negociables)

El agente debe respetar:

1. **Cota de Fréchet**: `entidades-no-humanas` ≥ max(interdimensional,
   ontologico-no-materialista, tratado-greys). Si el agente rompe esto,
   la propuesta es inválida.
2. **No subir tratado-greys por encima de 15%**: claim sin evidencia primaria,
   límite editorial.
3. **No subir misidentificacion o heterogeneidad**: son antecedent/derived con
   override fijo.
4. **No bajar programas-clasificados por debajo de 85%**: el corpus tiene
   evidencia institucional sólida (AAWSAP, Bolender, Twining); bajarlo sería
   contradecir la armadura editorial.

## Targets editoriales por hipótesis

Calibración deseada según la prosa actual de cada hipótesis:

| Hipótesis | Prior | Target band | Target % range |
|---|---|---|---|
| programas-clasificados | 88 | "very likely" → "almost certain" | 88–97 |
| fenomenos-naturales | 70 | "even chance" → "probable" | 40–65 |
| entidades-no-humanas | 28 | "even chance" | 41–54 |
| interdimensional | 22 | "unlikely" | 20–35 |
| ontologico-no-materialista | 22 | "unlikely" | 20–28 |
| tratado-greys | 6 | "almost no chance" | 1–10 |

Si una hipótesis sale de su target_range, eso es señal de que el experimento
está sobre-ajustando o sub-ajustando.

## Anti-patterns esperados del agente

El agente puede caer en:

1. **Saturación de weights**: subir todos los weights a la vez. La métrica lo
   detecta vía `extreme_drift`.
2. **Mapeo pattern→hypothesis caprichoso**: redirigir un pattern a otra
   hipótesis para mejorar el score. La métrica lo detecta vía band_jumps
   y coverage_gaps.
3. **Trade-off cosmético**: bajar una hipótesis a costa de otra sin razón
   editorial. La métrica no lo detecta directamente; depende del review
   humano del PR final.

## Qué hacer cuando AutoResearch converge

Si tras N iteraciones el score no baja, hay tres posibilidades:

1. **El modelo ya está cerca del óptimo** (eso también es información útil).
2. **La métrica no captura lo que importa**: revisar `eval.mjs` y agregar
   componentes editoriales nuevas.
3. **El sandbox es demasiado estrecho**: permitir al agente tocar más
   parámetros (ej: dejarlo modificar `UMBRELLA_SUBCLASSES`).

La decisión es humana, no del agente.
