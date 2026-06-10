# CLAUDE.md — UAP Codex

Contexto y reglas operativas específicas de este repositorio. Las reglas de comportamiento generales (Karpathy guidelines: think before coding, simplicity first, surgical changes, goal-driven execution) viven en `~/.claude/CLAUDE.md` global.

---

## Stack

- Next.js 14.2.35 App Router + TypeScript strict
- Tailwind CSS 3.4 (dark theme custom)
- `output: "export"` — SSG puro, deploy a GitHub Pages
- react-leaflet para `/atlas` (dynamic import, ssr: false)
- 1 client component: `components/MobileNav.tsx` (focus trap, Escape, body scroll lock)

## Estructura

Todo el código de la web vive en `web/`. Trabajar desde ahí, no desde la raíz.

```
web/
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
  lib/
    data.ts             # carga cases / patterns / frameworks / researchers
    types.ts            # UAPCase, Hypothesis, EvidenceContribution, etc.
    hypotheses.ts       # source-of-truth: 10 hipótesis con prior + prose
    hypothesisMapping.ts # log-odds Bayesian update + pressure
    icd203.ts           # bandas verbales DNI ICD-203
    sources.ts, ui.ts, jsonld.ts, siteStats.ts, corpusStats.ts, typography.tsx
  data/
    cases/              # SOURCE OF TRUTH: ~137 archivos JSON, uno por caso
    cases.json          # GENERADO por scripts/build-cases.mjs — gitignored
    posts/              # blog posts (mismo patrón que cases)
    patterns.json
    frameworks.json
    researchers.json    # 81 actores
  scripts/
    build-cases.mjs     # agrega data/cases/*.json → data/cases.json
    build-posts.mjs     # agrega data/posts/*.json → data/posts.json
    build-search-index.mjs
    audit-consistency.mjs # corre en prebuild; verifica % editoriales vs priors
    validate-schema.mjs   # corre en prebuild; valida schema de cases/researchers
```

## Workflow de datos para casos

**Source of truth = `web/data/cases/<id>.json`** (un archivo por caso).
`web/data/cases.json` es ARTEFACTO generado, no editar a mano, gitignored.

Para editar un caso:
1. Editar `web/data/cases/<id>.json` directamente.
2. `npm run build` corre `prebuild` automáticamente → regenera `cases.json` agregado.
3. Next bundlea `cases.json` como JSON module (importado por `lib/data.ts`).

Para agregar un caso nuevo:
1. Crear `web/data/cases/<new-id>.json` con schema `UAPCase` (ver `lib/types.ts`).
2. Asignar `num` único secuencial.
3. Build regenera el agregado.

Esta separación existe porque `cases.json` monolítico (~165KB) excede el budget de tokens del MCP `create_or_update_file`. Mantener archivos individuales evita re-encontrarse con ese límite.

## Schema UAPCase

Campos obligatorios: `id, num, name, year_start, country, country_name, flag, location, tier, probability, summary, summary_en, patterns, category`.

Campos opcionales de rich content (renderizados como secciones en `/cases/[slug]`):
- `whatHappened` — 2-3 párrafos, cronología + contexto. Separa párrafos con `\n\n`.
- `whyMatters` — 1 párrafo, significancia analítica.
- `evidence` — array de strings, 3-8 ítems documentados.
- `sources` — array de `{name, url?, note?}` para citas primarias.
- `evidenceContribution` — array de contribuciones a hipótesis: `{hypothesisId, direction, strength, rationale, rationaleEn}`. Recomendado para Tier S y A.

Si un caso no tiene rich content, la página de detalle muestra fallback "⏳ Caso pendiente de explicación detallada".

## Modelo de calibración

Las probabilidades del corpus se calculan en build-time con un Bayesian update en log-odds:

```
effective = sigmoid(logit(prior) + Σ direction × weight)
```

donde cada caso contribuye un shift en log-odds via `evidenceContribution`. Weights conservadores (`minimal: 0.005`, `modest: 0.02`, `substantial: 0.05`, `category-breaking: 0.15`) porque los casos del corpus están correlacionados (era cultural compartida, selection bias). Reemplaza un modelo lineal previo que saturaba al cap artificial.

Detalle completo en JSDoc de `lib/hypothesisMapping.ts` y `lib/hypotheses.ts`.

## Convenciones de UI

- Server components puros donde sea posible (zero JS shipped).
- Headers de section: `font-mono text-xs uppercase tracking-widest text-muted`.
- Theme tokens en `tailwind.config.ts`: `bg`, `panel`, `border`, `text`, `muted`, `accent`, `tierS/A/B`.
- Badges: usar `TIER_BADGE` static lookup (Tailwind JIT no compila clases dinámicas como `bg-${color}/10`).
- max-w container del detalle: `mx-auto max-w-3xl`.

## Deploy

- Workflow `.github/workflows/deploy-pages.yml` corre en push a `main`.
- Dual deploy: peaceiris (gh-pages branch) + actions/deploy-pages (artifact) — belt-and-suspenders por ambigüedad histórica del Pages source config.
- URL pública: https://uapcodex.org/ (custom domain) y https://dgonzamat.github.io/Mercadopublico/.
- `basePath` en CI: `${{ steps.pages.outputs.base_path }}` (auto-calculado por GitHub Pages desde el nombre del repo). Fallback local en `next.config.mjs`: `/Mercadopublico`.

## Branch protocol

- Develop en branches `claude/<topic>-<suffix>`.
- PR → main como draft → ready → merge (squash).
- Cuando una branch tenga conflicto post-squash, crear branch nueva desde main en vez de rebase forzado.

## Anti-patterns conocidos

- **No** importar `fs` desde `lib/data.ts` (lo importa `WorldMap.tsx` que es client component → webpack falla).
- **No** hardcodear el número total de casos — derivar de `cases.length` (vive en `lib/siteStats.ts` como `STATS.cases`).
- **No** usar `node:` scheme en imports de Next.js (`node:fs` falla; usar `fs`).
- **No** generar `cases.json` manualmente para commitear — siempre vía `npm run build` / `scripts/build-cases.mjs`.
- **No** emitir `Event` JSON-LD en casos (Google aplica el validador de eventos comerciales y exige `organizer`/`performer`/`offers`). Usar `Article` + `contentLocation: Place`.

## Deuda pendiente · fotos de actores

Estado (jun 2026): **20/81 actores tienen foto**; los 61 restantes usan el avatar de iniciales (fallback de `ResearcherAvatar`). No es un defecto de datos — el audit pasa 0/0 — sino cobertura incompleta.

Convención: el campo `photo` es `https://commons.wikimedia.org/wiki/Special:FilePath/<filename EXACTO>?width=400`. Los filenames son **impredecibles** (typos, números, IDs de Flickr, sufijos "official portrait"), así que **hay que copiarlos de Commons, no adivinarlos** — adivinar produce imágenes rotas (404), peor que el avatar.

Para completarlas hace falta resolver el filename exacto vía la API de Commons, que requiere `commons.wikimedia.org` en el allowlist de red del entorno (típicamente bloqueado). Con ese dominio habilitado, una sesión puede consultar la API, sacar los 61 filenames y poblar el lote verificado (`scripts/fetch-researcher-photos.sh` es el punto de partida). La foto la renderiza el navegador del usuario, no el build.
