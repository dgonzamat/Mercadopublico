import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { Cta } from "@/components/Cta";
import {
  Eyebrow,
  H1,
  H2,
  Lede,
  Body,
  Caption,
  PullQuote,
} from "@/lib/typography";
import { T } from "@/components/T";
import { STATS } from "@/lib/siteStats";

export const metadata = pageMeta({
  title: "Metodología — cómo se pesa la evidencia",
  description:
    "Cómo se pesa la evidencia: tres niveles de fuerza probatoria (Tier S/A/B), retornos decrecientes por caso, y por qué las seis narrativas reparten el 100% de forma comparable.",
  path: "/about/",
});

const CHAPTERS = [
  {
    id: "tiers",
    n: "1",
    es: { eyebrow: "Capítulo 1", h2: "Por qué Roswell no equivale a Meier", tldr: "3 niveles de evidencia (S/A/B) — Tier S (militar+sensor) no pesa lo mismo que Tier B (testigo único); y el tier no es un veredicto" },
    en: { eyebrow: "Chapter 1", h2: "Why Roswell isn't equivalent to Meier", tldr: "3 evidence tiers (S/A/B) — Tier S (military+sensor) weighs differently than Tier B (single-witness); and the tier is not a verdict" },
  },
  {
    id: "bayes",
    n: "2",
    es: { eyebrow: "Capítulo 2", h2: "Por qué el caso número 50 ya no agrega nada nuevo", tldr: "Un caso con sensor produce un posterior nítido que mueve masa entre narrativas; el caso 50 del mismo patrón solo refuerza la que ya dominaba" },
    en: { eyebrow: "Chapter 2", h2: "Why case number 50 adds nothing new", tldr: "A sensor case yields a sharp posterior that moves mass between narratives; case 50 of the same pattern only reinforces the one already dominant" },
  },
  {
    id: "non-exclusive",
    n: "3",
    es: { eyebrow: "Capítulo 3", h2: "Por qué las probabilidades suman 100%", tldr: "Las seis narrativas son mutuamente excluyentes por caso; la distribución es comparable y reparte el 100%" },
    en: { eyebrow: "Chapter 3", h2: "Why probabilities sum to 100%", tldr: "The six narratives are mutually exclusive per case; the distribution is comparable and sums to 100%" },
  },
  {
    id: "movement",
    n: "4",
    es: { eyebrow: "Capítulo 4", h2: "Lo decidido vs la frontera", tldr: "La mayor parte del corpus es prosaico (sobre todo misidentificación); las hipótesis no-humanas son minoría y se concentran en los casos mejor documentados." },
    en: { eyebrow: "Chapter 4", h2: "What is settled vs the frontier", tldr: "Most of the corpus is prosaic (mostly misidentification); the non-human hypotheses are a minority and concentrate in the best-documented cases." },
  },
  {
    id: "movers",
    n: "5",
    es: { eyebrow: "Capítulo 5", h2: "Qué movería el análisis ahora", tldr: "Análisis isotópico de Lake Huron, material recuperado verificable, reconocimiento formal de un nuevo país" },
    en: { eyebrow: "Chapter 5", h2: "What would move the analysis now", tldr: "Lake Huron isotopic analysis, verifiable recovered material, new country acknowledging" },
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 py-4 lg:grid-cols-[14rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="Capítulos" en="Chapters" />
          </p>
          <ol className="space-y-2">
            {CHAPTERS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="block text-sm leading-snug text-muted hover:text-accent"
                >
                  <span className="font-mono text-xs tabular-nums text-text">{c.n}</span>{" "}
                  <T es={c.es.h2} en={c.en.h2} />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <article className="space-y-16">
        <header className="space-y-4">
          <Eyebrow><T es="Metodología" en="Method" /></Eyebrow>
          <H1><T es="Las reglas del juego" en="The rules of the game" /></H1>
          <Lede className="text-muted">
            <T
              es="Toda colección de evidencia UAP necesita una respuesta a tres preguntas: qué cuenta, cómo se pesa, y cuándo cambia. Acá las tres, explícitas — para que cualquiera pueda auditar el análisis en lugar de creerlo."
              en="Any UAP evidence collection needs an answer to three questions: what counts, how it's weighted, and when it changes. Here are all three, made explicit — so anyone can audit the analysis instead of having to believe it."
            />
          </Lede>
        </header>

        <nav aria-label="Índice de capítulos" className="space-y-3 border-y-2 border-text/15 py-6 lg:hidden">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="Saltar a capítulo" en="Jump to chapter" />
          </p>
          <ol className="space-y-2">
            {CHAPTERS.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="flex items-baseline gap-3 py-1 text-sm">
                  <span className="w-6 font-mono text-xs tabular-nums text-muted">{c.n}</span>
                  <span className="text-text hover:text-accent">
                    <T es={c.es.h2} en={c.en.h2} />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section id="tiers" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[0].es.eyebrow} en={CHAPTERS[0].en.eyebrow} /></Eyebrow>
              <H2><T es={CHAPTERS[0].es.h2} en={CHAPTERS[0].en.h2} /></H2>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[0].es.tldr} en={CHAPTERS[0].en.tldr} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="No todos los casos UAP son equivalentes en valor evidencial. Mezclar niveles opaca el análisis e infla artificialmente la apariencia de evidencia. El público y la prensa confunden esos niveles con frecuencia — esa es una fuente principal de confusión."
                  en="Not all UAP cases are equivalent in evidential value. Mixing tiers obscures the analysis and artificially inflates the appearance of evidence. The public and the press frequently conflate tiers — that's a principal source of confusion."
                />
              </Body>
              <div className="border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">Tier</th>
                      <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted"><T es="Categoría" en="Category" /></th>
                      <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted"><T es="Ejemplos" en="Examples" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    <TierRow tier="S" es="Evidencia fuerte: sensor instrumental + múltiples testigos (típicamente militar)" en="Strong evidence: instrumental sensor + multiple witnesses (typically military)" examples="Tehran 1976, Nimitz, Belgian Wave, Lake Huron" color="text-tierS" />
                    <TierRow tier="A" es="Evidencia institucional: múltiples testigos verificables o documentación oficial" en="Institutional evidence: multiple verifiable witnesses or official documentation" examples="Ariel School, JAL 1628, Manises, Westall, Roswell" color="text-tierA" />
                    <TierRow tier="B" es="Evidencia limitada: testigo único, local o sin verificación primaria" en="Limited evidence: single-witness, local or without primary verification" examples="Hessdalen, Communion, Maury Island, Bonnybridge" color="text-tierB" />
                  </tbody>
                </table>
              </div>
              <PullQuote>
                <T
                  es={`Una "evidencia" Tier B no debería usarse para sustentar conclusiones que exigen Tier S. La escala (heredera de las categorías de encuentros cercanos de Hynek) mide solo la fuerza de la evidencia — no qué fue el caso.`}
                  en={`A Tier B "evidence" should not be used to support conclusions that require Tier S. The scale (descended from Hynek's Close Encounter Categories) measures only the strength of the evidence — not what the case was.`}
                />
              </PullQuote>

              {/* Los tres ejes — unifica tier / probabilidad / partición y dónde se ve cada uno.
                  Responde a la confusión de que cada vista habla solo de "su" eje. */}
              <div className="border-l-4 border-accent bg-surface-2 p-5">
                <p className="font-mono text-xs uppercase tracking-widest text-accent">
                  <T es="Tres ejes independientes — no confundir" en="Three independent axes — don't conflate" />
                </p>
                <Body className="mt-3 text-sm text-muted">
                  <T
                    es="Cada caso se describe con tres medidas distintas, repartidas entre las vistas del sitio. Es fácil confundirlas porque las tres suenan a «calidad»:"
                    en="Each case is described with three distinct measures, spread across the site's views. They are easy to conflate because all three sound like «quality»:"
                  />
                </Body>
                <ul className="mt-3 space-y-2 text-sm text-text">
                  <li>
                    <strong className="text-tierS"><T es="Tier (S/A/B)" en="Tier (S/A/B)" /></strong> — <T es="la fuerza de la evidencia. Se ve como badge en cada caso y como color del marcador en el mapa." en="the strength of the evidence. Shown as a badge on each case and as the marker color on the map." />
                  </li>
                  <li>
                    <strong className="text-accent"><T es="Probabilidad (0–100%)" en="Probability (0–100%)" /></strong> — <T es="cuán genuinamente inexplicado está el caso. Un fenómeno natural puede seguir sin explicación, así que NO equivale a «no-prosaico». Se ve como «%» en cada caso y como tamaño del marcador en el mapa." en="how genuinely unexplained the case is. A natural phenomenon can remain unexplained, so it does NOT equal «non-prosaic». Shown as «%» on each case and as the marker size on the map." />
                  </li>
                  <li>
                    <strong className="text-text"><T es="Partición MECE" en="MECE partition" /></strong> — <T es="qué fue: la distribución sobre seis narrativas excluyentes." en="what it was: the distribution over six mutually exclusive narratives." /> <Link href="/probabilidades" className="text-accent hover:underline"><T es="ver /probabilidades →" en="see /probabilidades →" /></Link>
                  </li>
                </ul>
                <Body className="mt-3 text-sm text-muted">
                  <T
                    es="Son ortogonales: un caso bien documentado (Tier S/A) puede tener como explicación más plausible un posible fraude, y un Tier B no es, por eso, un fraude."
                    en="They are orthogonal: a well-documented case (Tier S/A) can have a possible hoax as its most plausible explanation, and a Tier B is not, for that reason, a hoax."
                  />
                </Body>
              </div>
            </div>
          </details>
        </section>

        <section id="bayes" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[1].es.eyebrow} en={CHAPTERS[1].en.eyebrow} /></Eyebrow>
              <H2><T es={CHAPTERS[1].es.h2} en={CHAPTERS[1].en.h2} /></H2>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[1].es.tldr} en={CHAPTERS[1].en.tldr} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="Cada caso suma su posterior completo a la partición —el agregado es lineal, sin «rendimientos decrecientes» ocultos—. Lo que cambia es qué tan informativo es ese posterior: un caso institucional con sensor produce un posterior nítido que puede desplazar masa hacia una narrativa antes casi vacía; el caso número cincuenta del mismo patrón solo refuerza la narrativa que ya dominaba, sin enseñarnos nada nuevo sobre la forma de la partición."
                  en="Each case adds its full posterior to the partition —the aggregate is linear, with no hidden 'diminishing returns'—. What changes is how informative that posterior is: an institutional case with a sensor yields a sharp posterior that can move mass toward a previously near-empty narrative; case number fifty of the same pattern only reinforces the narrative that was already dominant, teaching us nothing new about the shape of the partition."
                />
              </Body>
              <div className="grid gap-4 sm:grid-cols-2">
                <MoveList
                  es="Desplaza masa entre narrativas"
                  en="Moves mass between narratives"
                  items={[
                    "Tier S/A con multi-sensor → posterior nítido (Tehran, Nimitz)",
                    "Categoría de evidencia nueva (Hessdalen, Lake Huron)",
                    "Caso que contradice el patrón establecido",
                    "Sensores oficiales + video correlacionado",
                  ]}
                  itemsEn={[
                    "Tier S/A with multi-sensor → sharp posterior (Tehran, Nimitz)",
                    "New class of evidence (Hessdalen, Lake Huron)",
                    "Case that contradicts the established pattern",
                    "Official sensors + correlated video",
                  ]}
                  accent
                />
                <MoveList
                  es="Solo refuerza lo dominante"
                  en="Only reinforces the dominant"
                  items={[
                    "Contactado aislado Tier B → casi todo mundano/indet (Meier)",
                    "Caso #50 del mismo patrón (escala la narrativa dominante)",
                    "Predicción de contactado fallida (carga mundano_natural)",
                  ]}
                  itemsEn={[
                    "Isolated Tier B contactee → mostly mundane/indet (Meier)",
                    "Case #50 of the same pattern (scales the dominant narrative)",
                    "Failed contactee prediction (loads mundano_natural)",
                  ]}
                />
              </div>
              <Caption>
                <T
                  es={<><strong className="text-text">Estado:</strong> los casos &quot;contactado&quot; aislados aportan posteriores dominados por <em>mundano_natural</em> e <em>indeterminable</em> — no redistribuyen la partición. Los institucionales con sensor (Tier S/A) producen posteriores nítidos que sí mueven masa entre narrativas.</>}
                  en={<><strong className="text-text">Status:</strong> isolated &quot;contactee&quot; cases contribute posteriors dominated by <em>mundano_natural</em> and <em>indeterminable</em> — they do not redistribute the partition. Institutional sensor cases (Tier S/A) yield sharp posteriors that do move mass between narratives.</>}
                />
              </Caption>
            </div>
          </details>
        </section>

        <section id="non-exclusive" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[2].es.eyebrow} en={CHAPTERS[2].en.eyebrow} /></Eyebrow>
              <H2><T es={CHAPTERS[2].es.h2} en={CHAPTERS[2].en.h2} /></H2>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[2].es.tldr} en={CHAPTERS[2].en.tldr} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="Por caso, las narrativas son mutuamente excluyentes: cada caso tuvo una causa real y la incertidumbre se reparte entre los candidatos, sumando 100%. Sumadas sobre el corpus dan una partición comparable — se puede decir qué explicación da cuenta de más casos. En la presentación del sitio se aplica una clasificación forzada: lo prosaico se abre en tres hipótesis (misidentificación, fenómeno natural, posible fraude), las dos no-humanas se muestran juntas, y la masa que el caso no permite asignar se reparte entre las hipótesis que sí apoya — de modo que ningún caso queda sin clasificar. El marco anterior, donde los porcentajes no sumaban 100 ni se podían comparar, se reemplazó precisamente para corregir eso."
                  en="Per case, the narratives are mutually exclusive: each case had one real cause and the uncertainty is split among the candidates, summing to 100%. Summed across the corpus they give a comparable partition — one can say which explanation accounts for more cases. The site's presentation applies a forced classification: the prosaic opens into three hypotheses (misidentification, natural phenomenon, possible hoax), the two non-human ones are shown together, and the mass a case cannot assign is spread across the hypotheses it does support — so no case is left unclassified. The prior framework, where percentages neither summed to 100 nor were comparable, was replaced precisely to fix that."
                />
              </Body>
              <div className="border-l-4 border-accent bg-surface-2 px-5 py-4">
                <p className="text-sm text-text">
                  <T
                    es={<>El detalle por explicación (con números y casos modales) vive en{" "}<Link href="/probabilidades" className="text-accent hover:underline">/probabilidades →</Link>{" "}para no duplicar el contenido acá.</>}
                    en={<>The per-explanation detail (with numbers and modal cases) lives in{" "}<Link href="/probabilidades" className="text-accent hover:underline">/probabilidades →</Link>{" "}to avoid duplicating content here.</>}
                  />
                </p>
              </div>
            </div>
          </details>
        </section>

        <section id="movement" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[3].es.eyebrow} en={CHAPTERS[3].en.eyebrow} /></Eyebrow>
              <H2><T es={CHAPTERS[3].es.h2} en={CHAPTERS[3].en.h2} /></H2>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[3].es.tldr} en={CHAPTERS[3].en.tldr} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="El modelo se reformuló para dar números COMPARABLES. Antes, cada hipótesis era una afirmación existencial independiente («al menos un caso es X») y sus porcentajes no sumaban 100 ni competían entre sí — no se podía decir qué explicación era más probable que otra. Ahora cada caso reparte el 100% sobre las mismas seis narrativas mutuamente excluyentes, y el corpus las agrega en una partición que reparte el 100% de forma comparable. Cada narrativa bundlea objeto + postura institucional, de modo que «no-humano + ocultación estatal» es una clase propia. Las hipótesis del marco anterior se conservan como mapeo dentro de cada narrativa, y «entidades no humanas» (suma de las dos narrativas no-humanas) y «heterogeneidad» quedan como vistas derivadas."
                  en="The model was reformulated to yield COMPARABLE numbers. Before, each hypothesis was an independent existential claim (at least one case is X) and its percentages neither summed to 100 nor competed — one could not say which explanation was more probable than another. Now each case splits 100% over the same six mutually-exclusive narratives, and the corpus aggregates them into a partition that splits 100% comparably. Each narrative bundles object + institutional stance, so 'non-human + state cover-up' is its own class. The prior framework hypotheses are preserved as a mapping inside each narrative, and 'non-human entities' (the sum of the two non-human narratives) and 'heterogeneity' remain derived views."
                />
              </Body>
              <Caption className="pt-2">
                <T
                  es={<>La partición completa, las seis narrativas y los casos modales de cada una viven en{" "}<Link href="/probabilidades" className="text-accent hover:underline">/probabilidades →</Link>.</>}
                  en={<>The full partition, the six narratives and each one&apos;s modal cases live at{" "}<Link href="/probabilidades" className="text-accent hover:underline">/probabilidades →</Link>.</>}
                />
              </Caption>
            </div>
          </details>
        </section>

        <section id="movers" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[4].es.eyebrow} en={CHAPTERS[4].en.eyebrow} /></Eyebrow>
              <H2><T es={CHAPTERS[4].es.h2} en={CHAPTERS[4].en.h2} /></H2>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[4].es.tldr} en={CHAPTERS[4].en.tldr} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <ul className="space-y-3">
                {[
                  { weight: "+++", color: "text-tierS", es: "Análisis isotópico independiente de residuos físicos publicado", en: "Independent isotopic analysis of physical residues published" },
                  { weight: "+++", color: "text-tierS", es: "Material recuperado con fotos verificables", en: "Recovered material with verifiable photos" },
                  { weight: "+++", color: "text-tierS", es: "Lake Huron fragmentos análisis publicado", en: "Lake Huron fragment analysis published" },
                  { weight: "+", color: "text-tierA", es: "Nuevo país que reconoce formalmente el fenómeno", en: "New country formally acknowledging" },
                  { weight: "+", color: "text-tierA", es: "Otro Tehran-equivalente con sensor data", en: "Another Tehran-equivalent with sensor data" },
                  { weight: "~0", color: "text-muted", es: "Nuevo contactee con cosmología detallada", en: "New contactee with detailed cosmology" },
                ].map((item, i) => (
                  <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-3">
                    <span className={`text-right font-mono text-xs ${item.color}`}>{item.weight}</span>
                    <span className="text-text"><T es={item.es} en={item.en} /></span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 space-y-4 border-t border-text/15 pt-8">
                <Eyebrow>
                  <T es="Posterior por caso, agregado mecánico" en="Per-case posterior, mechanical aggregate" />
                </Eyebrow>
                <h3 className="font-display text-xl font-medium leading-snug text-text md:text-2xl">
                  <T es="Cómo cada caso nuevo mueve las probabilidades automáticamente" en="How each new case moves the probabilities automatically" />
                </h3>
                <Body className="text-muted">
                  <T
                    es={<>Las probabilidades del corpus se derivan en build-time de forma pública y comparable. Cada caso reparte el 100% entre seis narrativas mutuamente excluyentes: <strong className="text-text">un posterior que suma 1</strong>. El corpus las agrega en el nº esperado de casos por narrativa —Eⱼ = Σᵢ P(narrativaⱼ | casoᵢ)—, que reparte el 100% y es comparable entre narrativas; al ser una esperanza (lineal), es válido aunque los casos estén correlacionados. Son juicios analíticos estructurados, no frecuencias calibradas empíricamente: el modelo dice qué explicación es más coherente con cada caso, no cuál es objetivamente correcta. Cada caso nuevo recalcula la partición sin intervención humana.</>}
                    en={<>Corpus probabilities are derived at build-time in a public, comparable way. Each case splits 100% among six mutually-exclusive narratives: <strong className="text-text">a posterior that sums to 1</strong>. The corpus aggregates them into the expected number of cases per narrative —Eⱼ = Σᵢ P(narrativeⱼ | caseᵢ)—, which splits 100% and is comparable across narratives; being an expectation (linear), it holds even if cases are correlated. These are structured analytical judgments, not empirically calibrated frequencies: the model says which explanation is most coherent with each case, not which is objectively correct. Every new case recomputes the partition without human intervention.</>}
                  />
                </Body>
                <Body className="text-muted">
                  <T
                    es={<>El posterior de cada caso es un juicio declarado, no un cálculo a partir de pesos: el análisis del caso reparte explícitamente el 100% según qué tan bien cada explicación da cuenta de la evidencia. No hay fórmula oculta — el reparto es el juicio, y queda visible en la página del caso. La masa que el caso no permite asignar (la antigua{" "}<strong className="text-text">«indeterminable»</strong>) se redistribuye, en las gráficas, entre las hipótesis que el caso sí apoya: <strong className="text-text">clasificación forzada</strong>, ningún caso queda sin clasificar.</>}
                    en={<>Each case&apos;s posterior is a declared judgment, not a computation from weights: the case analysis explicitly splits 100% by how well each explanation accounts for the evidence. There is no hidden formula — the split is the judgment, and it stays visible on the case page. The mass a case cannot assign (the former{" "}<strong className="text-text">&apos;indeterminable&apos;</strong>) is redistributed, in the charts, across the hypotheses the case does support: <strong className="text-text">forced classification</strong>, no case left unclassified.</>}
                  />
                </Body>
                <Body className="text-muted">
                  <T
                    es={<>El agregado del corpus es puramente mecánico: suma esos posteriores en el nº esperado de casos por narrativa y los redondea con el método de mayor resto (Hamilton) para que los porcentajes mostrados sumen exactamente 100. Cada caso nuevo entra con su posterior y recalcula la partición sin intervención adicional.</>}
                    en={<>The corpus aggregate is purely mechanical: it sums those posteriors into the expected number of cases per narrative and rounds them with the largest-remainder (Hamilton) method so the displayed percentages sum to exactly 100. Each new case enters with its posterior and recomputes the partition with no further intervention.</>}
                  />
                </Body>
                <Caption>
                  <T
                    es={<>Cada caso muestra su posterior en su propia página, en la sección{" "}<em>&quot;Distribución de explicaciones&quot;</em>. En los incidentes el posterior mide la naturaleza del objeto; en los casos-documento (memos, audiencias, filtraciones) mide el «lean» evidencial —hacia qué explicación inclina su contenido—, ya que no tienen un objeto que clasificar.</>}
                    en={<>Each case shows its posterior on its own page, in the{" "}<em>&quot;Distribution of explanations&quot;</em> section. For incidents the posterior measures the nature of the object; for document cases (memos, hearings, leaks) it measures the evidential &apos;lean&apos; —which explanation their content tilts toward—, since they have no object to classify.</>}
                  />
                </Caption>
              </div>
            </div>
          </details>
        </section>

        <section className="space-y-6 border-t-4 border-text bg-surface-2 px-6 py-10 md:px-10 md:py-14">
          <Eyebrow><T es="Ya entiendes el método" en="You now understand the method" /></Eyebrow>
          <h2 className="font-display text-2xl font-medium leading-snug text-text md:text-3xl">
            <T es="Ahora mira el resultado: seis narrativas que reparten el corpus" en="Now see the result: six narratives partitioning the corpus" />
          </h2>
          <div className="flex flex-wrap gap-3 pt-2">
            <Cta href="/probabilidades" variant="primary">
              <T es="Ver las seis narrativas →" en="See the six narratives →" />
            </Cta>
            <Cta href="/cases" variant="secondary">
              <T es={`Ver los ${STATS.cases} casos →`} en={`See the ${STATS.cases} cases →`} />
            </Cta>
            <Cta href="/fuentes" variant="secondary">
              <T es="Ver todas las fuentes →" en="See all sources →" />
            </Cta>
          </div>
        </section>

        <Caption className="border-t border-border pt-6">
          <T
            es="Toda la metodología vive en esta página — sin documentos externos ni dependencias técnicas. Auditable directamente desde acá."
            en="The full methodology lives on this page — no external documents or technical dependencies. Auditable directly from here."
          />
        </Caption>
      </article>
    </div>
  );
}

function TierRow({
  tier,
  es,
  en,
  examples,
  color,
}: {
  tier: string;
  es: string;
  en: string;
  examples: string;
  color: string;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-3 align-top">
        <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>{tier}</span>
      </td>
      <td className="px-3 py-3 align-top text-sm text-text"><T es={es} en={en} /></td>
      <td className="px-3 py-3 align-top text-xs text-muted">{examples}</td>
    </tr>
  );
}

function MoveList({
  es,
  en,
  items,
  itemsEn,
  accent,
}: {
  es: string;
  en: string;
  items: string[];
  itemsEn: string[];
  accent?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className={`font-mono text-xs uppercase tracking-widest ${accent ? "text-accent" : "text-muted"}`}>
        <T es={es} en={en} />
      </p>
      <ul className="space-y-1.5 text-xs text-text">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted">·</span>
            <span><T es={item} en={itemsEn[i] ?? item} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
