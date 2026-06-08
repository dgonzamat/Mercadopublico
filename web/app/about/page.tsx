import Link from "next/link";
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
  title: "Method",
  description:
    "Cómo se pesa la evidencia: cuatro tiers de fuerza probatoria, retornos decrecientes por caso, y por qué seis hipótesis pueden ser parcialmente ciertas en simultáneo.",
};

const CHAPTERS = [
  {
    id: "tiers",
    n: "1",
    es: { eyebrow: "Capítulo 1", h2: "Por qué Roswell no equivale a Meier", tldr: "4 tiers de evidencia — Tier 1 militar+sensor pesa distinto que Tier 4 contactee" },
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
    es: { eyebrow: "Capítulo 3", h2: "Por qué las probabilidades superan 100% (y no es un error)", tldr: "Las seis explicaciones principales no compiten entre sí — un mismo caso puede caer en más de una" },
    en: { eyebrow: "Chapter 3", h2: "Why probabilities exceed 100% (and it's not a bug)", tldr: "The six main explanations don't compete — a single case can fall into more than one" },
  },
  {
    id: "movement",
    n: "4",
    es: { eyebrow: "Capítulo 4", h2: "Hipótesis fáciles vs hipótesis en frontera", tldr: "Cinco de las seis explicaciones están razonablemente decididas — programas clasificados arriba, subclases específicas abajo. Solo entidades no humanas (categoría amplia) está abierta a evidencia decisiva." },
    en: { eyebrow: "Chapter 4", h2: "Easy hypotheses vs frontier hypotheses", tldr: "Five of the six explanations are reasonably settled — classified programs near the top, specific subclasses near the bottom. Only the broad 'non-human entities' category remains open to decisive evidence." },
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
                  es="No todos los casos UAP son equivalentes en valor evidencial. Mezclar tiers opaca el análisis e infla artificialmente la apariencia de evidencia. El público y la prensa frecuentemente conflactan tiers — esa es una fuente principal de confusión."
                  en="Not all UAP cases are equivalent in evidential value. Mixing tiers obscures the analysis and artificially inflates the appearance of evidence. The public and the press frequently conflate tiers — that's a principal source of confusion."
                />
              </Body>
              <div className="overflow-hidden rounded-lg border border-border">
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
                  es={`Una "evidencia" Tier 4 no debería usarse para soportar conclusiones que requieren Tier 1. El sistema deriva de las Close Encounter Categories de Hynek.`}
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
                    "Tier 4 contactee aislado (Meier 1-2%)",
                    "Caso #50 del mismo patrón (~0%)",
                    "Nueva predicción contactee fallada (baja, no sube)",
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
                  es={<><strong className="text-text">Estado:</strong> los casos individuales de tipo &quot;contactee&quot; ya no agregan evidencia útil. En cambio, los institucionales con sensor militar (Tier 1/2) siguen acumulando información valiosa.</>}
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
                  es="Distinción crítica del paradigma estadístico: las seis explicaciones principales no compiten entre sí — pueden ser parcialmente verdaderas a la vez. Por eso los porcentajes pueden sumar más de 100. Esto no es un error; es la estructura real del problema. Negarlo lleva a la falacia del 'tiene que ser una sola explicación'."
                  en="Critical distinction of the statistical paradigm: the six main explanations don't compete with each other — they can be partially true at once. That's why percentages can sum to more than 100. This isn't a bug; it's the real structure of the problem. Denying it leads to the 'must be one single explanation' fallacy."
                />
              </Body>
              <div className="rounded-lg border-l-4 border-accent bg-surface-2 px-5 py-4">
                <p className="text-sm text-text">
                  <T
                    es={<>El detalle por hipótesis (con números, bandas ICD-203 y razonamiento expandido) vive en{" "}<Link href="/probabilidades" className="text-accent hover:underline">/probabilidades →</Link>{" "}para no duplicar el contenido acá.</>}
                    en={<>The per-hypothesis detail (with numbers, ICD-203 bands, and expanded reasoning) lives in{" "}<Link href="/probabilidades" className="text-accent hover:underline">/probabilidades →</Link>{" "}to avoid duplicating content here.</>}
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
                  es="De las seis explicaciones principales del corpus, cinco están razonablemente decididas — programa clasificado arriba con evidencia histórica documentada (U-2, F-117); fenómeno natural raro, que arrancó con un prior alto (70%) pero que el corpus empujó hasta ~16% efectivo porque los casos con sensor muestran objetos estructurados, no plasma; y las tres subclases específicas (interdimensional, ontológico no materialista, tratado formal) abajo porque su evidencia es testimonial o sin documentos primarios. La sexta, entidades no humanas (categoría amplia), es la única que un solo experimento decisivo podría mover. Por eso ahí vive el debate del corpus."
                  en="Of the six main corpus explanations, five are reasonably settled — classified programs near the top with documented historical evidence (U-2, F-117); rare natural phenomenon, which started from a high prior (70%) but the corpus pushed down to ~16% effective because the sensor cases show structured objects, not plasma; and the three specific subclasses (interdimensional, non-materialist ontological, formal treaty) near the bottom because their evidence is testimonial or lacks primary documents. The sixth, broad non-human entities, is the only one a single decisive experiment could move. That's where the corpus debate lives."
                />
              </Body>
              <div className="grid gap-4 sm:grid-cols-3">
                <MoveList
                  es="Priors arriba (no se mueven)"
                  en="Priors near ceiling (don't move)"
                  items={[
                    "Programa clasificado · prior 88% → 99%",
                  ]}
                  itemsEn={[
                    "Classified program · prior 88% → 99%",
                  ]}
                />
                <MoveList
                  es="Prior abierto (la frontera)"
                  en="Open prior (the frontier)"
                  items={[
                    "Entidades no humanas · prior 28%",
                    "→ categoría amplia (la más debatida)",
                    "→ donde el experimento de Lake Huron pesaría",
                  ]}
                  itemsEn={[
                    "Non-human entities · prior 28%",
                    "→ broad category (most debated)",
                    "→ where the Lake Huron experiment would matter",
                  ]}
                  accent
                />
                <MoveList
                  es="Priors abajo (no se mueven)"
                  en="Priors near floor (don't move)"
                  items={[
                    "Interdimensional · prior 22%",
                    "Ontológico no materialista · prior 22%",
                    "Tratado formal · prior 6%",
                  ]}
                  itemsEn={[
                    "Interdimensional · prior 22%",
                    "Non-materialist ontological · prior 22%",
                    "Formal treaty · prior 6%",
                  ]}
                />
              </div>
              <Caption className="pt-2">
                <T
                  es="Las dos hipótesis adicionales — misidentificación (97%, antes del filtro institucional) y heterogeneidad (95%, consecuencia de las seis principales) — viven en /probabilidades en su propia sección."
                  en="The two additional hypotheses — misidentification (97%, before the institutional filter) and heterogeneity (95%, consequence of the six main ones) — live in /probabilidades in their own section."
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
                  <T es="Calibración derivada con ajuste manual" en="Derived calibration with manual override" />
                </Eyebrow>
                <h3 className="font-display text-xl font-medium leading-snug text-text md:text-2xl">
                  <T es="Cómo cada caso nuevo mueve las probabilidades automáticamente" en="How each new case moves the probabilities automatically" />
                </h3>
                <Body className="text-muted">
                  <T
                    es={<>Las probabilidades del corpus se derivan en build-time siguiendo una fórmula pública:{" "}<strong className="text-text">probabilidad = prior + presión × 0.5</strong>. El <em>prior</em> es el juicio del analista antes de mirar el corpus; la <em>presión</em> es la suma de las contribuciones declaradas por cada caso del corpus. Cada caso nuevo recalibra automáticamente todas las probabilidades del sitio sin intervención humana. El resultado se topa en el rango <strong className="text-text">1–99%</strong> (regla ICD-203: nunca 0 ni 100), por eso una hipótesis muy evidenciada como «programa clasificado» muestra 99% aunque la presión acumulada la empujaría más alto.</>}
                    en={<>Corpus probabilities are derived at build-time following a public formula:{" "}<strong className="text-text">probability = prior + pressure × 0.5</strong>. The <em>prior</em> is the analyst&apos;s judgment before looking at the corpus; the <em>pressure</em> is the sum of declared contributions from each corpus case. Every new case auto-recalibrates all probabilities site-wide without human intervention. The result is capped to the <strong className="text-text">1–99%</strong> range (ICD-203 rule: never 0 or 100), which is why a heavily-evidenced hypothesis like “classified program” shows 99% even though the accumulated pressure would push it higher.</>}
                  />
                </Body>
                <Body className="text-muted">
                  <T
                    es={<>Los pesos por caso son públicos y declarados:{" "}<strong className="text-text">mínimo +0.5</strong>{" "}(repite patrón ya documentado),{" "}<strong className="text-text">modesto +2</strong>{" "}(corroboración independiente o una modalidad sensora añadida),{" "}<strong className="text-text">sustancial +5</strong>{" "}(modalidad sensora nueva o contradice patrón establecido),{" "}<strong className="text-text">categoría nueva +15</strong>{" "}(clase de evidencia enteramente nueva — material recuperado + análisis publicado, identificación de origen, etc).</>}
                    en={<>Per-case weights are public and declared:{" "}<strong className="text-text">minimal +0.5</strong>{" "}(repeats already-documented pattern),{" "}<strong className="text-text">modest +2</strong>{" "}(independent corroboration or one added sensor modality),{" "}<strong className="text-text">substantial +5</strong>{" "}(new sensor modality or contradicts established pattern),{" "}<strong className="text-text">category-breaking +15</strong>{" "}(entirely new class of evidence — recovered material + published analysis, origin identification, etc).</>}
                  />
                </Body>
                <Body className="text-muted">
                  <T
                    es={<>Cuando un analista discrepa con el resultado derivado — por ejemplo cuando hay contexto cualitativo no codificable en pesos — puede declarar un{" "}<strong className="text-text">ajuste manual</strong>{" "}explícito que reemplaza el cálculo. El sitio indica visualmente cuándo se aplica un ajuste manual, para que el lector vea la diferencia entre derivación automática y juicio humano explícito.</>}
                    en={<>When an analyst disagrees with the derived result — for example when there&apos;s qualitative context not captured in the weights — they can declare an explicit{" "}<strong className="text-text">manual override</strong>{" "}that replaces the calculation. The site flags visually when an override is in effect, so the reader sees the difference between automatic derivation and explicit human judgment.</>}
                  />
                </Body>
                <Caption>
                  <T
                    es={<>Cada caso individual muestra su contribución declarada en su propia página, en la sección{" "}<em>&quot;Lo que este caso movió&quot;</em>. Los casos sin contribución declarada se auto-siembran desde sus patrones al peso mínimo (+0.5 por patrón mapeado). Las hipótesis{" "}<em>antecedente</em> (misidentificación) y{" "}<em>derivada</em> (heterogeneidad) usan ajuste manual por construcción, porque sus probabilidades no provienen del corpus.</>}
                    en={<>Each individual case shows its declared contribution on its own page, in the{" "}<em>&quot;What this case moved&quot;</em> section. Cases without a declared contribution are auto-seeded from their patterns at minimal weight (+0.5 per mapped pattern). The <em>antecedent</em> (misidentification) and <em>derived</em> (heterogeneity) hypotheses use manual override by construction, since their probabilities don&apos;t come from the corpus.</>}
                  />
                </Caption>
              </div>
            </div>
          </details>
        </section>

        <section className="space-y-6 border-t-4 border-text bg-surface-2 px-6 py-10 md:px-10 md:py-14">
          <Eyebrow><T es="Ya entendés el método" en="You now understand the method" /></Eyebrow>
          <h2 className="font-display text-2xl font-medium leading-snug text-text md:text-3xl">
            <T es="Ahora mirá el resultado: seis explicaciones con su nivel de confianza" en="Now see the result: six explanations with their confidence level" />
          </h2>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/probabilidades" className="inline-flex min-h-[48px] items-center bg-accent px-6 py-2 text-base font-medium text-bg hover:bg-text">
              <T es="Ver las seis explicaciones →" en="See the six explanations →" />
            </Link>
            <Link href="/cases" className="inline-flex min-h-[48px] items-center border-2 border-text px-6 py-2 text-base font-medium text-text hover:bg-text hover:text-bg">
              <T es={`Ver los ${STATS.cases} casos →`} en={`See the ${STATS.cases} cases →`} />
            </Link>
            <Link href="/fuentes" className="inline-flex min-h-[48px] items-center border-2 border-text px-6 py-2 text-base font-medium text-text hover:bg-text hover:text-bg">
              <T es="Ver todas las fuentes →" en="See all sources →" />
            </Link>
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
