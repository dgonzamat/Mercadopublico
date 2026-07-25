# Cerebro · historia de versiones

Por qué el orquestador es como es. Vive fuera de `cerebro.md` porque es
**arqueología, no instrucción**: explicar el pasado no cambia lo que hay que
hacer, y el skill se carga entero en contexto cada vez que dispara. Se consulta
al proponer una V8, no al correr una corrida.

---

Estás ejecutando el **cerebro** del repo. Un error de la v1: su objetivo era *puramente defensivo* (minimizar deuda), así que su mejor caso era «nada que arreglar» — un conserje, no un arquitecto. **V2 lo corrigió: el cerebro ATACA impacto.** **V3 cierra dos huecos que se vieron en la práctica**: (a) verificaba frontend *a ojo* (grep + screenshots eyeball-eados), y (b) su propio impacto era *proxy no medido* («¿funciona el cerebro?» sin respuesta cuantitativa). V3 lo resuelve orquestando **skills de librería** en los pasos correctos. **V4 corrige a V3 con lo aprendido al ejecutarlo** (jul 2026): la verificación de navegador que V3 prescribía **no es ejecutable** en la sesión remota por defecto —arranca sin `node_modules`, así que no hay `out/` ni dev server—, y lo que sí funcionó fue mejor: leer el **artefacto desplegado en `gh-pages`**, que verifica lo que el sitio realmente sirve. Y apareció un hueco que V3 no veía: le exigía prueba al guardrail nuevo pero **no a la sonda que verifica**, y dos falsos verdes en una corrida (una que no chequeaba nada, otra que leía un error de API como éxito) pasaron por ahí. De ahí la **regla cero de VERIFY**. **V5 cierra el hueco que ninguna versión anterior vio**: el cerebro seguía eligiendo *qué* atacar por comodidad de verificación. Una sesión entera (jul 2026) produjo cinco PRs —cuatro de metadata y de sí mismo, **cero de corpus**— con todas las sondas en verde; el fallo lo detectó el usuario, no el loop. La causa es que un fix de metadata se comprueba en segundos y un caso nuevo exige investigar y escribir 1.500 palabras ancladas: esa asimetría **no dice nada sobre cuál importa más**. De ahí la **regla de precedencia** — el corpus manda, y saltárselo hay que justificarlo con evidencia de esta corrida. **V6 corrige lo que quedaba: el cerebro decía orquestar y en la práctica ejecutaba.** Una sola regla permisiva —«invoca un skill solo cuando supere al enfoque plano»— dejaba el juicio para el instante en que hacerlo a mano *siempre* parece más barato, así que se resolvía en «no delegues»: en una sesión se escribieron tres reglas de audit a mano sin `/blindar`, no se corrió `/learn` ni `/retro` con ~15 lecciones sobre la mesa, y se editó este archivo tres veces sin `skill-creator`. La corrección es **separar dos clases de skill con reglas opuestas** (arriba): los del loop se delegan siempre, los de librería siguen siendo opt-in.

**V7 cambia la forma del cerebro: de corrida monolítica a DESPACHADOR DE MODOS.** Antes decidía solo qué atacar y por eso necesitaba la regla de precedencia para no derivar a lo barato; ahora **el modo lo eliges tú** —`caso-nuevo`, `bugs`, `mejoras-ux`, `mejoras-tec`, `frescura`— y la precedencia queda acotada al modo diagnóstico, que es el único donde el cerebro elige. Cada modo es una **cadena de skills explícita**, no una deliberación. El inventario de skills instalados reveló tres que nunca se habían usado y que cubren huecos reales: **`run`** (levanta la app — desbloquea `webapp-testing`, que V4 daba por inalcanzable sin `node_modules`), **`security-review`** (dimensión jamás mirada sobre un repo con anon key y funciones `SECURITY DEFINER` en producción) y **`simplify`** (calidad de código, que no caza bugs y por eso justifica su propio modo).

---

## La lectura transversal

Cada versión corrigió el mismo tipo de error: **el cerebro optimizaba lo que
podía comprobar barato**, y eso lo llevaba a elegir mal sin darse cuenta.

- **V3→V4** — verificaba con la herramienta que tenía a mano en vez de la que
  medía lo servido.
- **V4→V5** — atacaba lo que se verifica en segundos en vez de lo que crea
  valor.
- **V5→V6** — ejecutaba a mano en vez de delegar, porque delegar parece más
  caro en el instante de decidir.
- **V6→V7** — decidía solo cuándo y sobre qué, cuando esa decisión es del
  usuario.

En los cuatro casos el fallo fue invisible desde dentro: las sondas estaban en
verde. Tres de los cuatro los detectó el usuario, no el loop.
