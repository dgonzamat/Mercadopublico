Agente de fuentes de UAP Codex. Un corrector de prosa dejó {N} preguntas que solo la fuente primaria responde. Tu trabajo: responder cada una con la fuente y proponer el arreglo de la prosa, en ES y EN. No editas el repositorio.

Fichas: /home/user/Mercadopublico/web/data/cases/<id>.json (ya llevan aplicadas las correcciones del corrector). Documentos embebidos en /home/user/Mercadopublico/web/public/pursue/ (léelos con pymupdf: `python3 -I -W ignore -c "import pymupdf; ..."`; si el OCR duda en una cifra, renderiza la página con get_pixmap(dpi=110) y mírala). Fuentes externas: las URL de `sources` de cada ficha, con `curl -sL --max-time 60`; archive.org (collection project-blue-book, buscado por AAAA-MM y lugar, y su _djvu.txt), nicap.org y theblackvault son alcanzables; web.archive.org, war.gov, defense.gov y aaro.mil están bloqueados. Guía de acceso: /home/user/Mercadopublico/docs/brief-revision-evidencia.md, paso 2. Descarga a {L}/fuente/. Escribe con la guía /home/user/Mercadopublico/.claude/commands/redaccion.md (comillas «» en ES y "…" en EN, sin raya, sin markdown, frases cortas, presenta a cada persona nombrada).

Preguntas:
{PREGUNTAS}

Para cada pregunta:
1. Busca la respuesta en la fuente primaria. Si la fuente no lo dice, la respuesta es que la fuente no lo dice, y la prosa debe decir solo lo que sí consta (quita la cifra o el detalle que no se sostiene, o escribe que la fuente no lo precisa).
2. Propón ops que arreglen el defecto en la prosa de la ficha tal como está HOY en el archivo: {"campo":"whatHappened|whatHappened_en|summary|summary_en|whyMatters|whyMatters_en|evidence|evidence_en","viejo":"<tramo exacto, presente una sola vez en el campo; en evidence, el ítem completo>","nuevo":"…"}. Siempre el mismo cambio en ES y EN. No toques posterior, probability, classBasis, tier ni mundanoType. El resumen debe quedar entre 400 y 650 caracteres y ningún párrafo por encima de 900.
3. Ojo con el sesgo: no omitas lo que en la misma fuente contradice lo que propones.

Escribe {L}/fuente.json:
{"respuestas":[{"id":"…","pregunta":"…","respuesta":"…","cita":"<frase literal de la fuente o 'la fuente no lo dice'>","fuente":"<URL o ruta y página>","ops":[…]}]}

Responde al final en una línea por ficha: preguntas resueltas con fuente y las que la fuente no responde.
Regla adicional: ningún dato puede entrar en la ficha si su única fuente no figura en sources; si hace falta una fuente nueva, propónla aparte en un campo "sources_nuevas" de la respuesta, solo si la leíste.


Presupuesto (decisión del dueño, 11 nov 2026: es la etapa más cara del lote): las presentaciones («quién es X», «qué es Y») se resuelven con lo que ya dicen la ficha, sus fuentes y las notas de sus fuentes; si no basta, con UNA consulta a una fuente de `sources`; si tampoco basta, presenta con el rótulo que la ficha permite («el investigador X», «el organismo Y») sin buscar más. Investiga a fondo solo cifras, fechas, recuentos, contradicciones y atribuciones. Como mucho 3 consultas externas por pregunta.

Las preguntas marcadas «defecto ALTA de la prueba de lectura» vienen de un lector que no ve fuentes; arréglalas en la prosa aunque la respuesta sea solo presentar a alguien o situar una cifra.
