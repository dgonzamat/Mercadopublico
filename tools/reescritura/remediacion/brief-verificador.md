Eres el verificador de un lote de corrección de UAP Codex. Otro agente corrigió cinco fichas a partir de una auditoría; tú compruebas, en solo lectura, que no metió errores. No corriges nada: dictaminas.

Archivos (léelos una vez cada uno):
- Texto ANTERIOR de las fichas y defectos de la auditoría: /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc/paquete.json
- Parche aplicado (cada op es campo, texto viejo, texto nuevo; más `requiere_fuente` y `evidencia_cambiada`): /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc/parche.json

Revisa cada op y busca solo esto:
1. HECHO NUEVO: el texto nuevo afirma algo (nombre, cifra, fecha, lugar, atribución) que no estaba en el texto anterior, la evidencia ni las notas de las fuentes de esa ficha.
2. DATO CAMBIADO: una cifra, recuento, fecha o atribución distinta de la anterior. Comprueba si el resto de la propia ficha lo respalda.
3. SENTIDO CAMBIADO: la frase nueva dice otra cosa que la vieja (más o menos segura, otra conclusión), salvo que fuera justo el defecto a corregir.
4. ES/EN DESPAREJADOS: lo que se cambió en un idioma no se cambió igual en el otro.
5. CONTENIDO PERDIDO: al partir o recortar un párrafo desapareció un dato.

Para los casos 1 y 2 que el texto de la ficha no resuelva, puedes consultar la fuente primaria con `curl -sL` (máximo 6 consultas en total; archive.org y los sitios de las fuentes de la ficha suelen ser alcanzables; si no responde, dilo y sigue). Comprobaciones obligatorias: (a) en loring-afb-1975, de dónde salen los 5.000 pies y si 150–300 pies es correcto; (b) en oumuamua-2017, si «Thiem Hoang» y «Shmuel Bialy» están en la ficha o en sus fuentes; (c) en gulf-of-oman-2021, «unas 25 apariciones»; (d) en canarias-5-marzo-1979, lo que cambió sobre el juez y Cabo Cañaveral.

Escribe tu dictamen en /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc/verificacion.json:
{"fichas":[{"id":"<id>","objeciones":[{"campo":"…","tipo":"hecho-nuevo|dato-cambiado|sentido|es-en|perdido","op":<índice de la op en el parche>,"detalle":"…","propuesta":"<texto exacto que lo arreglaría, o 'revertir'>","fuente":"<URL o 'la propia ficha'>"}],"ops_revisadas":<n>,"veredicto":"OK|OBJECIONES"}]}

Responde al final en tres líneas: objeciones por ficha, cuántas fuentes consultaste y si alguna no respondió.
