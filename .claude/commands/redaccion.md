---
description: Guía de redacción de UAP Codex, en español y en inglés con el mismo nivel de exigencia. ÚSALA SIEMPRE que escribas, corrijas, resumas o verifiques texto de una ficha —título, ubicación, resumen, relato, por qué importa, evidencia, descripción de un documento— en cualquiera de los dos idiomas, y pásala a todo agente redactor o verificador. También ante «está mal escrito», «no se entiende», «mejora la prosa» o «revisa el texto».
argument-hint: "[id de ficha o campo a redactar/revisar; vacío = aplica la guía al trabajo en curso]"
---

Estás escribiendo para **UAP Codex**, un archivo serio de casos OVNI/UAP basado en fuentes primarias. El sitio es bilingüe y **los dos idiomas valen lo mismo**: el inglés es la versión principal del sitio y el español es su espejo, pero ninguno es una traducción de segunda. Un texto que en un idioma se entiende y en el otro no está mal en los dos.

Esta guía nació de un fallo real (oct 2026): la ficha de Skinwalker había crecido a 41.500 caracteres contando entrega tras entrega de documentos, y 23 títulos decían cosas como «Corea · un F-94 engancha con su radar un blanco en la cola», que un lector no entiende. Si dudas, vuelve a esta pregunta: **¿lo entiende a la primera alguien culto que no sabe nada del tema y lo lee en el móvil?**

## 1. El lector

- Persona culta, no especialista. No sabe qué es un AF 112, un GCI, un «eco» ni el «Release 06». No conoce el archivo por dentro.
- Lee en el móvil. Cada frase larga, cada sigla sin explicar y cada párrafo de inventario le cuesta una pantalla.
- Viene a saber **qué pasó, quién lo vio, qué quedó registrado y qué se sabe hoy**. Todo lo demás es secundario.

## 2. Cada campo tiene un trabajo

| Campo | Qué hace | Forma |
|---|---|---|
| `name` / `name_en` | Decir qué pasó y dónde | **Nombre del caso · qué pasó**, ≤ 65 caracteres, en todas las fichas sin excepción. El prefijo es el nombre por el que se conoce el caso si lo tiene («Roswell», «Caso Valdés», «Mothman», «Communion»), y si no, el lugar. Después de «·», quién vio qué. Sin año (va encima), sin veredicto (va en «Qué fue»), sin siglas ni jerga. «Exeter · objeto a baja altura visto por dos policías». |
| `location.place` / `place_en` | Ubicar | Solo el lugar, ≤ 70 caracteres: «Sector de Chorwon (hoy Cheorwon), Corea del Sur». Nada de cuadrículas, cálculos ni fuentes. |
| `summary` / `summary_en` | Contar el caso en un párrafo | Qué, quién, cuándo, dónde y qué quedó; 400–650 caracteres. La primera frase sola ya debe informar. |
| `whatHappened` | Relatar el suceso | **Cronológico**, centrado en el suceso. Párrafos de ≤ 1.200 caracteres. Ver §3. |
| `whyMatters` | Explicar por qué importa | 2–4 párrafos. Empieza por el hecho que importa, no por una fórmula. |
| `evidence` | Listar hechos documentados | 3–8 ítems, uno por hecho, ≤ 600 caracteres: quién, qué, cuándo, qué fuente. Sin valoraciones. |
| `documents[].description` | Decir qué es el documento y qué prueba | Primera frase autosuficiente (la ficha pliega el resto tras «Ver más»). Aquí van los detalles de archivo: páginas, firmas, modificaciones, procedencia. |

## 3. Estructura del relato

1. **El suceso primero.** La prosa cuenta lo que pasó, en orden. La historia de cómo llegaron los papeles al archivo no es el caso.
2. **Integrar un documento no es añadir un párrafo.** Se escribe su `description` y, como mucho, **una frase** en el relato si cambia lo que sabemos del caso (un dato nuevo, una corrección). Si un documento corrige el relato, se reescribe la frase afectada en su sitio: el relato dice solo lo correcto, sin contar que antes decía otra cosa.
3. **Nada de inventarios en prosa.** Listas de títulos, de códigos de documento o de modificaciones de contrato van a las descripciones de los documentos.
4. **Cada hecho, una vez.** Si una disputa, una cifra o una explicación ya se dijo, no se vuelve a exponer en otro párrafo ni en `evidence`.
5. **Longitud.** El mínimo es ~3.500 caracteres de `whatHappened` + `whyMatters` por idioma; el techo práctico, ~10.000. Más allá casi siempre hay acumulación o repetición, no información.
6. **Tiempo verbal.** Pretérito para el suceso, de principio a fin. No mezclar presente histórico y pasado sin motivo.

## 4. Lenguaje llano

Jerga que no se usa en títulos ni en resúmenes, y que en el relato se explica la primera vez:

| En vez de | Escribe |
|---|---|
| engancha / lock-on | su radar lo capta, lo sigue |
| blanco / target | el objeto, lo que detectaba el radar |
| eco, retorno / return | algo que solo vio el radar, lo que mostraba la pantalla |
| pasadas | vuelos por encima / alrededor |
| interceptar hasta el «Splash» | perseguir hasta el punto de contacto |
| GCI, AC&W, FEAF, ATIC… | la unidad que es, con la sigla entre paréntesis la primera vez |
| F-94, F-86D, AN/CPS-1 | un caza, un radar de tierra (el modelo, en el relato, si importa) |

Aviones muy conocidos (B-52, DC-3) pueden ir en el título si son el centro del caso.

## 5. Español

- **Norma**: español latinoamericano culto de prensa (referencia: BBC Mundo), RAE y Fundéu. Sin vocabulario de España: coche → auto, ordenador → computadora, aparcar → estacionar, pliego → bases de la licitación, emitir una serie → transmitirla, de aquí a → hasta.
- **Ritmo**: frases de 15–25 palabras de media, alguna hasta ~35; ninguna apila más de tres datos. Una sigla que el lector no necesita se quita en vez de glosarla dentro de la frase. La calidad la audita `/auditar-prosa` (prueba del lector + rúbrica) con la sonda `audit-prosa.mjs` como triaje.
- Sin voseo ni regionalismos. Donde la RAE admite dos formas, se usa una sola en todo el corpus: **«video»** (sin tilde, la forma del español de América y la mayoritaria en el corpus; unificado el 24 oct 2026).
- **Comillas**: «» y, dentro, “”. Las citas en inglés van literales entre «» y se traducen o glosan si el lector las necesita. Nunca comillas simples rectas ('así') como comillas: el apóstrofo solo va dentro de una palabra o un nombre (O'Brien). *(enforzado: E54.)*
- **Cifras**: punto de millar y coma decimal (21.948.810; 3,5); «EE. UU.» con espacio; unidades con espacio (50 pies, 22 km); siglos en romanos.
- **Nada de spanglish**: *paper* → artículo; *metadata* → metadatos; *release* → entrega o publicación; *disclosure* → revelación; *sole-source* → adjudicación directa; *debriefing* → informe o interrogatorio posterior; *briefing* → sesión informativa; *peer-reviewed* → revisado por pares; *timeline* → cronología.
- **Calcos que delatan traducción**: «secuencia desorientadora», «consecuente» por importante (*consequential*), «correr un análisis» por hacerlo, «su segunda importancia es…», «hace sentido», «a nivel de», «en base a», «jugar un rol». **«Prosaico» y «mundano»** por *prosaic* y *mundane*: se escribe «convencional» («explicación convencional», «causa convencional»), una sola palabra en toda la prosa (decisión del dueño, 29 oct 2026; la sonda E55 da ERROR). Tampoco «calibración» como valoración del caso («caso de calibración», «ancla de calibración», «lectura calibrada»): es metadiscurso y va fuera de «Por qué importa» (E52 lo cuenta).
- **Concordancia**: comprueba género y número cuando el sustantivo quedó lejos («el restante [documento]», no «la restante»).

## 6. Inglés (mismo nivel)

- **Plain English**, frases cortas, voz activa, verbos concretos. Estilo de un buen periódico, no de un informe.
- **Inglés estadounidense** en ortografía y vocabulario (*center*, *rumor*, *defense*, *maneuver*), como el resto del sitio.
- **Cifras y signos**: 6,000; 3.5; "double quotes" (straight, como el resto del corpus; las simples solo para una cita dentro de otra), “U.S.”; unidades: 50 ft, 22 km. **Fechas**: «March 5, 1952», «September 5» y «October 13 and 25», nunca «5 March 1952»; con día de la semana, «Thursday, October 21, 1982». **Ortografía estadounidense**: color, center, meter, defense, toward, catalog, program, gray, analyze, organize, skeptical, maneuver, license, judgment (los nombres propios y las citas literales entre comillas conservan su forma: «Ministry of Defence»). *(enforzado: E54.)*
- **Nada de traducción literal del español**: el `_en` dice lo mismo con las palabras que usaría un redactor nativo. Delatan traducción las construcciones «It is X what…», «realize» por *carry out*, «actual» por *current*, «eventually» por *possibly*, «sensible» por *sensitive*, artículos de más («the 1952»), y los nombres en español sin adaptar (Apolo → Apollo, Corea → Korea).
- **Paridad**: mismos hechos, mismas cifras y mismos matices en los dos idiomas. Si cambias uno, cambias el otro.

## 7. Prohibido en cualquier idioma

- **Voz del redactor**: «este expediente», «esta ficha» (salvo para marcar un cálculo propio: «según un cálculo de esta ficha»), «nuestro análisis».
- **Bitácora**: «este expediente describía…», «hasta ahora se citaba…», «una versión anterior decía…». Se escribe solo lo correcto.
- **Herramientas del redactor**: «conector», «extractor», «OCR», «barrido», «techo de extracción».
- **Tareas pendientes**: «lo que el corpus debe…». Si algo queda abierto: «queda por ver si…».
- **Rankings dentro del archivo**: «el primer caso del corpus en…», «la mejor foto del corpus». Caducan con la próxima ficha.
- **El reparto o la probabilidad en la prosa**: «el posterior carga…», «probabilidad baja». Son números derivados.
- **Muletillas**: «Conviene…», «Es decir», «Tres matices son necesarios», «honesto/honestamente», «no es X, es Y» como fórmula, «El valor de este caso…», «Es uno de los…».
- **Formato**: nada de markdown (`**`, «- », `#`), ni código entre comillas invertidas, ni rayas (—) para incisos. Enlaces a otros casos: `[[slug]]`. Párrafos separados por `\n\n`.
- **Exagerar el misterio**: cada maniobra, cifra o testigo con nombre necesita su fuente primaria. Si fue una luz, se dice «una luz».

## 8. Antes de entregar

0. Si tu texto cambia la evidencia que recoge la ficha (un dato corregido, uno nuevo comprobado en la fuente, una objeción que vuelve o que sale), dilo en tu informe: esa ficha pasa después por la revisión de la clasificación (`posterior`, `classBasis`), que tú no tocas.

1. Lee el título y el resumen como si no supieras nada: ¿se entienden a la primera?
2. Lee el relato en voz alta: ¿hay alguna frase que tengas que releer? Reescríbela.
3. Busca en tu texto: «expediente», «ficha», «entrega», «conviene», «es decir», y palabras en inglés fuera de comillas en el campo ES.
4. Compara ES y EN párrafo a párrafo: mismos hechos, misma longitud aproximada.
5. Corre desde `web/`: `node scripts/validate-schema.mjs` y `node scripts/audit-consistency.mjs` (E7, E7b, E13 y E47 vigilan parte de esta guía; no toda: lo que la sonda no ve, lo ves tú).

Un verificador revisa con esta misma guía. Si se aparta de ella, lo señala con la frase exacta y la reescritura propuesta.
