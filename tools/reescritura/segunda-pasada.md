# Lote R1 · segunda pasada (mismo redactor)

R = /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/reesc-r1

Tu primera versión mejoró mucho la lectura, pero ni el verificador ni el lector la dieron por buena. Tienes dos entradas:

1. **Verificador** (`R/verif/<id>.md`): hechos nuevos sin fuente, hechos cambiados, omisiones que cambian la lectura y fallos de paridad. **Cada corrección suya se comprueba otra vez en la fuente antes de aplicarla** (los verificadores también se equivocan). Si la fuente le da la razón, corrige; si no, deja el texto y anota en el plan por qué.

2. **Lector Opus** sin fuentes ni guía, que leyó en español una muestra del lote (`R/lector/es-<id>.md`, si tu ficha está en la muestra). Sus hallazgos describen defectos **de método**, así que aplícalos a **todas** tus fichas, estén o no en la muestra:
   - **Cada hecho se cuenta una vez.** En Skinwalker contó cuatro veces que no hay resultados revisados por pares y tres el pelo de perro y mapache. Elige el sitio donde cada hecho pesa más y quítalo de los demás (resumen y relato pueden compartir lo esencial; «Por qué importa» no repite).
   - **«Por qué importa» no resume el relato ni trae hechos nuevos del caso.** Dice qué prueba y qué no prueba el caso, qué cambió por él, cómo encaja con otros casos. Un hecho del suceso (quién compró el rancho después, una serie de televisión, una hipótesis nueva) va en el relato, en su lugar cronológico. En Washington 1952 la objeción de Ruppelt y la respuesta de Borden y Vickers sorprendieron al lector por no estar en el relato: el debate puede vivir en «Por qué importa», pero el relato debe anunciar que lo hubo.
   - **Cada párrafo dice cuándo ocurre.** «Esa noche», «ese mismo mes» sin año delante, o un párrafo de cazas sin decir de cuál de las dos noches, pierden al lector.
   - **Cada persona y cada sigla, presentada antes de usarla**; y cada recuento cerrado: si la médica tuvo cuatro pacientes, ¿están Trindade y Claudomira entre ellos? Si no lo dice la fuente, no lo afirmes, pero no dejes que el texto lo sugiera.
   - **Una sola conclusión por fuente.** Si el informe cerró «sin conclusión», no puede también «diagnosticar histeria» en otro párrafo: di exactamente qué concluyó y quién dijo lo otro.
   - **Frases con cadena de complementos** (el operador que, en la torre que, del aeropuerto que…) se parten.
   - Los enlaces `[[slug]]` se ven en el sitio como el título del caso enlazado: escribe la frase para que se lea bien con ese título dentro.

Mismo método que el brief (`R/brief-redactor.md`): actualiza `R/out/<id>.json` (plan incluido), `python3 -I R/tools/apply.py <id>`, `python3 -I R/tools/check.py <id>`, build + validate-schema + audit-consistency sin ERROR ni WARN de tus fichas, `audit-prosa --id`. Antes de terminar, lee cada ficha de corrido en los dos idiomas buscando justo esos defectos.

Responde con una línea por ficha: qué corrigió del verificador (y qué rechazaste con la fuente), y qué cambió por los hallazgos del lector.
