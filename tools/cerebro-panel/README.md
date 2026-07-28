# cerebro-panel

Panel de control del cerebro. **Externo al sitio**: vive fuera de `web/`, no
entra en el `output: export` y no se despliega a GitHub Pages. Es una
herramienta de operación del repo, no una página de uapcodex.org.

```powershell
powershell -ExecutionPolicy Bypass -File tools\cerebro-panel\start.ps1   # → http://127.0.0.1:4180
powershell -ExecutionPolicy Bypass -File tools\cerebro-panel\start.ps1 -Detener
```

`node tools/cerebro-panel/server.mjs` también funciona, pero deja el panel
colgando de la terminal que lo lanzó: si esa sesión se cierra —o el árbol de
procesos de un agente se limpia— el panel muere con ella, y muere **duro**
(sin señal, sin excepción, sin línea en el log), así que desde fuera parece que
«se cae solo». `start.ps1` lo crea vía `Win32_Process.Create`, de modo que
cuelga del servicio WMI y sobrevive a quien lo lanzó; además apaga el panel
previo antes de arrancar.

**Cuando se caiga, lee `panel.log`** (gitignored). Ahí está la respuesta:

| Lo que ves | Qué pasó |
|---|---|
| `apagado por SIGINT/SIGTERM/…` | alguien lo apagó: Ctrl+C, cierre de ventana, `kill` |
| `excepción no capturada` / `promesa rechazada` | reventó por código (y siguió vivo: hay red de seguridad) |
| línea de `arrancado` sin ninguna de cierre | **muerte dura** — `TerminateProcess` desde fuera; lánzalo con `start.ps1` |

Sin dependencias, sin build, sin `node_modules`. Node 18+.

**Si editas `server.mjs`, reinicia el panel.** Node no recarga módulos: el
proceso vivo sigue disparando los prompts que tenía en memoria, mientras
`index.html` —que se relee en cada request— ya muestra lo nuevo. La UI se
actualiza y el motor no, así que una corrida parece probar un cambio que nunca
cargó (pasó: una corrida "ignoró" una regla de ámbito recién escrita que
simplemente no estaba en memoria). El panel sella el `mtime` al arrancar y
avisa en la cabecera cuando el archivo cambió debajo.

---

## Qué hace

**Muestra la orquestación moviéndose.** El centro del panel es un flowchart de
tres bandas —**gate → cadena del modo → aterrizaje**— y sus nodos **se encienden
conforme la corrida avanza**: verde lo ya recorrido, rojo pulsante el paso
activo. Las aristas llevan una marcha de guiones que se acelera mientras hay una
corrida viva, y un ticker lista cada herramienta invocada en tiempo real, **con
lo que devolvió**: cada `tool_use` se casa con su `tool_result` por id, así que
el flujo se lee como entrada → salida y no como una lista de intenciones.

El diagrama es **lean-nativo**: dibuja lo que el prompt lean hace de verdad. Las
bandas de ceremonia (cierre obligatorio, rastro) y el nodo `DRIFT` se quitaron
porque el lean no las ejecuta y dejaban media pantalla apagada — un diagrama con
nodos que nunca encienden enseña a ignorarlo. **La banda del medio se deriva de
la cadena del modo elegido**, así que el diagrama no puede prometer un paso que
el skill no tiene; cambiar de pestaña cambia solo esa banda.

El movimiento sale de `--output-format stream-json`: cada `tool_use` del proceso
se parsea y se matchea contra los nodos. El criterio de encendido es
deliberadamente **estrecho** — nombre de herramienta, forma citada
(`{"skill":"simplify"}`) o forma con barra (`/blindar`)—, nunca `\bpalabra\b`:
con el criterio ancho, `git log` encendía el nodo **LOG** y el diagrama afirmaba
un cierre que no había ocurrido. Por la misma razón el **aterrizaje** no se
enciende con eventos en absoluto: `COMMIT` y `MERGE` no son herramientas del
agente sino acciones del panel, y se iluminan solo con el hecho consumado
(`job.commit`, `job.mergeado`) — nunca con la intención.

Para que la cadena pueda encenderse, el prompt lean **obliga a `Read` el
`.claude/commands/<skill>.md` de cada skill antes de ejecutarlo inline**
(`SlashCommand` está deshabilitada en headless). Sin ese `Read` el skill puede
ejecutarse igual, pero el panel no tiene con qué probarlo y el nodo queda
apagado — la regla existe para que el diagrama no invente.

Los modos de código (`bugs`, `mejoras-tec`) declaran además su **ámbito**, y les
está prohibido tomar el árbol sucio como objetivo. Sin eso el modo se vuelve
circular: `simplify` se define sobre «el código cambiado», y en headless lo único
cambiado suele ser trabajo en curso de otra sesión — una corrida de `mejoras-tec`
terminó auditando el diff sin commitear del propio panel y cerrando en 0. El
ámbito por defecto es el sitio bajo `web/`; si la señal trae una ruta, esa manda.

**Gatilla los triggers.** Un botón por modo. Los modos **no están escritos en el
panel**: se derivan de `cerebro.md` al vuelo, así que el panel no puede ofrecer
un modo que el skill no declara, ni quedarse sin uno que se añada.

**Monitorea el histórico.** Lee `docs/cerebro-runs.jsonl` y muestra cada corrida
con su señal, hallazgo, descartes, automejora y skill scan. Arriba, la **tasa
candidatos→verificados**, que es la única respuesta no anecdótica a «¿el cerebro
está dando valor?». Una tasa alta con pocos candidatos es un cerebro tímido; una
baja con muchos es uno que fabrica trabajo.

**Identifica bugs y los manda a corregir.** «Sondear salud» corre las cuatro
sondas del repo de verdad (`validate-schema`, `audit-consistency`,
`audit-design`, `audit-skills --negative-control`) y lista sus hallazgos. Cada
hallazgo lleva un selector de modo destino y un botón **Mandar**: el texto del
hallazgo viaja como contexto del prompt, de modo que la corrida ataca *eso* y no
empieza a buscar de cero. El destino se elige por hallazgo a propósito — un E21
de cobertura visual va a `caso-nuevo`, un fallo de contraste a `mejoras-ux`.

**Aterriza la corrida en el repo.** Una corrida que edita archivos y los deja
sueltos en el árbol no terminó: terminó a medias, y el siguiente disparo hereda
la basura. Al finalizar, el panel lista **solo los archivos que esa corrida
tocó** y te deja commitearlos en rama (nunca `git add .`) o descartarlos —
revirtiendo los versionados y borrando los nuevos, también acotado a esa lista.
Si estás en `main`, el commit **crea rama** `claude/cerebro-<modo>-<ts>`: el
panel no escribe en la base.

Commiteado, aparece **Mergear a main + push**, que cierra el ciclo hasta el
deploy. El merge es `--ff-only` a propósito: sin commits de merge, y si `main`
avanzó falla con un error claro en vez de dejar un merge sucio (y te devuelve a
tu rama, no a `main` a medias). Los mismos dos botones existen en la tarjeta
**Repo** para cambios que no vienen de una corrida.

---

## Permisos — léelo antes de disparar

Los disparos usan `--permission-mode acceptEdits` por defecto: el panel existe
para que el cerebro **arregle**, y con `manual` cada corrida se colgaría
esperando una confirmación que nadie va a dar (el panel no es una terminal
interactiva). El modo vigente se muestra en la cabecera, siempre, para que nunca
dispares sin saber con qué permisos.

```bash
CEREBRO_PANEL_PERMISSION_MODE=plan node tools/cerebro-panel/server.mjs   # solo planifica
```

El servidor escucha **solo en 127.0.0.1**. No lo expongas: ejecuta `claude` con
permisos de edición sobre el repo, así que abrirlo a la red es dar una shell.

Otras defensas: `spawn` sin shell (no hay interpolación de comandos), el modo se
valida contra la lista derivada de `cerebro.md` (un modo inventado devuelve 400)
y el contexto libre se recorta y viaja como argumento.

---

## Qué NO reimplementa

Dos reglas del repo se aplican aquí, y las dos costaron un falso verde antes:

- **El contrato sale de un solo sitio.** Modos, cadenas y campos obligatorios
  del log se leen con `web/scripts/lib/cerebro-contract.mjs`, el mismo módulo
  que consume la sonda `audit-skills.mjs`. Un segundo parser sería un segundo
  contrato: el panel ofrecería modos que la sonda no conoce y nadie se
  enteraría.
- **La salud sale de las sondas, ejecutadas.** El panel las corre como
  subprocesos y muestra su salida; no vuelve a auditar por su cuenta.

Y una defensa contra sí mismo: el panel **reconcilia** lo que logró extraer con
los totales que cada sonda declara (`ERRORS: n  WARNS: n`). Si no cuadran, lo
dice en la tarjeta en vez de callarse. La primera versión del parser solo
entendía el formato inline y reportó «0 warns» sobre un `audit-consistency` que
declaraba `WARNS: 1` — verde y ciego. Por eso el estado de cada sonda lo deciden
el exit code y el contador declarado, nunca lo que el panel supo leer.

---

## API

| Ruta | Qué |
|---|---|
| `GET /api/state` | modos, corridas, métricas, campos del contrato |
| `GET /api/health` | corre las cuatro sondas y devuelve sus hallazgos |
| `POST /api/fire` | `{modo, contexto?}` → lanza la corrida, devuelve el job |
| `GET /api/job?id=` | estado y salida acumulada de un job |
| `GET /api/jobs` | todos los jobs de la sesión, del más nuevo al más viejo |
| `POST /api/stop` | `{id}` → SIGTERM al job |
| `GET /api/diff?id=` | archivos que tocó la corrida + si ya se commiteó/mergeó |
| `POST /api/commit` | `{id, message?}` → commitea SOLO esos archivos, en rama |
| `POST /api/discard` | `{id}` → revierte/borra SOLO esos archivos |
| `GET /api/repo` | rama actual y `git status` completo del árbol |
| `POST /api/repo-commit` | `{archivos, message?}` → commitea los seleccionados, en rama |
| `POST /api/repo-discard` | `{archivos}` → revierte/borra los seleccionados |
| `POST /api/merge` | `{rama, id?}` → `merge --ff-only` a `main` + `push origin main` |
