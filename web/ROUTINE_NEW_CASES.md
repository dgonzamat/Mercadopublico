# Rutina diaria — descubrimiento e incorporación de casos UAP

Playbook para la **rutina agéntica de cowork** que corre a diario sobre este
repositorio. Define qué hacer, con qué disciplina, y — crítico — qué **NO**
hacer. La rutina descubre candidatos, abre un PR y lo mergea automáticamente
si CI pasa.

---

## Política de seguridad

1. **Nunca** hacer push directo a `main`. Siempre via PR.
2. **Auto-merge habilitado**: si CI verde (build-cases + auditoría + next build),
   mergear automáticamente via squash. Habilitar auto-merge en el PR al crearlo.
3. Si CI falla, corregir en la misma rama **antes** de que el auto-merge se active.
4. Si no hay candidatos que cumplan el umbral de calidad, **no abrir PR** —
   terminar la rutina en silencio. Cero ruido es preferible a casos débiles.
5. Un PR por día como máximo, agrupando los candidatos encontrados.

## Flujo

```
1. Descubrir candidatos (fuentes abajo)
2. Para cada candidato: ¿ya existe en data/cases/? → descartar duplicado
3. ¿Cumple el umbral de inclusión? → si no, descartar
4. Redactar data/cases/<id>.json con el schema completo + calibración
5. Asignar `num` único secuencial (max(num actual) + 1, +2, …)
6. Abrir UN PR (squash merge) con todos los candidatos del día
7. Habilitar auto-merge en el PR via GitHub API (squash)
8. CI (ci.yml) corre build-cases → auditoría → next build en el PR
9. Si CI verde → auto-merge se activa automáticamente
10. Si CI falla → corregir en la misma rama (auto-merge no se activa hasta que CI pase)
```

## Umbral de inclusión

Un candidato entra al corpus solo si es **institucional y documentado**:

- Respaldo de gobierno, militar, agencia, o investigación académica/periodística seria.
- Al menos una **fuente primaria verificable** (FOIA, archivo oficial, paper, cobertura de prensa establecida).
- NO rumores de redes sociales, NO contactees sin corroboración, NO refritos de casos ya presentes.

Si la calidad de fuentes no alcanza, **se descarta** — el valor del corpus es el filtro, no el volumen.

## Schema obligatorio (ver `lib/types.ts`)

Campos requeridos: `id, num, name, year_start, country, country_name, flag,
location {lat,lng,place}, tier, probability, summary, summary_en, patterns,
category`.

Rich content esperado: `whatHappened`(+`_en`), `whyMatters`(+`_en`),
`evidence`(+`_en`), `sources` (con `url` o `note`).

**JSON válido RFC 8259**: los saltos de párrafo van como `\n\n` escapados,
nunca como saltos de línea crudos (rompen `build-cases.mjs` — ver el bug de
aguadilla/bolender).

## Calibración (disciplina ICD-203)

- `tier`: S (institucional + sensor), A (institucional/multi-testigo), B (folklórico/recurrente).
- `evidenceContribution[]`: por cada hipótesis afectada, declarar
  `hypothesisId` (debe existir en `lib/hypotheses.ts`), `direction`
  (`supports`/`weakens`), `strength` (`minimal`/`modest`/`substantial`/`category-breaking`)
  y un `rationale`(+`En`) que justifique el peso. La calibración pesa **lo que
  los testigos/documentos describen**, no la interpretación del investigador.
- Vocabulario: usar "entidades no humanas" (no "algo no humano"),
  "ontológico no materialista" (no "psicoespiritual"), "tratado formal"
  (no "tratado encubierto"). La auditoría (E4) rechaza los términos viejos.
- Al citar % en cualquier texto, taggear con "prior" o "effective"
  (COPY NUMERIC DISCIPLINE — ver JSDoc de `lib/hypotheses.ts`).

## Fuentes sugeridas de descubrimiento

> Definir/ajustar según disponibilidad. La rutina debe priorizar releases
> oficiales sobre cobertura secundaria.

- Publicaciones AARO / DoD / war.gov UFO releases (skill `uap-release-analyzer`).
- Desclasificaciones NARA / FBI Vault.
- Audiencias del Congreso y testimonios oficiales nuevos.
- Cobertura de prensa establecida que cite documentos primarios.

## Verificación antes de activar auto-merge

- [ ] PR apunta a `main`, auto-merge habilitado (squash).
- [ ] CI verde: build-cases + auditoría (0 ERRORS) + next build.
- [ ] Cada caso nuevo tiene fuentes primarias y `evidenceContribution` calibrado.
- [ ] `num` únicos, sin colisión con casos existentes.
- [ ] Descripción del PR resume cada caso y por qué supera el umbral.
