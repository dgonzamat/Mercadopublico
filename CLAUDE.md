# CLAUDE.md — UAP Codex

Contexto y reglas operativas específicas de este repositorio. Las reglas de comportamiento generales (Karpathy guidelines: think before coding, simplicity first, surgical changes, goal-driven execution) viven en `~/.claude/CLAUDE.md` global.

## Estilo de comunicación

- Hablar con el usuario en **español neutro**, no rioplatense/argentino (preferencia explícita del usuario). Evitar voseo y modismos: nada de «vos/tenés/dale/acá/che» — usar «tú/tienes/de acuerdo/aquí». Aplica solo a la conversación; el contenido editorial del corpus mantiene su propia línea.

---

## Protocolo de aprendizaje (self-learning)

Este archivo es **memoria viva**, no documentación estática. La regla de compounding engineering de Boris Cherny: *cuando Claude se equivoca o descubre una convención frágil del repo, esa lección se escribe de vuelta aquí para no repetirla*. El corpus de reglas se afina "ruthlessly" hasta que baja la tasa de error.

**Cuándo capturar una lección** (dispara el loop):
- El usuario corrige algo que Claude hizo mal.
- Una convención/gotcha del codebase costó descubrirla (webpack falla, JIT no compila, allowlist bloquea, invariante de audit se rompió).
- Una investigación cara produjo un resultado que no debe repetirse (ej. el *Registro de búsqueda* de fotos de actores).

**Dónde va cada lección** (no crear secciones nuevas si encaja en una existente):
- Gotcha técnico reproducible → **`## Anti-patterns conocidos`**, una línea `**No** … (porque …)`.
- Regla de dominio (schema, MECE, línea editorial) → la sección temática correspondiente.
- Resultado de investigación que no re-hacer → un bloque tipo *Registro (NO re-buscar)* con fecha.

**Formato de una lección**: una línea, imperativa, con el *porqué* entre paréntesis. La causa importa más que la regla — sin ella la regla se borra en la próxima limpieza. Fechar los registros de investigación (`(mmm aaaa)`).

**Mantención**: consolidar duplicados, borrar reglas obsoletas, afilar el lenguaje. Menos reglas y más nítidas > muchas y difusas.

Tres slash commands automatizan el loop (todos en `.claude/commands/`):
- **`/learn`** — captura *una* corrección en el momento: la destila en una lección con el formato correcto y la inserta en la sección adecuada.
- **`/retro`** — cosechador de cierre: mina la *sesión entera* (conversación + diff) en busca de lecciones que no se capturaron en caliente y las propone en lote.
- **`/curar-memoria`** — mantención: audita las cifras/afirmaciones de este archivo contra el repo vivo (sondas auto-verificables) y marca reglas duplicadas/obsoletas/contradictorias.

La pieza **proactiva** (fuera del loop reactivo) es **`/innovar`** — corre las auditorías del repo y propone un backlog de mejoras/innovaciones priorizado por leverage, cada una anclada en una señal concreta. Ver `.claude/commands/innovar.md`.

Dos innovaciones más, una por capa: **`/blindar`** (reactiva) promueve un anti-pattern documentado a un **guardrail automático** — detecta cuáles se pueden enforcar mecánicamente y crea la sonda en `audit-consistency.mjs`/`validate-schema.mjs` o un hook, cerrando la brecha entre "documentado" y "imposible". **`/proximo-caso`** (operación) lee los huecos de cobertura (país×década, tier) + el backlog de `/innovar` y elige el próximo caso a crear, encadenando con `/nuevo-caso`.

**Hook de validación de schema** (`.claude/hooks/validate-schema-on-edit.sh`, registrado como `PostToolUse` en `.claude/settings.json`): al editar un `data/cases/*.json` o `data/researchers.json`, corre `validate-schema.mjs` en el acto y **bloquea** (exit 2) si el schema se rompe. Adelanta al momento del edit el mismo gate que antes solo corría en prebuild/CI — un `posterior` MECE que no suma 1, un `id`/`num` duplicado, un JSON roto o una foto sin licencia se ven al instante.

---

## Stack

- Next.js 14.2.35 App Router + TypeScript strict
- Tailwind CSS 3.4 (theme claro editorial custom: fondo crema `#f7f2e8`, tinta `#1a1a1a`, acento `#c41e3a` — tokens en `tailwind.config.ts`)
- `output: "export"` — SSG puro, deploy a GitHub Pages
- react-leaflet para `/atlas` (dynamic import, ssr: false)
- Client components: ~39 con `"use client"` (techo 45, vigilado por `audit-consistency.mjs`); la mayoría vive en `components/` y `components/explorer/` (laboratorio de visualización). Los interactivos clave: `components/MobileNav.tsx` (focus trap, Escape, body scroll lock) y `components/MeceDonut.tsx` (donut interactivo de /probabilidades y de la home vía `HypothesesSnapshot`, con prop `tone` light/dark; hover/tap sincroniza segmento↔leyenda + tooltip; SSR deja el donut completo, la interactividad es progresiva).

## Estructura

Todo el código de la web vive en `web/`. Trabajar desde ahí, no desde la raíz.

```
web/
  app/                  # rutas App Router (server components por default)
    page.tsx            # home: HeroRadar + stats (CountUp) + TimelineByYear + HypothesesSnapshot + CTA
    cases/              # listado + detalle [slug]
    probabilidades/     # transparencia del juicio ICD-203
    atlas/              # Leaflet map (client)
    patterns/           # 19 patrones recurrentes
    researchers/        # ecosistema disclosure (5 secciones)
    frameworks/         # 11 frameworks teóricos comparados
    about/, resumen/    # metodología + 10-min summary
  components/           # Badge, MobileNav, MeceChart, CorpusStats, WorldMap...
  lib/
    data.ts             # carga cases / patterns / frameworks / researchers
    types.ts            # UAPCase, Posterior (MECE), MeceClassId, etc.
    meceModel.ts        # modelo MECE: posterior por caso + agregación comparable
    sources.ts, ui.ts, jsonld.ts, siteStats.ts, corpusStats.ts, typography.tsx
  data/
    cases/              # SOURCE OF TRUTH: un archivo JSON por caso (~318 a jul 2026; cifra viva = STATS.cases)
    cases.json          # GENERADO por scripts/build-cases.mjs — gitignored
    posts/              # blog posts (mismo patrón que cases)
    patterns.json
    frameworks.json
    researchers.json    # 91 actores
  scripts/
    build-cases.mjs     # agrega data/cases/*.json → data/cases.json
    build-posts.mjs     # agrega data/posts/*.json → data/posts.json
    build-rss.mjs       # genera el RSS feed (corre en prebuild)
    build-search-index.mjs
    audit-consistency.mjs # corre en prebuild; verifica % editoriales vs priors
    audit-design.mjs      # corre en prebuild; contraste WCAG AA + drift de color de tier + touch targets
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
- `whatHappened` — cronología + contexto. Separa párrafos con `\n\n`.
- `whyMatters` — significancia analítica.
- `evidence` — array de strings, 3-8 ítems documentados.
- `sources` — array de `{name, url?, note?}` para citas primarias.

### Línea editorial · longitud de la descripción (jun 2026)

**Estándar: la descripción narrativa de cada caso —`whatHappened` + `whyMatters`— debe alcanzar al menos ~1 página A4 (~550 palabras / ~3.500 caracteres), en español e inglés.** `evidence` y `sources` aportan pero NO cuentan para la página: el estándar mide prosa, no listas — un caso con narrativa corta y listas largas sigue por debajo del estándar.

Esto extiende la regla anterior ("2-3 párrafos") porque el corpus dejó casos demasiado telegráficos para su tier. El auditor `audit-consistency.mjs` (regla **E13**, corre en prebuild) reporta cuántos casos siguen bajo el umbral, con backlog por tier — es **WARN agregado, no ERROR**: el build no se rompe, pero el progreso queda medible. La expansión se hace **con investigación caso por caso** (fuentes primarias, no relleno), priorizando **Tier S → A → B**. Cualquier caso nuevo debe nacer cumpliendo el estándar.
- `posterior` — distribución MECE sobre 6 narrativas que suma 1: `{mundano_natural, humana_clasificada, adversaria, nohumano_encubierto, nohumano_abierto, indet}`. OBLIGATORIO en casos no-documento (invariante M1 del audit `audit-consistency.mjs`). Ver `lib/meceModel.ts`.

Si un caso no tiene rich content, la página de detalle muestra fallback "⏳ Caso pendiente de explicación detallada".

## Modelo de probabilidad (MECE)

Las probabilidades son **comparables**: cada caso de incidente reparte el 100% sobre 6 narrativas **mutuamente excluyentes y exhaustivas** (campo `posterior`, suma 1). El corpus las agrega en el nº esperado de casos por narrativa —`Eⱼ = Σᵢ P(narrativaⱼ | casoᵢ)`—, que reparte el 100% y es comparable entre narrativas; al ser una esperanza (lineal) es válido aunque los casos estén correlacionados.

Cada narrativa bundlea **objeto + postura institucional**, de modo que combinaciones como «no-humano + ocultación estatal» son una clase propia: `mundano_natural` (misidentificación + fenómenos naturales), `humana_clasificada` (programa propio/aliado, encubrimiento intrínseco), `adversaria` (tecnología de otro Estado), `nohumano_encubierto` (no-humano que un Estado conoce/controla/oculta — incluye ingeniería inversa y narrativa de tratado), `nohumano_abierto` (no-humano que nadie controla — tipo Vallée / interdimensional / ontológico), `indet`. Las hipótesis del marco anterior se conservan como mapeo dentro de cada narrativa (`legacyHypothesis` en `MECE_CLASSES`). Dos vistas **derivadas**: `entidades-no-humanas` = `nohumano_encubierto` + `nohumano_abierto`; `heterogeneidad` = 1 − `mundano_natural`.

Son juicios analíticos estructurados, NO frecuencias calibradas: comparabilidad ≠ verdad. Los casos-documento se excluyen (la partición «qué era el objeto» no aplica). Detalle en JSDoc de `lib/meceModel.ts`. El invariante (suma=1, 6 claves, no en documentos) se valida en `audit-consistency.mjs` (regla M1) y `validate-schema.mjs`.

## Convenciones de UI

- Server components puros donde sea posible (zero JS shipped).
- Headers de section: `font-mono text-xs uppercase tracking-widest text-muted`.
- Theme tokens en `tailwind.config.ts`: `bg`, `panel`, `border`, `text`, `muted`, `accent`, `tierS/A/B`.
- Badges: usar el static lookup `TIER_META` de `lib/ui.ts` (Tailwind JIT no compila clases dinámicas como `bg-${color}/10`).
- max-w container del detalle: `mx-auto max-w-3xl`.

## Deploy

- Workflow `.github/workflows/deploy-pages.yml` corre en push a `main`.
- Dual deploy: peaceiris (gh-pages branch) + actions/deploy-pages (artifact) — belt-and-suspenders por ambigüedad histórica del Pages source config.
- URL pública: https://uapcodex.org/ (custom domain) y https://dgonzamat.github.io/Mercadopublico/.
- `basePath` en CI: `${{ steps.pages.outputs.base_path }}` (auto-calculado por GitHub Pages desde el nombre del repo). Fallback local en `next.config.mjs`: `/Mercadopublico`.
- **Para verificar qué se desplegó**, lee el artefacto construido desde la branch `gh-pages` vía GitHub MCP (`get_file_contents`, ref `gh-pages`) — el saliente a la URL viva (`uapcodex.org`/`github.io`) y a Google lo bloquea la allowlist del proxy (403 a CONNECT; `curl` da 000, `WebFetch` 403, Playwright no llega), pero `raw.githubusercontent.com` y la API de GitHub sí. Los chunks del `initial load` salen de los `<script>` de `index.html` en `gh-pages`. (jul 2026)
- **GA4 está consent-gated** (`components/CookieConsent.tsx`, ID `G-MZHZC5ZLY5`): `gtag.js` no carga hasta que el visitante toca «Aceptar», así que el HTML estático nunca dispara el hit y GA marca "No data received" hasta que alguien acepta — verificar con **Realtime en incógnito** (el Home de GA tarda 24–48 h), no asumir que falta el tag. (jul 2026)

## Branch protocol

- Develop en branches `claude/<topic>-<suffix>`.
- PR → main como draft → ready → merge (squash).
- Cuando una branch tenga conflicto post-squash, crear branch nueva desde main en vez de rebase forzado.
- Commitear con `git config user.email noreply@anthropic.com` / `user.name Claude` para que el commit quede **verificado** — si no, el Stop hook lo marca "Unverified".
- Tras mergear un PR, si reinicias la branch con `git checkout -B <branch> origin/main`, el Stop hook marcará el **commit de squash-merge de GitHub** como Unverified — es **falso positivo** (lo firmó GitHub, ya está en `main`): **no** lo amendes (reescribiría historia mergeada).

## Anti-patterns conocidos

- **No** importar `fs` desde `lib/data.ts` (lo importa `WorldMap.tsx` que es client component → webpack falla). *(enforzado: `audit-consistency.mjs` E18a)*
- **No** importar el corpus completo (`cases`/`patterns`/… desde `lib/data`) en un módulo alcanzable desde un componente cliente —directa o transitivamente—, aunque solo expongas agregados (porque webpack lo embute en el chunk cliente: `MobileNav` del layout global importaba `lib/siteStats`, que derivaba `STATS` del corpus, embutiendo los ~4 MB de `cases.json` en CADA página — el LCP killer real, 5,23→0,92 MB de JS al arreglarlo, jul 2026). Precalcula los agregados a un JSON diminuto en build (`data/site-stats.json` vía `build-cases.mjs`) e impórtalo en su lugar. Al diagnosticar bundle bloat, traza el grafo de módulos desde los `"use client"` — no adivines el componente (los de `/atlas` y `/laboratorio` eran inocentes; el culpable estaba en el layout).
- **No** hardcodear el número total de casos — derivar de `cases.length` (vive en `lib/siteStats.ts` como `STATS.cases`). Esto incluye la **prosa y comentarios de este mismo CLAUDE.md**: toda cifra del corpus citada a mano driftea (el `~304` de la sección Estructura ya era 316 en jul 2026) — al citarla, márcala aproximada + fechada, o remite a `STATS.cases`.
- **No** usar `node:` scheme en imports de Next.js (`node:fs` falla; usar `fs`). *(enforzado: `audit-consistency.mjs` E18b — scripts/ exentos)*
- **No** generar `cases.json` manualmente para commitear — siempre vía `node scripts/build-cases.mjs` (o `npm run build` cuando hay `node_modules`; ver la regla de abajo).
- **No** asumir `node_modules` instalado (las sesiones remotas / CI fresco parten sin él) — para regenerar o validar el corpus corre los scripts node directos desde `web/` (`node scripts/build-cases.mjs`, `validate-schema.mjs`, `audit-consistency.mjs`; todos sin dependencias), no `npm run build`/`next build` (que sí requieren `next`).
- **No** dejar archivos de prueba temporales en `data/cases/` — `validate-schema.mjs`, `build-cases.mjs` y el conteo `cases:` los recogen por `readdirSync`, así que inflan el número y pueden romper el build (un `_test.json` hizo reportar 317 en vez de 316); bórralos antes de confiar en el conteo.
- **No** emitir `Event` JSON-LD en casos (Google aplica el validador de eventos comerciales y exige `organizer`/`performer`/`offers`). Usar `Article` + `contentLocation: Place`. *(enforzado: `audit-consistency.mjs` E18c)*
- **No** proponer (ni empezar a construir) una vista/feature nueva en `/innovar` sin antes listar `app/*/page.tsx` + grepear `lib/` — las auditorías numéricas (`audit-consistency`/`audit-design`) miden salud, no revelan qué ya está construido; casi se duplicó `/cobertura` (matriz país×década) reimplementando `lib/regions.ts` desde cero (jul 2026).

## Deuda pendiente · fotos de actores

Estado (jul 2026): **28/91 actores tienen foto**. El techo real NO son los 63 restantes — es la **licencia**: la mayoría de las figuras UAP no tienen foto libre en Commons (sus imágenes son material de prensa con copyright). Cobertura máxima realista estimada en el análisis de jun 2026 (hecho sobre 81 actores; el corpus creció luego a 91): ~30-35.

Convención: el campo `photo` es `https://commons.wikimedia.org/wiki/Special:FilePath/<filename EXACTO>?width=400`. Los filenames son **impredecibles**, así que **hay que verificarlos, no adivinarlos** — adivinar produce imágenes rotas (404), peor que el avatar.

**Ruta de resolución que funciona** (descubierta jun 2026): la API de Commons y Wikipedia siguen bloqueadas por allowlist (`Host not in allowlist` / 403), pero **WebSearch con `site:commons.wikimedia.org` sí funciona** como resolución indirecta. Protocolo: (1) búsqueda de descubrimiento por persona, (2) búsqueda de verificación con el filename exacto entre comillas, (3) solo commitear filenames corroborados por links literales `File:...` o metadata consistente entre búsquedas independientes.

**Registro de búsqueda (jun 2026, ampliado jul 2026) — NO re-buscar**:
- ✅ Verificados y aplicados (jun 2026): reid (`Harry Reid official portrait 2009.jpg`), gillibrand (`Kirsten Gillibrand, official portrait, 112th Congress.jpg`).
- ✅ Verificados y aplicados (jul 2026): hellyer (`Paul Hellyer portrait (3x4).jpg`), kono (`Tarō Kōno 20190912.jpg`), rebelo (`Aldo Rebelo (16654292721) (cropped).jpg`, CC-BY 2.0 Agência Senado/Marcos Oliveira — metadata completa verificada), west (`Mick West CSICon 2018 Debunking 9-11 Microsphere Myths.jpg`), nickell (`Joe Nickell CSICon 2018 (cropped).jpg`), pope (`Nick Pope (journalist).png`), james-fox (`James C. Fox.jpg`). Nota: los filenames están doble-corroborados por links literales `File:...`; las licencias de west/nickell/pope/james-fox son best-effort ("CC-BY-SA", patrón de la casa para fotos de conferencia) porque los snippets de búsqueda no exponen el template de licencia — el detalle exacto es verificable en la página Commons de cada archivo.
- ❌ Confirmados SIN foto libre en Commons (jun 2026): Mack, McDonald, Sturrock, Sheehan, Salas, Nell, Gallaudet, Fravor, Graves. Puthoff tiene categoría pero sin retrato (solo una foto de equipo de laboratorio).
- ❌ Confirmados SIN retrato libre (jul 2026): Nolan (solo un video webm), Kean, Pasulka, Blumenthal, Villarroel, Velasco, De Brouwer, Knuth, Maccabee, Corbell (solo video ogv), Clarke, Randles, Rutkowski, Dietrich, Stratton, Gevaerd, Hourcade, Ballester Olmos. Ziegel tiene categoría (`Feliks Zigel'`) pero el filename del retrato no se resolvió vía búsqueda.
- ❓ Categoría existe pero el filename del retrato no se resolvió vía search index: Ruppelt, Keyhoe (hay `Donald Keyhoe on Mike Wallace.gif`, pero es GIF animado de TV — mal avatar), Poher (categoría sin retrato encontrable), Ziegel (su categoría tiene 1 archivo, probablemente `Zig close.JPG` CC-BY-SA 3.0, pero no se pudo confirmar si retrata a la persona o a su tumba — NO commitear sin confirmar). Candidatos si se habilita el allowlist algún día. (jul 2026: también se probaron `api.wikimedia.org`, Wikidata `Special:EntityData`, toolforge y DBpedia — todos 403; WebFetch a `*.wikimedia.org`/dbpedia también 403, aparentemente bloquean el fetcher.)
- ❌ Barrido final (jul 2026) — confirmados SIN retrato libre, cola agotada: Davis, Haines, Callahan, Hastings, Ramirez (solo video webm), Day, Barber, Farah, McConnell, Wang Sichao, Hind, Zeidman, Schuessler, Powell, Chalker, Strand, Choy, Santa María, Chamorro, Lianza, Bermúdez, Bravo, Fuenzalida, Agostinelli, Banchs, Franz, Janosch, Salazar, Puerta, Petit, Sánchez. **No queda nadie sin buscar**: 28/91 es el techo alcanzable vía Commons a jul 2026; solo crecerá si se suben fotos libres nuevas o se habilita el allowlist para resolver los ❓.
