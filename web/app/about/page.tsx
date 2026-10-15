import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
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
import { cases } from "@/lib/data";
import { TIER_META } from "@/lib/ui";

// Ejemplos de cada tier. Se filtran por el tier real de la ficha, así que la
// tabla no puede contradecir a los casos: si un tier cambia, el ejemplo sale
// de su fila en vez de quedar mal clasificado (antes 6 de 13 no coincidían).
const TIER_EXAMPLE_IDS: Record<"S" | "A" | "B", string[]> = {
  S: ["tehran-1976", "nimitz-2004", "belgian-wave-1989", "lake-huron-2023", "jal1628-1986", "manises-1979"],
  A: ["hessdalen-1981", "hudson-valley-1983", "talavera-la-real-1976", "trans-en-provence-1981", "falcon-lake-1967"],
  B: ["communion-1985", "maury-island-1947", "bonnybridge-1992", "gulf-breeze-1987"],
};

function tierExamples(tier: "S" | "A" | "B", locale: "es" | "en"): string {
  return TIER_EXAMPLE_IDS[tier]
    .map((id) => cases.find((c) => c.id === id))
    .filter((c) => c && c.tier === tier)
    .map((c) => (locale === "en" ? c!.name_en ?? c!.name : c!.name).split(" · ")[0])
    .join(", ");
}

export const metadata = {
  ...pageMeta({
  title: "Methodology: how the evidence is weighed",
  description:
    "How the evidence is weighed: three evidence tiers (S, A and B), why a repeated case adds little, and how six explanations share each case.",
  path: "/about/",
}),
  alternates: { canonical: "/about/", languages: hreflangFor("/about/") },
};

const CHAPTERS = [
  {
    id: "tiers",
    n: "1",
    es: { eyebrow: "Capítulo 1", h2: "Por qué Teherán no equivale a Communion", tldr: "Tres niveles de evidencia (S, A y B): un caso con sensores y testigos militares no pesa lo mismo que uno de testigo único, y el nivel no dice qué fue el caso" },
    en: { eyebrow: "Chapter 1", h2: "Why Tehran isn't equivalent to Communion", tldr: "Three evidence tiers (S, A and B): a case with sensors and military witnesses does not weigh the same as a single-witness one, and the tier does not say what the case was" },
  },
  {
    id: "bayes",
    n: "2",
    es: { eyebrow: "Capítulo 2", h2: "Por qué el caso número 50 ya no agrega nada nuevo", tldr: "Un caso con sensores puede cambiar qué explicación pesa más; el caso 50 del mismo tipo solo refuerza la que ya dominaba" },
    en: { eyebrow: "Chapter 2", h2: "Why case number 50 adds nothing new", tldr: "A case with sensors can change which explanation weighs most; case 50 of the same kind only reinforces the one already dominant" },
  },
  {
    id: "non-exclusive",
    n: "3",
    es: { eyebrow: "Capítulo 3", h2: "Por qué las probabilidades suman 100%", tldr: "En cada caso, las seis explicaciones se excluyen entre sí y se reparten el 100 %, así que se pueden comparar" },
    en: { eyebrow: "Chapter 3", h2: "Why probabilities sum to 100%", tldr: "In each case, the six explanations exclude one another and share 100%, so they can be compared" },
  },
  {
    id: "movement",
    n: "4",
    es: { eyebrow: "Capítulo 4", h2: "Lo decidido vs la frontera", tldr: "La mayoría de los casos tiene una causa ordinaria (sobre todo aeronaves, globos, astros y satélites); las explicaciones no humanas son minoría y se concentran en los casos mejor documentados." },
    en: { eyebrow: "Chapter 4", h2: "What is settled vs the frontier", tldr: "Most cases have an ordinary cause (mostly aircraft, balloons, celestial bodies and satellites); the non-human explanations are a minority and concentrate in the best-documented cases." },
  },
  {
    id: "movers",
    n: "5",
    es: { eyebrow: "Capítulo 5", h2: "Qué movería el análisis ahora", tldr: "Análisis isotópico de Lake Huron, material recuperado verificable, reconocimiento formal de un nuevo país" },
    en: { eyebrow: "Chapter 5", h2: "What would move the analysis now", tldr: "Lake Huron isotopic analysis, verifiable recovered material, formal acknowledgment by a new country" },
  },
];

export default function AboutPage() {
  return <AboutView locale="en" />;
}

export function AboutView({ locale }: { locale: "es" | "en" }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 py-4 lg:grid-cols-[14rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-3">
          <p className="font-mono text-[11px] text-muted">
            <T es="Capítulos" en="Chapters" locale={locale} />
          </p>
          <ol className="space-y-2">
            {CHAPTERS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="block text-sm leading-snug text-muted hover:text-accent"
                >
                  <span className="font-mono text-xs tabular-nums text-text">{c.n}</span>{" "}
                  <T es={c.es.h2} en={c.en.h2} locale={locale} />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <article className="space-y-16">
        <header className="space-y-4">
          <Eyebrow><T es="Metodología" en="Method" locale={locale} /></Eyebrow>
          <H1><T es="Las reglas del juego" en="The rules of the game" locale={locale} /></H1>
          <Lede className="text-muted">
            <T
              es="Toda colección de evidencia UAP necesita una respuesta a tres preguntas: qué cuenta, cómo se pesa, y cuándo cambia. Aquí están las tres, para que cualquiera pueda revisar el análisis en lugar de creerlo."
              en="Any UAP evidence collection needs an answer to three questions: what counts, how it's weighted, and when it changes. Here are all three, so anyone can check the analysis instead of having to believe it."
              locale={locale}
            />
          </Lede>
        </header>

        <nav aria-label="Índice de capítulos" className="space-y-3 border-y-2 border-text/15 py-6 lg:hidden">
          <p className="font-mono text-[11px] text-muted">
            <T es="Saltar a capítulo" en="Jump to chapter" locale={locale} />
          </p>
          <ol className="space-y-2">
            {CHAPTERS.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="flex items-baseline gap-3 py-1 text-sm">
                  <span className="w-6 font-mono text-xs tabular-nums text-muted">{c.n}</span>
                  <span className="text-text hover:text-accent">
                    <T es={c.es.h2} en={c.en.h2} locale={locale} />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section id="tiers" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[0].es.eyebrow} en={CHAPTERS[0].en.eyebrow} locale={locale} /></Eyebrow>
              <H2><T es={CHAPTERS[0].es.h2} en={CHAPTERS[0].en.h2} locale={locale} /></H2>
              <p className="font-mono text-xs text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[0].es.tldr} en={CHAPTERS[0].en.tldr} locale={locale} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="No todos los casos valen lo mismo como evidencia. Mezclar niveles enturbia el análisis y hace que parezca haber más evidencia de la que hay, y el público y la prensa los mezclan con frecuencia."
                  en="Not all cases are worth the same as evidence. Mixing tiers muddies the analysis and makes it look as if there were more evidence than there is, and the public and the press mix them up often."
                  locale={locale}
                />
              </Body>
              <div className="border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="px-3 py-2 text-left font-mono text-xs text-muted">Tier</th>
                      <th className="px-3 py-2 text-left font-mono text-xs text-muted"><T es="Categoría" en="Category" locale={locale} /></th>
                      <th className="px-3 py-2 text-left font-mono text-xs text-muted"><T es="Ejemplos" en="Examples" locale={locale} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    <TierRow tier="S" es={TIER_META.S.description} en={TIER_META.S.description_en} examples={tierExamples("S", locale)} color="text-tierS" locale={locale} />
                    <TierRow tier="A" es={TIER_META.A.description} en={TIER_META.A.description_en} examples={tierExamples("A", locale)} color="text-tierA" locale={locale} />
                    <TierRow tier="B" es={TIER_META.B.description} en={TIER_META.B.description_en} examples={tierExamples("B", locale)} color="text-tierB" locale={locale} />
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted">
                <T
                  es="Tres reglas fijan la frontera entre tiers. Sin un registro instrumental de la época, un caso no pasa de A, por muchos testigos que tenga. Un testimonio recogido años después no cuenta como de la época. Y el tier mide la fuerza de la evidencia, no qué fue: un caso S puede tener una causa ordinaria."
                  en="Three rules set the boundary between tiers. Without a contemporary instrumental record, a case goes no higher than A, however many witnesses it has. Testimony gathered years later does not count as contemporary. And the tier measures the strength of the evidence, not what it was: an S case can have an ordinary cause."
                  locale={locale}
                />
              </p>
              <p className="text-sm text-muted">
                <T
                  es="Los documentos no tienen ficha ni tier propios: cada uno aparece en el caso o el perfil de actor que respalda, con un párrafo que dice qué es, quién lo emitió y qué prueba."
                  en="Documents have no entry or tier of their own: each one appears on the case or actor profile it supports, with a paragraph on what it is, who issued it and what it proves."
                  locale={locale}
                />
              </p>
              <PullQuote>
                <T
                  es={`Una "evidencia" Tier B no debería usarse para sustentar conclusiones que exigen Tier S. La escala (heredera de las categorías de encuentros cercanos de Hynek) mide solo la fuerza de la evidencia, no qué fue el caso.`}
                  en={`A Tier B "evidence" should not be used to support conclusions that require Tier S. The scale (descended from Hynek's close-encounter categories) measures only the strength of the evidence, not what the case was.`}
                  locale={locale}
                />
              </PullQuote>

              {/* Los tres ejes — unifica tier / probabilidad / partición y dónde se ve cada uno.
                  Responde a la confusión de que cada vista habla solo de "su" eje. */}
              <div className="border-l-4 border-accent bg-surface-2 p-5">
                <p className="font-mono text-xs text-accent">
                  <T es="Tres medidas distintas" en="Three different measures" locale={locale} />
                </p>
                <Body className="mt-3 text-sm text-muted">
                  <T
                    es="Cada caso se describe con tres medidas distintas, repartidas entre las vistas del sitio. Es fácil confundirlas porque las tres suenan a «calidad»:"
                    en="Each case is described with three distinct measures, spread across the site's views. They are easy to conflate because all three sound like «quality»:"
                    locale={locale}
                  />
                </Body>
                <ul className="mt-3 space-y-2 text-sm text-text">
                  <li>
                    <strong className="text-tierS"><T es="Tier (S/A/B)" en="Tier (S/A/B)" locale={locale} /></strong>: <T es="la fuerza de la evidencia. Se ve como etiqueta en cada caso y como color del marcador en el mapa." en="the strength of the evidence. Shown as a badge on each case and as the marker color on the map." locale={locale} />
                  </li>
                  <li>
                    <strong className="text-accent"><T es="Probabilidad (0–100%)" en="Probability (0–100%)" locale={locale} /></strong>: <T es="cuánto del caso sigue sin explicación: la parte del reparto de explicaciones que no cubre ninguna causa conocida («indeterminado» más las dos explicaciones no humanas). No se escribe a mano: se calcula desde ese reparto, así que nunca lo contradice. Se ve como «%» en cada caso y como tamaño del marcador en el mapa." en="how much of the case remains unexplained: the share of the split of explanations that no known cause covers («indeterminate» plus the two non-human explanations). It is not written by hand: it is computed from that split, so it never contradicts it. Shown as «%» on each case and as the marker size on the map." locale={locale} />
                  </li>
                  <li>
                    <strong className="text-text"><T es="Reparto de explicaciones" en="Split of explanations" locale={locale} /></strong>: <T es="qué fue: cómo se reparte el caso entre seis explicaciones que se excluyen entre sí." en="what it was: how the case splits across six explanations that exclude one another." locale={locale} /> <LocaleLink href="/probabilidades" className="text-accent hover:underline"><T es="ver /probabilidades →" en="see /probabilidades →" locale={locale} /></LocaleLink>
                  </li>
                </ul>
                <Body className="mt-3 text-sm text-muted">
                  <T
                    es="Son independientes: un caso bien documentado (Tier S o A) puede tener como explicación más probable un posible fraude, y un Tier B no es por eso un fraude."
                    en="They are independent: a well-documented case (Tier S or A) can have a possible hoax as its most likely explanation, and a Tier B is not a hoax for that reason."
                    locale={locale}
                  />
                </Body>
              </div>
            </div>
          </details>
        </section>

        <section id="bayes" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[1].es.eyebrow} en={CHAPTERS[1].en.eyebrow} locale={locale} /></Eyebrow>
              <H2><T es={CHAPTERS[1].es.h2} en={CHAPTERS[1].en.h2} locale={locale} /></H2>
              <p className="font-mono text-xs text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[1].es.tldr} en={CHAPTERS[1].en.tldr} locale={locale} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="Cada caso suma su reparto completo, sin descuentos ocultos. Lo que cambia es cuánto informa ese reparto: un caso institucional con sensor da un reparto nítido que puede llevar peso a una explicación casi vacía; el quincuagésimo caso del mismo patrón solo refuerza la explicación que ya dominaba."
                  en="Each case adds its full split, with no hidden discounts. What changes is how much that split tells us: an institutional case with a sensor gives a sharp split that can move weight to an almost empty explanation; the fiftieth case of the same pattern only reinforces the explanation that already dominated."
                  locale={locale}
                />
              </Body>
              <div className="grid gap-4 sm:grid-cols-2">
                <MoveList
                  es="Cambia el reparto entre explicaciones"
                  en="Shifts the split between explanations"
                  items={[
                    "Tier S o A con varios sensores (Teherán, Nimitz)",
                    "Categoría de evidencia nueva (Hessdalen, Lake Huron)",
                    "Caso que contradice el patrón establecido",
                    "Sensores oficiales y vídeo que coinciden",
                  ]}
                  itemsEn={[
                    "Tier S or A with several sensors (Tehran, Nimitz)",
                    "New class of evidence (Hessdalen, Lake Huron)",
                    "Case that contradicts the established pattern",
                    "Official sensors and matching video",
                  ]}
                  accent
                  locale={locale}
                />
                <MoveList
                  es="Solo refuerza lo dominante"
                  en="Only reinforces the dominant"
                  items={[
                    "Un contactado aislado de Tier B (Communion)",
                    "El caso 50 del mismo tipo",
                    "Una predicción de contactado que no se cumplió",
                  ]}
                  itemsEn={[
                    "An isolated Tier B contactee (Communion)",
                    "Case 50 of the same kind",
                    "A contactee prediction that did not come true",
                  ]}
                  locale={locale}
                />
              </div>
              <Caption>
                <T
                  es="Los casos aislados de contactados se reparten sobre todo entre causas ordinarias e indeterminado, así que no cambian el reparto del archivo. Los casos institucionales con sensores (Tier S o A) sí pueden cambiarlo."
                  en="Isolated contactee cases split mostly between ordinary causes and indeterminate, so they do not change the archive's split. Institutional cases with sensors (Tier S or A) can."
                  locale={locale}
                />
              </Caption>
            </div>
          </details>
        </section>

        <section id="non-exclusive" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[2].es.eyebrow} en={CHAPTERS[2].en.eyebrow} locale={locale} /></Eyebrow>
              <H2><T es={CHAPTERS[2].es.h2} en={CHAPTERS[2].en.h2} locale={locale} /></H2>
              <p className="font-mono text-xs text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[2].es.tldr} en={CHAPTERS[2].en.tldr} locale={locale} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="En cada caso, las explicaciones se excluyen entre sí: el caso tuvo una sola causa real, y la incertidumbre se reparte entre las candidatas hasta sumar 100 %. Sumadas sobre todos los casos, se pueden comparar: se puede decir qué explicación da cuenta de más casos. En el sitio, cada caso se muestra en una sola explicación. Las ordinarias se nombran por lo que era el objeto (un astro, una aeronave o un globo, un cohete o un satélite…), un fenómeno natural o un posible fraude; las dos no humanas van juntas, y la parte que el caso no permite asignar se reparte entre las explicaciones que sí apoya, así que ningún caso queda sin clasificar."
                  en="In each case, the explanations exclude one another: the case had a single real cause, and the uncertainty is split among the candidates until it sums to 100%. Added across all cases, they can be compared: you can say which explanation accounts for more cases. On the site, each case is shown under a single explanation. Ordinary ones are named by what the object was (a star or planet, an aircraft or balloon, a rocket or satellite…), a natural phenomenon or a possible hoax; the two non-human ones are grouped, and the share a case cannot assign is spread across the explanations it does support, so no case is left unclassified."
                  locale={locale}
                />
              </Body>
              <Body className="text-muted">
                <T
                  es="Las probabilidades de cada caso son juicios estructurados, no frecuencias medidas: que se puedan comparar no las hace ciertas. Dicen qué explicación encaja mejor con lo que se sabe de cada caso, no cuál es la correcta. Hay dos formas de sumar los casos. Una suma las probabilidades de cada explicación: da el número esperado de casos por explicación y reparte lo indeterminado en fracciones. La otra cuenta cada caso una vez, en su explicación más probable, con «Indeterminado» como categoría propia: es la que usan la portada, /probabilidades y el filtro de /cases. Las dos dan cifras algo distintas porque miden cosas distintas, no porque se contradigan."
                  en="Each case's probabilities are structured judgments, not measured frequencies: being comparable does not make them true. They say which explanation fits best with what is known about each case, not which one is correct. There are two ways to add up the cases. One adds the probabilities of each explanation: it gives the expected number of cases per explanation and spreads the indeterminate share in fractions. The other counts each case once, under its most likely explanation, with 'Indeterminate' as its own category: that is what the home page, /probabilidades and the /cases filter use. The two give slightly different figures because they measure different things, not because they contradict each other."
                  locale={locale}
                />
              </Body>
              <Body className="text-muted">
                <T
                  es="En /probabilidades, las explicaciones ordinarias se abren por el objeto concreto, y «pendiente de revisión» marca los casos que aún no se han contrastado con ninguna fuente: su clase es la heredada, no una conclusión. En cada ficha, la Probabilidad es la parte del reparto que ninguna causa conocida explica (lo indeterminado más las dos explicaciones no humanas), y el tier mide la fuerza de la evidencia, no qué fue: un caso bien documentado puede tener como explicación más probable un posible fraude."
                  en="On /probabilidades, ordinary explanations open into the specific object, and 'pending review' marks the cases not yet checked against any source: their class is the inherited one, not a conclusion. On each case page, the Probability is the share of the split no known cause explains (the indeterminate part plus the two non-human explanations), and the tier measures the strength of the evidence, not what it was: a well-documented case can have a possible hoax as its most likely explanation."
                  locale={locale}
                />
              </Body>
              <div className="border-l-4 border-accent bg-surface-2 px-5 py-4">
                <p className="text-sm text-text">
                  <T
                    es={<>El detalle de cada explicación, con sus cifras y sus casos más representativos, está en{" "}<LocaleLink href="/probabilidades" className="text-accent hover:underline">/probabilidades →</LocaleLink></>}
                    en={<>The detail of each explanation, with its figures and most representative cases, is at{" "}<LocaleLink href="/probabilidades" className="text-accent hover:underline">/probabilidades →</LocaleLink></>}
                    locale={locale}
                  />
                </p>
              </div>
            </div>
          </details>
        </section>

        <section id="movement" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[3].es.eyebrow} en={CHAPTERS[3].en.eyebrow} locale={locale} /></Eyebrow>
              <H2><T es={CHAPTERS[3].es.h2} en={CHAPTERS[3].en.h2} locale={locale} /></H2>
              <p className="font-mono text-xs text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[3].es.tldr} en={CHAPTERS[3].en.tldr} locale={locale} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <Body className="text-muted">
                <T
                  es="El modelo se rehízo para que los números se puedan comparar. Antes, cada hipótesis era una afirmación aparte («al menos un caso es X»), y sus porcentajes ni sumaban 100 ni competían entre sí: no se podía decir qué explicación era más probable. Ahora cada caso reparte el 100 % entre las mismas seis explicaciones, que se excluyen entre sí, y el total del archivo se reparte igual. Cada explicación combina qué era el objeto y qué hizo el Estado, así que «no humano y ocultado por un Estado» es una clase propia. Las hipótesis del modelo anterior siguen dentro de cada explicación, y «entidades no humanas» (la suma de las dos no humanas) y «heterogeneidad» se calculan a partir de ellas."
                  en="The model was rebuilt so the numbers can be compared. Before, each hypothesis was a separate claim ('at least one case is X'), and its percentages neither summed to 100 nor competed: you could not say which explanation was more likely. Now each case splits 100% across the same six explanations, which exclude one another, and the archive total is split the same way. Each explanation combines what the object was and what the state did, so 'non-human and hidden by a state' is its own class. The previous model's hypotheses remain inside each explanation, and 'non-human entities' (the sum of the two non-human ones) and 'heterogeneity' are calculated from them."
                  locale={locale}
                />
              </Body>
              <Caption className="pt-2">
                <T
                  es={<>El reparto completo, las seis explicaciones y los casos más representativos de cada una están en{" "}<LocaleLink href="/probabilidades" className="text-accent hover:underline">/probabilidades →</LocaleLink>.</>}
                  en={<>The full split, the six explanations and the most representative cases of each are at{" "}<LocaleLink href="/probabilidades" className="text-accent hover:underline">/probabilidades →</LocaleLink>.</>}
                  locale={locale}
                />
              </Caption>
            </div>
          </details>
        </section>

        <section id="movers" className="scroll-mt-20">
          <details className="group border-b border-text/15 pb-6">
            <summary className="cursor-pointer list-none space-y-3 hover:opacity-80">
              <Eyebrow><T es={CHAPTERS[4].es.eyebrow} en={CHAPTERS[4].en.eyebrow} locale={locale} /></Eyebrow>
              <H2><T es={CHAPTERS[4].es.h2} en={CHAPTERS[4].en.h2} locale={locale} /></H2>
              <p className="font-mono text-xs text-muted">
                <span className="normal-case tracking-normal">
                  <T es={CHAPTERS[4].es.tldr} en={CHAPTERS[4].en.tldr} locale={locale} />
                </span>
                <span aria-hidden className="ml-2 inline-block text-accent transition-transform group-open:rotate-180">▾</span>
              </p>
            </summary>
            <div className="mt-6 space-y-6">
              <ul className="space-y-3">
                {[
                  { weight: "+++", color: "text-tierS", es: "Análisis isotópico independiente de residuos físicos publicado", en: "Independent isotopic analysis of physical residues published" },
                  { weight: "+++", color: "text-tierS", es: "Material recuperado con fotos verificables", en: "Recovered material with verifiable photos" },
                  { weight: "+++", color: "text-tierS", es: "Análisis publicado de los fragmentos de Lake Huron", en: "Published analysis of the Lake Huron fragments" },
                  { weight: "+", color: "text-tierA", es: "Nuevo país que reconoce formalmente el fenómeno", en: "A new country formally acknowledging the phenomenon" },
                  { weight: "+", color: "text-tierA", es: "Otro caso como Teherán, con datos de sensores", en: "Another case like Tehran, with sensor data" },
                  { weight: "~0", color: "text-muted", es: "Un nuevo contactado con una cosmología detallada", en: "A new contactee with a detailed cosmology" },
                ].map((item, i) => (
                  <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-3">
                    <span className={`text-right font-mono text-xs ${item.color}`}>{item.weight}</span>
                    <span className="text-text"><T es={item.es} en={item.en} locale={locale} /></span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 space-y-4 border-t border-text/15 pt-8">
                <Eyebrow>
                  <T es="Cómo se suma" en="How it adds up" locale={locale} />
                </Eyebrow>
                <h3 className="font-display text-xl font-medium leading-snug text-text md:text-2xl">
                  <T es="Cómo cada caso nuevo cambia las cifras" en="How each new case changes the figures" locale={locale} />
                </h3>
                <Body className="text-muted">
                  <T
                    es="Cada caso reparte el 100 % entre las seis explicaciones. Ese reparto es un juicio declarado, no el resultado de una fórmula: el análisis del caso decide cuánto encaja cada explicación con la evidencia, y el reparto queda visible en la página del caso, en «Distribución de explicaciones». Son juicios razonados, no frecuencias medidas: dicen qué explicación encaja mejor con cada caso, no cuál es la correcta."
                    en="Each case splits 100% across the six explanations. That split is a declared judgment, not the output of a formula: the case analysis decides how well each explanation fits the evidence, and the split stays visible on the case page, under 'Distribution of explanations'. They are reasoned judgments, not measured frequencies: they say which explanation fits each case best, not which one is correct."
                    locale={locale}
                  />
                </Body>
                <Body className="text-muted">
                  <T
                    es="El total del archivo se calcula solo: suma los repartos de todos los casos y redondea para que los porcentajes mostrados sumen exactamente 100. Como es una suma, vale aunque los casos se parezcan entre sí. Cada caso nuevo entra con su reparto y el total se recalcula al publicar el sitio, sin ajustes a mano. En las gráficas, la parte que un caso no permite asignar se reparte entre las explicaciones que ese caso sí apoya, así que ningún caso queda sin clasificar."
                    en="The archive total is computed automatically: it adds up the splits of every case and rounds them so the displayed percentages sum to exactly 100. Because it is a sum, it holds even when cases resemble one another. Each new case enters with its split and the total is recomputed when the site is published, with no manual adjustment. In the charts, the share a case cannot assign is spread across the explanations that case does support, so no case is left unclassified."
                    locale={locale}
                  />
                </Body>
              </div>
            </div>
          </details>
        </section>

        <section className="space-y-6 border-t-4 border-text bg-surface-2 px-6 py-10 md:px-10 md:py-14">
                    <h2 className="font-display text-2xl font-medium leading-snug text-text md:text-3xl">
            <T es="Ahora mira el resultado: cómo se reparte el archivo entre seis explicaciones" en="Now see the result: how the archive splits across six explanations" locale={locale} />
          </h2>
          <div className="flex flex-wrap gap-3 pt-2">
            <Cta href="/probabilidades" variant="primary">
              <T es="Ver las seis explicaciones →" en="See the six explanations →" locale={locale} />
            </Cta>
            <Cta href="/cases" variant="secondary">
              <T es={`Ver los ${STATS.cases} casos →`} en={`See the ${STATS.cases} cases →`} locale={locale} />
            </Cta>
            <Cta href="/fuentes" variant="secondary">
              <T es="Ver todas las fuentes →" en="See all sources →" locale={locale} />
            </Cta>
          </div>
        </section>

        <Caption className="border-t border-border pt-6">
          <T
            es="Toda la metodología está en esta página, sin documentos externos."
            en="The full methodology is on this page, with no external documents."
            locale={locale}
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
  locale,
}: {
  tier: string;
  es: string;
  en: string;
  examples: string;
  color: string;
  locale: "es" | "en";
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-3 align-top">
        <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>{tier}</span>
      </td>
      <td className="px-3 py-3 align-top text-sm text-text"><T es={es} en={en} locale={locale} /></td>
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
  locale,
}: {
  es: string;
  en: string;
  items: string[];
  itemsEn: string[];
  accent?: boolean;
  locale: "es" | "en";
}) {
  return (
    <div className="space-y-2">
      <p className={`font-mono text-xs ${accent ? "text-accent" : "text-muted"}`}>
        <T es={es} en={en} locale={locale} />
      </p>
      <ul className="space-y-1.5 text-xs text-text">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted">·</span>
            <span><T es={item} en={itemsEn[i] ?? item} locale={locale} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
