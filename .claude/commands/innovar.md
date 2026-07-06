---
description: Explorador proactivo de mejoras — corre las auditorías del repo + escanea oportunidades y propone un backlog priorizado por leverage (impacto × 1/esfuerzo). La pieza proactiva del loop; el resto es reactivo.
argument-hint: "[opcional: foco, ej. 'contenido' | 'a11y/perf' | 'cobertura' | 'nueva capacidad']"
---

Estás ejecutando el **explorador de mejoras** del repo. El loop de self-learning (`/learn`, `/retro`, `/curar-memoria`) es **reactivo**: aprende de errores y mantiene la memoria. Este comando es la mitad **proactiva**: no espera una corrección — busca activamente la mejora de mayor leverage y la propone. Es el `/techdebt` de Boris Cherny, aterrizado a UAP Codex.

Regla de oro anti-fluff: **cada propuesta cita una señal concreta** (una línea de auditoría, un conteo, un archivo). Sin señal, no es una mejora — es relleno. "Mejorar la UX" está prohibido; "el touch target de X mide 40px, bajo el mínimo AA de 44px (audit-design)" está permitido.

## 1. Correr las señales del repo (ground truth)
Desde `web/` (node plano, sin `node_modules`):
```
node scripts/audit-consistency.mjs   # tiers, cobertura países/años, E13 backlog, MECE, WARN/NOTE
node scripts/audit-design.mjs        # WCAG AA, contraste, drift de color de tier, touch targets
node scripts/validate-schema.mjs     # integridad estructural (debería estar limpio)
```
Deriva además: fotos de actores (`filter(x=>x.photo).length`/total), distribución Tier S/A/B, países y décadas cubiertos, headroom de client components vs el techo 45.

Si las auditorías están **todas en verde** (lo normal), NO te detengas ahí — el trabajo entonces es surfacear *oportunidades*, no *fallos*.

## 2. Dos buckets

**MEJORAS** (refinar lo que existe):
- Cualquier WARN/NOTE de las auditorías (aunque no rompan el build).
- Deuda conocida: fotos de actores (ver *Deuda pendiente* en `CLAUDE.md` — techo real ~30-35 por licencia, no re-buscar los ❌ ya agotados).
- Contenido delgado para su tier (si E13 vuelve a mostrar backlog).
- a11y/perf que `audit-design` marque cerca del umbral.

**INNOVACIONES** (capacidad nueva, anclada en los datos que ya existen):
- Nuevas vistas/derivadas sobre el corpus actual (ej. cruces país×década, series temporales de una narrativa MECE).
- Nuevos ejes de exploración en `components/explorer/`.
- Discoverability (SEO, RSS, sitemap) sobre datos ya presentes.
- Cada idea debe apalancar datos/estructura existentes — no inventar un pipeline nuevo desde cero salvo que el leverage lo justifique.

## 3. Respetar las restricciones del repo (no proponer lo que las viola)
- Techo de **45 client components** (vigilado por audit) — una innovación interactiva debe caber o justificar el costo.
- **SSG puro** (`output: "export"`) — nada que exija servidor en runtime.
- Anti-patterns de `CLAUDE.md` (no `Event` JSON-LD, no `fs` en `lib/data.ts`, JIT no compila clases dinámicas, etc.).

## 4. Priorizar por leverage
Ordena por **impacto × (1/esfuerzo)**. Tabla:
`[MEJORA|INNOVACIÓN] · título · impacto (alto/medio/bajo) · esfuerzo (S/M/L) · señal de origen (probe/conteo/archivo) · primer paso`.
Los picos de leverage arriba. Descarta lo que no mueva la aguja — un backlog corto y nítido > una lista larga.

## 5. Proponer, no construir
Presenta el backlog y **pide al usuario que elija**. No implementes sin aprobación. Si el usuario elige uno:
- Si es un caso nuevo o expansión de contenido → encadena con `/nuevo-caso` o la expansión con investigación de fuentes primarias.
- Si es código → propón un plan mínimo antes de tocar archivos.

No commitees ni pushees salvo que el usuario lo pida.
