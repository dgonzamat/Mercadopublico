---
type: llm
---
PASS si en la lista el autochequeo (`caso:check`) va ANTES de lanzar al verificador independiente, y el registro de hallazgos (`hallazgos-verificacion`) va DESPUÉS del verificador, y el contraste de cada arreglo del verificador con la fuente primaria va antes de aplicarlo. FAIL si el orden es otro, si falta alguno de los tres, o si el verificador es el mismo agente que redactó.
