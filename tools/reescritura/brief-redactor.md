# Lote R1 · reescritura de fichas (redactor)

R = /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/reesc-r1
Repo: /home/user/Mercadopublico (los comandos `node scripts/...` se corren desde /home/user/Mercadopublico/web).

Vas a **reescribir desde cero** la prosa de unas fichas de UAP Codex, en español y en inglés. No vas a corregir frase por frase: la capa anterior hizo eso, cumplió todas las reglas y el texto siguió sin leerse bien. Una auditoría con lectores reales halló que el problema es de **selección** (las fichas transcriben el registro: horas en cadena, contratos, frecuencias, números de acta) y de **coherencia** (recuentos que no cuadran entre resumen y relato, citas que parecen contradecir la frase que las rodea, «los dos testigos» sin presentar a nadie).

Lee primero, enteros:
- /home/user/Mercadopublico/.claude/commands/redaccion.md (la guía: trabajo de cada campo, norma de cada idioma, lo prohibido)
- /home/user/Mercadopublico/.claude/commands/auditar-prosa.md, paso 3 (la rúbrica con la que se juzgará tu texto: claridad, selección, coherencia, ritmo, norma latinoamericana, oficio narrativo con fidelidad, tono, paridad EN)

## Para cada ficha

**Entrada:** `R/pack/<id>.json` (un solo Read). Trae la prosa actual, la evidencia, los documentos (con su índice), las fuentes, el porqué de clase y, en algunas fichas, el informe del editor y de los lectores de la auditoría: léelos, dicen qué falló.

**Paso 1 · Plan.** Antes de escribir nada, decide:
- `de_que_trata`: el caso en una frase. Si la ficha mezcla historias, elige cuál es el caso.
- `se_queda`: los hechos que el lector necesita para entender qué pasó, quién lo vio, qué quedó registrado y qué se sabe hoy.
- `sale_del_relato`: cada detalle que sacas del relato y a dónde va (`documents[i].description`, `evidence`, o «se elimina» si ya está en otro sitio de la ficha).
- `comprobar_en_fuente`: cada incoherencia que veas (o que señale el editor). **Ábrela en la fuente** (las URL de `sources` y `fallbackUrl`; los PDF locales están en /home/user/Mercadopublico/web/public/pursue/; archive.org es alcanzable; para leer un PDF usa pymupdf con `python3 -I`) y anota qué dice. Si no puedes comprobarla, no la resuelvas inventando: escribe lo que dice cada fuente y que divergen.

**Paso 2 · Escribe** a partir de los hechos del paquete, no a partir de las frases viejas:
- **Ningún hecho nuevo** salvo los que comprobaste en la fuente en el paso 1, anotados en el plan con la cita. Nombres, cifras, horas y fechas salen del paquete.
- **No quites la evidencia que va en contra** de la lectura del caso: si el expediente trae algo que la contradice, se queda (es la regla de omisiones de CLAUDE.md: los correctores anteriores desinflaban o inflaban callando una parte del mismo documento).
- **Selección:** como máximo dos o tres horas por párrafo; nada de números de contrato, de acta, matrículas, frecuencias ni destinatarios de un télex en el relato (van a la descripción del documento o a `evidence`). Cada frase lleva como mucho tres datos.
- **Coherencia:** los recuentos (objetos, testigos, ecos) dicen lo mismo en título, resumen, relato y evidencia; cada persona se presenta antes de citarla; si dos fuentes divergen, el texto lo dice.
- **Ritmo:** frases de 15–25 palabras de media, alguna hasta ~35, alternando largas que avanzan y cortas que cierran; transiciones que den hilo.
- **Norma ES:** español latinoamericano culto de prensa (BBC Mundo). Nada de coche, ordenador, pliego, mesilla, farola, «de aquí a». Las citas en inglés o francés dentro del español se traducen (entre «») o se resumen; si importa el original, va en `evidence` o en la descripción del documento.
- **EN:** escrito por un periodista estadounidense, no traducido. Mismos hechos y matices. Ortografía estadounidense, fechas «March 5, 1952», comillas "…". Unidades como las da la fuente (pies, millas, nudos) sin mezclar sistemas en la misma frase.
- **Oficio:** donde el caso lo permite, escena y detalle concreto **documentado**; nunca un adjetivo o imagen que la fuente no da. Sin prosa defensiva: cada reserva, una vez, en su sitio.
- **«Por qué importa» aporta algo que el relato no dijo** (qué cambió, qué prueba o qué no prueba, cómo encaja con otros casos). No resume el relato.
- Conserva los enlaces `[[slug]]` que tenga la prosa si siguen viniendo a cuento.
- Límites: título ≤ 65 caracteres («Nombre del caso · qué pasó»), lugar ≤ 70, resumen 400–650, párrafos ≤ 1.200, evidence 3–8 ítems ≤ 600. `whatHappened` + `whyMatters` ≥ 3.500 caracteres por idioma (si la ficha actual tiene más de ~7.000, casi seguro sobra transcripción).
- No toques posterior, probability, classBasis, sources, tier, role ni nada fuera de los campos de abajo. No califiques la probabilidad en la prosa.

**Paso 3 · Salida:** `R/out/<id>.json`:
```
{"id": "...",
 "plan": {"de_que_trata": "...", "se_queda": ["..."], "sale_del_relato": [{"dato": "...", "va_a": "..."}], "comprobar_en_fuente": [{"punto": "...", "fuente": "url o archivo", "resultado": "..."}]},
 "fields": {"name": "...", "name_en": "...", "location.place": "...", "location.place_en": "...", "summary": "...", "summary_en": "...", "whatHappened": "...", "whatHappened_en": "...", "whyMatters": "...", "whyMatters_en": "...", "evidence": ["..."], "evidence_en": ["..."]},
 "documents": [{"index": 0, "description": "...", "description_en": "..."}]}
```
(`documents` solo con los que cambies; incluye siempre los dos idiomas.)

**Paso 4 · Comprueba:**
```
python3 -I R/tools/apply.py <id>          # escribe tu salida en la ficha del repo
python3 -I R/tools/check.py <id>          # NUEVOS: todo lo listado debe venir de tu paso 1; SALEN: revisa que no se pierda nada que cambie la lectura
cd /home/user/Mercadopublico/web && node scripts/build-cases.mjs >/dev/null && node scripts/validate-schema.mjs && node scripts/audit-consistency.mjs --warn
node scripts/audit-prosa.mjs --id <id>    # frases más cargadas, vocabulario de España, citas en inglés sin traducir
```
Corrige y repite hasta que la auditoría no dé ningún ERROR ni WARN que nombre tus fichas (otros agentes editan otras fichas a la vez: ignora lo que no sea tuyo). Antes de terminar, **lee tu texto en español y en inglés de corrido, como un lector que no sabe nada**: ¿se entiende a la primera qué pasó, cuántos objetos y testigos hubo y qué se sabe hoy?

## Prohibido
- git checkout/stash/reset/commit, tocar otras fichas, scripts o archivos fuera de R/out/ y de tus fichas en web/data/cases/.
- Rutas relativas: usa siempre las absolutas de arriba.

Responde al terminar con una línea por ficha: id, caracteres de prosa ES/EN antes→después, puntos comprobados en fuente y lo que no pudiste comprobar.
