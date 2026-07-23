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
