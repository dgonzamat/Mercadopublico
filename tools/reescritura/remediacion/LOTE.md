# Lote diario de remediación (aprobado por el dueño el 5 nov 2026)

Diez fichas al día con el método de la tercera prueba de concepto. Orden: Tier S pendientes → Tier A con
defectos ALTA de prosa → reescrituras Tier A. Las Tier B que solo tienen MEDIA o BAJA y las reescrituras
Tier B quedan aplazadas. Costo medido en el lote 2a-1: unos 61.000 tokens por ficha Tier S.

R = /home/user/Mercadopublico/tools/reescritura/remediacion · S = scratchpad de la sesión · L = S/lote-<AAAA-MM-DD>

1. `git fetch origin main`; la rama de trabajo debe estar al día con main (si no, `git merge -s ours` tras un squash ya fusionado). Si la rama tiene un PR abierto, llévalo a verde y fusiónalo antes de empezar; si no se puede (CI roja que no es tuya, conflicto ambiguo), avisa al dueño y para.
2. `python3 -I R/elegir_lote.py 10` → tramo y lista. Si el tramo es «Reescrituras», para y avisa: ese tramo usa el método de reescritura del lote R1, no este.
3. `python3 -I R/paquete.py L/paquete.json <ids>` y `python3 -I R/mktxt.py L`.
4. Corrector Opus: copia `R/brief-corrector-v3.md` a L cambiando `poc3/` por `lote-<fecha>/` y la lista de paquetes por los que generó mktxt. Si el lote es Tier S, añade al brief: «Para cada ficha, di en `no_resueltos` si el relato muestra un registro instrumental de la época que coincide con lo que vieron los testigos; si no lo muestra, escribe "TIER: revisar"». Si alguna ficha lleva la fisionomía «peluda-garras», añade: «di en `no_resueltos` si el relato describe seres pequeños, peludos y con garras; si no, escribe "FISIONOMÍA: no casa"».
5. `python3 -I R/aplicar.py L/parche.json --dry`: 0 rechazadas y 0 párrafos de más de 900 (si queda alguno, añade al parche una op que lo parta en ES y EN en el mismo punto).
6. `python3 R/mkverif.py L` y verificador Sonnet con `R/brief-verificador-v3.md` adaptado (rutas a L, número de fichas, los verif-N.txt que salieron). Contrasta tú cada HECHO-NUEVO y cada HECHO-NUEVO-CIERTO antes de aceptarlo; revierte lo que no se sostenga; quita las ops que cambien un solo idioma.
7. Aplica (`R/aplicar.py L/parche.json`). Para cada ALTA en `requiere_fuente`, busca la respuesta en el documento del visor (`web/public/pursue/…` con pymupdf; renderiza la página si el OCR duda) o en la fuente enlazada; si la fuente no lo dice, escribe en la ficha que no lo dice. Aplica esas ops en ES y EN.
8. Relectura de TODAS las fichas del lote (decisión del dueño, 10 nov 2026; antes se leían 2 y la mitad salía con un defecto ALTA que las demás no pasaban por ningún control): `python3 -I R/mktxt.py L --reaud <todos los ids>` y lectores con el modelo Opus 5.5 (`model: "opus"` en la llamada al agente), 2 fichas por lector, con `S/poc3/reaud/brief.md` adaptado a `L/reaud/`. Arregla los ALTA que señale cada lectura; si da REESCRIBIR, añádela a `reescribir_tras_relectura` en remediadas.json. Una ficha no se registra como cerrada sin su lectura.
9. `node scripts/validate-schema.mjs`, `node scripts/audit-consistency.mjs` (0 errores) y `npm run test:unit` desde web/.
10. Añade el lote a `R/remediadas.json`. Commit (sin `[skip ci]`), push y PR con el resumen. Cuando la integración continua esté en verde, fusiónalo por squash con un mensaje escrito por ti sin `[skip ci]` (el dueño autorizó el 5 nov fusionar sin preguntar) y sincroniza la rama con `git merge -s ours origin/main`.
10b. Refresca el panel «Avance de deuda UAP Codex» (https://claude.ai/artifact/6sozxb2TnQwbpFVfWVj71v): `python3 -I tools/reescritura/avance.py S/avance`, sube categorias.json, fichas_tier.json y sondas.json como assets, actualiza `datasets/<nombre>` (source.url, updated, edit; lee su version para if_version) y borra los assets anteriores.
11. Avisa al dueño en 4–6 líneas: fichas, ops, dictámenes del verificador, ALTA resueltos con fuente, veredictos de la relectura, «TIER: revisar» y «FISIONOMÍA: no casa» que hayan salido, y tokens del día.
