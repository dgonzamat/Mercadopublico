# Brief: limpiar muletillas de prosa en fichas de UAP Codex (sin tocar hechos ni clasificación)

Repo: /home/user/Mercadopublico. Fichas en `web/data/cases/<id>.json`. Trabajas SOLO en los ficheros de tu lote. No hagas commit ni push. No toques ningún otro fichero.

## Qué corregir (en español y en su par `_en`)
Campos: `summary`, `whatHappened`, `whyMatters`, `evidence` y sus `_en`.

1. **«El corpus» / «the corpus» / «este corpus»**: el lector no sabe qué es «el corpus». Reescribe sin la palabra: «que el corpus ya registra» → «ya documentado en [[slug]]» o simplemente bórralo; «el corpus lo clasifica…» → di el hecho. Se permite solo cuando la frase compara de verdad con otros casos del archivo y no hay forma más directa; en ese caso usa «el archivo» con moderación.
2. **«Honesto/honestidad/honest»** como muletilla («una lectura honesta», «el análisis honesto», «honestamente»): bórrala o usa una palabra precisa (prudente, completa, que no exagera). Se conserva si es literal sobre la honestidad de una persona.
3. **«No es X, es Y» / «no X sino Y» / «not X but Y»** como fórmula de énfasis: di Y directamente. Conserva la negación solo cuando corrige un error concreto y documentado (p. ej., «la tarjeta dice fraude, no aeronave»).
4. **Aperturas en fórmula** de `whyMatters`: «Es uno de los…», «It is one of the…», «El valor de este caso…», «Vale por…», «It matters for…». Empieza por el hecho que importa.
5. **Comentario editorial dentro de `evidence`**: cada ítem de `evidence` debe ser un hecho documentado (quién, qué, cuándo, qué fuente). Quita de ahí las valoraciones («lo que importa es…», «la lectura correcta…», menciones al corpus, a la probabilidad o al posterior). Si la valoración aporta algo, muévela a `whyMatters`; si no, bórrala.

## Qué NO hacer
- No cambies hechos, cifras, fechas, nombres, citas, fuentes ni `posterior`/`probability`/`mundanoType`/`classBasis`/`tier`. Esto es solo estilo.
- No borres información: si una frase con muletilla trae un dato, conserva el dato.
- No califiques la probabilidad en la prosa («probabilidad baja», «sube la probabilidad…»).
- No añadas rayas (—); si reescribes un inciso, prefiere comas o paréntesis.
- Nada de markdown (**, listas con «- », #) ni código entre comillas invertidas. Enlaces a otros casos: `[[slug]]`.
- Español neutro, sin voseo. En los campos ES no metas inglés sin traducir salvo citas literales entre «» y nombres propios.
- Mantén la estructura de párrafos (`\n\n`) y la paridad ES/EN: lo que cambies en ES, cámbialo igual en EN.
- `whatHappened` + `whyMatters` deben seguir sumando 3.500 caracteres o más en cada idioma (regla E13). Si un recorte te deja por debajo, recorta menos.

## Cómo editar
Edita el JSON en su sitio sin reformatearlo (no hagas `json.dump` del fichero entero: cambia solo los strings). Después, desde `/home/user/Mercadopublico/web`:
`node scripts/validate-schema.mjs` y `node scripts/audit-consistency.mjs` — no debe aparecer ningún ERROR ni WARN nuevo que nombre tus fichas (WARN preexistentes a ignorar: E21, E38).

## Informe (breve)
Por ficha: cuántas muletillas quitaste de cada tipo, cualquier caso dudoso que dejaste a propósito y por qué, y los caracteres finales ES/EN de whatHappened+whyMatters. Al final, la cola de la salida de las dos sondas.
