# Plan de optimización de la orquestación de fichas (18 nov 2026)

Escrito antes de ejecutar. Parte del piloto de cuatro fichas (`docs/plan-piloto-orquestacion.md`): 539k tokens por ficha en agentes, 14 hallazgos del verificador por ficha y 1 de 8 lecturas con 3 defectos o menos. Objetivo: bajar el costo todo lo posible sin tocar lo que protege la calidad, y subir la calidad de lectura, que el piloto no cumplió.

## Lo que no se toca
- Redactor y verificador son agentes distintos.
- Lectores Opus, sin fuentes ni guía (su calibración se hizo con Opus; con otro modelo las lecturas dejan de ser comparables).
- Ningún arreglo se aplica sin cita de página o línea de la fuente.
- La clasificación solo cambia por el método de dos pasos.

## Mediciones que sostienen el plan (hechos)

Agente vacío que solo responde «OK», en esta sesión:

| Tipo de agente | Tokens |
|---|---|
| `general-purpose` (el del piloto) | 111.936 |
| `ficha-trabajo` (`.claude/agents/`, 8 herramientas) | 46.960 |
| `ficha-lector` (`.claude/agents/`, solo Read) | 41.672 |

El piloto gastó 2.155.793 tokens en 10 agentes; 1.119.360 (52 %) fueron ese costo fijo.

Límite de la métrica: la cifra que reporta cada agente parece ser el tamaño de su contexto al terminar, no el consumo acumulado de todos sus turnos (un agente con 43 llamadas reportó 223k, y el vacío, 112k). Si es así, el costo fijo pesa más de lo que estas cifras muestran, porque se reenvía en cada turno, y un contexto más largo encarece cada turno. Es una inferencia, no un dato confirmado. Los tokens del orquestador no se han medido nunca.

## Palancas, en orden de ejecución

| # | Palanca | Qué cambia | Efecto esperado | Riesgo |
|---|---|---|---|---|
| A | **Tipos de agente propios** | Redactor y verificador corren como `ficha-trabajo`; lectores como `ficha-lector` | Calculado sobre el piloto: costo fijo de 1.119k a 459k; total de 2.156k a 1.495k; **374k por ficha (−31 %)** | Bajo: mismas herramientas que usaron en el piloto |
| B | **Orquestador en sesión nueva y arreglos como parches** | La tanda se orquesta desde una sesión recién abierta. El verificador entrega, además del informe, un archivo de parches (texto viejo, texto nuevo, cita, severidad); un script los aplica. El orquestador abre la fuente para los ALTA y MEDIA y para los que cambian un hecho | Baja el costo del orquestador (sin medir hoy) y evita que reescriba frases a mano | Medio: ver «Decisión del dueño» 1 |
| C | **Lectura después de los arreglos** | Los lectores leen el texto final, con los parches ya aplicados; lo que se corrige tras la lectura es solo deuda, con cambios mínimos | Ataca el defecto que el piloto destapó: al menos 6 de ~37 defectos nacieron al aplicar arreglos | Ninguno de costo: es el mismo número de lecturas |
| D | **Sonda de frase** en `caso:check` | Avisa de frases de más de ~45 palabras y de cadenas de dos o más punto y coma, en ES y EN | 0 tokens; el redactor y el orquestador lo ven antes del lector | Bajo: es aviso, no error |
| E | **El redactor cierra sus propios gates** | Corre `audit-consistency` al final y puede añadir un país nuevo a `COUNTRY_EN` y `regions.ts` | Evita los tres errores que en el piloto llegaron tarde (E7, E59, país) | Bajo: el choque entre agentes en paralelo fue una precaución, no un fallo observado |
| F | **Lista de comprobación del redactor**, con lo que repitieron las cuatro fichas | Paso 0.5 de `/nuevo-caso`: cita literal comprobada contra la imagen; el resumen atribuye igual que el relato; cada ausencia se prueba contra el legajo entero, no solo las páginas citadas; fecha del documento frente a fecha del suceso | Menos hallazgos del verificador (hoy 14 por ficha) | No se sabe si basta: la lista anterior no bastó |
| G | **Dos fichas por agente** (prueba A/B) | En la próxima tanda, dos fichas van con un agente cada una y las otras dos comparten un redactor y un verificador | Si no empeora: 6 agentes en vez de 10, unos 327k por ficha (−39 %) | Alto: contexto más largo por turno y posible pérdida de cuidado en la segunda ficha. Por eso es una prueba, no un cambio |

Las palancas A a F se aplican juntas. G solo se adopta si la prueba A/B lo sostiene.

**Corrección (18 nov 2026, al ejecutar):** la palanca C partía de una premisa falsa. En el piloto los lectores ya leyeron el texto con los arreglos del verificador aplicados; por eso vieron los defectos que esos arreglos crearon. Lo que no lee nadie es lo que se corrige después de la lectura, que son cambios mínimos de deuda. C se sustituye por dos cosas que sí atacan el problema: el verificador escribe el texto del arreglo con el estándar de `/redaccion` en el archivo de parches (B), y `caso:check` se corre también después de aplicarlos (D).

## Criterios de éxito de la próxima tanda (los del piloto, sin rebajar)

| Criterio | Medida | Éxito |
|---|---|---|
| Costo | Tokens reportados por los agentes, entre el número de fichas | 380k o menos por ficha con A; se anota aparte el brazo de G |
| Hechos | Hallazgos ALTA del verificador por ficha | 0 en al menos tres de cuatro fichas (el piloto tuvo 4 en dos fichas) |
| Lectura | Defectos de deuda por lectura | 3 o menos en cada lectura |
| Defectos nacidos de arreglos | Defectos de lectura en frases tocadas tras el verificador | 0 |
| Gates | Errores de las sondas al entregar el redactor | 0 |
| Cumplimiento | Cada parche aplicado lleva cita | Todos |
| Prueba G | Hallazgos y defectos de lectura del brazo compartido frente al individual | No peor en ninguno de los dos |

## Decisiones del dueño antes de ejecutar
1. **Alcance del contraste con la fuente.** Hoy la regla dice que ningún arreglo se aplica sin volver a la fuente. La palanca B propone que el orquestador abra la fuente en los ALTA, los MEDIA y todo lo que cambie un hecho, y que los BAJA de forma (fechas en inglés, comillas, calcos) se apliquen con la cita del verificador. Si no se aprueba, B se queda solo con el archivo de parches y la sesión nueva.
2. **Modelo de los agentes.** Los tipos propios fijan Opus. Los lectores se quedan en Opus por comparabilidad. Queda por decidir si redactor y verificador pasan a otro modelo; no hay datos de calidad ni de precio que lo respalden todavía, y cambiarlo a la vez que A–F impediría saber qué causó el resultado.
3. **Pendientes del piloto** (PR #1423): licencia del extracto de Clarenville, lectura humana de control de Agoncillo y Ghana, y los tres cálculos del verificador sin aplicar.

## Orden de trabajo
1. PR de reglas y herramientas: tipos de agente, formato de parches en `docs/brief-verificacion.md`, script aplicador, sonda de frase en `caso:check`, pasos 0.5, 5c y 5d de `/nuevo-caso`.
2. Tanda de cuatro fichas desde una sesión nueva, con la prueba A/B de G.
3. Resultados anexados a este archivo, sin tocar los criterios.

---

## Resultados de la tanda (18 nov 2026)

Escrito después de ejecutar; los criterios de arriba no se tocaron. Cuatro fichas, `num` 539 a 542, de dos familias de archivo oficial: Arquivo Nacional de Brasil (fondo ARX de la Fuerza Aérea) y archivo OVNI de la Fuerza Aérea danesa (Flyvertaktisk Kommando). Cada brazo de la prueba G lleva una ficha de cada familia para que compare igual con igual. El barrido de noticias de `/proximo-caso` no dio ningún viral nuevo con fuente primaria (Starship del 13 de noviembre y Anchorage ya estaban en el corpus).

| `num` | Ficha | Brazo | Familia | Tier |
|---|---|---|---|---|
| 539 | `caioba-seahorse-1980` | A (agentes propios) | Brasil, ARX.0.0.201 | A |
| 540 | `aalborg-haesum-1976` | A (agentes propios) | Dinamarca, FTK pp. 185–203 | A |
| 541 | `anapolis-2001` | B (compartidos) | Brasil, ARX.0.0.601–603 | A |
| 542 | `odense-kalundborg-1991` | B (compartidos) | Dinamarca, FTK pp. 24–26 y FBIS | A |

### Tokens por agente
Cifras que reporta cada agente al terminar. Sigue valiendo el límite de la métrica que el plan anotó: parece medir el contexto al final y no el consumo acumulado de todos los turnos. Agente vacío medido justo antes: `ficha-trabajo` 47.038 y `ficha-lector` 41.750 (en la sesión anterior, 46.960 y 41.672).

| Agente | Brazo | Ficha(s) | Tokens | Llamadas | Duración |
|---|---|---|---|---|---|
| Redactor | A | 539 | 275.316 | 97 | 13,7 min |
| Verificador | A | 539 | 197.112 | 53 | 8,4 min |
| Redactor | A | 540 | 223.658 | 72 | 12,0 min |
| Verificador | A | 540 | 163.653 | 43 | 7,4 min |
| Redactor compartido | B | 541 + 542 | 277.887 | 125 | 17,0 min |
| Verificador compartido | B | 541 + 542 | 204.657 | 56 | 10,4 min |
| Lector ES | — | las cuatro | 67.113 | 1 | 1,3 min |
| Lector EN | — | las cuatro | 64.192 | 1 | 1,4 min |
| **Total** | | | **1.473.588** | | |

Por ficha, con los lectores repartidos entre las cuatro (32.826 cada una): 539, 505.254; 540, 420.137; 541 y 542, 274.098 cada una. El costo fijo de los 8 agentes suma 365.728, el 24,8 % del total (52 % en el piloto). Los tokens del orquestador (esta sesión) no se pueden medir desde dentro.

### Criterio por criterio

| Criterio | Resultado | Veredicto |
|---|---|---|
| **Costo** (≤380k por ficha con A; G aparte) | Brazo A: 462.696 por ficha. Brazo G: 274.098. Tanda entera: 368.397 (−32 % frente a 539k del piloto), pero por debajo de 380k solo gracias a G | **No cumplido** en el brazo A |
| **Hechos** (0 ALTA en al menos 3 de 4) | 0 ALTA en las cuatro. Hallazgos: 14, 9, 8 y 8 (39; 9,75 por ficha, frente a 14 del piloto) | Cumplido |
| **Lectura** (≤3 defectos de deuda en cada lectura) | ES 7, 7, 7, 4; EN 7, 8, 5, 6. Ninguna de las 8 lecturas llega a 3 o menos (piloto: 1 de 8). Notas ES 6, 5, 6, 8; EN 6, 5, 6, 7,5 | **No cumplido** |
| **Defectos nacidos de arreglos** (0) | 14 defectos de lectura distintos en frases que tocaron los parches (Caioba 4, Aalborg 3, Anápolis 1, Odense 6). `caso:check` atrapó además, tras aplicar parches, 4 párrafos de más de 880 caracteres, una frase de 73 palabras y un referente ambiguo | **No cumplido** |
| **Gates** (0 errores al entregar el redactor) | 0 errores propios en los tres redactores. El de la 540 entregó con un ERROR E45 ajeno y transitorio (el `num` 539 aún no estaba escrito); el compartido vio dos ERROR ajenos a mitad del trabajo, que se resolvieron solos. `caso:check` sin avisos en las cuatro al entregar | Cumplido |
| **Cumplimiento** (cada parche aplicado con cita) | 109 parches (36, 24 y 49), todos con cita. El orquestador abrió la fuente de todos los que cambiaban un hecho, mirando la imagen en los manuscritos: la fecha «29 Dez 80» a 500 ppp, las «83 milhas» (el OCR leía 33), «07/08/1980», los formularios daneses y brasileños y el sello del FBIS. Rehízo el cálculo del azimut de Paracatu y consultó el GCAT. Rechazados: 0. Un hueco que declaró el verificador (la nota del GCAT) lo cerró el orquestador con el catálogo | Cumplido |
| **Prueba G** (brazo compartido no peor en hallazgos ni en lectura) | Hallazgos: A 14 y 9 (0 ALTA), B 8 y 8 (0 ALTA). Defectos de lectura: A 29 en 4 lecturas, B 22 en 4. Nacidos de parches: 7 en cada brazo | Cumplido según la medida; ver límites abajo |

### Hallazgos ALTA por ficha
Ninguno en las cuatro. Los MEDIA, por ficha: Caioba 6, Aalborg 5, Anápolis 3, Odense 3. Las categorías siguen siendo las del piloto: **omisión** (9 filas del registro), **cifra/hora** (7) y **atribución** (6).

### Defectos de lectura por lectura
Cuenta del orquestador a partir de los dos informes. Entran solo los puntos concretos que caen en la deuda de `/redaccion` §9 (contradicción, recuento, cifra o fecha sin situar, persona sin presentar, texto roto). Quedan fuera las quejas generales («demasiadas horas») y las divergencias del registro que el propio texto declara. El piloto no dejó escrito su criterio de conteo, así que la comparación con su «1 de 8» es aproximada.

| Ficha | ES | EN | Corregidos tras la lectura |
|---|---|---|---|
| Caioba 1980 | 7 | 7 | 5 (sujeto del cálculo, posición de las 83 millas, canal de São Roque, técnico, faros) |
| Aalborg 1976 | 7 | 8 | 7 (altura en grados, orden de las luces, Frejlev, 15°, llamada, testigos principales, duraciones) |
| Anápolis 2001 | 7 | 5 | 4 (frase con dos «que», 25 a 35 millas, distancias, 260°) |
| Odense 1991 | 4 | 6 | 5 (Lemvig, «y más grandes», letra de la nota, fechas del GCAT, Uherský Brod) |

Las correcciones son cambios mínimos y cada una se contrastó con la página que ya se había abierto (detalle en `docs/hallazgos-verificacion.md`). Ninguna pasó por una segunda lectura, como manda `/nuevo-caso` 5d.

### Lo que la tanda enseña

1. **El archivo de parches no evita los defectos de lectura; los traslada.** El brief pide escribir `new` con el estándar de `/redaccion`, y los parches cumplen las reglas de forma: ninguno pasó de 60 palabras. Aun así, la mayoría añade un dato más del mismo documento: un ángulo, otro faro, un tachón, una fecha de embarque. El lector tropieza justo ahí. De los defectos de lectura, 14 están en frases de parches. Es la misma causa que en el piloto: la corrección del verificador acierta en el hecho y empeora la lectura. La palanca B no la ataca.
2. **El brazo A no baja de 380k.** Los dos tipos propios (A) cumplieron lo previsto en el costo fijo (del 52 % al 25 %), pero el trabajo propio por ficha subió. Archivos manuscritos en portugués y danés, renderizados como imagen, cuestan más llamadas que los expedientes del piloto. El costo depende más de la fuente que del tipo de agente.
3. **La prueba G sostiene la palanca por la medida, pero la medida no basta para adoptarla.** El verificador compartido halló menos (8 y 8 frente a 14 y 9). Eso puede significar que el redactor compartido escribió mejor o que el verificador compartido buscó menos, y con dos fichas por brazo no se puede distinguir. La cifra de tokens favorece todavía más a B por su límite conocido: los agentes de B hicieron más llamadas (125 y 56 frente a 72–97 y 43–53), así que su consumo acumulado real está más infravalorado. Las fichas de B son, además, más cortas de expediente (6 páginas y 3 formularios, frente a 43 páginas y 19 páginas).
4. **El orquestador pagó el contraste.** Abrir la fuente de 1–8, 1–13 y 1–108, mirar seis manuscritos y rehacer un cálculo es trabajo que el plan dejaba sin medir. No hubo ningún rechazo, frente a 1 de 56 en el piloto: la regla aseguró y esta vez no atrapó nada.

### Pendientes para el dueño
- **Licencias:** el extracto del FTK de Aalborg se aloja citando el artículo 9 de la ley danesa de derechos de autor, sin certeza de que cubra cuestionarios militares internos. Los formularios de Odense van «con crédito», sin licencia declarada.
- **Tier en el borde:** Caioba (testigos identificados con declaraciones de 15 días a 5 semanas después; solo el télex es del día siguiente) y Anápolis (informe al menos 11 días posterior, entre la semana que cuenta y las dos semanas que no). Ningún verificador propuso cambiarlos, así que el método de dos pasos no se activó.
- **Defectos sin corregir:** en Caioba, la portada de septiembre, la circular de 1978 sin emisor y la Luna a 24°; en Odense, la lista de satélites.

### Para la próxima tanda (18 nov 2026)
- **Criterio de conteo de lectura**, el usado en esta tanda, para que las tandas se puedan comparar: cuenta cada punto concreto que el lector señala y cae en la deuda de `/redaccion` §9 (contradicción, recuento que no cuadra, cifra o fecha sin situar, persona sin presentar, texto roto). No cuentan las quejas generales («demasiadas horas») ni las divergencias del registro que el propio texto declara.
- **Campo `"añade"` en los parches** (PR #1426): el script ya no aplica a la prosa un parche que suma un dato; ese dato va a `evidence` o a la nota de la fuente. Se mide con los defectos nacidos de parches, que fueron 14 en esta tanda.
- **Recall del verificador**: para que la prueba G distinga «escribió mejor» de «verificó menos», se siembran tres errores conocidos (fecha, atribución y omisión) en una copia de cada ficha que solo ve el verificador, y se cuenta cuántos halla cada brazo.
- **¿Viaja `CLAUDE.md` en cada agente?** Sin resolver. Con `CLAUDE.md` recortado de 90,6 a 66,7 mil caracteres (PR #1427), un `ficha-trabajo` vacío midió 47.127 tokens en la misma sesión, frente a 47.038 antes: o los subagentes no lo cargan, o lo cargan desde la copia del inicio de la sesión. La medición de partida de la próxima tanda, en una sesión nueva, lo decide: si baja a unos 40 mil, viaja, y conviene sacar del camino de las fichas las secciones de código, UI, visitas y deploy; si sigue en unos 47 mil, ese recorte no ahorra nada.

## Prueba de una ficha con el flujo nuevo (18 nov 2026)

`belo-horizonte-1985` (`num` 543, Tier A; Arquivo Nacional ARX.0.0.250), con el campo `"añade"` (#1426), el resumen del registro y `CLAUDE.md` recortado (#1427). Un redactor, un verificador y dos lectores. Una sola ficha da señal, no prueba.

| Medida | Tanda 539–542 | Esta ficha |
|---|---|---|
| Agente vacío `ficha-trabajo` | 47.038 | 37.305 (sesión nueva; ver abajo) |
| Redactor + verificador | 387–472 mil (brazo A) | 393.912 (231.831 + 162.081) |
| Con los dos lectores | 463 mil por ficha (brazo A) | 473.729 (los dos lectores, 79.817, para una sola ficha) |
| Hallazgos del verificador | 9,75 por ficha, 0 ALTA | 11, 1 ALTA (omisión) |
| Parches con `"añade": true` | — | 3, todos en `evidence` y `classBasis`; el script no desvió ninguno |
| Defectos de lectura | 6,4 por lectura | ES 9, EN 10 (notas 6 y 6) |
| Defectos nacidos de parches | 3,5 por ficha | 1 |

**Lo que dice:**
1. **El campo `"añade"` cambió lo que escribe el verificador**: llevó por sí mismo los datos nuevos a `evidence`, y los defectos nacidos de parches bajaron de 3,5 a 1.
2. **Abrió un fallo nuevo**: el parche que corregía la prosa remitía al dato que se había ido a `evidence` («encaja con el final de la grabación») y los dos lectores no pudieron situarlo. Una corrección de prosa que se apoya en un dato nuevo necesita el mínimo de ese dato en la prosa.
3. **La lectura no mejoró**: 9 y 10 defectos, la mayoría ajenos a los parches (fechas de oficios, jerga de radiales, distancias). Coincide con la tanda: el defecto de lectura nace sobre todo al redactar, no al parchear.
4. **Costo**: el agente vacío bajó de 47.038 a 37.305 tokens. Es compatible con que `CLAUDE.md` viaje en cada agente, pero no está aislado: la sesión también es otra y la bajada supera lo que el recorte explica (~7 mil). Con todo, el redactor gastó lo mismo que en la tanda.

### Editor que solo recorta (misma ficha, 18 nov 2026)
Un `ficha-trabajo` con un solo encargo: quitar de la prosa lo que el lector no necesita, sin añadir hechos ni abrir fuentes, y sin ver los informes de lectura anteriores. Costó 69.965 tokens. Recortó un 16 % (ES 7.096 → 5.972; EN 7.251 → 6.149): trámites de archivo, jerga de radiales, horas y alturas secundarias. El diff solo quita y reordena; una frase simplificada volvía a acercarse a un error de atribución ya corregido y se ajustó.

| Lectura | Antes del editor | Después |
|---|---|---|
| ES | 9 defectos, nota 6 | 7 defectos, nota 6 |
| EN | 10 defectos, nota 6 | 9 defectos, nota 6 («casi nativo»; antes, «traducción cuidada») |

**Lo que dice:** el editor quita lo que sobra y baja los defectos un poco, pero la nota no se mueve. Lo que queda no es exceso: es que el relato coteja documentos que se contradicen (dos puntos frente a tres puntas, sur frente a este) sin darle al lector una imagen de qué se vio. Eso es estructura, y recortar no lo arregla. Dos de los defectos que quedan los escribió el orquestador al corregir la deuda, lo que confirma que cualquier mano que toca la prosa sin releerla crea defectos.

### Reordenar por el suceso (misma ficha, 18 nov 2026)
Un `ficha-trabajo` reescribió «Qué pasó» con una sola versión del suceso, según la grabación de radio, y un párrafo final con lo que difiere entre documentos, sin añadir hechos (comprobado con el diff y con la p. 3 del registro). Costó 70.480 tokens. Lectores nuevos: ES 8 defectos y EN 10, notas 6 y 6. **No se publicó**: queda la versión del editor.

| Versión | ES | EN | Notas |
|---|---|---|---|
| Verificada | 9 | 10 | 6 y 6 |
| Editor que recorta | 7 | 9 | 6 y 6 |
| Reordenada por el suceso | 8 | 10 | 6 y 6 |

**Conclusión de las tres lecturas:** ni recortar ni reordenar mueve la nota. Los defectos que se repiten en las seis lecturas (dos puntos o tres puntas, sur o este, el turno, las millas, si el pasajero vio algo) son ambigüedades de la propia fuente: el texto no puede resolverlas sin inventar ni borrar hechos. Para un caso de archivo con documentos que se contradicen, 6/10 parece el techo de lectura con este cuestionario, y el criterio de «3 defectos o menos» no distingue un defecto de redacción de una ambigüedad del registro. Antes de otra prueba de proceso, conviene separar en el conteo esas dos cosas.

## Decisiones tras las pruebas (18 nov 2026, decisión del dueño)

1. **El proceso queda como está**: un redactor y un verificador `ficha-trabajo` por ficha, lectores `ficha-lector`, campo `"añade"` en los parches, `npm run hallazgos:resumen` en el paso 0.5 y `CLAUDE.md` recortado.
2. **No se añaden pasos ni reglas para la lectura**: el editor que recorta y el reordenamiento por el suceso no movieron la nota en la misma ficha.
3. **Nuevo criterio de lectura** (sustituye a «3 defectos o menos por lectura» para las tandas siguientes; los criterios de arriba se mantienen como estaban para comparar): **0 defectos de redacción** por lectura, contando solo lo que el redactor puede arreglar sin añadir ni quitar hechos (frase rota o ambigua, persona sin presentar, cifra o fecha sin situar, jerga sin explicar, repetición). Las contradicciones que trae la propia fuente se anotan aparte y no penalizan; el texto debe declararlas, no resolverlas.
4. **No se adoptan agentes compartidos entre fichas** (palanca G): ahorra tokens, pero no hay evidencia de que verifique igual.
5. **Siguiente paso: producir fichas** con este proceso, no seguir optimizándolo.
