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
