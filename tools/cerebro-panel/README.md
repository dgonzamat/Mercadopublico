# cerebro-panel

Panel de control del cerebro. **Externo al sitio**: vive fuera de `web/`, no
entra en el `output: export` y no se despliega a GitHub Pages. Es una
herramienta de operación del repo, no una página de uapcodex.org.

```bash
node tools/cerebro-panel/server.mjs        # → http://127.0.0.1:4180
```

Sin dependencias, sin build, sin `node_modules`. Node 18+.

---

## Qué hace

**Muestra la orquestación moviéndose.** El centro del panel es un flowchart de
cuatro bandas —**gate común → cadena del modo → cierre obligatorio → rastro**— y
sus nodos **se encienden conforme la corrida avanza**: verde lo ya recorrido,
rojo pulsante el paso activo. Las aristas llevan una marcha de guiones que se
acelera mientras hay una corrida viva, y un ticker lista cada herramienta
invocada en tiempo real.

Las tres bandas fijas son la estructura que `cerebro.md` declara para todo modo;
**la banda del medio se deriva de la cadena del modo elegido**, así que el
diagrama no puede prometer un paso que el skill no tiene. Cambiar de pestaña
cambia solo esa banda.

El movimiento sale de `--output-format stream-json`: cada `tool_use` del proceso
se parsea y se matchea contra los nodos. El criterio de encendido es
deliberadamente **estrecho** — nombre de herramienta, forma citada
(`{"skill":"simplify"}`) o forma con barra (`/blindar`)—, nunca `\bpalabra\b`:
con el criterio ancho, `git log` encendía el nodo **LOG** y el diagrama afirmaba
un cierre que no había ocurrido. Por la misma razón la banda **rastro** no se
enciende con eventos en absoluto, sino comparando el log antes y después de la
corrida: se ilumina con el hecho comprobado, no con la intención.

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
| `POST /api/stop` | `{id}` → SIGTERM al job |
