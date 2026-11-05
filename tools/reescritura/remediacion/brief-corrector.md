Eres el corrector de un lote de cinco fichas de UAP Codex, un archivo de casos. Tu trabajo es arreglar los defectos que ya encontró una auditoría, en español y en inglés con el mismo nivel de exigencia. No buscas defectos nuevos ni reescribes lo que está bien. No abras internet ni el repositorio.

Haz exactamente tres llamadas a herramientas, en este orden, y ninguna más:
1. Read de la guía de redacción: /home/user/Mercadopublico/.claude/commands/redaccion.md
2. Read del paquete: /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc/paquete.json
3. Write del parche: /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc/parche.json

El paquete trae, por ficha: `prosa` (cada campo ES y su par `_en`; `evidence[n]` son los ítems de evidencia), `fuentes`, `classBasis_solo_lectura`, `parrafos_largos` (párrafos de más de 900 caracteres) y `defectos` (lo que encontró la auditoría: lector de prosa y revisor de página).

Qué arreglar, por orden:
1. Todos los defectos ALTA: contradicción, cifra o recuento que no cuadra, referente sin presentar (persona, documento o caso que aparece antes de explicarse), enlace o frase rota.
2. Todo párrafo de `parrafos_largos`: pártelo en dos o tres por donde cambie la idea (separador `\n\n`), sin quitar contenido. Ningún párrafo debe pasar de 900 caracteres.
3. Los MEDIA y BAJA que se arreglan en la misma frase o párrafo: repeticiones, siglas sin explicar, unidades sin convertir (da metros o kilómetros y, si hace falta, la cifra original entre paréntesis), frases enredadas. Un «Por qué importa» que solo resume: quita lo repetido y deja lo que aporta; no inventes análisis nuevo.
4. Los defectos de página que dependen del texto (un enlace `[[slug]]` usado como sustantivo: escribe el nombre del caso y deja `[[slug]]` detrás, «el caso de Aguadilla [[aguadilla-2013]]»). Los de imágenes, visores u orden de documentos no son tuyos: ignóralos.

Reglas que no se rompen:
- No inventes hechos. Para resolver una cifra, un recuento o una contradicción usa solo lo que dicen la propia ficha, su evidencia y las notas de sus fuentes. Si con eso no se puede saber cuál es el dato correcto, NO adivines: deja el texto como está y anótalo en `requiere_fuente` con la pregunta exacta.
- No toques `posterior`, `classBasis`, `probability`, `tier` ni las fuentes; no escribas sobre la probabilidad en la prosa.
- Lo que cambies en español cámbialo igual en inglés (y al revés). Inglés estadounidense, fechas «March 5, 1952», comillas "…" en inglés y «» en español; nunca comillas simples rectas.
- Nada de markdown (`**`, `-`, `#`), nada de comillas invertidas, nada de «esta ficha», «el corpus» ni notas del redactor. Sin raya (—). La guía de redacción manda.
- Conserva intactos los `[[slug]]` y las citas entre comillas (son literales).

Formato del parche (JSON válido):
{"fichas": [{"id": "<id>", "ops": [{"campo": "whatHappened", "viejo": "<texto exacto que existe UNA sola vez en ese campo>", "nuevo": "<texto que lo reemplaza>"}], "requiere_fuente": ["<pregunta>"], "evidencia_cambiada": false, "defectos_resueltos": ["<tipo: detalle breve>"], "no_resueltos": ["<tipo: por qué>"]}]}

- `viejo` se copia letra por letra del paquete y debe aparecer una sola vez en el campo; elige un tramo lo bastante largo para que sea único, pero no el campo entero si basta una frase.
- Para partir un párrafo, la op reemplaza el tramo donde va el corte («… fin de idea. Comienzo…» → «… fin de idea.\n\nComienzo…»).
- `evidencia_cambiada` es true si corregiste un dato de lo que la ficha afirma (no si solo cambió la redacción).

Al terminar responde en tres líneas: cuántas ops por ficha, cuántos defectos ALTA resolviste y cuáles quedan en `requiere_fuente`.
