# Lote R1 · verificación de fichas reescritas (verificador, solo lectura)

R = /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/reesc-r1

Otro agente reescribió desde cero la prosa de estas fichas para que se lea mejor. Tu trabajo **no** es juzgar el estilo: es comprobar que la reescritura **no cambió los hechos**. La regla de CLAUDE.md que importa aquí: en revisiones anteriores los correctores no inventaron citas, pero sí **omitieron** lo del mismo expediente que contradecía su lectura (unas veces inflando el misterio, otras desinflándolo). Una reescritura que «selecciona» corre justo ese riesgo.

Para cada ficha tienes:
- Original: `R/orig/<id>.json`
- Reescrita: `/home/user/Mercadopublico/web/data/cases/<id>.json`
- Plan del redactor (qué decidió quitar, mover y comprobar): `R/out/<id>.json` → `plan`
- Ejecuta: `python3 -I R/tools/check.py <id>` → NUEVOS (cifras y nombres que no estaban en el original) y SALEN (cifras y nombres de la prosa vieja que ya no están en ninguna parte de la ficha). La herramienta es mecánica y tiene un límite: no ve un número que ya existía y se reutiliza en otro contexto, ni un hecho que cambia sin cambiar de cifra. Por eso tienes que **leer las dos versiones lado a lado**.

Comprueba, en este orden:
1. **Hechos nuevos.** Cada NUEVO y cada afirmación que no estaba en el original: ¿lo respalda el `comprobar_en_fuente` del plan? Abre esa fuente (URL de `sources`/`fallbackUrl`, PDF local en /home/user/Mercadopublico/web/public/pursue/, archive.org; pymupdf con `python3 -I`) y confirma la frase.
2. **Hechos cambiados.** Fechas, horas, cifras, quién vio qué, cuántos objetos y testigos, qué concluyó cada fuente: ¿dicen lo mismo que el original o que la fuente? Una paráfrasis que cambia el sentido es un error.
3. **Omisiones que cambian la lectura.** Recorre lo que salió (SALEN y lo que veas al comparar). Mover un detalle a `documents[].description` o a `evidence` está bien. Quitar algo que pesa a favor o en contra de una explicación (una objeción, un dato del registro que la contradice, una retractación, la conclusión de una fuente oficial) es un error aunque el texto quede mejor.
4. **Resoluciones del plan.** Cada `comprobar_en_fuente`: ¿la fuente dice lo que el redactor anotó?
5. **Paridad.** Español e inglés dicen los mismos hechos y matices.

Salida: `R/verif/<id>.md` con, por ficha: **OK** o la lista de problemas. Cada problema: tipo (nuevo sin fuente / cambiado / omisión / resolución errónea / paridad), la frase exacta de la versión nueva, lo que dice el original o la fuente (con la cita), y la corrección propuesta en los dos idiomas. No edites nada fuera de R/verif/: eres solo lectura. Si no pudiste abrir una fuente, dilo.

Responde con una línea por ficha: id, OK o nº de problemas por tipo.
