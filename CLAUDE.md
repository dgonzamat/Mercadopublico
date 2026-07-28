# CLAUDE.md — UAP Codex

Contexto y reglas operativas específicas de este repositorio. Las reglas de comportamiento generales (Karpathy guidelines) se versionan más abajo en este mismo archivo para que apliquen también en sesiones remotas/CI, donde el `~/.claude/CLAUDE.md` global no viaja al contenedor.

## Karpathy guidelines (reglas de comportamiento generales)

Principios de trabajo por defecto. Aplican a toda tarea, no solo a este repo.

- **Think before coding** — entender el problema, el contexto y la intención real antes de tocar archivos. Leer el código vecino, mapear el grafo de dependencias cuando importa, y confirmar el objetivo si es ambiguo. La mayoría de los errores caros nacen de codear sobre una suposición no verificada.
- **Simplicity first** — la solución más simple que resuelve el problema gana. Nada de abstracciones especulativas, capas «por si acaso» ni sobre-ingeniería. Menos código y más nítido > mucho y difuso (mismo espíritu que la mantención de esta memoria).
- **Surgical changes** — tocar el mínimo necesario. No refactorizar de paso, no reformatear lo que no cambia, no renombrar por gusto. El diff debe leerse como el cambio pedido y nada más; escribir código que calce con el estilo, la densidad de comentarios y el idioma del código que lo rodea.
- **Goal-driven execution** — cuando hay lo suficiente para actuar, actuar. No re-derivar hechos ya establecidos, no re-litigar decisiones ya tomadas, no narrar opciones que no se van a seguir. Dar una recomendación, no un catálogo. Reportar el resultado con honestidad: si algo falló o se saltó, decirlo con la evidencia.

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
- Resultado de investigación que no re-hacer → **[`docs/registros.md`](docs/registros.md)**, un bloque *Registro (NO re-buscar)* fechado. Va **ahí, no aquí**: son bitácoras, no reglas — ahogaban los anti-patterns operativos compitiendo por la misma atención (7 bloques de 1200–1500 chars, extraídos jul 2026). En `CLAUDE.md` queda solo el puntero de una línea, en la sección temática que lo necesita.

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

- Next.js 16.2.9 App Router + TypeScript strict (React 18.3.1)
- Tailwind CSS 3.4 (theme claro editorial custom: fondo crema `#f7f2e8`, tinta `#1a1a1a`, acento `#c41e3a` — tokens en `tailwind.config.ts`)
- `output: "export"` — SSG puro, deploy a GitHub Pages
- react-leaflet para `/atlas` (dynamic import, ssr: false)
- Client components: ~43 con `"use client"` (jul 2026; techo 45, cifra viva = la que reporta `audit-consistency.mjs`); la mayoría vive en `components/` y `components/explorer/` (laboratorio de visualización). Los interactivos clave: `components/MobileNav.tsx` (focus trap, Escape, body scroll lock) y `components/MeceDonut.tsx` (donut interactivo de /probabilidades y de la home vía `HypothesesSnapshot`, con prop `tone` light/dark; hover/tap sincroniza segmento↔leyenda + tooltip; SSR deja el donut completo, la interactividad es progresiva).

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
    cases/              # SOURCE OF TRUTH: un archivo JSON por caso (~330 a jul 2026; cifra viva = STATS.cases)
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
    qa-screenshots.mjs    # sonda de QA VISUAL (on-demand: npm run qa:shots) — renderiza pixeles
    audit-skills.mjs      # contrato de los skills del loop (corre en CI, no en prebuild)
    lib/cerebro-contract.mjs  # parser único de cerebro.md — lo comparten la sonda y el panel
tools/
  cerebro-panel/          # panel de control del cerebro (fuera de web/, NO se despliega)
```

### Panel de control del cerebro (`tools/cerebro-panel`)

`node tools/cerebro-panel/server.mjs` → `http://127.0.0.1:4180`. UI **externa al sitio** (vive fuera de `web/`, no entra en el `output: export`) para **ver moverse** la orquestación, **gatillar** sus modos y **mandar a corregir** lo que las sondas encuentran. Node plano, cero dependencias.

El centro es un **flowchart de cuatro bandas** (gate común → cadena del modo → cierre obligatorio → rastro) cuyos nodos se encienden conforme la corrida avanza. El movimiento sale de `--output-format stream-json`: cada `tool_use` se parsea y se matchea contra los nodos. **El criterio de encendido debe ser estrecho** —nombre de herramienta, forma citada (`{"skill":"simplify"}`) o con barra (`/blindar`)—, nunca `\bpalabra\b`: con el criterio ancho un `git log` encendía el nodo **LOG** y el diagrama afirmaba un cierre que no había ocurrido (jul 2026). Por eso la banda **rastro** no se enciende con eventos, sino comparando el log antes/después de la corrida — se ilumina con el hecho comprobado, no con la intención. La banda de la cadena se deriva de la tabla de modos de `cerebro.md`, así que el diagrama no puede prometer un paso que el skill no declara.

Es un **servidor y no una página** porque disparar un trigger es `spawn('claude', ['-p', '/cerebro <modo>'])`, y eso necesita un proceso: una página estática —o un artifact— puede mostrar el log, pero no puede correr nada ni leer el repo. Corre en la máquina del dueño, junto al CLI.

Tres cosas que NO reimplementa, y que son la razón de que exista `lib/cerebro-contract.mjs`: los **modos** salen del mismo parser que consume `audit-skills.mjs` (un segundo parser sería un segundo contrato — el panel ofrecería modos que la sonda no conoce); la **salud** sale de las cuatro sondas ejecutadas como subprocesos; y el panel **reconcilia** lo que logró extraer contra el `ERRORS: n  WARNS: n` que cada sonda declara, mostrando el desajuste en vez de callarlo. Esa última defensa nació de un falso verde propio: el parser inicial solo entendía el formato inline (`🔴 [X7] …`) y reportó «0 warns» sobre un `audit-consistency` que declaraba `WARNS: 1`, porque ahí el emoji va en la **cabecera** y los hallazgos en las líneas indentadas debajo. *(enforzado: `audit-skills.mjs` **X9**, ERROR si el panel deja de importar el contrato compartido o se escribe su propio regex de secciones.)*

**Seguridad**: escucha solo en `127.0.0.1` (ejecuta `claude` con permisos de edición sobre el repo — exponerlo es dar una shell), `spawn` sin shell, y el modo se valida contra la lista derivada de `cerebro.md`. Los disparos usan `--permission-mode acceptEdits` por defecto —el panel existe para que el cerebro arregle, y `manual` colgaría cada corrida esperando una confirmación que nadie va a dar—; `CEREBRO_PANEL_PERMISSION_MODE=plan` para que solo planifique. El modo vigente se muestra en la cabecera siempre.

### Sonda de QA visual (`qa-screenshots.mjs` · `npm run qa:shots`)

Las tres sondas de prebuild (`audit-consistency`, `audit-design`, `validate-schema`) son **node-plain sin `node_modules`** y revisan datos/schema/tokens, pero **nunca renderizan un pixel**. Esta sonda cierra esa brecha: construye no, pero **fotografía el sitio ya construido** (`out/`) con Chromium headless vía CDP, para revisión visual o para acompañar un PR de UI/UX. Por eso es **on-demand, no un gate del prebuild**: requiere `out/` (`npm run build` antes) + Chromium (`PLAYWRIGHT_BROWSERS_PATH`, ya en el entorno), que las node-plain deliberadamente evitan. Salida a `web/qa-shots/` (gitignored). Manifiesto de vistas extensible dentro del script; foco por `phrase`/`selector` o página completa; ad-hoc con `--route`/`--phrase`. **Viewport móvil** con `npm run qa:shots:mobile` (o `--mobile` / `--viewport 360x780`): emula el teléfono por CDP (`setDeviceMetricsOverride`, `mobile:true`) para que respondan los `@media` —no basta `window-size`—, y sufija la captura (`<name>-mobile.png`) para no pisar la desktop. Con esto el QA cubre el móvil, donde el repo tiene gotchas de layout documentados (`globals.css`: overflow del header fixed, full-bleed 100vw).

**Gotchas del harness (aprendidos fotografiando el visor de referencias, jul 2026), ya codificados en el script**: (1) **JS deshabilitado por defecto** → layout ESTÁTICO — los visores PDF (`react-pdf`, `ssr:false`) no cargan ni desplazan la página tras medir, y el HTML server-rendered (prosa, enlaces ↗, donut SSR) se ve completo; usar `js:true` por vista solo si se necesita interactividad. (2) El DOM trae **ES+EN a la vez** (el CSS oculta uno) — al enfocar un elemento hay que tomar el VISIBLE (`rect.height > 0`), no el del idioma oculto. (3) Clip con **coords ABSOLUTAS de página + `captureBeyondViewport`** (no `scrollIntoView` + coords de viewport, que se pelean con el clip y dan capturas en blanco). (4) El `basePath /Mercadopublico` rompe `file://`; el script sirve `out/` por http para que `/_next` resuelva.

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

Esta separación existe porque `cases.json` monolítico (~4 MB a jul 2026, con toda la prosa ES+EN; era ~165KB cuando se decidió el split) excede el budget de tokens del MCP `create_or_update_file`. Mantener archivos individuales evita re-encontrarse con ese límite.

## Schema UAPCase

Campos obligatorios: `id, num, name, year_start, country, country_name, flag, location, tier, probability, summary, summary_en, patterns, category`.

Campos opcionales de rich content (renderizados como secciones en `/cases/[slug]`):
- `whatHappened` — cronología + contexto. Separa párrafos con `\n\n`.
- `whyMatters` — significancia analítica.
- `evidence` — array de strings, 3-8 ítems documentados.
- `sources` — array de `{name, url?, note?, note_en?}` para citas primarias. Si una fuente lleva `note` (ES) debe llevar su par `note_en`: el sitio es inglés-primario y el detalle renderiza `note_en ?? note`, así que una nota sin par cae al español en el sitio EN. *(enforzado: `audit-consistency.mjs` E26, WARN agregado por tier)*

### Línea editorial · longitud de la descripción (jun 2026)

**Estándar: la descripción narrativa de cada caso —`whatHappened` + `whyMatters`— debe alcanzar al menos ~1 página A4 (~550 palabras / ~3.500 caracteres), en español e inglés.** `evidence` y `sources` aportan pero NO cuentan para la página: el estándar mide prosa, no listas — un caso con narrativa corta y listas largas sigue por debajo del estándar.

Esto extiende la regla anterior ("2-3 párrafos") porque el corpus dejó casos demasiado telegráficos para su tier. El auditor `audit-consistency.mjs` (regla **E13**, corre en prebuild) reporta cuántos casos siguen bajo el umbral, con backlog por tier — es **WARN agregado, no ERROR**: el build no se rompe, pero el progreso queda medible. La expansión se hace **con investigación caso por caso** (fuentes primarias, no relleno), priorizando **Tier S → A → B**. Cualquier caso nuevo debe nacer cumpliendo el estándar.

### Línea editorial · spanglish (jul 2026)

**En los campos ES (`name`, `summary`, `whatHappened`, `whyMatters`, `evidence`) el inglés descriptivo sin traducir es drift — el inglés vive en su par `*_en`.** Solo se permite inglés en títulos de documentos citados entre comillas y en nombres propios/instituciones. Enforced en dos capas de `audit-consistency.mjs`: **E7** (ERROR) cubre `name`/`summary` con lista-negra curada; **E7b** (WARN) cubre la **prosa** por racha + densidad verbal. La lección que creó E7b (jul 2026): E7 solo escaneaba `name`/`summary`, así que un párrafo en inglés pegado en la prosa era invisible a la auditoría — al confiar en una sonda, verifica QUÉ campos cubre, puede estar verde y ciega al 90% del texto. Cita el inglés verbatim largo entre comillas (E7b exime comillas, incl. apóstrofos internos tipo `member's`).
- `posterior` — distribución MECE sobre 6 narrativas que suma 1: `{mundano_natural, humana_clasificada, adversaria, nohumano_encubierto, nohumano_abierto, indet}`. OBLIGATORIO en casos no-documento (invariante M1 del audit `audit-consistency.mjs`). Ver `lib/meceModel.ts`.

Si un caso no tiene rich content, la página de detalle muestra fallback "⏳ Caso pendiente de explicación detallada".

### Visor de documentos (`documents[]` / `primaryDocument`)

El detalle embebe documentos primarios inline (`components/PdfDoc.tsx` → react-pdf `dynamic(ssr:false)` para `type:"pdf"`; `<img>` server para `type:"image"`). **`src` debe ser embebible** — war.gov bloquea el framing de terceros, así que solo se admiten dos orígenes con garantía de embed:
1. **Same-origin `/pursue/`** — archivos ≤30 MB commiteados en `web/public/pursue/` (viajan con el repo, se despliegan a gh-pages).
2. **Bucket Supabase Storage `pursue`** — `src` = `…/storage/v1/object/public/pursue/<name>`, para los 30-50 MB (o partes `__partNofM`) que GitHub no aloja.

Tres capas de sonda protegen el visor (todas corren en prebuild salvo la viva):
- **`validate-schema.mjs`** (ERROR): `type` ∈ {pdf,image} coherente con la extensión de `src`; `src` debe ser `/pursue/` o el bucket (nada de war.gov); `fallbackUrl` bien formada.
- **`audit-consistency.mjs` E17** (WARN): cada asset `/pursue/` same-origin existe en `web/public/`.
- **`audit-consistency.mjs` E20** (ERROR): cada documento que referencia el **bucket Supabase** está en `data/pursue-bucket-manifest.json`. El build no puede consultar `supabase.co` (allowlist), así que el manifiesto es la verdad offline; la **sonda viva diaria** (Routine CCR) lo mantiene honesto contra `storage.objects`. Regenerar el manifiesto: `select name from storage.objects where bucket_id='pursue' order by name`.

**Cobertura de visual · regla E21** (jul 2026, WARN agregado): todo caso debería embeber al menos un asset visual —`documents[]`, `primaryDocument` o `featuredDoc` (PDF o imagen)— para que el detalle no sea solo prosa. `audit-consistency.mjs` E21 reporta cuántos casos no tienen ninguno, con backlog por tier (a jul 2026: 27/330 sin visual, S×1 A×10 B×16). Es **WARN, no ERROR** (mismo patrón que E13): conseguir el asset exige rehostear caso por caso en `/pursue` o el bucket porque war.gov bloquea el embed; el conteo deja el progreso medible, prioridad **S→A→B**. No es exigible a casos nuevos de golpe (la mayoría del corpus no tiene visual todavía), pero al crear/expandir un caso, si hay un documento primario embebible, móntalo.

**Registros (NO re-buscar) · de dónde salen los assets visuales** — origen de los binarios PURSUE (Drive del dueño), el mirror de dominio público en `archive.org/details/wargovUFO`, la reachability real de Commons/WikiLeaks/Openverse vía proxy, y el barrido E21 Tier-A completo: todo en [`docs/registros.md`](docs/registros.md#documentos-y-assets-visuales-pursue-commons-archiveorg). **Consúltalo antes de buscar un asset** — la mayoría de los huecos que quedan ya se barrieron y están cerrados por licencia, no por falta de búsqueda.




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

## Contador de visitas (/visitantes) (jul 2026)

- **Arquitectura de dos capas**: beacon cliente (`components/VisitorBeacon.tsx`: dedup 24 h en localStorage, filtro de datacenter por org/ISP de la geo-IP, gate de engagement, opt-out `?notrack=1`) + **gate server-side** en Supabase proyecto `uap-codex` (migraciones `web/supabase/migrations/0005`/`0006`: filtro de UA, 1 visita/día por IP hasheada —sha256 con salt secreto + fecha, purga a 2 días, nunca IP cruda—, tope **15** pageviews/día/IP (era 50; migración `0007`), exención `tracking_exempt` para dueño+demo). La capa server es la única inescapable: el filtrado solo-cliente lo saltaba un crawler con Chrome real (patrón Singapur, jul 2026) o cualquier `curl` con la anon key.
- **El país lo resuelve el servidor**: la API de Supabase pasa por Cloudflare y PostgREST recibe `cf-ipcountry` y `cf-connecting-ip` en `request.headers` — el `cc` del cliente es solo fallback (migración 0006). No confiar en país enviado por el cliente.
- **Cómo probar el gate end-to-end desde una sesión remota** (la allowlist bloquea `supabase.co` para curl/WebFetch): usar **`pg_net`** — la base llama a su propia API REST con `net.http_post(...)` (UA arbitrario incluido) y las respuestas quedan en `net._http_response`. Para aserciones deterministas sin tocar la API: simular headers con `set_config('request.headers', '…', true)` dentro de un DO block, y limpiar el rastro (países de prueba `ZY`/`ZX`, borrar hashes de IPs de prueba).
- **Los cuatro totales del panel NO cuadran entre sí, y es correcto** — no "arreglarlo" (jul 2026 se perdió una auditoría entera diagnosticando esto como pérdida de escrituras). Cada uno mide algo distinto: `visits_daily`/`visits_by_country` = **visitantes-día** (el gate deduplica a 1/IP/día); `visits_pages_daily`/`visits_by_path` = **pageviews** (hasta el tope/IP/día). Además (a) las series arrancan en fechas distintas — país desde 25 jun, rutas desde 30 jun, cuando se creó la tabla — así que sus totales *nunca* pueden coincidir; (b) los snapshots acumulados llevan historia que el diario no: la brecha `visits_by_path` − `visits_pages_daily` es **exactamente `/visitantes`** (auto-conteo previo a #574). El panel además calcula los % de páginas sobre el **top-50** del RPC, no sobre el total.
- **Deuda pendiente (jul 2026) · el gate falla ABIERTO**: sin contexto PostgREST (`request.headers` nulo) o sin IP en `x-forwarded-for`, `_tracking_allowed` devuelve `true`. Es deliberado (#577: mejor un falso positivo que romper el conteo), pero implica que **el tope no se puede probar por SQL directo** — hay que usar la técnica `pg_net` de arriba.
- **Sondas**: regla **E19** de `audit-consistency.mjs` (build: dedup 24 h presente, HOSTING_RE sin cloudflare/fastly/akamai, `/visitantes` sin auto-conteo, migraciones 0005/0006 en el repo) + **Routine diaria** en la sesión CCR (15:00 UTC) que vigila la salud del gate en la base viva (dedup poblándose, sin patrón mono-país nuevo, funciones íntegras) y solo reporta anomalías.

## Branch protocol

- Develop en branches `claude/<topic>-<suffix>`.
- PR → main como draft → ready → merge (squash).
- Cuando una branch tenga conflicto post-squash, crear branch nueva desde main en vez de rebase forzado.
- Commitear con `git config user.email noreply@anthropic.com` / `user.name Claude` para que el commit quede **verificado** — si no, el Stop hook lo marca "Unverified".
- Tras mergear un PR, si reinicias la branch con `git checkout -B <branch> origin/main`, el Stop hook marcará el **commit de squash-merge de GitHub** como Unverified — es **falso positivo** (lo firmó GitHub, ya está en `main`): **no** lo amendes (reescribiría historia mergeada).

## Anti-patterns conocidos

- **No** importar `fs` desde `lib/data.ts` (lo importa `WorldMap.tsx` que es client component → webpack falla). *(enforzado: `audit-consistency.mjs` E18a)*
- **No** importar el corpus (`cases`/`patterns`/… desde `lib/data`) en un módulo alcanzable desde un componente cliente —directa o **transitivamente**—, ni aunque solo expongas agregados (webpack embute el JSON entero en el chunk: `MobileNav` del layout importaba `lib/siteStats`, que derivaba `STATS` del corpus → los ~4 MB de `cases.json` en **cada** página; el LCP killer real, 5,23→0,92 MB de JS al arreglarlo, jul 2026). Precalcula el agregado a un JSON diminuto en build (`data/site-stats.json` vía `build-cases.mjs`) e impórtalo en su lugar. *(enforzado parcialmente: `audit-consistency.mjs` E18d blinda la superficie del explorer. La regla transitiva general NO se mecaniza — las fronteras de `dynamic()` la harían frágil.)*
  - **Corolario · slim de campos**: incluso `cases-client.json` (~1,4 MB, sin prosa) es demasiado para una viz que usa cuatro campos. `WorldMap` lo importaba entero para marcadores que solo necesitan `id/name/tier/country/country_name/year/probability/location` → proyecta un dataset a-medida (`data/atlas-points.json`, **68 KB**, `lib/atlasData.ts`). El slim de **prosa** protege el LCP global; el slim de **campos** protege la ruta que lo consume.
- **No** adivinar el componente culpable al diagnosticar bundle bloat — **traza el grafo de módulos desde cada `"use client"`** (los de `/atlas` y `/laboratorio` eran inocentes; el culpable estaba en el layout global, jul 2026).
- **No** re-exportar una const (`export { X } from "./y"`) y seguir usándola localmente en el mismo módulo sin importarla también — el re-export NO crea binding local, así que `X` queda «Cannot find name» y rompe el build (pasó con `MUNDANO_SUBTYPES` al moverlo a `lib/meceClasses` y re-exportarlo desde `meceModel`, que lo usa en `expandedHypotheses`, #638; el patrón correcto —re-export **+** `import { X }`— ya vivía en `MECE_CLASSES`, se olvidó replicar). Ojo con la verificación: el `tsc` local sin `node_modules` da **falso verde** en estos errores de resolución (degrada; solo el `next build` de CI los ve) — para atraparlos local, filtra los `Cannot find name` **reales** del ruido de `react`/`next`/`node` ausente, no confíes en «0 errores».
  - **Verificar con `tsc` local dio DOS falsos verdes encadenados (jul 2026), y el arreglo del primero causó el segundo.** Úsalo solo así: **`tsc -p tsconfig.json --noEmit`** (modo proyecto), filtrando el ruido de `node_modules` ausente —`TS2307` módulo no encontrado, `TS7026` JSX sin tipos de React, `TS18048`/`TS2345` por `notFound()` que sin los tipos de `next` no es `never` y no narrowing-ea— y mirando lo que sí importa: **`TS2554` (aridad), `TS2345` real, `TS1xxx` (sintaxis), `TS2304` (binding)**.
    1. **`tsc <archivos>` no chequea NADA.** Con un `tsconfig.json` presente y archivos en la línea de comandos, tsc aborta con `error TS5112` y sale; el filtro de ruido se traga esa única línea y queda «0 errores» sobre código que ni se parseó.
    2. **`--ignoreConfig` arregla eso pero mata el alias `@/`**, así que el chequeo **entre módulos deja de existir** en silencio: pasa un cambio de firma con call-sites sin actualizar y el resultado sigue verde (pasó threadeando `locale` en `lib/jsonld.ts`, #703). El modo proyecto es el único que resuelve los `paths`.
    Los dos se detectaron con el **control negativo** —romper a propósito lo que la sonda debería ver (un cierre `});`, un argumento requerido de más) y confirmar que dispara—. La moraleja va más allá de tsc: **el parche a una sonda rota puede romperla de otra manera**, así que revalida con el control negativo *después* de arreglarla, no solo antes. Es «verifica la sonda contra un caso cuyo resultado ya conoces» aplicado a la herramienta que verifica. *(Codificado como regla cero de §5 en `.claude/commands/cerebro.md`.)*
- **No** hardcodear el número total de casos — derivar de `cases.length` (vive en `lib/siteStats.ts` como `STATS.cases`). Esto incluye la **prosa y comentarios de este mismo CLAUDE.md**: toda cifra del corpus citada a mano driftea (el `~304` de la sección Estructura ya era 316 en jul 2026) — al citarla, márcala aproximada + fechada, o remite a `STATS.cases`. **También aplica a las descripciones de `patterns.json`**: un `"N casos"` horneado en la descripción de un patrón driftea contra el conteo que el detalle `/patterns/[letter]` ya deriva y muestra en la misma página (pasó con 8b: `"9 casos"` vs 17 reales, jul 2026 — lo cazó un análisis externo). *(enforzado: `audit-consistency.mjs` E30 — ERROR si una descripción de patrón hornea un conteo que ≠ los casos que lo usan.)*
  - **Excepción — NO derivar `CORPUS_START_YEAR = 1947`** (`build-cases.mjs`): es un **ancla editorial deliberada** (era institucional moderna, Roswell/Twining), **no el mínimo del corpus**. El corpus incluye ~19 antecedentes anteriores (`nuremberg-1561`, `utsuro-bune-1803`, `foo-fighters-1944`, `ghost-rockets-1946`…), visibles en `/cases` y en la columna «‹1940» de `/cobertura`; `endYear` sí se deriva (`Math.max`), pero el `startYear` es fijo por diseño y el copy lo narra como "1947–2026" con esos casos como profundidad histórica. **Un análisis externo (jul 2026) lo leyó como bug y recomendó «derivar del corpus real» → lo habría cambiado a 1561 y roto el framing.** No es drift (1947 no cambia al crecer el corpus, a diferencia de un conteo). Si se decide comunicar los antecedentes, es decisión **editorial** (copy), no derivar la constante.
- **No** usar `node:` scheme en imports de Next.js (`node:fs` falla; usar `fs`). *(enforzado: `audit-consistency.mjs` E18b — scripts/ exentos)*
- **No** generar `cases.json` manualmente para commitear — siempre vía `node scripts/build-cases.mjs` (o `npm run build` cuando hay `node_modules`; ver la regla de abajo).
- **No** asumir `node_modules` instalado (las sesiones remotas / CI fresco parten sin él) — para regenerar o validar el corpus corre los scripts node directos desde `web/` (`node scripts/build-cases.mjs`, `validate-schema.mjs`, `audit-consistency.mjs`; todos sin dependencias), no `npm run build`/`next build` (que sí requieren `next`).
- **No** dejar archivos de prueba temporales en `data/cases/` — `validate-schema.mjs`, `build-cases.mjs` y el conteo `cases:` los recogen por `readdirSync`, así que inflan el número y pueden romper el build (un `_test.json` hizo reportar 317 en vez de 316); bórralos antes de confiar en el conteo. *(enforzado: `audit-consistency.mjs` E22 — ERROR si un basename lleva un token de basura tipo test/tmp/copy/bak/draft/prueba/`~`/`(n)`; new/old/final se excluyen porque aparecen en slugs reales)*
- **Inglés es el idioma PRIMARIO del sitio** (SEO global, desde jul 2026): la raíz `/` sirve inglés (`<html lang="en">`, default del CSS bilingüe = EN, metadata/canonical en inglés, `x-default` hreflang = raíz inglesa) y el **espejo español vive en `/es`**. El corpus es bilingüe en el DOM (`<T es en>` + CSS por `data-locale`); `app/es/layout.tsx` fija `data-locale="es"` server-side. (Antes era español-primario; se invirtió por alcance internacional.)
  - **Un idioma por URL · RESUELTO para los cuerpos de página (jul 2026)**: antes cada URL servía los **dos idiomas** en el HTML (`<T>` emitía dos spans, el CSS ocultaba uno) → ~2× texto y señal SEO diluida. Se migró por **threading de `locale`**: `<T>` acepta `locale?: "es" | "en"` (con él emite un solo idioma como nodo plano sin `data-lang`; sin él, modo bilingüe legacy). Cada sección espejo se partió en `XView({ locale })` (la raíz pasa `"en"`, el wrapper `/es` pasa `"es"`); las páginas de detalle reciben `locale` con default `"en"` y el wrapper `/es` renderiza `<XDetailPage locale="es"/>`. Componentes hijos con `<T>`: los section-scoped exigen `locale` (así `tsc` **fuerza** que toda call-site lo threadee — red de completitud); los que cruzan a rutas sin espejo (`Breadcrumb`, `ShareButton`) lo llevan **opcional** (default bilingüe). La prosa cruda `data-lang` (whatHappened/whyMatters de casos, bio de researchers, body de blog) se gatea por `locale` en vez de CSS. Medido: `/cases` 3916→~56 spans `data-lang`, `/patterns` 334→94. **`LocaleToggle` ahora NAVEGA** entre raíz↔`/es` en rutas espejo (helper `mirrorHref` en `LocaleLink`) y sigue con flip-CSS en las no-espejo (que siguen bilingües en una sola URL); el chrome fija su idioma según la URL (`isEsRoute`/`mirrorHref` en el `useEffect`) para casar con el cuerpo.
  - **Chrome un-idioma · TAMBIÉN resuelto (jul 2026)**: el header/footer ya no emiten los dos idiomas. Helper `chromeLocale(pathname)` (en `LocaleLink`): `/es`→"es", raíz-con-espejo→"en", ruta sin espejo o SSR-sin-pathname→`undefined` (bilingüe, correcto: esos cuerpos también lo son). Se propaga a los `<T>` del chrome vía `usePathname` en los client components (`HeaderNav`, `SiteHeader`, `MobileNav`, `AccountControl`) y el **footer se extrajo de `app/layout.tsx` (server) a `components/SiteFooter.tsx` (client)** porque el layout no conoce la ruta hija. Clave del static export: **`usePathname` SÍ resuelve la ruta en el prerender** (verificado: los `LocaleLink` del footer salen con `/es` incrustado en el HTML de `/es`), así que el chrome queda mono-idioma en el HTML estático sin depender de la hidratación. Medido: páginas espejo **94→0 spans `data-lang`**; las no-espejo (atlas, contact, fuentes) siguen bilingües (correcto). Con esto `/cases` cerró 3916→94→**0**.
- **No** renderizar crudo (`{campo}`) un campo que tiene par bilingüe (`_en`) o helper de locale (`countryEn`) — el dato puede ser **100% bilingüe** y aun así filtrar el idioma base en el sitio inglés-primario si el render usa `{campo}` en vez de `<T es={campo} en={campo_en ?? campo}>` (o el helper). Pasó **dos veces** esta sesión: `patterns.json` (`{p.name}`/`{p.description}`, #659) y `country_name` (`{c.country_name}` en `/researchers`+`/atlas`, #660), ambos bilingües en data pero crudos en el render. Al tocar un render de un campo con par, verifica que lo consuma. (El `<Tooltip>` de react-leaflet es JSX bajo el `MapContainer` → el dual-span de `<T>` por `data-locale` funciona ahí; no es un `bindPopup` con string HTML.)
  - **La clase tiene TRES superficies, no una — al cerrarla en el render no está cerrada.** (1) el **render** (`<T>`), (2) la **metadata** (`generateMetadata`, regla de abajo), y (3) los **datos estructurados** (`lib/jsonld.ts`), que fue la última en descubrirse: la ruta raíz —la **inglesa**— publicaba a los rich results `headline`/`description` en español en los 327 casos, `bio_short` español en los 91 actores, breadcrumbs `Inicio`/`Casos`/`Actores`, y un `url`/`@id` que apuntaba a la variante EN aunque el consumidor fuera `/es` (jul 2026). Google **muestra** ese texto en el resultado, así que el costo es el del `seoTitle` ES ya medido. Los helpers de JSON-LD ahora exigen `locale` como parámetro **requerido**, para que `tsc` fuerce el threading en toda call-site. *(enforzado: `audit-consistency.mjs` E33, ERROR — mira solo `lib/jsonld.ts`, solo las vars de entidad `c`/`r`/`p` y solo los campos con par real; `r.name` queda fuera porque los nombres propios no se traducen.)*
- **No** alimentar la metadata de una ruta **inglesa** con `seoTitle`/`seoDescription`: esos campos están en **español** y son la variante ES (`data/cases/*.json`). La raíz `/cases/[slug]/` es la ruta inglesa y los usaba directamente, cayendo a `name_en` solo cuando faltaban — así que 15 casos servían un `<title>` en español a la SERP anglófona. Coste medido en Search Console (11 jun–9 jul): **542 impresiones y 0 clicks** en AAWSAP + Grusch, ambas en **posición ~7**, con EE.UU. aportando el 60% de las impresiones a **CTR 0,3%** (vs 7–14% donde el idioma coincide). Desde jul 2026 la ruta EN usa solo `seoTitle_en`/`seoDescription_en`, con fallback a `name_en`/`summary_en`. Es el mismo error que la regla de arriba (campo con par bilingüe consumido crudo), pero en `generateMetadata` en vez del render — **la metadata también tiene pares `_en`**.
  - **Resuelto (jul 2026, `cc31ad4`) · `seoTitle` ES**: `/es/cases/[slug]/` ahora llama `esMeta({ absoluteTitle: c.seoTitle, description: c.seoDescription ?? c.summary })` — `esMeta` soporta título absoluto (sin el sufijo `· UAP Codex`), así que los títulos ES optimizados sí se sirven y las rutas cuyo `name` está en inglés (`grusch-testimony-2023`, `robertson-panel-1953`) muestran su `seoTitle` español.
- **No** declarar `alternates.languages` sin verificar que el espejo existe, ni omitirlo cuando existe — el `hreflang` solo vale si es **recíproco**, y hacia un 404 invalida el cluster entero. La mitad que driftea es **siempre la raíz inglesa** (las `/es` pasan por `esMeta`, que emite el par por construcción). Ambas direcciones se vieron en el deploy vivo, jul 2026. *(enforzado: `audit-consistency.mjs` E31, ERROR — el comentario de la regla lleva el detalle de los dos casos y por qué E23/E27 no los veían)*
- **No** escribir la metadata de una sección a mano — usa **`pageMeta`**. Next no hace deep-merge de `openGraph`, así que la ruta hereda el del layout y su card social apunta a la **home** (4 rutas emitían `og:url = uapcodex.org/`, jul 2026). Esa misma superficie a mano es la que se salta la **revisión de idioma**: las 5 rutas raíz no espejadas servían `<title>` en español en el sitio inglés-primario. *(enforzado: `audit-consistency.mjs` E32, ERROR. El **idioma** NO se mecaniza —una heurística ES/EN daría falsos positivos con nombres propios—; queda como criterio en la revisión que E32 fuerza.)*
- **No** asumir que `cases-client.json` (el bundle client sin prosa) trae los pares `_en`: lleva `summary_en`/`evidence_en` pero **no `name_en`**, así que localizar el **nombre** de un caso en un componente cliente (tooltip de `WorldMap`) exigiría sumarlo al bundle y engordar el chunk — por eso el `{c.name}` del mapa quedó fuera de #660. Si necesitas un `_en` nuevo en cliente, pésalo contra el LCP (ver la regla de bundle bloat arriba).
- **No** dejar driftar el espejo español `/es`: el set `MIRRORED` de `components/LocaleLink.tsx` debe corresponder 1:1 con los directorios `app/es/<seccion>/page.tsx` — una sección en `MIRRORED` sin página `/es` manda sus links a 404, y una página `/es` fuera de `MIRRORED` no localiza sus links de contenido (se fugan a la raíz inglesa). *(enforzado: `audit-consistency.mjs` E23, ERROR)*
- **No** agregar una ruta pública nueva (`app/<seccion>/page.tsx`) sin sumarla al array `staticRoutes` de `app/sitemap.ts` — ese array está **hardcodeado a propósito** (no se deriva de `app/`, para fijar `changeFrequency`/`priority` por ruta), así que una página pública con `canonical` propio queda fuera del sitemap y Google solo la descubre por enlaces internos (pasó con `/calidad` y `/cobertura`, #647). El sitemap es **EN-only (la raíz)**: los pares `/es` los cubre el `hreflang` del `<head>`, no van al array. Rutas gated (`RequireAuth`, p. ej. `/laboratorio`) o de login (`/acceso`, `noindex`) NO van — quedan fuera correctamente. *(enforzado: `audit-consistency.mjs` E27, ERROR — toda ruta pública `app/*/page.tsx` debe estar en `staticRoutes` o declararse `robots: { index: false }`; excluye dinámicas, el espejo `/es`, gated y noindex. Cerró el hueco de `/visitantes`, #661.)*
- **No** emitir `Event` JSON-LD en casos (Google aplica el validador de eventos comerciales y exige `organizer`/`performer`/`offers`). Usar `Article` + `contentLocation: Place`. *(enforzado: `audit-consistency.mjs` E18c)*
- **No** proponer (ni empezar a construir) una vista/feature nueva en `/innovar` sin antes listar `app/*/page.tsx` + grepear `lib/` — las auditorías numéricas (`audit-consistency`/`audit-design`) miden salud, no revelan qué ya está construido; casi se duplicó `/cobertura` (matriz país×década) reimplementando `lib/regions.ts` desde cero (jul 2026).
- **No** medir presencia de «prosa de primer nivel» contando `<p>` crudo — las landings usan el sistema de tipografía (`Lede`/`H1`/`Eyebrow` de `lib/typography`), no `<p>`, así que `<p>`-count da falsos positivos (`/cases` marcó `<p>×0` pero abre con un `<Lede>` de intro completo). Para auditar estructura/prosa, cuenta los componentes de tipografía. (jul 2026)
- **No** clasificar `cloudflare|fastly|akamai` como "IP de datacenter" en filtros anti-bot (son el egress de iCloud Private Relay y VPNs de consumidor — bloquearlos descarta Safaris humanos reales). *(enforzado: `audit-consistency.mjs` E19b)*
- **No** filtrar bots solo en el cliente — cualquier cliente con la anon key llama los RPC de conteo directo, y un crawler con Chrome "real" pasa UA + engagement; el gate tiene que vivir en la función SECURITY DEFINER (ver sección Contador de visitas). *(enforzado: sonda viva diaria; jul 2026)*
- **No** concluir nada de `test-chart.mjs` (ni de otra sonda que lea `out/`) sobre un `out/` que no reconstruiste — es artefacto de build gitignored que queda **rancio** en el contenedor (uno del 16 jul con 326 casos/6 segmentos hizo concluir «2 fallos preexistentes en main», y casi «arreglé» un test que pasaba; jul 2026). Antes de creerle: `rm -rf web/out` o rebuild. Y como `test-chart` corre en `postbuild` (`npm run build`), un **deploy verde ya prueba que pasa** — no hace falta correrla local. Es la lección de la sección de fuentes rotas («verifica la sonda contra un caso cuyo resultado ya conoces») aplicada a las sondas que dependen de `out/`. *(enforzado: `test-chart.mjs` aborta con «out/ RANCIO» si `out/probabilidades/index.html` es más viejo que `data/cases.json`, en vez de emitir aserciones falsas)*
- **No** fijar un `grid-template-columns` único cuando algunos ítems llevan `hidden <bp>:inline` (display:none condicional) — CSS Grid excluye del auto-placement a los ítems `display:none` y compacta el resto hacia los primeros tracks del template en orden de DOM, así que un track `1fr` pensado para el contenido puede terminar ocupado por el vecino de ancho fijo mientras el contenido cae en un track `auto` y se comprime a su ancho intrínseco (`CaseRow.tsx` + el header de `/cases`: con `num`/`year` ocultos en móvil, el título+resumen caían al track de `flag` en vez del `1fr`, medido en producción como 159px/44% de la fila en 390px vs 96px/26% para dos badges de 1-3 caracteres; jul 2026). Fix: `grid-cols` responsivo que matchee el nº de ítems visibles por breakpoint (`grid-cols-[...] sm:grid-cols-[...]`), no `col-start-N` fijo por ítem (conserva el `gap` de los tracks que quedan vacíos).

## Deuda pendiente · ~38 fuentes rotas (hard 4xx) en el corpus (baseline 21 jul 2026)

`data/link-health-baseline.json` (regenerado 21 jul 2026): **38 rotas duras**, desglosadas en **36 × `404`**, 1 × `401` y 1 × `406`. (La cifra vieja «74» de este doc era un escaneo puntual anterior que sumaba `fetch failed`/`timeout`/`403` al conteo; el gate solo indexa lo duro 4xx/5xx, que es el set accionable. Cifra viva = `deadCount` del baseline.)

**Los `403` NO cuentan como rotos**: son bloqueos anti-bot (NYT, congress.gov, ResearchGate, thehill, newsnation). Para un humano abren bien; la sonda ya los marca `?` en vez de `✗`. No "arreglarlos".

**Por qué importa más que un bug de UI**: la propuesta del sitio es *evidencia institucional con fuentes primarias verificables*. Las citas muertas erosionan justo eso. Es la deuda de contenido más seria detectada hasta ahora — por encima del backlog visual E21.

**El agujero de proceso — CERRADO (jul 2026)**. Antes: `check-links.mjs` terminaba con exit 0 pase lo que pase, no estaba en el `postbuild` ni tenía regla en `audit-consistency.mjs` — las fuentes se pudrían en silencio y nada avisaba. El guardrail tiene tres piezas:

- **`npm run check-links:gate`** (`--baseline`) — compara contra `data/link-health-baseline.json`, una **línea base congelada de las roturas ya conocidas**, y falla (exit 1) **solo con las NUEVAS**. Un check binario sobre el total sería rojo permanente mientras el corpus arrastre link rot, y se ignoraría.
- **Indexada POR URL, no por conteo**: si se arregla una cita y se rompe otra, el total no se mueve — un gate por conteo no vería nada. Además reporta las que **revivieron**, para que la línea base baje (`npm run check-links:baseline` la recongela).
- **Solo entra al gate lo duro (4xx/5xx)**. Los `timeout`/`fetch failed` se reportan aparte (pueden ser caídas pasajeras; harían el check intermitente) y los `403` tampoco (anti-bot).

Corre en **`daily-audit.yml`**, no en el prebuild: necesita red, y las sondas de build son node-plain offline a propósito. Abre issue con label `audit`/`automated` al detectar roturas nuevas.

La contraparte offline es **`audit-consistency.mjs` E28** (WARN): la auditoría no tiene red, pero sí puede verificar que la línea base exista, sea parseable y no esté rancia (>45 días). Si el cron deja de correr, el build lo dice.

**El trinquete solo baja — guard anti-regresión en `--update-baseline` (jul 2026)**. La línea base se recongela *después* de arreglar citas, así que cualquier rotura que el propio arreglo introdujo entraba como «deuda conocida» y desaparecía del radar. Pasó: un lote reapuntó 4 citas a URLs de Wayback muertas; el gate las vio como roturas nuevas, pero `--update-baseline` las congeló sin decir nada y la base «bajó» de 55 a 50 mientras la evidencia empeoraba. Ahora `--update-baseline` **rechaza (exit 1) congelar URLs que no estaban en la base anterior** y exige `--force` explícito. Complemento: **E29** (ERROR) marca cualquier URL de `web.archive.org` congelada como rota — esa rotura la introdujimos nosotros, se corrige regenerando el snapshot, no investigando.

**Lección más general**: *una herramienta con un bug no solo produce malos arreglos, produce malas conclusiones*. El mismo `limit=-20` defectuoso que eligió snapshots rotos hizo concluir que 9 artículos de Wikipedia «nunca existieron»; dos sí existían (`Boyd_Bushman`, `Sturrock_panel`, capturas 200 de 2014 y 2024, borrados por notabilidad). Antes de sacar una conclusión de una sonda nueva, verifica la sonda contra un caso cuyo resultado ya conoces.

Casos con más rotas: `roswell-1947` (3); con 2 cada uno `twining-memo-1947`, `sturrock-panel-1998`, `robertson-panel-1953`, `rendlesham-1980`, `mystery-drones-east-coast-2024`. Las institucionales duelen más: `nationalarchives.gov.uk/ufos/` (404, citado por **4 casos**), `theblackvault.com/.../defense-intelligence-reference-documents/` y `documents2.theblackvault.com/.../bolendermemo.pdf` (404, ambos en AAWSAP/Bolender), `argentina.gob.ar/fuerza-aerea/cefae` (404).

**Ruta de resolución**: casi todo es *link rot* normal (los gobiernos reorganizan sus sitios). Priorizar por tier del caso y por nº de casos que citan la misma URL. **Distinguir antes de tocar**: `404` = link rot; `fetch failed`/`timeout` pueden ser caídas temporales — reverificar antes de reescribir nada.

**Registros (NO re-buscar) · las dos vías de reparación están agotadas desde este entorno** — ni el rewrite mecánico a Wayback ni la «URL viva de reemplazo» son verificables aquí (`NO_SNAPSHOT` en 35/38; 403/302-loop en los hosts). Detalle y evidencia en [`docs/registros.md`](docs/registros.md#fuentes-rotas--vías-de-reparación-agotadas). La reparación necesita un humano o una red sin el muro 403.


## Deuda pendiente · fotos de actores

Estado (jul 2026): **28/91 actores tienen foto**. El techo real NO son los 63 restantes — es la **licencia**: la mayoría de las figuras UAP no tienen foto libre en Commons (sus imágenes son material de prensa con copyright). Cobertura máxima realista estimada en el análisis de jun 2026 (hecho sobre 81 actores; el corpus creció luego a 91): ~30-35.

Convención: el campo `photo` es `https://commons.wikimedia.org/wiki/Special:FilePath/<filename EXACTO>?width=400`. Los filenames son **impredecibles**, así que **hay que verificarlos, no adivinarlos** — adivinar produce imágenes rotas (404), peor que el avatar.

**Ruta de resolución que funciona** (descubierta jun 2026): la API de Commons y Wikipedia siguen bloqueadas por allowlist (`Host not in allowlist` / 403), pero **WebSearch con `site:commons.wikimedia.org` sí funciona** como resolución indirecta. Protocolo: (1) búsqueda de descubrimiento por persona, (2) búsqueda de verificación con el filename exacto entre comillas, (3) solo commitear filenames corroborados por links literales `File:...` o metadata consistente entre búsquedas independientes.

**Registro de búsqueda (jun 2026, ampliado jul 2026) — NO re-buscar**: el barrido completo de Commons (28 verificados y aplicados, el resto confirmado sin retrato libre, cola agotada) vive en [`docs/registros.md`](docs/registros.md#fotos-de-actores--barrido-de-commons). **No re-buscar sin leerlo.**
