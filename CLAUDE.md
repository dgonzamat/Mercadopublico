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
- **Cuando queden decisiones del dueño, preguntárselas con la herramienta de preguntas (`AskUserQuestion`) y con la recomendación marcada como primera opción** (decisión del dueño, 20 nov 2026): dejarlas al final de un mensaje como «decisiones tuyas» obligaba a pedir cada vez «recomienda» antes de poder elegir. Una pregunta por decisión, con su porqué en la descripción de cada opción. Vale también al cerrar un resumen, un informe o una tabla de avances: terminar con «siguen pendientes…» sin la pregunta es el mismo error (se repitió el mismo 20 nov 2026, ya con la regla escrita).

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

**Registro de frenos de las sondas** (nov 2026): `scripts/lib/probe-log.mjs` anota en `web/data/probe-hits.jsonl` cada ERROR de `validate-schema` y `audit-consistency` que salta en local (una vez por día, regla y archivo; nunca en CI ni con `PROBE_LOG=0`, que es lo que usa un control negativo). Existe porque la medición de 2.345 corridas de CI solo veía las reglas de estructura: lo que las sondas frenan antes del commit no dejaba rastro. Resumen con `npm run sondas:frenos`; es la base para decidir qué regla da valor.

**Hook de validación de schema** (`.claude/hooks/validate-schema-on-edit.sh`, registrado como `PostToolUse` en `.claude/settings.json`): al editar un `data/cases/*.json` o `data/researchers.json`, corre `validate-schema.mjs` en el acto y **bloquea** (exit 2) si el schema se rompe. Adelanta al momento del edit el mismo gate que antes solo corría en prebuild/CI — un `posterior` MECE que no suma 1, un `id`/`num` duplicado, un JSON roto o una foto sin licencia se ven al instante. No ve los archivos escritos desde `Bash` o node (las seis fichas de abducción y contacto de nov 2026 salieron de scripts y el hook nunca corrió); por eso un hook `Stop` (`validate-schema-on-stop.sh`, nov 2026) repite la validación al cerrar el turno si el árbol tiene cambios en esos datos, y después corre `audit-consistency.mjs` (unos 2 s; devuelve solo los ERROR); bloquea con exit 2. Un `PreToolUse` (`block-irreversible-bash.sh`) bloquea el push forzado sin lease y el push directo a `main`, y `permissions.deny` cierra las herramientas de Supabase que no se deshacen (pausar el proyecto, borrar o reiniciar ramas).

**Registro de hallazgos del verificador** (nov 2026): `docs/hallazgos-verificacion.md` anota una fila por cada hallazgo del verificador independiente en una ficha nueva, con su categoría (atribución, omisión, ausencia, cifra/hora, léxico/voz…) y si una sonda lo habría visto; su regla de cierre manda a `/blindar` la categoría que se repite en dos de las últimas cinco fichas. Antes del verificador, `npm run caso:check -- <id>` avisa de afirmaciones de ausencia, voz del redactor, párrafos largos y párrafos con tres o más datos técnicos (grados, horas GMT, números de informe, cálculos), y de «dijo a [medio]» cuando el medio figura en `sources` (atribución, la categoría que más se repite en el registro: el medio a menudo solo reproduce las palabras; `/blindar`, 24 nov 2026), que son donde se perdieron los lectores de las tandas 557–565. `/nuevo-caso` lee el registro en el paso 0.5 y lo alimenta en el 5c; el verificador usa siempre el brief fijo de fichas nuevas (`docs/brief-verificacion.md`), para que el registro compare fichas y no briefs, y el paso 5d añade la prueba del lector antes de fusionar. **E63** (ERROR) exige que toda ficha desde el `num` 529 tenga al menos una fila en el registro. Existe porque `probe-hits.jsonl` solo ve lo que frena una sonda, y en seis fichas el registro suma 42 filas de hallazgos y `caso:check` habría marcado 4: atribución, omisión, cifras y ausencias solo las halla un lector que abra la fuente.

---

## Mapa de reglas (MECE, nov 2026, decisión del dueño)

Cada regla vive en **un solo hogar**, según lo que gobierna; los demás archivos (skills, briefs de agentes, el registro) solo apuntan a él con una línea. Existe porque la misma regla escrita en tres o cuatro sitios divergió: la de las ausencias decía «no lo tenemos» en este archivo y la guía `/redaccion` prohibía la voz del redactor, y una ficha cumplió una y violó la otra (18 nov 2026). La columna «vigilante» dice quién la hace cumplir; una categoría sin vigilante es un hueco a la vista (así pasaron la prosa y los visuales en la serie de abducciones).

| # | Categoría (qué gobierna) | Hogar | Vigilante |
|---|---|---|---|
| 1 | **Evidencia**: qué es cierto y cómo se comprueba | `## Evidencia` de este archivo | verificador independiente (brief fijo); E41, E42, E48 |
| 2 | **Clasificación**: `posterior`, tier, `classBasis`, probabilidad | `## Modelo de probabilidad (MECE)` | `validate-schema` (suma 1); E43, E44, E48; método de dos agentes |
| 3 | **Escritura**: norma, voz, estructura, longitud, bilingüe, qué es deuda | `/redaccion` (§9: deuda y mantenimiento) | E7, E47, E52, E54, E55, E56, E59, E60, E62; lector del paso 5d; `/auditar-prosa` |
| 4 | **Esquema y datos**: campos, `num`, ids, lugar | `## Schema UAPCase` y `### Esquema y datos` | `validate-schema` y su hook; E22, E45, E61 |
| 5 | **Visuales y documentos** | `### Visor de documentos` y `### Visuales y documentos` | E17, E20, E21, E53; E63 para fichas nuevas |
| 6 | **Selección de casos**: cobertura, virales, anti-relleno | `/proximo-caso` | ninguno mecánico: criterio del dueño |
| 7 | **Proceso de una ficha**: orden de pasos y quién los hace | `/nuevo-caso` | E63 (fila en el registro); `### Proceso y agentes` |
| 8 | **Código del sitio**: Next, i18n, SEO, UI | `.claude/rules/codigo-sitio.md` (carga por ruta) | E15, E18, E23, E27, E31, E32, E33, E40, `tsc` |
| 9 | **Operación**: git, PR, deploy, almacenamiento, visitas, enlaces | `## Branch protocol`, `## Deploy`, `## Contador de visitas`, `## Fuentes rotas` | gate semanal de enlaces, E38, sonda viva de visitas |
| 10 | **Memoria**: cómo se aprenden y mantienen las reglas | `## Protocolo de aprendizaje` | `/learn`, `/retro`, `/blindar`, `/curar-memoria` y su sonda de duplicados (`npm run audit:reglas`) |

## Stack

- Next.js 16.4.6 App Router + TypeScript strict (React 18.3.1)
- Tailwind CSS 3.4 (theme claro editorial custom: fondo crema `#f7f2e8`, tinta `#1a1a1a`, acento `#c41e3a` — tokens en `tailwind.config.ts`)
- `output: "export"` — SSG puro, deploy a GitHub Pages
- react-leaflet para `/atlas` (dynamic import, ssr: false)
- Client components: 42 con `"use client"` (nov 2026, techo de 46 en E16; cifra viva = la que reporta `audit-consistency.mjs`); la mayoría vive en `components/` y `components/explorer/` (laboratorio de visualización). Los interactivos clave: `components/MobileNav.tsx` (focus trap, Escape, body scroll lock) y `components/MeceDonut.tsx` (donut interactivo de /probabilidades y de la home vía `HypothesesSnapshot`, con prop `tone` light/dark; hover/tap sincroniza segmento↔leyenda + tooltip; SSR deja el donut completo, la interactividad es progresiva).

## Estructura

Todo el código de la web vive en `web/`. Trabajar desde ahí, no desde la raíz.

```
web/
  app/                  # rutas App Router (server components por default)
    page.tsx            # home: HeroRadar + stats (CountUp) + TimelineByYear + HypothesesSnapshot + CTA
    cases/              # listado + detalle [slug]
    probabilidades/     # transparencia del juicio ICD-203
    atlas/              # Leaflet map (client)
    (patterns/ retirada en oct 2026 por decisión del dueño: etiquetado irregular; el campo `patterns` sigue en los datos y en el laboratorio)
    researchers/        # ecosistema disclosure (5 secciones)
    frameworks/         # 11 frameworks teóricos comparados
    about/, resumen/    # metodología + 10-min summary
  components/           # MobileNav, MeceChart, CorpusStats, WorldMap...
  lib/
    data.ts             # carga cases / patterns / frameworks / researchers
    types.ts            # UAPCase, Posterior (MECE), MeceClassId, etc.
    meceModel.ts        # modelo MECE: posterior por caso + agregación comparable
    sources.ts, ui.ts, jsonld.ts, siteStats.ts, corpusStats.ts, typography.tsx
  data/
    cases/              # SOURCE OF TRUTH: un archivo JSON por caso (466 a nov 2026; cifra viva = STATS.cases)
    cases.json          # GENERADO por scripts/build-cases.mjs — gitignored
    posts/              # blog posts (mismo patrón que cases)
    patterns.json
    frameworks.json
    researchers.json    # 140 actores (nov 2026; cifra viva = su .length)
  scripts/
    build-cases.mjs     # agrega data/cases/*.json → data/cases.json
    build-posts.mjs     # agrega data/posts/*.json → data/posts.json
    build-rss.mjs       # genera el RSS feed (corre en prebuild)
    build-search-index.mjs
    audit-consistency.mjs # corre en prebuild; verifica % editoriales vs priors
    audit-design.mjs      # corre en prebuild; contraste WCAG AA + drift de color de tier + touch targets
    validate-schema.mjs   # corre en prebuild; valida schema de cases/researchers
    qa-screenshots.mjs    # sonda de QA VISUAL (on-demand: npm run qa:shots) — renderiza pixeles
    audit-skills.mjs      # todo skill nombrado en .claude/commands existe (corre en CI, no en prebuild)
tools/
  bucket-regray/          # recompresión en gris de los PDF del bucket (fuera de web/, NO se despliega)
  reescritura/            # herramientas de la remediación de prosa (fuera de web/, NO se despliega)
  evals/                  # evals de los skills con `claude plugin eval` (on-demand, cuesta dinero; ver su README)
  lector-ciego/           # prueba del lector fuera del repo, sin CLAUDE.md (on-demand, cuesta dinero; ver su README)
```

### Sonda de QA visual (`qa-screenshots.mjs` · `npm run qa:shots`)

On-demand, no gate del prebuild: `npm run qa:shots` (o `qa:shots:mobile`) fotografía el sitio ya construido (`out/`) con Chromium vía CDP; salida en `web/qa-shots/` (gitignored). JS deshabilitado por defecto (layout estático), el DOM trae ES+EN (enfoca el elemento visible), clip con coordenadas absolutas y `out/` servido por http desde la raíz. Detalle de los gotchas: [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#sonda-de-qa-visual).

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

Esta separación existe porque `cases.json` monolítico (~11 MB a nov 2026, con toda la prosa ES+EN; era ~165KB cuando se decidió el split) excede el budget de tokens del MCP `create_or_update_file`. Mantener archivos individuales evita re-encontrarse con ese límite.

## Schema UAPCase

Campos obligatorios: `id, num, name, year_start, country, country_name, flag, location, tier, probability, summary, summary_en, patterns, category`.

**Regla de país (16 oct 2026, decisión del dueño)**: `country` es el del **lugar del suceso**, no el de la plataforma que lo registró; en el mar, el del país costero más cercano (Golfo de Omán → OM, frente a Yemen → YE, mar de Filipinas → PH). Solo si la fuente no revela el lugar se queda la nación de la plataforma, y `country_name` lo dice («Área de responsabilidad de INDOPACOM (ubicación exacta no revelada)»). Todo `country_name` nuevo necesita su entrada en `COUNTRY_EN` de `lib/i18n-geo.ts` y su código en `lib/regions.ts`. *(enforzado: `audit-consistency.mjs` **E50** y **E35**, ERROR.)*

**Sin estado «en desarrollo» (19 oct 2026, decisión del dueño)**: un caso se arma con la información que se tiene y se amplía después; no se marca como provisional. Se quitó de las 10 fichas que lo llevaban, porque la etiqueta no tenía regla de salida y envejecía en silencio (Yemen seguía «en desarrollo» un año después de la audiencia). El estado «proyectado» (`projected`) también salió (19 oct 2026, decisión del dueño): ninguna ficha lo usaba y solo quedaba su insignia y su leyenda en `/cases`. *(enforzado: `validate-schema.mjs` solo admite `epistemicStatus: "documented"`; controles negativos corridos con los dos valores.)*

Campos opcionales de rich content (renderizados como secciones en `/cases/[slug]`):
- `whatHappened` — cronología + contexto. Separa párrafos con `\n\n`.
- `whyMatters` — significancia analítica.
- `evidence` — array de strings, 3-8 ítems documentados.
- `sources` — array de `{name, url?, note?, note_en?}` para citas primarias. Si una fuente lleva `note` (ES) debe llevar su par `note_en`: el sitio es inglés-primario y el detalle renderiza `note_en ?? note`, así que una nota sin par cae al español en el sitio EN. *(enforzado: `audit-consistency.mjs` E26, WARN agregado por tier)*
- `posterior` — distribución MECE sobre 6 narrativas que suma 1: `{mundano_natural, humana_clasificada, adversaria, nohumano_encubierto, nohumano_abierto, indet}`. OBLIGATORIO en toda ficha (lo exige `validate-schema.mjs`; la antigua M1 de `audit-consistency.mjs` se fusionó allí en nov 2026). Ver `lib/meceModel.ts`.

### Línea editorial · guía de redacción (oct 2026)

**Todo texto de una ficha, en español y en inglés, se escribe y se verifica con `/redaccion`**, y su ruta va en el brief de todo agente redactor o verificador; qué es deuda y qué es mantenimiento vive en su §9. Lo mecánico lo vigilan E52, E54, E56, E59, E60 y E62; la calidad de la prosa no la mide ninguna regla de forma, así que toda tanda de reescritura pasa por `/auditar-prosa` (no elijas la muestra con la sonda: su puntuación no predijo la nota del lector). Si la reescritura cambia la evidencia que recoge la ficha, la ficha pasa por la revisión de `posterior` y `classBasis` con el método de dos pasos. Un título citado entre comillas es literal aunque la fuente se equivoque: la corrección va en la nota de la fuente. Historia de cada regla: [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#línea-editorial--guía-de-redacción).

### Línea editorial · longitud de la descripción (jun 2026)

**Estándar: la descripción narrativa de cada caso —`whatHappened` + `whyMatters`— debe alcanzar al menos ~1 página A4, en español e inglés (la cifra exacta y el techo viven en `/redaccion` §3).** `evidence` y `sources` aportan pero NO cuentan para la página: el estándar mide prosa, no listas — un caso con narrativa corta y listas largas sigue por debajo del estándar.

Esto extiende la regla anterior ("2-3 párrafos") porque el corpus dejó casos demasiado telegráficos para su tier. El auditor `audit-consistency.mjs` (regla **E13**, corre en prebuild) reporta cuántos casos siguen bajo el umbral, con backlog por tier — es **WARN agregado, no ERROR**: el build no se rompe, pero el progreso queda medible. La expansión se hace **con investigación caso por caso** (fuentes primarias, no relleno), priorizando **Tier S → A → B**. Cualquier caso nuevo debe nacer cumpliendo el estándar. Una ficha cuya búsqueda de fuentes se agotó puede eximirse en `LONGITUD_CERRADA` (decisión del dueño, con la búsqueda anotada en [`docs/registros.md`](docs/registros.md#fichas-cortas--búsqueda-agotada)); un guard avisa si llega al estándar o deja de existir (Orcas Island 1994, oct 2026).

### Línea editorial · spanglish (jul 2026)

**En los campos ES (`name`, `summary`, `whatHappened`, `whyMatters`, `evidence`) el inglés descriptivo sin traducir es drift — el inglés vive en su par `*_en`.** Solo se permite inglés en títulos de documentos citados entre comillas y en nombres propios/instituciones. Enforced en dos capas de `audit-consistency.mjs`: **E7** (ERROR) cubre `name`/`summary` con lista-negra curada; **E7b** (WARN) cubre la **prosa** por racha + densidad verbal. La lección que creó E7b (jul 2026): E7 solo escaneaba `name`/`summary`, así que un párrafo en inglés pegado en la prosa era invisible a la auditoría — al confiar en una sonda, verifica QUÉ campos cubre, puede estar verde y ciega al 90% del texto. Cita el inglés verbatim largo entre comillas (E7b exime comillas, incl. apóstrofos internos tipo `member's`).

Si un caso no tiene rich content, la página de detalle muestra fallback "⏳ Caso pendiente de explicación detallada".

### Visor de documentos (`documents[]` / `primaryDocument`)

El detalle embebe documentos primarios inline (`components/PdfDoc.tsx` → react-pdf `dynamic(ssr:false)` para `type:"pdf"`; `<img>` server para `type:"image"`). **`src` debe ser embebible** — war.gov bloquea el framing de terceros, así que solo se admiten dos orígenes con garantía de embed:
1. **Same-origin `/pursue/`** — archivos ≤30 MB commiteados en `web/public/pursue/` (viajan con el repo, se despliegan a gh-pages).
2. **Bucket Supabase Storage `pursue`** — `src` = `…/storage/v1/object/public/pursue/<name>`, para los 30-50 MB (o partes `__partNofM`) que GitHub no aloja.

Tres capas de sonda protegen el visor (todas corren en prebuild salvo la viva):
- **`validate-schema.mjs`** (ERROR): `type` ∈ {pdf,image} coherente con la extensión de `src`; `src` debe ser `/pursue/` o el bucket (nada de war.gov); `fallbackUrl` bien formada.
- **`audit-consistency.mjs` E17** (WARN): cada asset `/pursue/` same-origin existe en `web/public/`.
- **`audit-consistency.mjs` E20** (ERROR): cada documento que referencia el **bucket Supabase** está en `data/pursue-bucket-manifest.json`. El build no puede consultar `supabase.co` (allowlist), así que el manifiesto es la verdad offline; la **sonda viva diaria** (Routine CCR) lo mantiene honesto contra `storage.objects`. Regenerar el manifiesto: `select name from storage.objects where bucket_id='pursue' order by name`.

**Cobertura de visual · regla E21** (jul 2026, WARN agregado): todo caso debería embeber al menos un asset visual —`documents[]`, `primaryDocument` o `featuredDoc` (PDF o imagen)— para que el detalle no sea solo prosa. `audit-consistency.mjs` E21 reporta cuántos casos no tienen ninguno, **separando los ACCIONABLES de los cerrados por licencia** (a oct 2026: 0 accionables, tras el barrido R6 del 16 oct; cifra viva = la que reporta E21). La exención sale del mapa `VISUAL_CERRADO_POR_LICENCIA` y **cada entrada tiene su barrido agotado documentado** en [`docs/registros.md`](docs/registros.md#documentos-y-assets-visuales-pursue-commons-archiveorg): Commons + archive.org + Openverse secos, o meta/institucionales sin documento de incidente único. Es el mismo principio que `NOT_DEAD` en `check-links.mjs` —separar «no lo tenemos» de «no se puede tener»—, porque una sonda que pide todos los días algo imposible se acaba silenciando igual que una incorrecta. **La exención no es un desván**: un guard avisa si un caso exento consiguió visual o dejó de existir, para que la lista no esconda progreso real. *(Al buscar un asset, lee el registro primero: `ariel-school-1994` era el último Tier S pendiente y está cerrado, no sin buscar.)* Es **WARN, no ERROR** (mismo patrón que E13): conseguir el asset exige rehostear caso por caso en `/pursue` o el bucket porque war.gov bloquea el embed; el conteo deja el progreso medible, prioridad **S→A→B**. Para las fichas nuevas sí es exigible desde el `num` 535 (**E63**, ERROR, 18 nov 2026, decisión del dueño): visual embebido o exención en `VISUAL_CERRADO_POR_LICENCIA` con su barrido en `docs/registros.md`, porque la serie de abducciones llevó el backlog accionable de 0 a 6 con todos los checks en verde. Para el resto del corpus sigue siendo WARN: al expandir un caso, si hay un documento primario embebible, móntalo.

**Registros (NO re-buscar) · de dónde salen los assets visuales** — origen de los binarios PURSUE (Drive del dueño), el mirror de dominio público en `archive.org/details/wargovUFO`, la reachability real de Commons/WikiLeaks/Openverse vía proxy, y el barrido E21 Tier-A completo: todo en [`docs/registros.md`](docs/registros.md#documentos-y-assets-visuales-pursue-commons-archiveorg). **Consúltalo antes de buscar un asset** — la mayoría de los huecos que quedan ya se barrieron y están cerrados por licencia, no por falta de búsqueda.




## Evidencia (qué es cierto y cómo se comprueba)

Hogar único de las reglas de evidencia (mapa MECE, nov 2026): fuente primaria, acceso a la fuente, atribución, omisiones, ausencias y fechas. Los briefs de los agentes y las skills apuntan aquí en vez de repetirlas. El método de dos pasos para clasificar vive en «Modelo de probabilidad». Los casos que dieron origen a cada regla están en [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#evidencia) (movidos allí el 18 nov 2026 para aligerar este archivo, que cada agente lee entero).

**Acceso a la fuente: la ausencia de señal en una sonda no es una afirmación sobre el contenido.**
- **No** dar por vacío un documento de Drive porque `read_file_content` devuelva `""`: por encima de ~50 MB lo hace sin error; `download_file_content` corta en 10 MB con error explícito. Por encima de 50 MB, partir en origen o usar el espejo de dominio público `archive.org/details/wargovUFO`. Antes que partir: con el archivo o su carpeta en «cualquiera con el enlace», `curl -L "https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t"` lo baja entero desde el contenedor, y lo comprueba el tamaño, que debe coincidir con `fileSize` (el conector no quita permisos: el dueño cierra el acceso después; entrega 08, nov 2026). `war.gov`, `defense.gov`, `media.defense.gov` y `aaro.mil` dan 403 desde el contenedor.
- **No** pedir al usuario que parta un fichero sin buscar antes el espejo: los PDF de PURSUE están en `archive.org/details/pursue-uap-documents-2026` (busca el `DOW-UAP-Dnnn` en `/metadata/…/files`), Blue Book en `collection:project-blue-book` (por número de expediente) y la sala de lectura de la CIA, con OCR en `_djvu.txt`. Un segundo escaneo verifica las lecturas dudosas del primero.
- **No** dar por vacío ni por ilegible un PDF sin mirar su estructura: páginas, texto e imágenes por página (`pypdf` o `pymupdf`; los cifrados con AES piden `cryptography`; respeta `/Rotate`). Si hay imagen y no texto, es un escaneo: se renderiza y se mira (y `tesseract` si está instalado).
- **No** dar por ilegible una publicación de X que no carga sin JavaScript: `cdn.syndication.twimg.com/tweet-result?id=<id>&token=a` devuelve el texto y la hora en UTC, y `api.fxtwitter.com/status/<id>` el texto entero si aquel lo trunca (bólidos de Chile y Tennessee, nov 2026).
- **No** tomar el título de un video DVIDS como metadata oficial: lee el `og:description`; en el Release 02 el título lo puso quien subió el archivo y falta la cadena de custodia ([`docs/dvids-inventario.md`](docs/dvids-inventario.md)).
- **No** fiarse del OCR para una cifra o fecha que decide algo, ni de una transcripción automática sin comprobar que cubre toda la duración: renderiza la página, transcribe con dos modelos y cita lo que coincide; la transcripción ajena de un manuscrito también se coteja con el escaneo.

**Ausencias.**
- **No** afirmar una ausencia («no existe», «no se publicó») que se apoye en una búsqueda: un «0 resultados» puede ser el límite del término o del índice (el de DVIDS no ve sus items recientes; usa `/unit/AARO` y el barrido de IDs ±150). O se verifica por una superficie enumerable, o se escribe en forma impersonal («no se conoce»), según `/redaccion` §7 *(E56)*.
- **Antes de escribir que algo falta, grep el corpus por el instrumento que falta**: la contraevidencia más barata es la que ya tenemos. Los nombres de cargos se fijan contra el registro oficial, no contra la cobertura.

**Atribución, veredictos y fechas.**
- **No** trasladar a la ficha la conclusión de una tarjeta de Blue Book sin leer el expediente: es un trámite, a veces posterior e imposible; es un dato del caso, no su resolución.
- **No** escribir el veredicto oficial ni los detalles de un caso de la época de Blue Book sin abrir su expediente en archive.org: los relatos secundarios inflan el misterio (23 de 25 fichas contrastadas en sep 2026). Toda cifra, maniobra o testigo con nombre sin fuente primaria se verifica antes de citarlo; el error inverso (desinflar por omisión) también ocurre: la fuente decide la dirección *(E41)*. Y la versión publicada se coteja también: Ruppelt (1956) cita telegramas que no están en el expediente, con otras cifras, y la ficha dice que difieren (Fürstenfeldbruck, nov 2026).
- **No** tomar la fecha de hallazgo o de entrega de un resto espacial como fecha de su caída: busca la designación en el GCAT.
- **No** dar por cerrada una fecha, una cifra o una anotación a mano porque una lectura parece la buena: cotéjala con las demás manos y amplía el escaneo; si no se resuelve, se escriben las dos lecturas, no una elegida en silencio (en Fürstenfeldbruck, «not Balloon» podía ser «Prob Balloon» e inclinaba el resumen, nov 2026).
- **No** identificar a una persona que el documento tacha («1843(a)(2)» y similares), ni por inferencia ni por cruce: ponerla en un perfil, emparejarla con alguien que la ficha ya nombra por cargo, lugar o fechas, o atribuirle lo que dijo otro, la identifica igual. Se escribe solo lo que dice el documento («una médica de nombre tachado del hospital de Colares»). En el informe de BAASS de la entrega 08 salieron cuatro cruces en un día: nombres puestos por un lector, la médica de Colares, Puthoff con EarthTech y un coronel con Hollanda (nov 2026).
- **No** aceptar enlaces salientes a explainers secundarios de terceros; se declina por el motivo estructural (el corpus cita fuentes primarias), nunca por un vacío puntual del artículo, que invita a cerrarlo y volver a pedir.

**Catálogo de satélites** (GCAT de McDowell, `planet4589.org/space/gcat/tsv/cat/satcat.tsv`, descarga directa): para cualquier resto o luz de 1957 en adelante, antes de darlo por no identificado. Que la hora coincida no basta: el objeto tuvo que estar sobre el horizonte del testigo y con luz del Sol. Antes de escribir «solo» o «no dice dónde cayó», lee también `auxcat.tsv` (etapas y cofias) y la columna `Dest`: dos verificadores tumbaron afirmaciones así en las fichas de los bólidos de Chile y Tennessee (nov 2026).

**Bólidos recientes**: la fuente primaria es la página del evento en `fireballs.ndc.nasa.gov/skyfalls/events/` (cámaras de la NASA: trayectoria, velocidad, tamaño) y el GLM del GOES-19 en `noaa-goes19.s3.amazonaws.com/GLM-L2-LCFA/<año>/<día del año>/<hora>/`, que se lee con h5py y es una superficie enumerable. CNEOS y la lista de bólidos GLM de la NASA van semanas atrasados: que un evento reciente no figure no prueba nada (nov 2026).

## Modelo de probabilidad (MECE)

Las probabilidades son **comparables**: cada caso de incidente reparte el 100% sobre 6 narrativas **mutuamente excluyentes y exhaustivas** (campo `posterior`, suma 1). El corpus las agrega en el nº esperado de casos por narrativa —`Eⱼ = Σᵢ P(narrativaⱼ | casoᵢ)`—, que reparte el 100% y es comparable entre narrativas; al ser una esperanza (lineal) es válido aunque los casos estén correlacionados. Son juicios analíticos estructurados, NO frecuencias calibradas. El invariante (suma=1, 6 claves) lo valida `validate-schema.mjs`; detalle en el JSDoc de `lib/meceModel.ts`. Las revisiones que fijaron cada regla de abajo están en [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#modelo-de-probabilidad).

Cada narrativa bundlea **objeto + postura institucional**: `mundano_natural` (misidentificación + fenómenos naturales), `humana_clasificada` (programa propio/aliado, encubrimiento intrínseco), `adversaria` (tecnología de otro Estado), `nohumano_encubierto` (no-humano que un Estado conoce/controla/oculta — incluye ingeniería inversa y narrativa de tratado), `nohumano_abierto` (no-humano que nadie controla — tipo Vallée / interdimensional / ontológico), `indet`. Las hipótesis del marco anterior se conservan en `legacyHypothesis` de `MECE_CLASSES`. Vistas derivadas: `entidades-no-humanas` = `nohumano_encubierto` + `nohumano_abierto`; `heterogeneidad` = 1 − `mundano_natural`.

**Clasificación.**
- La clasificación —`posterior`, `probability`, `mundanoType`— se asigna **solo después de leer la evidencia primaria del caso**, nunca desde un resumen de Wikipedia o de un agregador: el código suma lo que la ficha declara, y un reparto sin leer la evidencia contamina todos los conteos del sitio. Al terminar, `evidenceReviewed` (AAAA-MM-DD) *(E42)*.
- **Método obligatorio para revisar clasificaciones: dos pasos, dos agentes.** Uno corrige contra la fuente primaria ([`docs/brief-revision-evidencia.md`](docs/brief-revision-evidencia.md)); otro, distinto, verifica en solo lectura cada afirmación añadida, cada eliminación y cada omisión; los arreglos del verificador se contrastan otra vez con la fuente. El error más frecuente es la omisión de lo que, en el **mismo** expediente, contradice la lectura del corrector; y los verificadores también se equivocan.
- En la prosa **no** se califica la probabilidad («probabilidad baja», «sube a…»): es un número derivado y el texto caduca. Todo barrido de prosa revisa también los campos `_en`.
- **La `probability` de un incidente no se escribe a mano**: es `round(100 × (indet + nohumano_encubierto + nohumano_abierto))` *(E43)*.
- **Clase prosaica con su porqué** (`classBasis`, ES+EN+fuente; E44): la clase la nombra una **fuente** que figura en `sources` o en el visor, no la prosa de la ficha *(E48)*. Si ninguna fuente propone causa tras buscar a fondo, la masa queda en `sin_propuesta` («Causa ordinaria probable, sin identificar») por la tasa base de casos parecidos, citándola; solo va a `indet` si la evidencia misma argumenta contra las causas ordinarias. Con capas, la clase cubre solo la capa que la fuente explica.
- **Propuesta refutada ≠ propuesta débil**: si el propio registro refuta la única causa propuesta, cuenta como si nadie la propusiera (`sin_propuesta`); si solo es débil o discutida, la clase se mantiene y el `classBasis` dice qué se le opone. El «pero…» de un `classBasis` no basta para marcar una refutación: se lee el registro.
- **Ningún documento tiene ficha propia**: vive en `documents[]` (con `description`/`description_en`) del caso o del perfil de actor que respalda, o como tarjeta `type: "link"`; la URL vieja redirige vía `lib/caseAliases.ts` *(validate-schema; E25)*.

**Tier de los incidentes = fuerza de la evidencia, no qué fue.** El texto publicado vive en `TIER_META` (`lib/ui.ts`) y `/about` lo lee de ahí.
- **S**: un registro instrumental de la época (radar, sensor, película o foto con procedencia conocida) que corrobora a varios testigos independientes. **A**: varios testigos independientes identificados, o documentación oficial de la época, sin instrumento que los corrobore. **B**: un solo testigo, testimonio recogido años después o relato sin documentación primaria de la época. Sin instrumento, ningún caso pasa de A.
- Precisiones (14 oct–24 oct 2026, decisiones del dueño):
  1. El registro debe **coincidir** con lo que vieron los testigos (ecos sueltos, otro sitio u otra hora no corroboran).
  2. Cuenta el informe oficial **de primera mano** de la época que atestigua el contacto aunque no se conserven los datos; no el de segunda mano.
  3. Un instrumento de procedencia conocida con la tripulación institucional que lo operaba es S aunque solo uno declare; sin testigos, A.
  4. Un solo testigo con documentación oficial del mismo día es A, igual que el caso cuyo instrumento registra un efecto y no el objeto.
  5. La documentación oficial de primera mano del día siguiente cuenta como de la época.
  6. El video civil de un operador identificado sin más testigos independientes identificados queda en A (en B si el video no se publicó y los testigos no tienen nombre).
  7. Varios instrumentos institucionales que se corroboran, o uno con sus operadores, son S aunque nadie viera el objeto.
  8. Testigos que vieron lo mismo juntos cuentan como un solo testimonio.
  9. La documentación oficial que transmite un relato de segunda mano, sin testigos identificados, no basta para A.
  10. Un solo testigo cuyo informe oficial llega semanas después es B.
  11. «Con sus operadores» exige un parte o declaración de quien operaba el sensor; sin ella es un instrumento sin testigos (A). Por eso los clips de sensor con cadena institucional (entregas 01, 04 y 06 de PURSUE) son A, y los del Release 02, sin cadena de custodia, B.
  12. Muchas fotos civiles independientes en un expediente oficial de la época son registro instrumental (S); sin fotógrafos identificados ni expediente, A.
  13. La regla 7 no anula la 1.
- **Plazo**: el informe de primera mano de la propia unidad con testigos identificados vale como de la época hasta una semana después (A); desde dos semanas, B. El plazo mide el testimonio, no el registro instrumental: los registros del radar transcritos minuto a minuto valen aunque lleguen semanas después.
- Una ficha que no muestra su registro no prueba que no exista: se busca en la fuente antes de bajarla de tier.
- El redactor propone el tier citando el número de regla, y comprueba la regla 1 calculando distancia y hora cuando une dos registros, y la 11 cuando hay un solo sensor: en nov 2026, tres de seis tiers propuestos eran demasiado altos y los bajó el verificador (Haifa A→B, Soroca A→B con dos detecciones a la misma hora y a más de 300 km, Chile S→A con un solo sensor sin declaración de su operador).

**Lección viva** (sep 2026): un test sobre valores crudos no cubre lo que el usuario lee en pantalla; `test-chart.mjs` asserta los enteros impresos (`pctParts()` reparte por *largest remainder*).

### Críptidos (25 nov 2026, decisión del dueño)

- Colección aparte en `data/cases/` con `category: "cryptid"`: mismo formato, `/redaccion`, reglas de evidencia y tier (precisión: un análisis de laboratorio con procedencia conocida —pelo, ADN, molde de huella— es registro instrumental aunque identifique un animal corriente). El `num` sigue la secuencia común.
- Sin `posterior`: llevan `posteriorCripto` (`ordinaria`, `fraude`, `no_catalogada`, `extraterrestre`, `interdimensional`, `indet`; suma 1) y `cryptidClass`; `classBasis` obligatorio si la clase es `ordinaria` o `fraude`; ni `mundanoType`, `misidSubtype` ni `objectDetail`. *(validate-schema)*
- `probability` («sin explicar») = `Math.round(100 × (no_catalogada + extraterrestre + interdimensional + indet))`. *(E43c)* **Excepción (25 nov 2026, decisión del dueño):** si la especie ya está descrita —el críptido resultó ser un animal real: celacanto, okapi, saola, takahē, sengi—, la ficha lleva `speciesDescribed: true` y `no_catalogada` **no suma**, porque la ficha cuenta un caso explicado y «99 % sin explicar» decía lo contrario (los cinco verificadores lo marcaron). Solo vale en `category: "cryptid"`. *(validate-schema; E43c)*
- Categoría y criatura (25 nov 2026, decisión del dueño): cada críptido lleva `cryptid`, el id de una criatura de `data/cryptid-taxonomy.json`, que fija su categoría; las categorías son términos establecidos de la criptozoología (homínidos peludos, serpientes marinas, globsters, taxones Lázaro…), no propios, porque «homínido» a secas juntaba demasiado y una categoría inventada no se puede citar. Una criatura nueva se suma al JSON con su categoría. *(validate-schema)* «Taxones Lázaro» es solo para una especie que se daba por extinta o perdida y reaparece (celacanto, takahē, sengi); el okapi y la saola nunca se habían descrito y van en «Especies descubiertas» (25 nov 2026, decisión del dueño; el nombre es provisional hasta que el dueño lo confirme).
- **Tier de un ejemplar físico (25 nov 2026, decisión del dueño):** S si el ejemplar tiene un análisis publicado (morfología o ADN) con operadores identificados que lo firman; A si solo hay descripción o testimonio. Un cambio de tier pasa por el método de dos pasos de CLAUDE.md › Modelo de probabilidad. *Precisiones al aplicarla (clasificador independiente, 25 nov 2026; por confirmar por el dueño):* «solo descripción» es la de un animal sin ejemplar examinado (relatos), no la descripción taxonómica de un holotipo; el tier mide la fuerza del registro y no su acierto (los análisis de pelo del okapi dieron cebra y siguen contando); con ejemplar, el análisis debe ser del ejemplar del episodio y puede ser posterior; sin ejemplar analizado (el takahē) se aplican las reglas S/A/B de los incidentes. Aplicado el 25 nov 2026: celacanto, okapi y saola A→S; sengi S; takahē A.
- Fuera de todo total UAP: `build-cases.mjs` los saca de `cases.json` (y de ahí del cliente, el atlas y `site-stats`) y los escribe en `data/cryptids.json`; en `audit-consistency.mjs` las reglas del modelo y de los totales usan `uapCases`, y las de prosa, roles, lugar, E25 y E63 el corpus entero. Se publican en `/cryptids` y en una capa del atlas apagada por defecto; método en `/about#criptidos`.

## Convenciones de UI

Las convenciones de código y de UI que no tocan los datos (componentes, tokens, «Qué fue», rótulos) viven en [`.claude/rules/codigo-sitio.md`](.claude/rules/codigo-sitio.md), que Claude carga solo al leer `web/app`, `web/components` o `web/lib`. Aquí queda lo que también gobierna los datos de una ficha:

- **Ficha de caso: un orden fijo y un solo criterio (especificación de la ficha, 24 oct 2026, decisión del dueño).** El orden es: cabecera (lugar, título, resumen entero), tier, «Qué fue», **registro del suceso**, «Qué pasó» y «Por qué importa», «Documentos y fuentes», contexto y relaciones. Cada elemento visual (`documents[]`, `primaryDocument`, `featuredDoc`) lleva `role`: `prueba` (registra el suceso; va antes del relato, hasta dos), `documento` (papel sobre el caso; va después del relato) o `contexto` (lugar, avión, persona; va al final). La página ordena **solo** por `role` (`lib/caseVisuals.ts`), nunca por el campo ni por el tipo. Así se hizo porque los arreglos sueltos rompían la lógica: al bajar el visor, la foto de Trent quedó entre el papeleo mientras la entrada del rancho Skinwalker iba arriba, y la tarjeta destacada se quedó encima del relato. *(enforzado: `audit-consistency.mjs` **E53**, ERROR si un elemento no tiene `role` válido; **E52**, ERROR desde el 31 oct 2026 (cerró la capa 2: las 396 fichas pasaron por redactor y verificador) con los límites de la guía `/redaccion`; `npm run qa:relato` (on-demand, no gate del build; aborta si `out/` está rancio) mide en móvil todas las fichas y falla si el primer contenido del caso pasa de 2,5 pantallas o si se cuela algo entre la cabecera y él. Controles negativos corridos.)*
- **«Dónde ocurrió»: mapa de la región (16 nov 2026, decisión del dueño).** Un SVG estático por ficha e idioma que genera `scripts/build-maps.mjs` en el prebuild (`public/maps/`, gitignored; Natural Earth 1:50m vía `world-atlas`, estados de EE. UU. vía `us-atlas` y hasta seis ciudades de referencia de Natural Earth *populated places*, reducidas en `scripts/data/ne-populated-places.json` y colocadas sin pisar el lugar ni los rótulos; sin teselas ni JS), y que `components/RegionMap.tsx` coloca al cierre de «Qué pasó», para no retrasar «Qué fue» ni el relato. Obedece `location.precision`: `exact` dibuja el punto, `approx` una zona y `none` (lugar no revelado, órbita, la Luna) no lleva mapa. Al revisar las coordenadas para el mapa, 32 fichas sin lugar revelado tenían coordenadas de relleno (Oriente Medio en 33, 44, Bagdad) y Mantell estaba en el centro de Kentucky: un punto en el mapa afirma un lugar, así que la precisión va antes que el dibujo. *(enforzado: `validate-schema.mjs` exige `precision`; `audit-consistency.mjs` **E61**, ERROR si un lugar no revelado o fuera de la Tierra no es `none` o un punto `exact` tiene coordenadas enteras; controles negativos corridos.)*

## Deploy

- Workflow `.github/workflows/deploy-pages.yml` corre en push a `main`.
- **Almacenamiento cerca del techo**: `web/public/` (~700 MB del gigabyte de GitHub Pages) y el bucket Supabase `pursue` (~272 MB, tope de 50 MiB por objeto); cifras vivas = **E38** (WARN al 75 %, ERROR al 95 %; lee el bucket del bloque `totals` del manifiesto). Son directorios de solo-crecer: antes de sumar un documento entero, pesa un extracto. Para recomprimir escaneos (tramados → gris a ~130–180 ppp; color de documentos en blanco y negro → gris a ~115 ppp, q50, con pikepdf conservando la capa de texto; manuscrito sobre papel amarillento, en color) y cómo se subió al bucket: [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#deploy--presupuesto-de-almacenamiento).
- Dual deploy: peaceiris (gh-pages branch) + actions/deploy-pages (artifact) — belt-and-suspenders por ambigüedad histórica del Pages source config.
- URL pública: https://uapcodex.org/ (custom domain) y https://dgonzamat.github.io/Mercadopublico/.
- `basePath` en CI: `${{ steps.pages.outputs.base_path }}` (auto-calculado por GitHub Pages desde el nombre del repo). En local `next.config.mjs` deja `basePath` **vacío** (`NEXT_PUBLIC_BASE_PATH || ""`), porque el sitio se sirve desde la raíz de `uapcodex.org`. **No** sirvas `out/` bajo `/Mercadopublico` en una sonda: el router del cliente no reconoce `/es`, pasa el chrome a inglés y lanza el error #418, y la auditoría de noviembre de 2026 tomó por defectos del sitio (pie y aviso de cookies en inglés, #418) lo que era de su sonda de capturas.
- **Para verificar qué se desplegó**, lee el artefacto construido desde la branch `gh-pages` vía GitHub MCP (`get_file_contents`, ref `gh-pages`) — el saliente a la URL viva (`uapcodex.org`/`github.io`) y a Google lo bloquea la allowlist del proxy (403 a CONNECT; `curl` da 000, `WebFetch` 403, Playwright no llega), pero `raw.githubusercontent.com` y la API de GitHub sí. Los chunks del `initial load` salen de los `<script>` de `index.html` en `gh-pages`. (jul 2026)
- **GA4 está consent-gated** (`components/CookieConsent.tsx`, ID `G-MZHZC5ZLY5`): `gtag.js` no carga hasta que el visitante toca «Aceptar», así que el HTML estático nunca dispara el hit y GA marca "No data received" hasta que alguien acepta — verificar con **Realtime en incógnito** (el Home de GA tarda 24–48 h), no asumir que falta el tag. (jul 2026)

## Contador de visitas (/visitantes) (jul 2026)

- **Dos capas**: beacon cliente (`components/VisitorBeacon.tsx`) y gate server-side en la función SECURITY DEFINER de Supabase (migraciones `0005`–`0007`: 1 visita/día por IP hasheada con salt, tope de 15 pageviews/día/IP, exención `tracking_exempt`). Solo la capa server es inescapable; el país lo pone el servidor (`cf-ipcountry`), no el cliente. *(E19 y sonda viva diaria)*
- **Origen de la visita** (migración `0011`, 20 nov 2026, decisión del dueño): solo el dominio de la página de entrada (`document.referrer` guardado al inicio de la sesión), reducido a dominio en el servidor y contado una vez por visita con el mismo gate. Nunca la URL completa; cubre a todo visitante, no solo a quien acepta cookies como GA4.
- **Los cuatro totales del panel no cuadran entre sí, y es correcto**: visitantes-día frente a pageviews, con series que arrancan en fechas distintas. No «arreglarlo».
- **Probar el gate desde una sesión remota**: `pg_net` (la base llama a su propia API REST). El gate falla abierto sin contexto PostgREST, así que no se prueba por SQL directo.
- **`public.app_content` es de otra app** del mismo proyecto Supabase: no borrarla.
- **Bloquear el scraper** exige Cloudflare delante (DNS en Porkbun → GitHub Pages; Vercel no sirve el sitio). Decisión vigente: no hacerlo mientras el daño sea solo de métricas.

Detalle e historia: [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#contador-de-visitas).

## Branch protocol

- Develop en branches `claude/<topic>-<suffix>`.
- PR → main como draft → ready → merge (squash). **El dueño autorizó (5 nov 2026) fusionar sin preguntar** los PR que abre Claude en este repo cuando la integración continua está en verde: no esperar su visto bueno.
- Cuando una branch tenga conflicto post-squash, crear branch nueva desde main en vez de rebase forzado.
- Commitear con `git config user.email noreply@anthropic.com` / `user.name Claude` para que el commit quede **verificado** — si no, el Stop hook lo marca "Unverified".
- **No** fusionar por squash un PR cuyos commits llevan `[skip ci]` sin escribir tú el mensaje del squash (`commit_message` sin esa marca): GitHub concatena los mensajes de los commits en el del squash, y un `[skip ci]` heredado hace que el push a `main` **no dispare el deploy**. Pasó con #938 y #939 (29 sep 2026): los dos quedaron en main sin publicarse y el sitio siguió mostrando la versión anterior hasta lanzar `deploy-pages.yml` a mano (`workflow_dispatch`). Los WIP intermedios pueden llevar `[skip ci]` (evitan CI cancelados que llegan como correos de fallo), pero el mensaje final no. **Y el último commit de la rama tampoco**: desde el ruleset de `main` (20 oct 2026) el merge exige el check `validate` del evento del PR, un head con `[skip ci]` no lo genera y el `workflow_dispatch` manual no cuenta (el merge da 405 «Required status check "validate" is expected»).
- **Para publicar solo lo verificado mientras otros agentes editan el árbol**, arma el commit sin tocar el árbol: `export GIT_INDEX_FILE=/tmp/idx; git read-tree origin/main;` `git update-index --add --cacheinfo 100644,$(git hash-object -w <f>),<f>` por cada fichero listo; `git commit-tree $(git write-tree) -p origin/main` y empuja ese commit a una rama propia para el PR. Así salieron los PR #1212–#1230 (oct 2026) sin arrastrar fichas a medio verificar ni el `[skip ci]` de los WIP.
- Tras mergear un PR, si reinicias la branch con `git checkout -B <branch> origin/main`, el Stop hook marcará el **commit de squash-merge de GitHub** como Unverified — es **falso positivo** (lo firmó GitHub, ya está en `main`): **no** lo amendes (reescribiría historia mergeada).

## Anti-patterns conocidos

Las líneas que terminan en ↪ tienen su relato completo (casos, cifras, diagnósticos) en [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#anti-patterns--relato-completo); aquí queda la regla, su causa y su vigilante.

### Esquema y datos

- **No** dar por libre el siguiente `num` ni por verde un PR de fichas nuevas sin rehacer `validate-schema` contra el `main` actual justo antes de fusionar (dos PR calcularon el mismo `max(num)+1` con CI verde y `main` quedó en ERROR, nov 2026): con varias sesiones abiertas, `git fetch` y recalcula al abrir el PR, y tras cada fusión `git merge origin/main` en los demás y repite las sondas. ↪

- **No** generar `cases.json` manualmente para commitear — siempre vía `node scripts/build-cases.mjs` (o `npm run build` cuando hay `node_modules`; ver la regla de abajo).

- **No** asumir `node_modules` instalado (las sesiones remotas / CI fresco parten sin él) — para regenerar o validar el corpus corre los scripts node directos desde `web/` (`node scripts/build-cases.mjs`, `validate-schema.mjs`, `audit-consistency.mjs`; todos sin dependencias), no `npm run build`/`next build` (que sí requieren `next`).

- **No** dejar archivos de prueba temporales en `data/cases/` — `validate-schema.mjs`, `build-cases.mjs` y el conteo `cases:` los recogen por `readdirSync`, así que inflan el número y pueden romper el build (un `_test.json` hizo reportar 317 en vez de 316); bórralos antes de confiar en el conteo. *(enforzado: `audit-consistency.mjs` E22 — ERROR si un basename lleva un token de basura tipo test/tmp/copy/bak/draft/prueba/`~`/`(n)`; new/old/final se excluyen porque aparecen en slugs reales)*

- **No** reserializar fichas con `JSON.stringify` para un barrido: 32 de 434 no se reescriben idénticas y el diff arrastra cambios ajenos al barrido. Sustituye cadena por cadena sobre el texto del archivo y comprueba que el diff tiene solo las líneas esperadas (barrido de E62, 47 fichas, nov 2026).

- **No** fusionar ni borrar una ficha sin anotar su `num` en `data/retired-nums.json` (registro en [`docs/registros.md`](docs/registros.md)): sin él, un `num` duplicado pasa inadvertido (se listaban 2 retirados y había 16, oct 2026). *(E45, ERROR)* ↪

### Escritura (la guía vive en `/redaccion`)

- **No** escribir markdown en la prosa de los casos (regla en `/redaccion` §7): el detalle solo interpreta `[[slug]]`, así que `**`, `- ` y `#` salen crudos, y un `\n` simple colapsa a espacio. Para enumerar, funde los ítems con «;». El defecto no se ve en el JSON sino en `out/cases/<slug>/index.html`: antes de usar un markup, confirma quién lo renderiza. *(E52, ERROR)* ↪

- **No** dejar en la prosa (regla en `/redaccion` §7) tareas del redactor, bitácoras de corrección, rankings dentro del corpus, código entre comillas invertidas ni descripciones del reparto («el posterior carga…»): el lector toma lo primero por análisis, y lo demás caduca o sale crudo. Lo pendiente se escribe como hecho («queda por ver si…»), lo corregido solo en su versión correcta, se enlaza con `[[slug]]` y se explica la evidencia. Las muletillas del redactor rompen el build (E56, marcadores en `scripts/lib/prose-markers.mjs`; lo citado no cuenta). *(E47, ERROR)* ↪

- **No** mostrar en la ficha texto extraído automáticamente de la prosa (la «cita destacada» en rojo que sacaba una frase de `whatHappened`): un corte por heurística parte frases, pierde el sujeto o el contexto y queda como titular de la página; estaba mal en más de 60 de las 109 fichas que la mostraban y se quitó del detalle (oct 2026). Lo que se destaca lo escribe un redactor en un campo propio, o no se destaca.

### Visuales y documentos

- **No** dar por sano un proveedor de teselas ni ningún recurso servido como imagen por su código HTTP ni por su peso: la tesela de error llega con 200 (CARTO estampó «API KEY REQUIRED» sobre `/atlas`, sep 2026); descarga la imagen y mírala. Por eso `maxNativeZoom={16}` en `components/WorldMap.tsx`: Esri sirve un cartel más allá del zoom 16. ↪

- **No** dejar al azar el orden de `documents[]` con más de cuatro PDF: el visor muestra solo los cuatro primeros y esconde el resto (el informe de BAASS de Skinwalker quedó oculto, oct 2026). Lo que importa va primero; más de dos `prueba` pasan a `documento`. *(E53, ERROR)* ↪

- **No** enlazar una imagen de Commons por su original ni con más de 960 px: desde el contenedor el original y `?width=1280` dan 429, y `?width=960` o menos da 200 (nov 2026). Espacia las consultas, porque una ráfaga bloquea toda la sesión, y si la imagen es de un observatorio o agencia, bájala de su sitio. ↪

- **No** poner imágenes generadas con IA en una ficha, ni como contexto (decisión del dueño, 13 nov 2026): en un sitio de evidencia se leerían como registro del suceso. Solo imágenes oficiales o institucionales con licencia que permita alojarlas; si no hay, el caso queda sin visual del suceso (la foto de contexto no cuenta). Lo ya agotado está en [`docs/registros.md`](docs/registros.md). ↪

### Proceso y agentes

- **No** dar por cerrada una corrección de prosa (parche, deuda de lectura) sin releer el párrafo entero, ni dejar en la prosa una frase que remite a un dato que se movió a `evidence`: el lector solo ve la prosa. En la ficha de Belo Horizonte 1985 (18 nov 2026), dos de los defectos que quedaron tras tres lecturas los escribió el orquestador al corregir, y «encaja con el final de la grabación» remitía a un dato que solo estaba en `evidence`.

- **No** lanzar un agente para lo que cabe en otro que ya corre o en el orquestador, ni usar `general-purpose` para el trabajo por ficha: cada agente paga su contexto antes de trabajar, y un `general-purpose` vacío cuesta ~112k tokens frente a ~47k del tipo propio `ficha-trabajo` (medido el 18 nov 2026). En el piloto de cuatro fichas ese costo fijo fue el 52 % de 2,16 millones. El reparto por ficha y los tipos de agente viven en `/nuevo-caso` › Orquestación.

- **No** usar un subagente como lector ciego: recibe `CLAUDE.md` entero, con la guía de redacción y el modelo MECE, y el antiguo `ficha-lector` citaba la E56 de memoria (20 nov 2026). La prueba del lector corre con `tools/lector-ciego/lector.mjs`, fuera del repo y con `--setting-sources local`, que deja fuera también el `CLAUDE.md` global.

- **No** proponer al dueño montar un documento en una ficha, ni dárselo a un agente, sin buscar antes su código en `docs/registros.md`: D44 se había sacado el 15 nov 2026 del caso del golfo de Adén porque su cuadrícula cae frente a Omán, y el 21 nov se volvió a proponer como «mismo golfo», se aprobó y hubo que revertirlo.

- **No** lanzar más de ~4 agentes pesados a la vez ni poner dos a editar el mismo fichero: con seis simultáneos la sesión chocó con el límite de uso y dos murieron sin editar nada; y los commits WIP periódicos del Stop hook recogen a medias el trabajo de un agente que sigue escribiendo. Tandas de 4 correctores, y el verificador de una tanda solo cuando su corrector terminó. *(sep 2026)*

- **No** dar a un agente rutas relativas ni un nombre de lote sin comprobar que está libre: un agente escribió `rewrite/` en la raíz del repo en vez de en el scratchpad, y tres encontraron `parche-B14.json`, `B16` y `verif-B15.md` de lotes anteriores e improvisaron otros nombres (oct 2026). El brief lleva rutas absolutas y un nombre de lote nuevo; antes de publicar, `git status` no debe mostrar nada fuera de `web/`.

- **No** reportar la deuda solo con lo que mide la auditoría ni arrastrar una lista anterior sin comprobarla: la deuda que se lleva a mano desaparece en silencio y la resuelta reaparece como pendiente (pasaron las dos cosas, oct 2026). Cada lista arrastra todos los puntos de la anterior con su estado verificado hoy, y ninguna cifra se copia: `npm run deuda` mide lo medible y lee lo demás de `data/debt-manual.json`, que no admite cifras. ↪

### Operación

- **No** clasificar `cloudflare|fastly|akamai` como "IP de datacenter" en filtros anti-bot (son el egress de iCloud Private Relay y VPNs de consumidor — bloquearlos descarta Safaris humanos reales). *(enforzado: `audit-consistency.mjs` E19b)*

- **No** filtrar bots solo en el cliente — cualquier cliente con la anon key llama los RPC de conteo directo, y un crawler con Chrome "real" pasa UA + engagement; el gate tiene que vivir en la función SECURITY DEFINER (ver sección Contador de visitas). *(enforzado: sonda viva diaria; jul 2026)*

- **No** tratar como link rot lo que solo dice que *nuestra sonda* falló: un 5xx es el servidor declinando, no una cita muerta, y un 404 visto solo con `HEAD` puede ser falso, así que se reintenta con GET; cuando varias roturas nuevas comparten dominio, sospecha del dominio (diez de quince eran el captcha de un mismo hosting, sep 2026). Las reglas del gate están en «Fuentes rotas». ↪

- **No** versionar `__pycache__/` ni `.pyc`: `tools/bucket-regray/__pycache__/regray_bucket.cpython-311.pyc` estaba en el repo y cada ejecución del script lo modificaba, con el Stop hook pidiendo commitearlo (oct 2026). Están en `.gitignore` desde entonces.

### Sondas

- **No** concluir nada de una sonda que lea `out/` (como `test-chart.mjs`) sobre un `out/` que no reconstruiste: queda rancio en el contenedor y casi hizo «arreglar» un test que pasaba (jul 2026). `rm -rf web/out` o reconstruye; un deploy verde ya prueba que `test-chart` pasa. *(test-chart aborta con «out/ RANCIO»)* ↪

- **No** recalcular en Python un valor que una sonda JS vuelve a derivar: `round()` de Python redondea el ,5 al par (26,5 → 26) y `Math.round` de JS hacia arriba (→ 27), así que E43 marcó dos casos recién recalculados como erróneos. Deriva con la misma aritmética que la sonda, o corre la sonda después. *(sep 2026)*

- **No** medir inglés suelto ni jerga sobre texto que contiene enlaces `[[slug]]` sin quitarlos antes: E52 contaba `[[pursue-release-2026]]` como la palabra «release» en la prosa y marcaba dos fichas limpias (oct 2026). La sonda quita los enlaces igual que las citas; control negativo corrido.

## Fuentes rotas (hard 4xx) en el corpus — 0 a 23 sep 2026 (eran 33 el 17 sep)

- **`npm run check-links:gate`** (semanal, `weekly-audit.yml`) falla solo con roturas **nuevas** frente a `data/link-health-baseline.json`, indexada por URL; abre o actualiza un único issue persistente (`<!-- link-rot-gate -->`). Cifra viva = `deadCount` del baseline.
- **No** contar como rotos `401/402/403/406/412/429` ni ningún `5xx` (`NOT_DEAD`), ni un 404 visto solo con `HEAD` (se reintenta con GET); si varias roturas nuevas comparten dominio, sospecha del dominio.
- `--update-baseline` rechaza congelar URLs nuevas sin `--force`; **E29**: una URL de `web.archive.org` rota la introdujimos nosotros.
- Si la fuente desapareció, un sustituto declarado en su `name` vale más que una cita muerta; un 200 no prueba que reviva (`cia.gov` redirige a la portada).
- Antes de fiarte de una sonda o de un buscador remoto, pruébalo con un caso de resultado conocido o una palabra inventada.

Historia, registro y vías de reparación: [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#fuentes-rotas) y [`docs/registros.md`](docs/registros.md#fuentes-rotas--vías-de-reparación-agotadas).

## Deuda pendiente · fotos de actores

55/140 actores con foto (20 nov 2026). El techo es la licencia, no la búsqueda. El campo `photo` es `https://commons.wikimedia.org/wiki/Special:FilePath/<filename exacto>?width=400`, con el nombre verificado, nunca adivinado. Vías que funcionan: la ficha de la página de Wikipedia del actor (también las locales) y la búsqueda de archivos de Commons por nombre entre comillas (en HTML, no por la API); si la API de Commons o de Wikipedia da 429 a la sesión, la página `File:` sigue respondiendo por WebFetch (nov 2026). Lee siempre la descripción: los homónimos abundan y «fair use» no es libre. Barrido hecho (NO re-buscar): [`docs/registros.md`](docs/registros.md#fotos-de-actores--barrido-de-commons); historia: [`docs/bitacora-reglas.md`](docs/bitacora-reglas.md#fotos-de-actores).

