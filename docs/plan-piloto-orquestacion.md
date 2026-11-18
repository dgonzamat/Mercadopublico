# Plan del piloto de la orquestación de fichas (18 nov 2026)

Escrito **antes** de ejecutar. Los criterios no se tocan después de ver los resultados; si alguno resulta mal planteado, se anota como tal en el informe y no se reescribe aquí.

## Qué se prueba
La orquestación vigente de `/nuevo-caso` › Orquestación: dos agentes por ficha (redactor y verificador, que también revisa la clasificación), arreglos aplicados por el orquestador con cita de la fuente, y una lectura por tanda con hasta cinco fichas por lector. Las reglas 9 y 10 de `/redaccion` §3 actúan al redactar.

## Tanda
Cuatro fichas nuevas, `num` 535 a 538 (el `max(num)` de `origin/main` es 534; se asignan de antemano para que cuatro redactores en paralelo no choquen).

| `num` | Candidato | Hueco que llena | Fuente primaria prevista |
|---|---|---|---|
| 535 | Ghana 1987 (informe de inteligencia de la DIA, 27 jul 1987) | país sin ningún caso; década de 1980 (33 casos) | informe DIA, espejo en ufoscans.com; FOIA de la DIA |
| 536 | Agoncillo (La Rioja) 1978, expediente 780720 | década de 1970; expedientes del Ministerio de Defensa de España | Biblioteca Virtual de Defensa, «Expedientes OVNI» |
| 537 | Un caso de los archivos de Canadá (Library and Archives Canada) elegido por el redactor | década de 1960–1980 | LAC, espejo en ufoscans.com/category/canada-ufo |
| 538 | Un caso de los archivos de Nueva Zelanda elegido por el redactor | país con 2 casos | Archives NZ, espejo en ufoscans.com/category/new-zealand-ufo |

Los candidatos 537 y 538 los elige cada redactor: tienen que ser sucesos reales, no estar en el corpus (grep de `data/cases/`) y poder anclarse a un documento primario. Si no hay ninguno anclable, el redactor se detiene e informa; no rellena.

## Medidas y criterios de éxito

| Hipótesis | Medida | Éxito |
|---|---|---|
| **C · costo** | Tokens que reporta cada agente al terminar; total de la tanda entre 4 | Menos de 800k por ficha (el PoC de Puddy, medido, fue ~1,8M con 9 agentes). El costo fijo del agente vacío se mide justo antes y se resta para ver el trabajo. |
| **H · hechos** | Hallazgos del verificador por ficha, por categoría (registro de hallazgos) | No más que las seis fichas de abducción (~7 por ficha) |
| **L · lectura** | Defectos de deuda (`/redaccion` §9) que señala cada lector, **no la nota** | 3 o menos por ficha, en ES y en EN |
| **R · reglas nuevas** | De esos defectos, los que son un referente ambiguo o una cronología mal cuadrada | Cerca de cero. Si siguen apareciendo, las reglas 9 y 10 no actúan al redactar |
| **G · gates** | Errores de `validate-schema`, `audit-consistency` (incluidas E63 y E52) y `audit:reglas` | 0 |
| **P · cumplimiento** | Cada arreglo aplicado lleva cita de página o línea; cada hallazgo tiene su fila | Sí en todos |

## Reparto de agentes
- 4 redactores en paralelo (tope del repo: ~4 agentes pesados a la vez), cada uno con su `num` y su `id`.
- 4 verificadores, uno por ficha, con el brief fijo (`docs/brief-verificacion.md`, sección «New cases: fixed brief»), cuando su redactor termina.
- Arreglos: los aplica el orquestador, contrastando cada uno con la fuente.
- 2 lectores Opus (español e inglés), cada uno con las cuatro fichas en su idioma.
- Control humano: el dueño lee dos fichas elegidas al azar, sin ver el informe de los lectores.

## Línea base y lo que no se controla
- Costo fijo del agente vacío: 116.162 tokens, medido tras desconectar los primeros conectores; se repite justo antes de la tanda.
- Variables mezcladas: se desconectaron conectores y la sesión cambió de modelo. Por eso el costo se compara restando el costo fijo, no en bruto.
- Cuatro fichas son una muestra pequeña: los resultados se leen como señal, no como prueba.

## Qué se hace con el resultado
Si se cumplen C, G y P y L está en 3 o menos, la orquestación queda como está. Si falla L con R alto, las reglas 9 y 10 no bastan y se refuerzan antes de otra tanda. Si falla C, se revisa el reparto de agentes. Si falla H, se mira qué categoría repite el redactor y va a `/blindar` según la regla de cierre del registro.

---

## Resultados (18 nov 2026)

Escrito después de ejecutar. Los criterios de arriba no se tocaron. Los conteos de defectos de lectura son míos, a partir de los informes de los dos lectores; las cifras de tokens son las que reporta cada agente.

| Criterio | Resultado | Veredicto |
|---|---|---|
| **C · costo** | 10 agentes (4 redactores, 4 verificadores, 2 lectores): 2.155.793 tokens, **539k por ficha**. El costo fijo del agente vacío (111.936, medido justo antes) explica 1.119.360, el 52 %; el trabajo propio, unos 259k por ficha. No incluye los tokens del orquestador (esta sesión), que no se midieron. | Cumplido, con esa salvedad |
| **H · hechos** | Hallazgos del verificador: 14, 12, 14 y 16 (56; 4 altos). La referencia eran ~7 por ficha en las seis de abducción. | **No cumplido** (2×) |
| **L · lectura** | Defectos de deuda por lectura: ES 3, 4, 5, 5; EN 5, 4, 5, 5. Solo 1 de 8 lecturas llega a 3 o menos. Notas ES 7, 7, 5, 6; EN 7, 6, 5, 6. | **No cumplido** |
| **R · reglas nuevas** | Referentes y cronologías siguen entre los defectos (McNamara antes de presentarlo, «he / the other man», «5 de marzo» sin año, la ventana horaria de Clarenville). Al menos 6 de ~37 defectos salen de frases escritas o aceptadas por el orquestador al aplicar arreglos del verificador. | **No cumplido** |
| **G · gates** | 0 errores al final. E7, E59 y el país nuevo (`COUNTRY_EN`, `regions.ts`) los halló el verificador o la auditoría del orquestador, no los redactores: el brief del piloto les prohibía correr `audit-consistency` y editar esos archivos por el trabajo en paralelo. | Cumplido, con esa salvedad |
| **P · cumplimiento** | Cada arreglo aplicado lleva cita de página o línea; 1 hallazgo rechazado tras abrir la fuente (Blenheim: «an extremely worried person» describe a Jennings, no a la testigo); 3 cálculos del verificador quedan sin aplicar a la espera de un segundo agente. | Cumplido |

### Qué dice el plan que se haga
Falla L con R alto: las reglas 9 y 10 no bastan, y se refuerzan antes de otra tanda. Falla H: la categoría que más repite (atribución, omisión y cifra/hora en las cuatro fichas) va al registro; no se puede vigilar con sonda, así que pasa a la lista de comprobación del paso 0.5 de `/nuevo-caso`.

### Lo que el piloto enseñó y el plan no previó
1. **Lo que se corrige tras el verificador no lo lee nadie.** Los lectores ven el texto final. Varios defectos de lectura nacieron de arreglos aplicados después (frases con dos puntos y coma encadenados, una ventana horaria con un apellido sin presentar, un paréntesis explicativo). Ninguna regla ni sonda ve ese paso.
2. **El brief del piloto desvió dos resultados.** Prohibir `audit-consistency` y la edición de `lib/` a los redactores, para no pisarse en paralelo, hizo que E7, E59 y el país nuevo llegaran tarde. No es una conclusión sobre el flujo de una sola ficha.
3. **Los verificadores también se equivocan, y la regla de citar la fuente lo atrapó.** Una de 56 propuestas se rechazó al abrir la página.
4. **Los archivos oficiales dan más hallazgos que los relatos secundarios.** Las cuatro fichas parten de expedientes de archivo (DIA, Defensa de España, RG 77 de Canadá, AIR 244 de Nueva Zelanda): más material primario por ficha, más ocasiones de atribución y omisión.
5. **Decisión de licencia pendiente del dueño:** alojar el extracto de RG 77 (Clarenville) frente a dejar solo un enlace, como en Shag Harbour y Falconbridge.
