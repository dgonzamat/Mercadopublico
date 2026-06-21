# Plan de autoridad / backlinks — UAP Codex

> Estado: jun 2026. Objetivo: subir las páginas que ya están en página 1 de
> Google (AAWSAP pos 7, varias en pos 5–9) hacia **top 5** y sostenerlas.
> El on-page ya está optimizado (PRs #391–#393). El factor que falta —y que
> **no se arregla con código**— es la **autoridad de dominio**: enlaces
> externos que le digan a Google que el sitio es una fuente confiable.

---

## 1. Diagnóstico: por qué los backlinks son el cuello de botella

`uapcodex.org` es un dominio nuevo, sin historial de enlaces. Search Console
(28 días) muestra el patrón típico de esa situación:

- 760 impresiones / 5 clicks. El sitio **aparece** (Google lo indexa y lo
  considera relevante) pero **abajo** (pos 7–11), porque no tiene señales de
  autoridad para rankear por encima de Wikipedia, prensa y `.mil`/`.gov`.
- Varias páginas ya en página 1 (AAWSAP 7.0, Grusch 6.4, Robertson 6.0,
  Lago de Cote 5.2). Están a un empujón de autoridad de cruzar a top 5.

Mover de pos 7 → 4 en queries de baja competencia (las nuestras lo son)
suele necesitar **pocos enlaces buenos**, no cientos. Es alcanzable.

---

## 2. La ventaja injusta: el ángulo latinoamericano

El mercado anglosajón de UAP está saturado (Roswell, Tic Tac, Grusch ya los
cubren cientos de sitios con dominios fuertes). **Donde UAP Codex puede
ganar de verdad es en los casos latinoamericanos**, mal cubiertos en inglés
y a menudo solo en fuentes dispersas en español/portugués:

- Brasil: Arquivo Nacional, Operação Prato (Colares 1977), Varginha 1996.
- Chile: caso Naval/CEFAA 2014, Carlos Valdés / Putre.
- Uruguay: CRIDOVNI (comisión oficial — rarísimo, hay pocos países con eso).
- Argentina, Perú, México: comisiones y casos regionales.

Esto es un **nicho defendible**: contenido bien documentado que no existe en
inglés. Es lo que más fácil atrae enlaces porque es genuinamente único.

---

## 3. Tácticas, priorizadas por impacto/esfuerzo

### Nivel 1 — Alta autoridad, requiere que el contenido sea citable (hacer YA)

1. **Wikipedia (citas legítimas, no autopromoción).**
   - Regla: NO agregar tu propio sitio como enlace externo masivamente
     (es `WP:REFSPAM` y lo revierten). El camino correcto: donde UAP Codex
     tiene la **mejor síntesis con fuentes primarias** de un caso, puede
     usarse como *referencia* de una afirmación concreta que hoy no está
     citada.
   - Targets realistas (es.wikipedia / pt.wikipedia, menos vigiladas que en):
     artículos de CRIDOVNI, caso Naval Chile 2014, Operação Prato, A.J.
     Gevaerd, Revista UFO. En cada uno, identificar una afirmación sin cita
     que la ficha de UAP Codex respalde con fuente primaria.
   - Esto vale por 10 enlaces normales: Wikipedia pasa autoridad y, además,
     es donde Google "aprende" qué entidades existen.

2. **Wikidata / Commons.** Vincular entidades (casos, investigadores) en
   Wikidata con `official website` / `described at URL`. Bajo esfuerzo,
   ayuda al knowledge graph.

### Nivel 2 — Comunidades (constante, bajo esfuerzo, sin spamear)

3. **Reddit** — participar de verdad, enlazar cuando aporta:
   - EN: r/UFOs (2.5M), r/UFOB, r/HighStrangeness, r/aliens.
   - ES: r/Ovnis, r/uap_es; PT: r/OVNIs.
   - Táctica: cuando alguien pregunta por un caso que tienes bien
     documentado (ej. "what was AAWSAP / the AARO report"), responder con
     sustancia + enlace a la ficha. Un enlace contextual y útil > 100 spam.
   - Nota: los enlaces de Reddit son `nofollow` (no pasan PageRank directo),
     pero generan **tráfico real y descubrimiento** que lleva a enlaces
     `dofollow` de terceros. Es el motor de arranque.

4. **Foros y agregadores del nicho**: Metabunk (escépticos, alta calidad),
   The Black Vault (comunidad FOIA), AboveTopSecret, r/UFOs wiki. Un enlace
   desde Metabunk en una discusión sobre el AARO HRR es oro.

### Nivel 3 — Digital PR / activos diseñados para atraer enlaces

5. **El activo "pilar" citable.** El diferenciador único de UAP Codex es el
   **modelo de probabilidad MECE** (repartir 100% sobre 6 narrativas por
   caso). Eso es un *data story* que periodistas y blogueros enlazan:
   - "Analizamos 200 casos UAP institucionales y asignamos probabilidades:
     esto es lo que dicen los números." Tabla/gráfico embebible + metodología.
   - Los rankings/visualizaciones con datos propios son el formato #1 de
     *link bait* honesto: la gente cita la fuente del dato.

6. **Explainer canónico AAWSAP → AATIP → AARO.** Tu página AAWSAP ya recibe
   el 62% de las impresiones. Convertirla (o un post de blog) en *la* mejor
   explicación cronológica enlazable del tema, con la línea de tiempo y el
   enlace al PDF oficial (ya hecho en #392), la hace candidata a cita.

7. **Outreach a podcasts/newsletters UAP** (hay decenas). Ofrecer la base de
   datos como recurso. Muchos enlazan recursos en sus show notes (dofollow).

### Nivel 4 — Directorios y básicos (una vez, y olvidar)

8. Alta en directorios temáticos UAP, "awesome lists" de GitHub sobre UAP/
   datasets, Product Hunt (si aplica), y perfiles sociales con enlace
   (el de Instagram @uapcodex2026 ya existe — asegurar el link en bio).

---

## 4. Lo que NO hacer (riesgo de penalización)

- **Comprar enlaces / PBNs / granjas de enlaces** → penalización de Google.
- **Spamear el mismo enlace** en foros/Reddit/Wikipedia → reversión + daño
  reputacional.
- **Intercambios masivos de enlaces** ("link a cambio de link") a escala.
- Anchor text idéntico y sobreoptimizado en cada enlace → patrón antinatural.

La regla: cada enlace debe ser algo que un humano pondría porque el recurso
es útil. Si no, no lo pongas.

---

## 5. Secuencia sugerida (primeras 4 semanas)

1. **Semana 1** — Wikidata + 2-3 citas de Wikipedia bien elegidas (casos
   LatAm donde somos la mejor fuente). Asegurar enlace en bio de Instagram.
2. **Semana 2** — Construir el activo pilar (data story del modelo MECE o el
   explainer AAWSAP). Es el que atraerá enlaces pasivamente después.
3. **Semana 3** — Participación en Reddit/Metabunk: 3-5 respuestas de
   sustancia donde el caso documentado aporta.
4. **Semana 4** — Outreach: 5-10 podcasts/newsletters UAP ofreciendo la base
   como recurso. Medir en Search Console el efecto sobre posición.

**Métrica de éxito**: no "número de enlaces", sino **posición media de las
páginas top** (AAWSAP, Grusch, Loeb) bajando de 7 hacia 4-5, y aparición de
**dominios referentes** en el reporte de Enlaces de Search Console.

---

## 6. Qué puede hacer Claude desde el repo (vs. qué es manual tuyo)

| Tarea | ¿Código? | Quién |
|---|---|---|
| Activo pilar (post/visualización del modelo MECE) | Sí | Claude implementa |
| Explainer canónico AAWSAP→AATIP→AARO | Sí | Claude implementa |
| Datos estructurados / embeds citables | Sí | Claude implementa |
| Lote siguiente de bios de investigadores | Sí | Claude implementa |
| Citas en Wikipedia / Wikidata | No | Manual (tú) |
| Participación en Reddit/foros | No | Manual (tú) |
| Outreach a podcasts/newsletters | No | Manual (tú) |

El trabajo de enlaces es **tuyo** (relaciones humanas). Lo que Claude puede
hacer es **fabricar los activos que hacen que enlazarte sea fácil**: el data
story, el explainer, el siguiente lote de contenido profundo.
