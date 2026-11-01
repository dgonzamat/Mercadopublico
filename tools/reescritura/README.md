# Reescritura de fichas por lotes (método del lote R1, nov 2026)

Herramientas y briefs con los que se reescribieron las primeras fichas (PR #1236). Fuera de `web/`: no se despliegan.

Flujo por lote (unas 8–11 fichas, máximo 4 agentes a la vez):
1. `pack.py <id>...` empaqueta cada ficha (prosa, evidencia, documentos, fuentes, porqué de clase y, si existen, los informes de la auditoría de prosa) y guarda el original en `orig/`.
2. Redactor (`brief-redactor.md`): plan, comprobación en la fuente, reescritura ES+EN, `apply.py`, `check.py` y sondas.
3. Verificador independiente, solo lectura (`brief-verificador.md`): hechos nuevos, cambiados, omisiones que cambian la lectura, paridad.
4. Lector Opus sin fuentes ni guía sobre una muestra (skill `/auditar-prosa`), y segunda pasada del mismo redactor (`segunda-pasada.md`).
5. Si la reescritura cambió la evidencia, revisión de la clasificación en dos pasos (`brief-posterior.md` + verificador).
6. `pdf.mjs <salida.pdf> <id>...` genera el PDF de respaldo (opcional).

Los briefs usan como carpeta de trabajo `R` una ruta del scratchpad de la sesión: cámbiala por la del lote nuevo. `apply.py` aplica sobre la ficha actual del repo (no sobre `orig/`), para no revertir la clasificación que otro paso ya cambió. `check.py` es mecánico: detecta cifras y nombres nuevos o que salen, no un dato que ya existía y cambia de contexto; por eso el verificador lee las dos versiones.
