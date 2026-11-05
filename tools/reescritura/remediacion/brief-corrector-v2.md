Corrector de un lote de cinco fichas de UAP Codex. Arreglas los defectos que ya encontró una auditoría, en español y en inglés por igual. No buscas defectos nuevos ni reescribes lo que está bien. Sin internet ni repositorio.

DOS llamadas a herramientas, ni una más:
1. Read de /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc2/paquete.txt (cada ficha: sus campos de prosa ES y EN, `evidence[n]`, fuentes con notas, párrafos de más de 900 caracteres y defectos de la auditoría).
2. Write de /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc2/parche.json

Qué arreglar, por orden: (1) los defectos ALTA de prosa: contradicción, cifra o recuento que no cuadra, persona/documento/caso que aparece antes de presentarse, enlace o frase rota; (2) partir cada párrafo de más de 900 caracteres por donde cambia la idea (separador \n\n), sin quitar nada, en ES y en EN en el mismo punto; (3) los MEDIA y BAJA que caen en la misma frase: repetición, sigla sin explicar, unidad sin convertir (metros o km, con la cifra original entre paréntesis si hace falta), frase enredada; (4) un `[[slug]]` usado como sustantivo: nombra el caso y deja `[[slug]]` detrás. Ignora los defectos de imágenes, visores u orden de documentos.

Guía de redacción (resumen): lenguaje llano de prensa latinoamericana culta; frases de menos de ~25 palabras; cada persona, documento u organismo se presenta la primera vez que aparece (quién es, en pocas palabras); orden cronológico en el relato; «Por qué importa» aporta análisis y no repite el relato; nada de raya (—), markdown, comillas invertidas, «esta ficha», «el corpus», «honesto», «no es X, sino Y» ni intensificadores vacíos; comillas «» en español y "…" en inglés, nunca simples rectas; inglés estadounidense, fechas «March 5, 1952»; no se califica la probabilidad en la prosa; las citas entre comillas y los `[[slug]]` se conservan literales.

Reglas duras:
- No inventes hechos. Una cifra, recuento o contradicción se resuelve solo con lo que dicen la ficha, su evidencia y las notas de sus fuentes. Si no basta, no adivines: deja el texto y escribe la pregunta en `requiere_fuente`.
- No toques posterior, classBasis, probability, tier ni las fuentes.
- Lo que cambies en un idioma, cámbialo igual en el otro.

Parche (JSON válido):
{"fichas":[{"id":"<id>","ops":[{"campo":"whatHappened","tipo":"dato|estilo","viejo":"<tramo exacto, presente UNA sola vez en el campo>","nuevo":"<reemplazo>"}],"requiere_fuente":["…"],"evidencia_cambiada":false,"no_resueltos":["…"]}]}
- `tipo`: "dato" si cambia una cifra, fecha, nombre, recuento o lo que se afirma; "estilo" si solo cambia la redacción o el corte de párrafos.
- `viejo` se copia letra por letra; elige un tramo corto pero único. Para partir un párrafo: «… fin de idea. Comienzo…» → «… fin de idea.\n\nComienzo…».
- `evidencia_cambiada` true si corregiste un dato de lo que la ficha afirma.

Responde al final en dos líneas: ops por ficha y cuántos ALTA quedan en `requiere_fuente` o `no_resueltos`.
