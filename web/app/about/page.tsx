import Link from "next/link";
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

export const metadata = {
  title: "Metodología — cómo se pesa la evidencia",
  description:
    "Cómo se pesa la evidencia: cuatro niveles de fuerza probatoria, retornos decrecientes por caso, y por qué las seis narrativas reparten el 100% de forma comparable.",

  alternates: { canonical: "/about/" },
};

const CHAPTERS = [
  {
    id: "tiers",
    n: "1",
    es: { eyebrow: "Capítulo 1", h2: "Por qué Roswell no equivale a Meier", tldr: "4 niveles de evidencia — Tier 1 (militar+sensor) no pesa lo mismo que Tier 4 (contactado)" },
    en: { eyebrow: "Chapter 1", h2: "Why Roswell isn't equivalent to Meier", tldr: "4 evidence tiers — Tier 1 military+sensor weighs differently than Tier 4 contactee" },
  },
  {
    id: "bayes",
    n: "2",
    es: { eyebrow: "Capítulo 2", h2: "Por qué el caso número 50 ya no agrega nada", tldr: "Un caso militar con sensor mueve la aguja; el caso 50 del mismo patrón ya no aporta evidencia nueva" },
    en: { eyebrow: "Chapter 2", h2: "Why case number 50 no longer adds anything", tldr: "A military case with sensor moves the needle; case 50 of the same pattern adds no new evidence" },
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
    es: { eyebrow: "Capítulo 4", h2: "Lo decidido vs la frontera", tldr: "La mayor parte del corpus se reparte entre explicaciones mundanas e indeterminables; las narrativas no-humanas son pequeñas y concentran el debate abierto." },
    en: { eyebrow: "Chapter 4", h2: "What is settled vs the frontier", tldr: "Most of the corpus splits between mundane and indeterminable explanations; the non-human narratives are small and hold the open debate." },
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
                      <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted"><T es="Confiabilidad" en="Reliability" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    <TierRow tier="1" es="Institucional militar + sensor" en="Institutional military + sensor" examples="Tehran 1976, Belgian Wave, USPER 2025, Lake Huron" conf="75–88%" color="text-tierS" />
                    <TierRow tier="2" es="Institucional civil / multi-witness" en="Institutional civil / multi-witness" examples="Ariel School, JAL 1628, Manises, Westall, Roswell" conf="65–85%" color="text-tierS" />
                    <TierRow tier="3" es="Folklórico / recurrente local" en="Folkloric / local recurring" examples="Hessdalen, Popocatépetl, Marfa" conf="50–65%" color="text-tierA" />
                    <TierRow tier="4" es="Contactee / individual" en="Contactee / individual" examples="Meier, Sixto Paz, Adamski, Parkes" conf="40% exp. / <5% cosmología" color="text-tierB" />
                  </tbody>
                </table>
              </div>
              <PullQuote>
                <T
                  es={`Una "evidencia" Tier 4 no debería usarse para sustentar conclusiones que exigen Tier 1. El sistema deriva de las categorías de encuentros cercanos de Hynek.`}
                  en={`A Tier 4 "evidence" should not be used to support conclusions that require Tier 1. The system derives from Hynek's Close Encounter Categories.`}
                />
              </PullQuote>
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
                  es="No todos los casos añaden evidencia igualmente. Algunos mueven la aguja; otros ya no aportan nada nuevo porque repiten un patrón ya documentado."
                  en="Not all cases add evidence equally. Some move the needle; others no longer add anything new because they repeat an already-documented pattern."
                />
              </Body>
              <div className="grid gap-4 sm:grid-cols-2">
                <MoveList
                  es="Mueve mucho"
                  en="Moves a lot"
                  items={[
                    "Tier 1/2 con multi-sensor (Tehran +5%)",
                    "Categoría nueva (Hessdalen +categoría)",
                    "Caso que contradice patrón establecido",
                    "Sensores oficiales + video (Lake Huron +2%)",
                  ]}
                  itemsEn={[
                    "Tier 1/2 with multi-sensor (Tehran +5%)",
                    "New category (Hessdalen +category)",
                    "Case that contradicts established pattern",
                    "Official sensors + video (Lake Huron +2%)",
                  ]}
                  accent
                />
                <MoveList
                  es="Mueve poco o nada"
                  en="Barely moves"
                  items={[
                    "Contactado aislado Tier 4 (Meier 1–2%)",
                    "Caso #50 del mismo patrón (~0%)",
                    "Nueva predicción de contactado fallida (baja, no sube)",
                  ]}
                  itemsEn={[
                    "Isolated Tier 4 contactee (Meier 1-2%)",
                    "Case #50 of the same pattern (~0%)",
                    "New failed contactee prediction (lowers, doesn't raise)",
                  ]}
                />
              </div>
              <Caption>
                <T
                  es={<><strong className="text-text">Estado:</strong> los casos individuales de tipo &quot;contactado&quot; ya no agregan evidencia útil. En cambio, los institucionales con sensor militar (Tier 1/2) siguen acumulando información valiosa.</>}
                  en={<><strong className="text-text">Status:</strong> individual &quot;contactee&quot; cases no longer add useful evidence. By contrast, institutional cases with military sensors (Tier 1/2) keep accumulating valuable information.</>}
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
                  es="Por caso, las seis narrativas son mutuamente excluyentes: cada caso tuvo una causa real y la incertidumbre se reparte entre los candidatos, sumando 100%. Sumadas sobre el corpus dan una partición comparable — se puede decir qué explicación da cuenta de más casos. El costo honesto es asumir que cada caso tiene una explicación verdadera; lo que no se puede asignar cae en «indeterminable». El marco anterior, donde los porcentajes no sumaban 100 ni se podían comparar, se reemplazó precisamente para corregir eso."
                  en="Per case, the six narratives are mutually exclusive: each case had one real cause and the uncertainty is split among the candidates, summing to 100%. Summed across the corpus they give a comparable partition — one can say which explanation accounts for more cases. The honest cost is assuming each case has one true explanation; whatever cannot be assigned falls into 'indeterminable'. The prior framework, where percentages neither summed to 100 nor were comparable, was replaced precisely to fix that."
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
                    es={<>El posterior de cada caso es un juicio declarado, no un cálculo a partir de pesos: el análisis del caso reparte explícitamente el 100% entre las seis narrativas según qué tan bien cada una da cuenta de la evidencia. No hay fórmula oculta — el reparto es el juicio, y queda visible en la página del caso. Lo que el caso no permite asignar se concentra en{" "}<strong className="text-text">«indeterminable»</strong>, la válvula de honestidad del modelo.</>}
                    en={<>Each case&apos;s posterior is a declared judgment, not a computation from weights: the case analysis explicitly splits 100% among the six narratives by how well each accounts for the evidence. There is no hidden formula — the split is the judgment, and it stays visible on the case page. Whatever the case does not allow assigning concentrates in{" "}<strong className="text-text">&apos;indeterminable&apos;</strong>, the model&apos;s honesty valve.</>}
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
                    es={<>Cada caso de incidente muestra su posterior en su propia página, en la sección{" "}<em>&quot;Cómo se reparte este caso&quot;</em>. Los casos-documento (memos, audiencias, filtraciones) no llevan posterior: la pregunta «qué era el objeto» no les aplica.</>}
                    en={<>Each incident case shows its posterior on its own page, in the{" "}<em>&quot;How this case splits&quot;</em> section. Document cases (memos, hearings, leaks) carry no posterior: the &apos;what was the object&apos; question does not apply to them.</>}
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
  conf,
  color,
}: {
  tier: string;
  es: string;
  en: string;
  examples: string;
  conf: string;
  color: string;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-3 align-top">
        <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>{tier}</span>
      </td>
      <td className="px-3 py-3 align-top text-sm text-text"><T es={es} en={en} /></td>
      <td className="px-3 py-3 align-top text-xs text-muted">{examples}</td>
      <td className="px-3 py-3 align-top font-mono text-xs tabular-nums text-text">{conf}</td>
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
