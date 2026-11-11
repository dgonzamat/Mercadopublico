# Integración de tus propias respuestas de fuente

Un verificador distinto revisó tus respuestas. Su dictamen está en `verif-fuente.json`, en la carpeta de tu lote. Ahora produces tú el parche final. No editas el repositorio.

1. Para cada respuesta con dictamen OK, toma tus ops tal cual.
2. Para cada CORREGIR o SIN-RESPALDO, **vuelve a la fuente antes de aplicar la propuesta del verificador**: los verificadores también se equivocan. Si la fuente le da la razón, aplica su texto (ajustando la forma si hace falta). Si no, mantén el tuyo y explica por qué con la frase de la fuente.
3. Si el verificador propone ops nuevas o cambios de `campos` (por ejemplo `location.place`), inclúyelos tras comprobarlos.
4. No introduzcas en ninguna ficha un dato cuya única fuente no figure en `sources`. Las fuentes nuevas van en `sources_nuevas`, solo si las leíste, con `name`, `name_en`, `url`, `note` y `note_en`, sin raya en el nombre y sin notas de trabajo.
5. No toques `posterior`, `probability`, `classBasis`, `tier` ni `mundanoType`. Si la prosa queda desalineada con el `classBasis`, anótalo.
6. No escribas ausencias como hechos ni notas de trabajo del redactor («no se ha podido consultar»).
7. Reglas de forma: mismo cambio en ES y EN; resumen entre 400 y 650 caracteres; ningún párrafo por encima de 900 (parte en el mismo punto en ES y EN); «» en ES y "…" en EN; sin raya ni markdown. Cada «viejo» debe aparecer una sola vez en el texto ACTUAL de la ficha (/home/user/Mercadopublico/web/data/cases/<id>.json). Para evidence usa índice: "evidence[2]".

Escribe en la carpeta de tu lote:
- `parche-fuente-final.json`: {"fichas":[{"id":"…","ops":[{"campo":"…","viejo":"…","nuevo":"…"}],"sources_nuevas":[],"notas_fuente":[{"url":"…","note":"…","note_en":"…"}],"campos":{}}]}
- `integracion.md`: por cada CORREGIR, qué decidiste y la frase de la fuente que lo sostiene.

Comprueba con un script que todas las ops aplican en orden y que se cumplen los límites.

Responde en pocas líneas, en español neutro: qué cambiaste respecto del verificador y por qué, y **qué fichas cambian un hecho que su `classBasis` cita o del que depende su clase** (solo esas pasan a revisión de clasificación; di cuál es el hecho).
