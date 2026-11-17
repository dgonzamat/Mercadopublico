---
description: Operación dirigida por datos — lee los huecos de cobertura (país×década, tier) y el backlog de /innovar, y propone el próximo caso a crear, encadenando con /nuevo-caso. La innovación de la capa de operación.
argument-hint: "[opcional: foco, ej. 'un país sin cobertura' | 'una década rala' | 'subir un tier']"
---

Estás ejecutando el **selector del próximo caso**. `/nuevo-caso` crea un caso a ciegas — tú decides cuál. Este comando decide *cuál conviene más* mirando dónde el corpus está flaco, y luego encadena con `/nuevo-caso`. Convierte la operación de reactiva ("¿qué caso quieres agregar?") a dirigida por datos ("estos huecos son los de mayor leverage").

Regla dura: **no inventar casos**. Este comando identifica *huecos* y sugiere *eventos reales y documentados* que los llenarían. La creación real pasa por la disciplina de fuentes primarias de `/nuevo-caso`.

## 1. Medir los huecos (mismas señales que /cobertura e /innovar)
Desde `web/` (node plano):
```
node scripts/build-cases.mjs   # regenera cases.json si hace falta
```
Deriva de `data/cases/*.json`:
- **Cobertura país × década**: qué países tienen 1 solo caso, qué décadas están ralas (misma lógica que `app/cobertura/page.tsx`).
- **Distribución de tier**: dónde faltan casos Tier S/A (los de más peso).
- **Patterns/frameworks sub-representados**: patterns con pocos casos enlazados.
- **`num` siguiente**: `max(num)+1` (ver `/nuevo-caso`).

## 1b. NEWS-SWEEP — la frontera que la sonda de corpus NO ve
La sonda de §1 solo ve huecos **internos**; el corpus está **saturado en lo documentado clásico** (jul 2026: 25+ candidatos "obvios" —Voronezh, Colares, Hessdalen, Aguadilla, RB-47…— ya existían). Los candidatos reales que quedan son de **frontera**: eventos institucionales **posteriores al cutoff del modelo (ene 2026)** o aún no ingeridos, que **solo aparecen en noticias**. Casi se declara "corpus saturado" sin este paso — y un `WebSearch` destapó las *subpoenas del Senado (SSCI) a contratistas* y la *audiencia de nov 2024*, ninguna en el corpus.

Antes de proponer, corre `WebSearch` sobre eventos UAP **institucionales recientes** (audiencias del Congreso, informes oficiales AARO/GAO/NASA, desclasificaciones, acciones legales) y **cruza cada hit contra el corpus** (`grep`/node sobre `data/cases/*.json`) para descartar los ya cubiertos.

Disciplina no-negociable:
- **La noticia es una PISTA, no la fuente.** El candidato solo se ancla en `/nuevo-caso` a una **fuente primaria** (transcript oficial, informe, documento judicial) — no al artículo de prensa.
- **Solo institucional/documentado** — filtra tabloide y especulación (este dominio está lleno).
- **Caveat de entorno**: `WebSearch` funciona (US-only), pero **fetchear la fuente primaria a veces choca con la allowlist** (war.gov, media.defense.gov bloqueados) — usa los mirrors alcanzables (congress.gov, archive.org, rev.com para transcripts). Si no se puede anclar la fuente primaria, se descarta (regla anti-relleno).

### 1c. Casos en tendencia primero (17 nov 2026, decisión del dueño)
**Estrategia de crecimiento: los sucesos virales recientes van delante de los huecos históricos**, porque son los que la gente busca esa semana y traen lectores desde el buscador. Señal que la sostiene: en el panel de `/visitantes` del 17 nov, Anchorage 2026 (un video viral de junio) sumaba 59 + 6 vistas, el 50 % de las 129 del periodo, y la ficha del vuelo 15 de Starship, publicada el día anterior y cinco días después del suceso, ya era la segunda página más vista (7 + 4). Son cifras pequeñas de unos pocos días: la estrategia se revisa con la serie de Search Console, no con un pantallazo.

Cómo se aplica:
- En el news-sweep de §1b, busca también **avistamientos virales de los últimos 7–14 días** (videos de redes recogidos por la prensa, luces vistas en varios países), no solo hechos institucionales. Lo viral entra si tiene **una explicación oficial o una fuente primaria** (comunicado de una autoridad aeronáutica o espacial, catálogo GCAT, informe de una red de cámaras): Starship 15 (AHAC y Presidencia de El Salvador) y Victoria 2023 (ASA y DFN) son el modelo.
- La **rapidez** es parte del valor: una ficha publicada en la semana del suceso compite cuando la búsqueda está viva. El proceso no se acorta por eso (fuente primaria, verificador aparte, `/redaccion`); se acorta la espera para empezar.
- Título, resumen y `seoTitle_en` llevan las palabras con las que la gente lo busca (lugar, «UFO», el nombre del cohete o del fenómeno), sin romper la forma «Lugar · quién vio qué».
- Un viral sin fuente primaria ni explicación oficial no entra por ser tendencia: la regla anti-relleno sigue mandando.

## 2. Proponer candidatos concretos (reales, no inventados)
Para cada hueco de alto leverage, sugiere **eventos UAP históricos reales y documentados** que lo llenarían — con una línea de por qué encaja (país/década/tier que cubre) y una pista de fuente. Ejemplos de tipo de propuesta:
- "Década 1930s tiene 2 casos y 0 en Asia → *foo-fighters* documentados / avistamientos militares de la época."
- "País X con 1 solo caso → el evento Y (informe oficial Z) subiría su cobertura."
No propongas nada que no puedas anclar en un evento real; si no conoces uno documentado para ese hueco, dilo — es honesto y evita relleno.

## 3. Priorizar
Tabla: `hueco (señal) · evento candidato real · tier estimado · por qué llena el hueco · pista de fuente`. Los de mayor leverage arriba (un país/década sin cobertura + tier alto pesa más que un 2º caso en un país ya denso).

## 4. Encadenar
El usuario elige un candidato → **corre `/nuevo-caso`** con ese evento, que hace la investigación de fuentes primarias, arma el schema, respeta `posterior` MECE=1 y el estándar editorial, y valida vía el hook. Este comando solo *elige el objetivo*; `/nuevo-caso` lo *ejecuta*.

No commitees ni pushees salvo que el usuario lo pida.
