---
paths:
  - "web/app/**"
  - "web/components/**"
  - "web/lib/**"
  - "web/tailwind.config.ts"
  - "web/next.config.mjs"
---
# Código del sitio (Next, i18n, SEO, UI)

Hogar de la categoría 8 del mapa de reglas de `CLAUDE.md`. Se carga solo al leer archivos de esas rutas, para que los agentes que trabajan en fichas no paguen estas reglas en cada arranque (nov 2026). Vigilantes: E15, E18, E23, E27, E31, E32, E33, E40 y `tsc`.

## Convenciones de UI

- Server components puros donde sea posible (zero JS shipped).
- **«Qué fue»: la cifra grande es la de la explicación que más pesa (15 nov 2026, decisión del dueño; reemplaza la regla del 13 nov).** La cifra grande es siempre la de la explicación con más peso dentro del grupo mayor, pase o no del 50 % («32 % tecnología humana clasificada»), debajo va una sola frase corta, sin cifras («La explicación más probable», «Ninguna explicación llega a la mitad», «La evidencia no alcanza para decidir»), y las cifras viven en una barra de hasta tres tramos con leyenda: la explicación que más pesa, el resto de su grupo y el otro grupo (diseño limpio, 16 nov 2026, decisión del dueño). Ponerlas en la prosa sumó seis cifras en Shag Harbour, dos repetidas con distinto sentido (35 % sin decidir y 35 % origen terrestre), y llamó «causa conocida» a una causa sin identificar. El porqué de clase va plegado tras una línea que nombra la causa («Causa ordinaria que proponen las fuentes: dron» o «Por qué no se identifica una causa ordinaria»), nunca «lo más probable es»; solo si manda lo indeterminado, que no es una explicación, la cifra grande es la del grupo. El grupo de las causas conocidas se rotula «Origen terrestre (humano o natural)» / «Earthly origin (human or natural)»: «Causa natural o humana» se leía como «era natural» en Skinwalker, donde lo que más pesa es la tecnología clasificada. Lógica en `CasePosterior` (`components/MeceChart.tsx`). La misma regla (primero el grupo que más pesa, luego la explicación mayor dentro de él, eligiendo sin fundir las dos no humanas) clasifica cada caso en `/cases`, `/probabilidades`, la portada y el laboratorio: `modalHypothesis` (`lib/meceModel.ts`) y `dominantNarrative` (`lib/meceClasses.ts`). Con el argmax simple, 26 fichas caían bajo una explicación distinta de la que mostraba su ficha (16 nov 2026).
- Headers de section: el componente `Eyebrow` (`text-sm font-semibold text-muted`, en minúsculas). Hasta oct 2026 iban en `font-mono uppercase tracking-widest`, y la ficha acumulaba ~17 rótulos en mayúsculas que competían con el contenido; no volver a las mayúsculas para rótulos de sección.
- Theme tokens en `tailwind.config.ts`: `bg`, `panel`, `border`, `text`, `muted`, `accent`, `tierS/A/B`.
- Badges: usar el static lookup `TIER_META` de `lib/ui.ts` (Tailwind JIT no compila clases dinámicas como `bg-${color}/10`).
- max-w container del detalle: `mx-auto max-w-3xl`.

## Anti-patterns de código

- **No** importar `fs` desde `lib/data.ts` (lo importa un client component y webpack falla). *(E18a)*
- **No** importar el corpus en un módulo alcanzable desde un componente cliente, ni de forma transitiva (embute los MB de `cases.json` en cada página: 5,23→0,92 MB de JS al arreglarlo, jul 2026). Precalcula el agregado en build y, para una visualización, proyecta un dataset con solo sus campos (`atlas-points.json`). *(E18d, parcial)*
- **No** adivinar el componente culpable del bundle: traza el grafo de módulos desde cada `"use client"`.
- **No** re-exportar una const y usarla en el mismo módulo sin importarla (el re-export no crea binding). Verifica con `tsc -p tsconfig.json --noEmit` y control negativo: `tsc <archivos>` no chequea nada (TS5112) y `--ignoreConfig` mata el alias `@/`.
- **No** hardcodear conteos ni recencia del corpus («la entrega más reciente»): se derivan (`STATS`, `Math.max`). Excepción: `CORPUS_START_YEAR = 1947` es un ancla editorial, no el mínimo del corpus. *(E39)*
- **No** usar el esquema `node:` en imports de Next (`fs`, no `node:fs`). *(E18b)*
- **Inglés es el idioma primario**: la raíz sirve inglés y el espejo español vive en `/es`; cada URL sirve un solo idioma (`locale` en `<T>`; el chrome lo toma de `chromeLocale(pathname)`).
- **No** renderizar crudo un campo con par `_en`: son cuatro superficies, el render (`<T>`), la metadata, el JSON-LD (`lib/jsonld.ts`, E33) y el índice de búsqueda (E40).
- **No** alimentar la metadata de la ruta inglesa con `seoTitle`/`seoDescription`, que son la variante ES: usa `seoTitle_en` o `name_en`.
- **No** declarar `alternates.languages` sin espejo real, ni omitirlo cuando existe: el hreflang es recíproco. *(E31)*
- **No** escribir a mano la metadata de una sección: `pageMeta` (Next no hace deep-merge de `openGraph`). *(E32)*
- **No** asumir `name_en` en `cases-client.json`: un `_en` nuevo en cliente va al dataset slim de la ruta que lo usa; en un `<select>`, `useLocale()`.
- **No** desalinear el set `MIRRORED` de `LocaleLink.tsx` y los directorios `app/es/*`. *(E23)*
- **No** agregar una ruta pública sin sumarla a `staticRoutes` de `app/sitemap.ts` o marcarla `noindex`. *(E27)*
- **No** emitir `Event` JSON-LD en casos: `Article` + `contentLocation: Place`. *(E15)*
- **No** proponer una vista nueva en `/innovar` sin listar `app/*/page.tsx` y grepear `lib/` (casi se duplicó `/cobertura`).
- **No** medir prosa contando `<p>`: las landings usan `Lede`/`H1`/`Eyebrow`.
- **No** fijar un `grid-template-columns` único con ítems `hidden <bp>:inline`: `grid-cols` responsivo por breakpoint.
- **No** dejar una cifra de `STATS` atada a una forma del dato que puede desaparecer (la portada dijo «0 documentos» cuatro días). *(E51)*
- **No** volver a `next/font/google`: las fuentes son locales en `web/app/fonts/` (el CI falló al descargarlas, oct 2026).

Causa e historia de cada línea: [`docs/bitacora-reglas.md`](../../docs/bitacora-reglas.md#código-del-sitio).
