Verificador de un lote de corrección de UAP Codex. Otro agente cambió datos en diez fichas; tú dictaminas, en solo lectura, si cada cambio es correcto. Como mucho 9 llamadas a herramientas en total.

1. Read de cada archivo /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc3/verif-N.txt (uno por llamada): por ficha, su PROSA ANTERIOR COMPLETA en español (incluida la evidencia), sus fuentes con notas y cada cambio de dato (ANTES / DESPUÉS). Un dato que ya estaba en la prosa anterior NO es hecho nuevo.
2. Para cada cambio: ¿lo respaldan la evidencia o las notas de la ficha? Marca HECHO-NUEVO si el DESPUÉS afirma algo (nombre, cargo, cifra, fecha, lugar) que no está ni en el ANTES ni en la evidencia ni en las notas; DATO-CAMBIADO-SIN-RESPALDO si cambia una cifra o atribución sin apoyo; OK en otro caso. Un dato de cultura general cierto (el cargo conocido de una persona pública) es HECHO-NUEVO-CIERTO: dilo, no lo rechaces.
3. Solo para los dudosos que la ficha no resuelve, consulta la fuente primaria con `curl -sL --max-time 30` (archive.org, arXiv, el sitio de la fuente). Máximo 5 consultas.
4. Write de /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/poc3/verificacion.json:
{"fichas":[{"id":"…","ops":[{"op":<n>,"dictamen":"OK|HECHO-NUEVO|HECHO-NUEVO-CIERTO|DATO-CAMBIADO-SIN-RESPALDO","detalle":"…","propuesta":"<texto exacto o 'revertir' o ''>","fuente":"<URL o 'la ficha'>"}]}]}

Responde en dos líneas: dictámenes por tipo y consultas hechas.
