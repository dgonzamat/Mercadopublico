# Hallazgos de la verificación independiente

Registro versionado de lo que halló el verificador independiente en cada ficha nueva. Existe porque esos informes vivían solo en la sesión que los pedía y desaparecían con ella: el bucle de aprendizaje del repo (`probe-hits.jsonl`, `/learn`) solo veía lo que una sonda mecánica frena, y lo que más falló en las fichas lo atrapó un lector que abrió la fuente.

Lo usan `/nuevo-caso` (paso 0.5 antes de redactar, paso 5c al cerrar) y `/blindar` (candidatos).

## Regla de cierre

- Una **categoría** con filas en **dos o más de las últimas cinco fichas** es candidata a `/blindar`.
- Con una sola ficha, vale una línea de `/learn`.
- Si la categoría **no se puede vigilar con una sonda** (atribución, omisiones), pasa a la lista de comprobación del paso 0.5 de `/nuevo-caso`.
- Cada fila dice si `npm run caso:check` **habría marcado** el hallazgo. Una categoría que `caso:check` no marca nunca tras cinco fichas no merece sonda: se retira esa regla.

Categorías: **atribución** (quién dijo o hizo qué; de qué fecha es el documento que lo recoge) · **omisión** (algo del mismo documento que matiza la ficha) · **ausencia** (una frase «no consta», «nadie halló» sin la búsqueda que la respalde) · **cifra/hora** (un dato desplazado o mal medido) · **léxico/voz** (vocabulario de España, voz del redactor) · **clasificación** (tier, clase o reparto) · **nombre** (autor, cargo o seudónimo mal escrito) · **lectura** (lo que halla el lector sin fuentes del paso 5d: persona sin presentar, recuento o fecha que no cuadra, contradicción aparente).

Toda ficha nueva desde el `num` 529 necesita al menos una fila aquí; si el verificador y el lector no hallan nada, una fila con la categoría «sin hallazgos». Lo exige `audit-consistency.mjs` (E63), que lee la primera columna de la tabla.

## Registro

Conteo hecho a mano a partir de los informes de los verificadores (17-18 nov 2026); es aproximado: una fila agrupa hallazgos parecidos de la misma ficha.

| Ficha | Categoría | Hallazgo (una línea) | ¿`caso:check` lo marca? |
|---|---|---|---|
| andreasson-ashburnham-1967 | atribución | «Recordaron siempre» las luces: no consta para Waino, y Betty confirmó su recuerdo solo más tarde | no |
| andreasson-ashburnham-1967 | atribución | La fecha se fijó con los registros y el testimonio juntos; la ficha decía que primero el testimonio | no |
| andreasson-ashburnham-1967 | atribución | Klass habla de ufólogos «crédulos»; la ficha decía «los ufólogos» | no |
| andreasson-ashburnham-1967 | cifra/hora | «Al menos trece sesiones» eran 14; el programa de Bozo acababa una hora antes de la hora dada | no |
| andreasson-ashburnham-1967 | omisión | Cinco seres en la carta de 1975; condición de Hynek; opinión del hipnotista; admisión de Fowler | no |
| moody-alamogordo-1975 | atribución | La carta se escribió al día siguiente del suceso (no el 20 de agosto, fecha en que la recibió APRO) | no |
| moody-alamogordo-1975 | atribución | La predicción de contacto se atribuyó al jefe de los seres; en la carta es de Moody, sin decir quién se lo dijo | no |
| moody-alamogordo-1975 | ausencia | «Ni el polígrafo ni la regresión llegaron a hacerse»: solo consta lo de la regresión | no |
| moody-alamogordo-1975 | ausencia | «No consta una retractación» | sí |
| moody-alamogordo-1975 | cifra/hora | «A las tres semanas»: el boletín solo dice septiembre | no |
| moody-alamogordo-1975 | omisión | Lo que añade el Mammoth (hospital, radiación, historial perdido) y el «recuerdo programado» de Lorenzen | no |
| moody-alamogordo-1975 | léxico/voz | «Coche» en las descripciones de documentos | sí |
| cergy-pontoise-1979 | cifra/hora | Las 4:15 son la hora de los testigos, no del aviso (5:00); 3 °C a las 4:00, no 4 °C | no |
| cergy-pontoise-1979 | atribución | La radiactividad la midió la gendarmería, no el GEPAN; la llamada a RTL es de las 6:40 y N'Diaye dijo 5:30 | no |
| cergy-pontoise-1979 | atribución | Rémi vio a dos personas subir al auto; la ficha decía «no tres» | no |
| cergy-pontoise-1979 | ausencia | «Nunca se retractaron» y «no se ha visto el periódico» | parcial |
| cergy-pontoise-1979 | léxico/voz | «Pisos», «vaqueros», «rueda de prensa» | sí |
| cergy-pontoise-1979 | omisión | La confesión de Prévost también la recogen Vallée y la Encyclopedia of Occultism and Parapsychology | no |
| aveley-1974 | atribución | La hipnosis la organizó la revista (Bowen, por medio de Finch), no Collins | no |
| aveley-1974 | atribución | La frase de Bowen es de junio de 1978 y no habla de Aveley; estaba puesta en el editorial de agosto | no |
| aveley-1974 | ausencia | «Collins revisó la prensa local y no halló avistamientos»: el texto dice que la prensa no sirvió como fuente | no (la regla actual no ve «no halló») |
| aveley-1974 | cifra/hora | Las 22:10 son la hora en que ya llamaban ovni a la luz, no la de cuando Kevin la señaló | no |
| aveley-1974 | omisión | Recuerdos conscientes previos a la hipnosis, avistamientos anteriores de John, «nadie les sugirió una abducción» | no |
| aveley-1974 | clasificación | Explicación convencional 0,56 → 0,52 | no |
| adamski-desert-center-1952 | atribución | «Fraude que se sabe que son»: lo dijo un oficial de prensa de la Fuerza Aérea, no la OSI | no |
| adamski-desert-center-1952 | atribución | El dictamen sobre «un niño de diez años con una Brownie» era de las fotos de platillos, no del encuentro | no |
| adamski-desert-center-1952 | ausencia | «No se conserva la placa»: Adamski cuenta que se la devolvieron el 13 de diciembre | no (la regla actual no ve «no se conserva») |
| adamski-desert-center-1952 | omisión | El FBI dio el caso por cerrado; Marshall lo llamó «oportunista» | no |
| adamski-desert-center-1952 | cifra/hora | El cigarro apareció unos minutos después del avión, no justo detrás | no |
| adamski-desert-center-1952 | nombre | Marc Hallet, no «Michael» | no |
| puddy-moorooduc-1972 | omisión | La nota de la RAAF recoge que el agente Cox contó que Beale vio una luz azul «en términos parecidos» a los de Puddy; la ficha decía que nadie describió algo parecido | no |
| puddy-moorooduc-1972 | atribución | El segundo suceso tiene tres fechas (martes 25 en los formularios, 27 en el boletín de 1972, «lunes» en la nota del oficial); la ficha daba el 25 por cerrado | no |
| puddy-moorooduc-1972 | ausencia | «La RAAF descartó helicópteros y aviones»: la nota solo dice que ningún helicóptero militar operaba y que consultó a la DCA; las preguntas de causa quedaron en blanco | no (marcó la frase ya reescrita, falso positivo) |
| puddy-moorooduc-1972 | cifra/hora | El resumen daba 21:15 (hora del aviso a la policía) como hora del suceso; el formulario dice 21:00 con diez minutos de margen | no |
| puddy-moorooduc-1972 | cifra/hora | «Otros tres vecinos» (son cuatro personas de otras localidades) y «a otras horas» (la franja de Davis incluye las 21:15) | no |
| puddy-moorooduc-1972 | atribución | Magee firma el relato de 1980 y Norman escribe aparte; el texto de 1997 es otro, no una reimpresión | no |
| puddy-moorooduc-1972 | atribución | Frases de Little y Stapleton (vía Basterfield) sin decir de quién eran; el mensaje varía entre fuentes | no |
| puddy-moorooduc-1972 | ausencia | «Sin documento de la época» sobre el tercer episodio: el informe de Little y Stapleton no está fechado | no |
| puddy-moorooduc-1972 | omisión | El segundo formulario llegó a la RAAF el 17 de agosto; Magee escribe «creo que no lo devolvió», no «no lo devolvió» | no |
| puddy-moorooduc-1972 | atribución | «Primera publicación del caso» no se puede verificar; «el hombre de la vaca, único testigo del primer tramo» es del segundo suceso | no |
| puddy-moorooduc-1972 | omisión | Magee (1997) dice que los tres episodios fueron en 1972 aunque los sitúa seis meses después de julio | no |
| puddy-moorooduc-1972 | léxico/voz | «Sin capa de texto» (herramienta del redactor), «Lo que sostiene este caso es que existió» (fórmula), citas en inglés sin glosar, siglas sin explicar | no |
| puddy-moorooduc-1972 | extensión | Prosa de 11.085 caracteres antes de los arreglos y 12.771 después; E52 frenó a más de 12.000 y se recortó el tercer episodio | sí, pero lo vio E52, no `caso:check` |
| puddy-moorooduc-1972 | lectura | Basterfield, Little y Stapleton citados sin presentar; el resumen da la persecución por hecho; «esa noche» sin día; la radio «la mañana del 25» sin explicar qué implica | no |
| puddy-moorooduc-1972 | atribución | PoC ronda 2 (brief fijo): el boletín de 1972 sí cuenta la persecución («I've been chased by a flying saucer», l. 298; la luz «remained in position above her», l. 318-320) y la ficha decía que no; Magee 1997 se pregunta si la hipnotizaron «they» (l. 963-967), no deja el origen abierto | no |
| puddy-moorooduc-1972 | atribución | El texto de 1972 no lleva firma: lo escribe Judith Magee en primera persona (l. 305-306); el de Magee es «Copyright © 1996», presentado en 1997 | no |
| puddy-moorooduc-1972 | cifra/hora | Los formularios de Beale y Toal están firmados el 31-7 y el 1-8 (r098, r101); el 25 es la fecha del avistamiento | no |
| puddy-moorooduc-1972 | omisión | Llamadas fallidas de la RAAF (r105), «presencia» en el auto (Little y Stapleton), boceto del platillo (r095), «could have moved» frente a «could not open the doors»; en la revisión de clase, el formulario de los Beale dice «PINKISH GLOW» (r096) y la ficha solo recogía la luz azul que contó Cox | no |
| puddy-moorooduc-1972 | ausencia | «La RAAF no halló aviones»: vale para la primera noche (p030 «Nil»); en el segundo suceso los apartados 32 y 33 tienen solo una diagonal (r102) | no |
| puddy-moorooduc-1972 | lectura | PoC ronda 2, lectores Opus ES y EN 6/10: ya sin personas sin presentar; quedan referentes ambiguos («su informe», «she addressed… 1995», «him»), las dos cronologías del segundo suceso sin cuadrar con la radio, el relato omitía el «followed car» del formulario (p027, punto 21) y «quedó sin responder» (p031: ninguna opción marcada) | no |
| cergy-pontoise-1979 | lectura | «Dos amigos» en el resumen frente a «los tres» en el relato; siete u ocho días; Vallée, Bouchon y «otro autor» sin presentar; «la versión de la visita del GEPAN», nunca contada | no |
| adamski-desert-center-1952 | lectura | Keyhoe, Moseley, los Baker, el memorando de 1956 y la declaración del 17 de marzo sin presentar; un párrafo sin sujeto; el FBI «nunca investigó» sin comentar | no |
| moody-alamogordo-1975 | lectura | Walton, los Hill, Klass, McQuiston y el Mammoth sin presentar; «dos semanas» frente a «un par de meses»; una frase de 85 palabras | no |
| aveley-1974 | lectura | «Tres horas» frente a unas 2 h 40 entre las horas dadas; la hermana recogida esa noche sin explicar; Creighton y Randles sin presentar | no |
| andreasson-ashburnham-1967 | lectura | Fowler sin presentar en el resumen; Bozo (16:30-17:30) frente a las 18:35 sin decir qué implica; «primary loop cutoff» sin traducir | no |
| ghana-accra-1987 | atribución | Piloto 18 nov 2026: el `summary` daba a todos los testigos del diario el rumbo hacia el golfo; el IIR (p. 2, §1) dice «over southeastern Ghana and the Gulf of Guinea briefly between 2300 and 2400 hours GMT» y «in the vicinity of Accra», sin dirección; el rumbo es solo del piloto (p. 2, §2) | no |
| ghana-accra-1987 | omisión | Se perdía «briefly» (p. 2, §1), «yellowish» y «apparently not aware of any sound» (p. 3) | no |
| ghana-accra-1987 | atribución | Cita de la DIA no literal: «STRONG SUGGEST SPACE DEBRIS FROM ATMOSPHERIC GRIDLOCK» (p. 6, §1, con la broma incluida); «Harmonics Convergence» (p. 6) | no |
| ghana-accra-1987 | atribución | La nota (p. 5) es un mensaje aparte seis minutos después del informe («R 201418Z» frente a «R 201412Z», p. 1): lo tachado es una identidad, no un nombre; «el comandante» sin «de Ghana» en el documento (p. 3) | no |
| ghana-accra-1987 | atribución | Yukón 1996 lo identificó el analista Ted Molczan (2012), que sí calculó la hora; la ficha no decía quién | no |
| ghana-accra-1987 | ausencia | «El resumen ocupa una frase» (son dos, p. 2, §1) y «el último» párrafo (tras el tercero sigue otro tachado, p. 6) | no |
| ghana-accra-1987 | léxico/voz | Fórmula «no es X, es Y» dos veces en párrafos seguidos; E57 marcó cuatro enlaces a otros casos usados como sustantivo | parcial (E57; la fórmula no) |
| ghana-accra-1987 | omisión | APLICADO tras repetirlo un segundo agente (18 nov 2026: 23:07–23:17 UTC con J2, una sola pasada descendente al día, zona en la sombra de la Tierra, así que solo pudo verse incandescente); `posterior` sin cambios. Con el GCAT, la única pasada norte-sur del día de la etapa 1987-064B sobre Accra cae hacia las 23:00–23:45 UTC, la hora de los testigos. Es un cálculo del verificador; por el método de dos pasos otro agente debe repetirlo antes de tocar `posterior` o `classBasis` | no |
| ghana-accra-1987 | proceso | País nuevo: faltaban `COUNTRY_EN` (`lib/i18n-geo.ts`) y `regions.ts`, que el redactor no podía editar según el brief; E50/E35 habrían roto el build | sí (E50, E35) |
| agoncillo-1978 | omisión | Piloto: el índice de Ballester marca Albacete (20/7/1978) como «Adicional», que él define como avistamiento nuevo sin informe desclasificado (bo.pdf p. 4); la ficha lo dejaba como relación abierta. Procede de los libros de Pegaso (p. 3) | no |
| agoncillo-1978 | atribución | «Las tres declaraciones coinciden» en luces blancas y rumbo constante: el soldado no dice «blancas» y «dirección E./W.» está en la narración del jefe, no en cada declaración; «constante» no figura (expediente 780720, escrito 681, p. 3) | no |
| agoncillo-1978 | atribución | «Pensaron en un avión y solo les extrañó el silencio»: el escrito es un condicional, «extrañándoles de que en el caso de que fuese un avión, no hiciese ruido notable» (p. 3); el «solo» lo añadía la ficha, en whyMatters y en classBasis | no |
| agoncillo-1978 | atribución | «Guard Corps» traducía mal «Cuerpo de Guardia» (la guardia del puesto, resumen del MOA, p. 2): era una simplificación, no una versión opuesta | no |
| agoncillo-1978 | cifra/hora | Ballester: el cuerpo del artículo es de «Valencia, 13 de octubre de 2016» (bo.pdf p. 6); la adenda es de diciembre de 2017 (p. 8) | no |
| agoncillo-1978 | omisión | `evidence` listaba dos de las tres diferencias del resumen del MOA; la tercera es la que más pesa (p. 2 frente a p. 3) | no |
| agoncillo-1978 | léxico/voz | Fechas en inglés con el día delante («20 Jul 1978»), calco «is known» y título EN con «silent» que el ES no tiene | no |
| agoncillo-1978 | atribución | La causa de que difieran las formas (cuántas luces distingue cada uno) es razonamiento del redactor escrito como hecho; pasa a «puede depender» | no |
| agoncillo-1978 | ausencia | NO APLICADOS, opcionales: nombre del autor del resumen del MOA (Rocamora, solo en la tabla de Ballester, p. 10) y la poda de fórmulas y repeticiones de whyMatters (mantenimiento, `/redaccion` §9) | no |
| clarenville-1978 | léxico/voz | Piloto: «Random Island» en el `summary` ES rompe el build (E7: inglés descriptivo en `name`/`summary`); el brief le prohibió correr la auditoría y lo halló el verificador | sí (E7) |
| clarenville-1978 | licencia | La p. 286 del PDF alojado es un recorte de Canadian Press, no del Gobierno de Canadá; la frase de licencia era falsa para esa página. Se quita del extracto (5 págs.) | no |
| clarenville-1978 | licencia | DECIDIDO el 18 nov 2026 por el dueño (alojar y fijar criterio en `docs/registros.md`): alojar el extracto de RG 77 se aparta del precedente de `docs/registros.md` (Falconbridge, Shag Harbour, barrido del NRC: material de la Corona, solo enlace); los términos de LAC exigen citar la URL de LAC y no hay certeza de que cubran copias de un tercero | no |
| clarenville-1978 | cifra/hora | El télex de la RCMP (p. 269) da la llamada de la señora Lethbridge a Defensa «AT 0500 HOURS», una hora después de la ventana militar 02:00–04:00 NDT; McNamara copia esa ventana como «04:30 to 06:30 ast» (p. 287) | no |
| clarenville-1978 | omisión | Parte de la RCMP de Happy Valley-Goose Bay, 4-12-1978 (parte 14, p. 16): en la zona de Clarenville hubo «a number of sightings» y la gente veía «all sorts of objects which were later identified as stars» | no |
| clarenville-1978 | atribución | La nota de McNamara (p. 287) agrupa tres informes (192, 198 y 199, este de Gander); «most likely Jupiter» sigue a «the first two reports» | no |
| clarenville-1978 | cifra/hora | Júpiter a 16–31° de altura (+15°) y acimut 80–97° con las efemérides del verificador; la ficha daba 33°, 17° y 99° | no |
| clarenville-1978 | ausencia | «Ninguno de los que guarda el archivo del NRC» abarcaba más de lo leído; acotada a los partes, télex y recortes de 1978 sobre el caso | no |
| clarenville-1978 | atribución | McNamara sin presentar («del NRC»); «el parte termina diciendo» la fiabilidad (es el párrafo 2, el 3 es el envío del télex a Ottawa, p. 271) | no |
| clarenville-1978 | extensión | Tras los arreglos, dos párrafos pasaron de 900 caracteres (939 y 1.010); se partieron | sí (E59) |
| clarenville-1978 | omisión | APLICADO tras repetirlo un segundo agente (18 nov 2026: IGRF −26,2° en Gander; de Gander a Random Island, 145,5° verdaderos ≈ 171,7° magnéticos y 60,3 NM; Sirio a 139–144° verdaderos de 05:20 a 05:45 UTC); el `classBasis` ya no cuenta el rumbo como objeción y el `posterior` no cambia. Con la declinación de 1978 (~26° O) el rumbo 165–170° del télex coincide con el de Gander a Random Island o, si es magnético, apunta a Sirio. Es un cálculo del verificador (IGRF y PyEphem); otro agente debe repetirlo antes de rebajar la objeción del `classBasis` | no |
| blenheim-1959 | omisión | Piloto: «la copia publicada no muestra qué se reveló» era falso. El anexo 15A (p. 214) es un dibujo de agosto de 1959 de un hombre de pie con casco, traje plateado, manopla y «DARK SHEATH» en el brazo izquierdo, y la minuta del 6-3-1979 (p. 31, párr. 3) dice que la clasificación subió tras contar ella que un hombre bajó y le gritó en un idioma extranjero, que el oficial creyó ruso | no |
| blenheim-1959 | omisión | La ficha daba por buena la reserva de 1959; la misma minuta (p. 31, párr. 2-3 y p. 32, párr. 6) dice que solo hubo garantía en 1960, que en 1959 se le dijo «to keep her information to herself» y que la respuesta a Clarkson se redactó «realising that it was not strictly accurate» | no |
| blenheim-1959 | atribución | «El cuartel general daba el asunto por cerrado»: la carta del 20 de agosto se envió «for evaluation by Headquarters Intelligence Staff» (p. 191, párr. 9), el director de Inteligencia anotó el 28-8 una carta anónima «You have talked» (p. 187) y la carta de 1960 cita una respuesta del cuartel general del 1-9-1959 (p. 179); el `summary` invertía el orden | no |
| blenheim-1959 | atribución | La llamada a la policía no menciona los pinos (p. 221); solo la declaración (p. 219) | no |
| blenheim-1959 | omisión | La inmovilidad y el ocupante que cambia ya están en las notas del 23 de julio: «observer attracted towards them but did not move ???» y «hardly have had enough room to stand» (p. 205, 7a y 7d) | no |
| blenheim-1959 | atribución | «Probably allergic» es del memorando del 1-3-1979 (p. 33), no del resumen adjunto; el informe del médico no está en la copia | no |
| blenheim-1959 | cifra/hora | La declaración dice «about 25 to 6» (5:35, p. 219) y la llamada 5:40 (p. 221): el margen con los avisos de Holdaway es de 35 a 70 minutos | no |
| blenheim-1959 | atribución | «Firmó una declaración»: la copia (pp. 219-220) no lleva firma; el firmante «McGlymont» no es legible (se lee «McClymont»); «en el momento» frente a «justo después del suceso» (p. 206, párr. 13); la carta de 1960 cita una carta «del 25 de agosto», la del 20 es solo la única con esa referencia | no |
| blenheim-1959 | léxico/voz | RECHAZADO por el contraste con la fuente: el verificador leyó «an extremely worried person» (p. 191, párr. 8) como descripción de la testigo; la frase describe a Jennings, sujeto de los tres predicados («has spent considerable private time…, is convinced that Mrs. Moreland is genuine, and is an extremely worried person»). La propuesta de `classBasis` que la usaba se reescribió sin ella | no |
| blenheim-1959 | cifra/hora | NO APLICADO, opcionales: Holdaway tomó primero la luz por los faros de un coche (p. 201 y recorte p. 184, sin contrastar con la imagen), la carta anónima y detalles de las notas del 23 de julio y de 1979 | no |
| blenheim-1959 | extensión | Con los arreglos la prosa ES pasó de 12.000 y un párrafo de 908 caracteres; se recortó lo secundario (una frase del marido, años, ciudad, nombre del grupo) y se partieron los párrafos | sí (E52 y E59) |
| ghana-accra-1987 | lectura | Piloto, lectores Opus ES 7/10 y EN 7/10: dos puntos y coma encadenados (introducidos al aplicar un arreglo), «Six minutes after… sender blacked out» sin explicar, «he / his / the other man» de la nota, «traded a light» en el resumen | no |
| agoncillo-1978 | lectura | Piloto, ES 7/10 y EN 6/10: «accidental» sin explicar, papeleo de números de escrito, «nombre y empleo» frente a nombres borrados sin reconciliar, frase larga del «guardhouse», sigla MOA con nombre en español | no |
| clarenville-1978 | lectura | Piloto, ES 5/10 y EN 5/10: la ventana horaria del télex (tres cláusulas, McNamara antes de presentarlo, ambos introducidos al aplicar arreglos), «at the time» sin hora, «rumbo» y «verdadero o magnético» sin explicar, Chester fuera de la lista de testigos | no |
| blenheim-1959 | lectura | Piloto, ES 6/10 y EN 6/10: «partly missing» sin explicar, «did not move ???» con paréntesis confuso, «un grupo civil de platillos» sin contexto, «5 de marzo» sin año, correspondencia de 1979 pesada | no |
| anapolis-2001 | pendiente | Fila provisional del redactor; la sustituye el orquestador con los hallazgos del verificador | no |
| caioba-seahorse-1980 | pendiente | Fila provisional del redactor; la sustituye el orquestador con los hallazgos del verificador | no |
| aalborg-haesum-1976 | pendiente | Fila provisional del redactor; la sustituye el orquestador con los hallazgos del verificador | no |
| odense-kalundborg-1991 | pendiente | Fila provisional del redactor; la sustituye el orquestador con los hallazgos del verificador | no |

**Lectura (18 nov 2026, tras la sexta ficha):** de 42 filas, `caso:check` habría marcado 4 (ninguna de Puddy; sus avisos eran falsos positivos) y 2 más con la regla ampliada. Las categorías **atribución, omisión, cifra/hora y ausencia** aparecieron en las cinco últimas fichas (Moody a Puddy): el paso 0.5 y el autochequeo **no las redujeron**. El léxico (3 de 5) sí era mecánico y pasó a E62. Puddy es una ficha más difícil que las anteriores (tres episodios, manuscritos de la RAAF, tres versiones de los investigadores), así que no es un experimento limpio: la comparación solo valdrá con tres fichas más.

**Predicciones del redactor antes del verificador** (guardadas antes del informe): acertó dónde estaba el riesgo en atribución (Magee frente a Basterfield), en la omisión de Cox y Beale y en la hora de las 21:15; falló en las tres frases de ausencia que marcó (el verificador las halló correctas: «la evaluación no responde», «nadie entrevistó al hombre de la vaca») y no vio tres hallazgos graves: las tres fechas del segundo suceso, el «descartó» y el recuento de testigos. Saber dónde está el riesgo no basta para hallar el error.

**Auditoría de prosa de las seis (18 nov 2026, `/auditar-prosa`):** con el verificador en verde, cuatro lectores Opus sin fuentes y un editor no aprobaron ninguna: cuatro a reescribir (Puddy, Cergy, Adamski, Moody) y dos a retocar. Personas sin presentar en las seis y recuentos que no cuadran en cinco. El verificador no tenía por qué verlo: no son errores de hecho. Por eso el paso 5d de `/nuevo-caso` pone la prueba del lector antes de fusionar.

## Deuda detectada por el PoC (sin tocar)

`npm run caso:check -- --all` sobre el corpus de 433 fichas (18 nov 2026): léxico de España en 58 pares ficha-palabra (`coche` en 42, `rueda de prensa` en 10, `móviles` en 4, `aparcado` en 2); medido de nuevo por apariciones fuera de comillas son 128 en 50 fichas, y `móvil` da falsos positivos («piezas móviles», «blancos móviles» de un radar), afirmaciones de ausencia en 262 frases, párrafos de 880 a 900 caracteres en 70 y cifras de tres o más dígitos que no coinciden entre ES y EN en 107. Los números de ausencia y de cifras incluyen mucho ruido (frases que cuentan lo que dice una fuente): no son deuda hasta revisarlos. El léxico sí es deuda real, porque la guía `/redaccion` lo prohíbe.
