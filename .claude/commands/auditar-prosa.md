---
description: Audita la CALIDAD de la prosa de las fichas (ES y EN) como la leería un lector, no como la mide una regla. Elige una muestra al azar por tier, usa un agente lector que no ve fuentes ni guía para la prueba de comprensión, y un editor con una rúbrica de claridad, selección, coherencia, ritmo, norma latinoamericana y oficio narrativo; la sonda audit-prosa.mjs solo localiza frases y defectos concretos. ÚSALO ante «la prosa está mala», «no se entiende», «audita las fichas», «calidad de escritura», o antes de dar por cerrada cualquier tanda de reescritura. Solo audita: no edita fichas.
argument-hint: "[id de ficha | tier S|A|B | N fichas al azar; vacío = 10 al azar repartidas por tier]"
---

Estás auditando la **calidad de escritura** de las fichas de UAP Codex. Este skill existe porque la capa 2 de reescritura (oct 2026) se dio por cerrada con todas las sondas en cero y la prosa seguía mal: el resumen de Skinwalker empezaba por el número del contrato y apilaba seis siglas en una frase de 60 palabras, y la primera frase de Kinross 1953 pasaba de 80 palabras con dos siglas glosadas dentro. **Las sondas miden forma; la calidad solo la ve quien lee.** Por eso este skill no termina nunca en un número: termina en frases citadas y en una propuesta de reescritura.

Solo audita. Las fichas se reescriben después con `/redaccion` y el método de dos agentes de CLAUDE.md (corrector + verificador contra la fuente).

## 1. Muestra

**Al azar y repartida por tier, nunca por la puntuación de la sonda.** La primera prueba (nov 2026, 10 fichas, 20 lecturas) eligió la muestra con la sonda y su puntuación no se correlacionó con la nota de los lectores (Spearman ≈ 0): el globo chino, el peor según la sonda, fue el mejor leído (7–8/10), y Panamá y Goulburn, con 0 puntos, había que reescribirlas. Ninguna de las 10 salió aprobada. Lo que falla es la selección y la coherencia, que no se miden contando.

Según el argumento: los ids pedidos, o N fichas al azar del tier pedido, o 10 al azar repartidas en proporción a S/A/B. Para medir una tanda de reescritura, la muestra sale de las fichas de esa tanda.

La sonda (desde `web/`) se usa después, en el paso 3, para localizar defectos con su texto:

```
node scripts/audit-prosa.mjs --negative-control   # primero: ¿la sonda discrimina?
node scripts/audit-prosa.mjs --id <id>            # frases más cargadas, vocabulario de España, citas largas en inglés sin traducir
```

## 2. Prueba del lector (un agente por ficha, en paralelo, máximo 4)

Un agente **que no ve las fuentes, ni la guía, ni este skill**. Recibe solo el texto de la ficha tal como lo vería un lector: título, lugar, resumen, «Qué pasó» y «Por qué importa», en un idioma (corre ES y EN por separado). Su brief:

> Eres una persona culta que no sabe nada de ovnis y lee esto en el móvil. Lee el texto una vez, de corrido. Después responde, sin volver a leer: (1) en una frase, qué pasó; (2) quién lo vio y qué quedó registrado; (3) qué se sabe hoy; (4) copia literalmente cada frase que tuviste que releer o que no entendiste, y di por qué; (5) ¿cuántos objetos y cuántos testigos había, y qué forma tenía lo que vieron?; (6) ¿qué cifra, fecha u hora no pudiste situar?; (7) ¿te pareció que el texto se contradice? Copia las dos frases y di si la contradicción la afirma el texto o la supones tú; (8) ¿qué te contaron dos veces?; (9) ¿en qué punto dejaste de leer con interés, si lo hubo?; (10) una nota del 1 al 10 a tu experiencia de lectura. En inglés, añade: ¿se lee como escrito por un periodista estadounidense o como una traducción? Sé franco: no estás evaluando el tema, estás contando tu experiencia de lectura.

**Modelo del lector: Opus.** En la prueba de nov 2026, con el brief de arriba y las mismas 10 fichas, el lector Opus nombró 14 de los 14 problemas que habían marcado los editores (13 en inglés), y el Haiku 11; los que se le escaparon a Haiku eran justo los de coherencia (los «dos testigos» de Goulburn que nadie presentó, la hora del radar que no cuadra con la del piloto). Como el lector solo lee una muestra, la diferencia de precio pesa poco. **La nota del 1 al 10 no se compara entre modelos ni sirve de umbral:** Opus puso 7 a la RB-47, Haiku 5 y Sonnet 3, y había que reescribirla; el veredicto sale de lo que el lector señala, no de su nota. Al preparar el texto para el lector, cambia cada `[[slug]]` por «↗», que es lo único que muestra el sitio (`lib/caseRefs.tsx`: el título del caso va solo en el `title` del enlace): con el slug crudo o con el título insertado, los lectores lo tomaron por un error de la ficha. La frase tiene que leerse completa con ese «↗» al final.

Contrasta sus respuestas 1–3 y 5 con lo que la ficha dice de verdad. Si no coinciden, la ficha falla aunque cada frase sea correcta. Un lector puede agrupar varias fichas (hasta 5, de casos distintos), pero nunca la misma ficha en los dos idiomas: la segunda lectura ya no es la de alguien que no sabe nada.

## 3. Rúbrica del editor (tú, o un agente editor distinto del lector)

Puntúa cada criterio de 1 a 5, y **cada nota por debajo de 4 lleva la frase exacta citada y su reescritura propuesta**. Sin cita, la nota no vale.

1. **Claridad.** Se entiende a la primera. Frases de 15–25 palabras de media, alguna hasta ~35; ninguna apila más de tres datos. Sin siglas que el lector no necesita: «un radar militar» mejor que «una estación del ADC (GCI, intercepción controlada desde tierra)». Explicar una sigla dentro de la frase suele empeorarla; quitarla suele arreglarla.
2. **Selección.** Cuenta el caso, no transcribe el documento. Fue el defecto más repetido en la primera prueba (Panamá hora por hora, Goulburn con rutas y frecuencias, Skinwalker con la contabilidad del contrato, Mothman con tablas y bases de datos). Vientos por altitud, destinatarios de un télex, números de contrato o de acta, frecuencias, matrículas, más de dos o tres horas por párrafo y fechas de entrega van a la descripción del documento o a `evidence`. Pregunta clave: ¿esta frase le sirve al lector para entender qué pasó? Si no, sobra en el relato.
3. **Estructura e hilo.** Orden cronológico, un asunto por párrafo, transiciones que dan continuidad («al año siguiente», «para entonces», «sin embargo»). El resumen informa desde la primera frase. La ficha sabe de qué trata: si mezcla tres historias, se señala.
4. **Coherencia.** Los recuentos cuadran entre resumen, relato y `evidence` (cuántos objetos, cuántos testigos, a qué hora empezó; en Panamá el resumen decía dos objetos y el relato contaba tres ecos). Cada cita apoya la frase que la rodea y no parece contradecirla (en Roswell, el diario de Crary «No balloon flight…» justo después de afirmar que el globo se lanzó). Todo referente tiene antecedente («los dos testigos», «ambas explicaciones»). Si dos documentos divergen, el texto lo dice; si no, el lector cree que la ficha se contradice. Lo que el editor dé por incoherente se comprueba contra la fuente antes de reescribir: puede ser una divergencia real del registro.
5. **Ritmo.** Alterna frases largas que avanzan y cortas que cierran. Penaliza los dos extremos: la frase-inventario de 60 palabras y la ristra monótona de frases sujeto-verbo-punto.
6. **Norma: español latinoamericano culto de prensa** (referencia: BBC Mundo, El País América, La Nación). Sin voseo ni regionalismos, y sin vocabulario de España: coche → auto, ordenador → computadora, aparcar → estacionar, pliego → bases de la licitación, concurso (público) → licitación, emitir (una serie) → transmitir, de aquí a → hasta, mesilla → mesita de noche, farola → poste de luz, cárabo → búho. Las citas largas en inglés dentro del texto español se traducen o se resumen (la sonda las lista). Sin calcos del inglés (sección «Español» de `/redaccion`).
7. **Oficio narrativo con fidelidad.** Donde el caso lo permite, la técnica de la crónica latinoamericana: escena, detalle concreto, cierre en el dato. **El efecto solo puede salir de un detalle documentado** (la cámara térmica que no registró nada, la mano fría de dedos largos que el vigilante dijo sentir), nunca de un adjetivo o una imagen que la fuente no da («cortes hechos a bisturí»). Un adorno que agranda el misterio es un fallo grave, no un acierto de estilo. Un télex de 1953 con un testigo no da para crónica: ahí basta claridad.
8. **Tono.** Sin prosa defensiva: las reservas necesarias se dicen una vez, en su sitio, como parte del relato, no como cobertura en cada frase.
9. **Paridad EN.** El inglés se lee como escrito por un periodista estadounidense, con el mismo oficio: no es una traducción. Mismos hechos y mismos matices.

Veredicto por ficha: **aprobada** (todo ≥ 4), **retocar** (algún 3, problemas locales) o **reescribir** (algún ≤ 2, o el lector no pudo decir qué pasó). Una ficha que falla la prueba del lector es **reescribir** aunque la rúbrica dé 4.

## 4. Informe

Escribe el informe en el scratchpad (ruta absoluta, nombre de lote nuevo), no en el repo. Por ficha:
- defectos que localizó la sonda (frases cargadas, vocabulario, citas en inglés);
- respuestas del lector y si coinciden con la ficha;
- notas de la rúbrica con sus citas y reescrituras;
- veredicto.

Cierra con el agregado (cuántas aprobadas, a retocar y a reescribir, por tier), **las fichas donde la sonda y el lector discrepan** (para seguir midiendo si la sonda aprende a anticipar algo), lo que hay que **comprobar contra la fuente** antes de reescribir, y los defectos que se repiten, que son los que hay que llevar a la guía `/redaccion` o a una regla de la sonda con `/blindar`.

## Reglas

- No editas fichas ni scripts en este skill.
- Ninguna tanda de reescritura se da por cerrada sin pasar por aquí una muestra que incluya fichas de los tres tiers.
- No promedies el veredicto: un 2 en selección no lo compensa un 5 en norma.
- Si se pide reescribir, parte de los hallazgos del editor, pero cada «incoherencia» y cada dato que se quite o se cambie se comprueba antes contra la fuente (método de dos agentes de CLAUDE.md).
