# Lote de remediación (aprobado por el dueño el 5 nov 2026; flujo vigente desde el 11 nov 2026)

Veinte fichas por lote; si al tramo le quedan pocas más (22 en el Tier B con ALTA, decisión del dueño del 11 nov 2026), va entero. Orden de `elegir_lote.py`: Tier S → Tier A con ALTA → reescrituras Tier A → Tier B con ALTA →
reescrituras Tier B. Las Tier B con solo MEDIA o BAJA quedan aplazadas. Una ficha cuenta como cerrada solo cuando
termina todo su ciclo (pasos 4 a 11).

**Un lote por sesión nueva** (decisión del dueño, 11 nov 2026): una conversación larga relee todo su contexto en cada
turno y llegó a ser cerca del 28 % del gasto de un día. Todo lo que el lote necesita vive en el repo: datos de la
auditoría en `tools/reescritura/datos/`, plantillas de los briefs en `R/plantillas/` (se rellenan con `R/brief.py`,
nunca copiando el brief del lote anterior, que arrastraba fichas y rutas viejas).

**Modelos** (decisión del dueño, 11 nov 2026): verificadores en Sonnet (`model: "sonnet"`), lo demás en Opus
(`model: "opus"`). Como mucho ~4 agentes pesados a la vez.

R = /home/user/Mercadopublico/tools/reescritura/remediacion · S = scratchpad de la sesión · L = S/lote-<AAAA-MM-DD><letra>
(un L por tanda de 6–8 fichas; tres tandas por lote).

**Eficiencia** (PoC del 11 nov 2026, aprobada por el dueño): cada agente gasta ~150.000 tokens solo en arrancar, así que el ahorro está en lanzar menos agentes, no en darles menos trabajo. Un solo verificador de corrección y un solo verificador de fuentes para las tres tandas (`--tandas`). Lectores de 3 fichas: uno de 4 se dejó un defecto grave que dos lectores de 2 vieron (Keyhoe sin presentar en Shirleys Bay). **Agente colgado**: si su archivo de salida existe y lleva 10 minutos sin cambiar, detenlo (TaskStop) y termina tú su paso con lo que dejó; el 11 nov uno esperó 45 minutos tras escribir su parche.

1. `git fetch origin main`; la rama de trabajo debe estar al día con main (si no, `git merge -s ours origin/main` tras un squash ya fusionado). Si la rama tiene un PR abierto, llévalo a verde y fusiónalo antes de empezar; si no se puede, avisa al dueño y para.
2. `python3 -I R/elegir_lote.py 20` (o el número que fije el dueño) → tramo y lista. Si el tramo es de reescrituras, para y avisa: usa el método de reescritura del lote R1, no este.
3. Por tanda: `python3 -I R/paquete.py L/paquete.json <ids separados por espacio>` y `python3 -I R/mktxt.py L`.
4. Corrector (Opus): `python3 -I R/brief.py corrector L`. Si la tanda es Tier S, añade al brief la pregunta «TIER: revisar» (registro instrumental que coincida con lo visto); si alguna ficha lleva la fisionomía «peluda-garras», la de «FISIONOMÍA: no casa».
5. `python3 -I R/chk.py L/parche.json` debe decir OK: 0 rechazadas, 0 párrafos de más de 900, resúmenes entre 400 y 650 y prosa ES desde 3.500; los campos «un-idioma» se miran a mano (vocabulario, unidades u hora del español son legítimos).
6. `python3 -I R/mkverif.py L` en cada tanda y, cuando las tres pasaron el paso 5, UN verificador (Sonnet): `python3 -I R/brief.py verificador L1 --tandas L2 L3 --atencion "<lo dudoso de los parches>"` (escribe L1/verificacion.json con las fichas de todas). Contrasta tú cada HECHO-NUEVO y HECHO-NUEVO-CIERTO; revierte lo que no se sostenga; quita las ops que cambien un solo idioma. Aplica (`R/aplicar.py L/parche.json`).
7. Lectura de TODAS las fichas, antes de las preguntas de fuente (así sus ALTA entran en la misma ronda): `python3 -I R/mktxt.py L --reaud <ids>`, `python3 -I R/brief.py lector L --nt dos` y lectores (Opus) de 3 fichas cada uno (`--nt tres`; la última tanda puede llevar uno de 1 o 2). Si una lectura da REESCRIBIR, la ficha va a `reescribir_tras_relectura` en remediadas.json y sale del lote.
8. Preguntas de fuente (Opus): `python3 -I R/brief.py fuente L` junta los `requiere_fuente` del corrector y los ALTA de los lectores. El brief limita la investigación de las presentaciones («quién es X»), que son la mitad de las preguntas y casi nunca cambian un hecho.
9. Cuando los tres agentes de fuente terminaron, UN verificador de fuentes (Sonnet), distinto de ellos: `python3 -I R/brief.py verif-fuente L1 --tandas L2 L3 --atencion "<fichas y datos delicados>"`. Copia L1/verif-fuente.json a L2 y L3 antes del paso 10.
10. El mismo agente de fuente integra sus respuestas con el dictamen (SendMessage con el texto de `R/plantillas/integra-propia.md`, que `R/brief.py integra-propia L` deja en L). Aplica con `python3 -I R/aplicar_fuente.py L`; los `campos` que imprime («!!campos sin aplicar») van a mano.
11. Clasificación en dos pasos, solo para las fichas donde cambió un hecho que su `classBasis` cita o del que depende la clase (lo dice la respuesta del paso 10): copia las fichas de antes del lote a `C/orig/`, `python3 -I R/brief.py clasificacion L --c C`, revisor (Opus) y verificador (Sonnet) distintos; cada arreglo del verificador se contrasta con la fuente antes de aplicarse.
12. `node scripts/validate-schema.mjs`, `node scripts/audit-consistency.mjs` (0 errores) y `npm run test:unit` desde web/.
13. Añade el lote a `R/remediadas.json`. Commit (sin `[skip ci]`), push y PR. Con la integración continua en verde, fusiónalo por squash con un mensaje escrito por ti sin `[skip ci]` (autorizado el 5 nov) y sincroniza la rama con `git merge -s ours origin/main`.
14. Refresca el panel «Avance de deuda UAP Codex» (https://claude.ai/artifact/6sozxb2TnQwbpFVfWVj71v): `python3 -I tools/reescritura/avance.py S/avance`, sube categorias.json y fichas_tier.json como assets, actualiza `datasets/<nombre>` (source.url, updated, edit; lee su version para if_version) y borra los assets anteriores.
15. Avisa al dueño en 4–6 líneas: fichas, ops, dictámenes de los verificadores, ALTA resueltos con fuente, veredictos de la lectura, cambios de clasificación, tokens del lote y **tokens por ficha cerrada y defectos ALTA por ficha de la lectura** (referencia del 11 nov, con lectores de 2: ~270.000 tokens por ficha y 0,7 ALTA por ficha, 14 en 20; si los ALTA por ficha bajan con lectores de 3, se vuelve a 2).
