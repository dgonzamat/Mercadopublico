# CLAUDE.md

Contexto y reglas operativas para futuras sesiones de Claude Code en este repositorio.

---

## Parte 1 — Karpathy guidelines

Reglas de comportamiento para reducir errores comunes de LLM al editar código. Sesgan hacia precaución sobre velocidad. Para tareas triviales, usa juicio.

Fuente: https://github.com/multica-ai/andrej-karpathy-skills

### 1. Think Before Coding

**No asumas. No escondas confusión. Surface tradeoffs.**

Antes de implementar:
- Declara tus supuestos explícitamente. Si no estás seguro, pregunta.
- Si hay múltiples interpretaciones, preséntalas — no elijas en silencio.
- Si existe un enfoque más simple, dilo. Empuja de vuelta cuando corresponda.
- Si algo no está claro, detente. Nombra qué te confunde. Pregunta.

### 2. Simplicity First

**Código mínimo que resuelve el problema. Nada especulativo.**

- Nada de features más allá de lo pedido.
- Nada de abstracciones para código de un solo uso.
- Nada de "flexibilidad" o "configurabilidad" no solicitada.
- Nada de error handling para escenarios imposibles.
- Si escribiste 200 líneas y pueden ser 50, reescribe.

Pregúntate: "¿Diría un senior que esto está sobrecomplicado?" Si sí, simplifica.

### 3. Surgical Changes

**Toca solo lo que debes. Limpia solo tu propio desorden.**

Editando código existente:
- No "mejores" código adyacente, comentarios o formato.
- No refactorices cosas que no están rotas.
- Mantén el estilo existente, aunque tú lo harías distinto.
- Si notas dead code no relacionado, menciónalo — no lo borres.

Cuando tus cambios crean huérfanos:
- Elimina imports/variables/funciones que TUS cambios dejaron sin uso.
- No elimines dead code preexistente sin pedirlo.

El test: cada línea cambiada debe trazar directo al request del usuario.

### 4. Goal-Driven Execution

**Define criterios de éxito. Loop hasta verificar.**

Transforma tareas en metas verificables:
- "Agregar validación" → "Escribe tests para inputs inválidos, hazlos pasar"
- "Arregla el bug" → "Escribe un test que lo reproduce, hazlo pasar"
- "Refactoriza X" → "Asegúrate que los tests pasan antes y después"

Para tareas multi-step, establece un plan corto:
```
1. [Paso] → verify: [check]
2. [Paso] → verify: [check]
3. [Paso] → verify: [check]
```

Criterios fuertes te permiten loop independiente. Criterios débiles ("hazlo funcionar") requieren clarificación constante.

---

## Parte 2 — Contexto del proyecto UAP Atlas

### Stack

- Next.js 14.2.35 App Router + TypeScript strict
- Tailwind CSS 3.4 (dark theme custom)
- `output: "export"` — SSG puro, deploy a GitHub Pages
- react-leaflet para `/atlas` (dynamic import, ssr: false)
- 1 client component: `components/MobileNav.tsx` (focus trap, Escape, body scroll lock)

### Estructura

```
app/                  # rutas App Router (server components por default)
  page.tsx            # home minimalista: title + IcdProbabilityChart + CTA
  cases/              # listado + detalle [slug]
  probabilidades/     # transparencia del juicio ICD-203
  atlas/              # Leaflet map (client)
  patterns/           # 18 patrones recurrentes
  researchers/        # ecosistema disclosure (5 secciones)
  frameworks/         # 11 frameworks teóricos comparados
  about/, resumen/    # metodología + 10-min summary
components/           # Badge, MobileNav, IcdProbabilityChart, CorpusStats, WorldMap...
lib/                  # data.ts, types.ts, ui.ts, icd203.ts, hypotheses.ts, hypothesisMapping.ts, corpusStats.ts
data/
  cases/              # SOURCE OF TRUTH: 52 archivos JSON, uno por caso
  cases.json          # GENERADO por scripts/build-cases.mjs — gitignored
  patterns.json
  frameworks.json
  researchers.json
scripts/
  build-cases.mjs     # agregador build-time: lee data/cases/*.json → escribe data/cases.json
```

### Workflow de datos para casos

**Source of truth = `data/cases/<id>.json`** (un archivo por caso).
`data/cases.json` es ARTEFACTO generado, no editar a mano, gitignored.

Para editar un caso:
1. Editar `data/cases/<id>.json` directamente
2. `npm run build` corre `prebuild` automáticamente → regenera `cases.json` agregado
3. Next bundlea `cases.json` como JSON module (importado por `lib/data.ts`)

Para agregar un caso nuevo:
1. Crear `data/cases/<new-id>.json` con schema `UAPCase` (ver `lib/types.ts`)
2. Asignar `num` único secuencial
3. Build regenera el agregado

Esta separación existe porque `cases.json` monolítico (~165KB) excede el budget de tokens del MCP `create_or_update_file`. Mantener archivos individuales evita re-encontrarse con ese límite.

### Schema UAPCase

Campos obligatorios: `id, num, name, year_start, country, country_name, flag, location, tier, probability, summary, summary_en, patterns, category`.

Campos opcionales de rich content (renderizados como secciones en `/cases/[slug]`):
- `whatHappened` — 2-3 párrafos, cronología + contexto. Separa párrafos con `\n\n`.
- `whyMatters` — 1 párrafo, significancia analítica
- `evidence` — array de strings, 3-5 ítems documentados
- `sources` — array de `{name, url?, note?}` para citas primarias

Si un caso no tiene rich content, la página de detalle muestra fallback "⏳ Caso pendiente de explicación detallada".

### Convenciones de UI

- Server components puros donde sea posible (zero JS shipped)
- Headers de section: `font-mono text-xs uppercase tracking-widest text-muted`
- Theme tokens en `tailwind.config.ts`: `bg`, `panel`, `border`, `text`, `muted`, `accent`, `tierS/A/B`
- Badges: usar `TIER_BADGE` static lookup (Tailwind JIT no compila clases dinámicas como `bg-${color}/10`)
- max-w container del detalle: `mx-auto max-w-3xl`

### Deploy

- Workflow `.github/workflows/deploy-pages.yml` corre en push a `main`
- Dual deploy: peaceiris (gh-pages branch) + actions/deploy-pages (artifact) — belt-and-suspenders por ambigüedad histórica del Pages source config
- URL pública: https://dgonzamat.github.io/Mercadopublico/
- `basePath` en `next.config.mjs`: `/Mercadopublico` (case-sensitive, no `/mercadopublico`)

### Branch protocol

- Develop en branches `claude/<topic>-<suffix>`
- PR → main como draft → ready → merge (squash)
- Cuando una branch tenga conflicto post-squash, crear branch nueva desde main en vez de rebase forzado

### Anti-patterns conocidos

- **No** importar `fs` desde `lib/data.ts` (lo importa `WorldMap.tsx` que es client component → webpack falla)
- **No** hardcodear el número total de casos (51 vs 52) — derivar de `cases.length`
- **No** usar `node:` scheme en imports de Next.js (`node:fs` falla; usar `fs`)
- **No** generar `cases.json` manualmente para commitear — siempre vía `npm run build` / `scripts/build-cases.mjs`
