# Hallazgos de la verificación independiente

Registro versionado de lo que halló el verificador independiente en cada ficha nueva. Existe porque esos informes vivían solo en la sesión que los pedía y desaparecían con ella: el bucle de aprendizaje del repo (`probe-hits.jsonl`, `/learn`) solo veía lo que una sonda mecánica frena, y lo que más falló en las fichas lo atrapó un lector que abrió la fuente.

Lo usan `/nuevo-caso` (paso 0.5 antes de redactar, paso 5c al cerrar) y `/blindar` (candidatos).

## Regla de cierre

- Una **categoría** con filas en **dos o más de las últimas cinco fichas** es candidata a `/blindar`.
- Con una sola ficha, vale una línea de `/learn`.
- Si la categoría **no se puede vigilar con una sonda** (atribución, omisiones), pasa a la lista de comprobación del paso 0.5 de `/nuevo-caso`.
- Cada fila dice si `npm run caso:check` **habría marcado** el hallazgo. Una categoría que `caso:check` no marca nunca tras cinco fichas no merece sonda: se retira esa regla.

Categorías: **atribución** (quién dijo o hizo qué; de qué fecha es el documento que lo recoge) · **omisión** (algo del mismo documento que matiza la ficha) · **ausencia** (una frase «no consta», «nadie halló» sin la búsqueda que la respalde) · **cifra/hora** (un dato desplazado o mal medido) · **léxico/voz** (vocabulario de España, voz del redactor) · **clasificación** (tier, clase o reparto) · **nombre** (autor, cargo o seudónimo mal escrito).

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

**Lectura (18 nov 2026):** de 29 filas, `caso:check` habría marcado 4 y 2 más con una regla ampliada («no halló», «no se conserva»). Las 23 restantes solo las ve un lector que abra la fuente. Las categorías con filas en las cinco fichas son **atribución** y **omisión**; ninguna se puede vigilar con una sonda.

## Deuda detectada por el PoC (sin tocar)

`npm run caso:check -- --all` sobre el corpus de 433 fichas (18 nov 2026): léxico de España en 58 (`coche` en 42, `rueda de prensa` en 10, `móviles` en 4, `aparcado` en 2), afirmaciones de ausencia en 262 frases, párrafos de 880 a 900 caracteres en 70 y cifras de tres o más dígitos que no coinciden entre ES y EN en 107. Los números de ausencia y de cifras incluyen mucho ruido (frases que cuentan lo que dice una fuente): no son deuda hasta revisarlos. El léxico sí es deuda real, porque la guía `/redaccion` lo prohíbe.
