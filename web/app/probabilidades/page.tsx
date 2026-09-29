import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { HeterogeneityByDecade } from "@/components/HeterogeneityByDecade";
import { corpusPosteriors, expandedHypotheses, modalHypothesis, PROSAIC_CLASSES } from "@/lib/meceModel";
import { DETAIL_UNSPECIFIED, OBJECT_DETAILS, type ProsaicKey } from "@/lib/meceClasses";
import { cases } from "@/lib/data";
import { AnalyzerCta } from "@/components/AnalyzerCta";

export const metadata = {
  ...pageMeta({
  title: "Probabilities by explanation (MECE model)",
  description:
    "Six mutually exclusive narratives (object + institutional stance): each UAP case allocates 100% and the corpus aggregates them comparably (MECE model).",
  path: "/probabilidades/",
}),
  alternates: { canonical: "/probabilidades/", languages: hreflangFor("/probabilidades/") },
};

/** Qué significa cada hipótesis (y qué hipótesis del marco anterior preserva). */
const BLURB: Record<string, { es: string; en: string }> = {
  // Lo prosaico se nombra por el OBJETO, no por el error del testigo: las clases
  // de objeto salen de `misidSubtype` (dato), ver PROSAIC_CLASSES; su detalle de
  // segundo nivel (`objectDetail`) se desglosa bajo cada bloque.
  astronomico: {
    es: "Un objeto astronómico tomado por otra cosa: un planeta brillante (Venus, Júpiter), una estrella, la Luna o un meteoro o bólido. El objeto era real y estaba donde debía; lo anómalo fue la lectura.",
    en: "An astronomical object taken for something else: a bright planet (Venus, Jupiter), a star, the Moon or a meteor or fireball. The object was real and where it should be; the anomaly was in the reading.",
  },
  aeronave: {
    es: "Una aeronave: avión, helicóptero, dron o globo (meteorológico, de investigación, de fiesta). Los globos se archivan aquí porque vuelan en el mismo espacio aéreo y se confunden con lo mismo.",
    en: "An aircraft: plane, helicopter, drone or balloon (weather, research, party). Balloons are filed here because they fly in the same airspace and get mistaken for the same things.",
  },
  espacial: {
    es: "Un objeto espacial: cohete o misil, satélite o reentrada —lanzamientos, etapas y restos que reentran, trenes de satélites—. El catálogo de lanzamientos permite fecharlos y a menudo identificarlos.",
    en: "A space object: rocket or missile, satellite or reentry —launches, stages and debris reentering, satellite trains. Launch catalogs make it possible to date them and often identify them.",
  },
  luces_tierra: {
    es: "Luces en tierra: un faro o reflector, una bengala o fuegos artificiales, los faros de un vehículo. La fuente estaba en el suelo o cerca de él, y la distancia o el relieve la hicieron parecer otra cosa.",
    en: "Ground lights: a beacon or searchlight, a flare or fireworks, a vehicle's headlights. The source was on or near the ground, and distance or terrain made it look like something else.",
  },
  terrestre_otros: {
    es: "Un objeto convencional no precisado: el análisis inclina a algo ordinario —un reflejo, un error perceptual— pero la evidencia no fija de qué clase de objeto se trata.",
    en: "A conventional object, not pinned down: the analysis leans toward something ordinary —a reflection, a perceptual error— but the evidence does not fix what class of object it was.",
  },
  natural: {
    es: "Fenómeno natural genuino poco entendido: atmosférico (plasma, rayo en bola, nubes) u óptico (espejismo, refracción). Física real, no una nave ni un engaño. Los meteoros y bólidos se cuentan como objeto astronómico.",
    en: "A genuine, poorly-understood natural phenomenon: atmospheric (plasma, ball lightning, clouds) or optical (mirage, refraction). Real physics, not a craft or a hoax. Meteors and fireballs are counted as astronomical objects.",
  },
  fraude: {
    es: "Posible engaño deliberado: montaje, fabricación o hoax. La clasificación señala el candidato más plausible, no un veredicto cerrado.",
    en: "Possible deliberate deception: staging, fabrication or hoax. The classification flags the most plausible candidate, not a closed verdict.",
  },
  humana_clasificada: {
    es: "Programa secreto propio o aliado (el encubrimiento es intrínseco). Antigua hipótesis «programas clasificados».",
    en: "A secret own or allied program (cover-up is intrinsic). Former 'classified programs' hypothesis.",
  },
  adversaria: {
    es: "Tecnología de vigilancia de otro Estado. Antigua hipótesis «tecnología adversaria».",
    en: "Another state's surveillance technology. Former 'adversary technology' hypothesis.",
  },
  nohumano: {
    es: "Inteligencia o tecnología no humana — ya sea que un Estado la controle u oculte (ingeniería inversa, tratado) o que nadie la controle (tipo Vallée, interdimensional / ontológico).",
    en: "Non-human intelligence or technology — whether a state controls or hides it (reverse-engineering, treaty) or no one controls it (Vallée-style, interdimensional / ontological).",
  },
  indet: {
    es: "Indeterminado — la evidencia no inclina hacia ninguna narrativa: incidentes inconclusos. No es una explicación, es la ausencia honesta de una.",
    en: "Indeterminate — the evidence leans toward no narrative: inconclusive incidents. It is not an explanation but the honest absence of one.",
  },
};

export default function ProbabilidadesPage() {
  return <ProbabilidadesView locale="en" />;
}

export function ProbabilidadesView({ locale }: { locale: "es" | "en" }) {
  // Solo los INCIDENTES, por la naturaleza del objeto. Los casos-documento son
  // evidencia, no sucesos: se listan en /cases pero no entran en ningún agregado.
  // Los incidentes que no se pueden decidir caen en «Indeterminado» (keepIndet),
  // una narrativa MECE del mismo eje. Mismo conjunto que la home, /cases y /calidad.
  const scored = corpusPosteriors();
  const incidents = scored.length;
  const docCount = cases.filter((c) => c.category === "document").length;

  // Conjunto expandido de narrativas (mundano abierto en 3 sub-tipos, no-humano
  // consolidado, «Indeterminado» conservado), clasificación forzada. Por masa.
  const hypRows = expandedHypotheses(scored, { consolidateNonHuman: true, keepIndet: true });

  // Nº de casos donde cada narrativa es la explicación modal (misma lógica que
  // el filtro de /cases). Solo necesitamos el conteo: el listado vive en /cases.
  // En la misma pasada, el desglose de SEGUNDO nivel (`objectDetail`) de cada
  // clase prosaica, también modal: qué objeto concreto era, o «sin precisar».
  const modalCount: Record<string, number> = {};
  const detailCount: Record<string, Record<string, number>> = {};
  for (const r of hypRows) modalCount[r.key] = 0;
  for (const s of scored) {
    const m = modalHypothesis(s, { consolidateNonHuman: true, keepIndet: true });
    modalCount[m.key] = (modalCount[m.key] ?? 0) + 1;
    if (OBJECT_DETAILS[m.key as ProsaicKey]) {
      const d = (detailCount[m.key] ??= {});
      const k = OBJECT_DETAILS[m.key as ProsaicKey]!.some((x) => x.key === s.objectDetail)
        ? s.objectDetail!
        : DETAIL_UNSPECIFIED.key;
      d[k] = (d[k] ?? 0) + 1;
    }
  }
  const PROSAIC_KEYS = new Set<string>(PROSAIC_CLASSES.map((c) => c.key));
  const prosaicShown = hypRows.filter((r) => PROSAIC_KEYS.has(r.key)).length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <Eyebrow>
        <T es="Probabilidades · modelo comparable" en="Probabilities · comparable model" locale={locale} />
      </Eyebrow>
      <H1>
        <T es="Qué explica el corpus" en="What the corpus explains" locale={locale} />
      </H1>
      <Lede>
        <T
          es={`Los ${incidents} incidentes del corpus se clasifican, cada uno, en una narrativa según la naturaleza del objeto. Lo prosaico se nombra por lo que era —objeto astronómico, aeronave, objeto espacial, luces en tierra—, más fenómeno natural y posible fraude; «no-humano» agrupa encubierto + abierto. Los incidentes inconclusos caen en «Indeterminado». Los ${docCount} casos-documento del archivo no entran: son evidencia de los sucesos, no sucesos. Sumadas, las narrativas reparten los incidentes de forma comparable: se puede decir cuál da cuenta de más casos.`}
          en={`The corpus's ${incidents} incidents are each classified into one narrative by the nature of the object. The prosaic is named by what it was —astronomical object, aircraft, space object, ground lights—, plus natural phenomenon and possible hoax; 'non-human' groups covert + open. Inconclusive incidents fall into 'Indeterminate'. The archive's ${docCount} document cases are left out: they are evidence of the events, not events. Summed, the narratives partition the incidents comparably: one can say which accounts for more cases.`}
          locale={locale}
        />
      </Lede>

      <section className="mt-12">
        <H2>
          <T es="Las hipótesis del corpus" en="The corpus hypotheses" locale={locale} />
        </H2>
        <Caption>
          <T
            es={`El centro marca el total de incidentes (${incidents}), cada uno en su narrativa más probable, y «Indeterminado» para lo que no se puede decidir. Clasificación forzada y navegable.`}
            en={`The center marks the total of incidents (${incidents}), each in its most probable narrative, and 'Indeterminate' for what cannot be decided. Forced, navigable classification.`}
            locale={locale}
          />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <MecePartition
            items={scored}
            keepIndet
            consolidateNonHuman
            locale={locale}
            hrefFor={(key) => `#hyp-${key}`}
            totalLabelEs={`Suman 100% · ${incidents} incidentes · mundano abierto en ${prosaicShown} · no-humano agrupado · Indeterminado aparte`}
            totalLabelEn={`Sum to 100% · ${incidents} incidents · mundane opened into ${prosaicShown} · non-human grouped · Indeterminate separate`}
          />
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="La heterogeneidad en el tiempo" en="Heterogeneity over time" locale={locale} />
        </H2>
        <Caption>
          <T
            es="El donut de arriba es el snapshot agregado. Esta serie le añade el eje temporal: cuánto de cada década resiste explicación mundana. El repunte de los 2020s coincide con el ciclo de divulgación."
            en="The donut above is the aggregate snapshot. This series adds the time axis: how much of each decade resists a mundane explanation. The 2020s uptick coincides with the disclosure cycle."
            locale={locale}
          />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <HeterogeneityByDecade locale={locale} />
        </div>
      </section>

      <div className="mt-12">
        <AnalyzerCta locale={locale} />
      </div>

      <section className="mt-16">
        <H2>
          <T es="Las hipótesis, una por una" en="The hypotheses, one by one" locale={locale} />
        </H2>
        <Caption>
          <T
            es="Qué significa cada una y qué hipótesis del marco anterior preserva. Las clases prosaicas se abren en su detalle —qué objeto concreto era—, con «sin precisar» para los casos en que la evidencia fija la clase pero no el objeto. Cada bloque enlaza al listado de casos donde es la explicación más probable, ya filtrado."
            en="What each means and which prior-framework hypothesis it preserves. The prosaic classes open into their detail —which specific object it was—, with 'not specified' for cases where the evidence fixes the class but not the object. Each block links to the list of cases where it is the most probable explanation, pre-filtered."
            locale={locale}
          />
        </Caption>

        <div className="mt-8 space-y-10">
          {hypRows.map((c) => {
            const total = modalCount[c.key] ?? 0;
            return (
              <div key={c.key} id={`hyp-${c.key}`} className="scroll-mt-24">
                {/* Cabecera: barra de color de la hipótesis + nombre + nº de casos */}
                <div
                  className="flex items-baseline justify-between gap-3 border-b-2 pb-2"
                  style={{ borderColor: c.color }}
                >
                  <h3 className="font-mono text-sm font-medium uppercase tracking-wider text-text">
                    <T es={c.label} en={c.labelEn} locale={locale} />
                  </h3>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {total} <T es="casos" en="cases" locale={locale} />
                  </span>
                </div>

                <Body className="mt-3 text-sm leading-relaxed text-muted">
                  <T es={BLURB[c.key].es} en={BLURB[c.key].en} locale={locale} />
                </Body>

                {/* Segundo nivel: detalle del objeto dentro de la clase (modal). */}
                {total > 0 && OBJECT_DETAILS[c.key as ProsaicKey] && (
                  <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    {[...OBJECT_DETAILS[c.key as ProsaicKey]!, DETAIL_UNSPECIFIED].map((d) => (
                      <li key={d.key} className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1 font-mono text-[11px]">
                        <span className="text-text">
                          <T es={d.label} en={d.labelEn} locale={locale} />
                        </span>
                        <span className="tabular-nums text-muted">{detailCount[c.key]?.[d.key] ?? 0}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {total > 0 && (
                  <LocaleLink
                    href={`/cases/#${c.key}`}
                    className="group mt-4 inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-widest text-text underline-offset-4 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="group-hover:underline">
                      <T es={`Ver los ${total} casos`} en={`See the ${total} cases`} locale={locale} />
                    </span>
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                  </LocaleLink>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA: explorar el corpus completo */}
        <div className="mt-12 border-t border-border pt-6">
          <LocaleLink
            href="/cases"
            className="group inline-flex min-h-[44px] items-center gap-2 border-2 border-text px-5 font-display text-base font-medium text-text hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T es="Explorar los casos en orden cronológico" en="Explore the cases in chronological order" locale={locale} />
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </LocaleLink>
        </div>
      </section>

      <section className="mt-16 border-t border-border pt-6">
        <H2>
          <T es="Honestidad del modelo" en="Model honesty" locale={locale} />
        </H2>
        <Body className="mt-2 text-sm text-muted">
          <T
            es="Los posteriores por caso son juicios analíticos estructurados, no frecuencias calibradas empíricamente: comparabilidad no es lo mismo que verdad. El modelo dice qué explicación es más coherente con el análisis de cada caso, no cuál es objetivamente correcta. Hay dos maneras de agregar el corpus, y ambas cubren los mismos incidentes —los casos-documento no entran: son evidencia, no sucesos—. El «nº esperado de casos por explicación» (la suma de las probabilidades de cada narrativa) es lineal y comparable, válido aunque los casos estén correlacionados, y reparte la masa «indeterminable» de forma fraccional: se muestra en /calidad. El conteo por hipótesis modal asigna cada caso —clasificación forzada— a su narrativa más probable, conservando «Indeterminado» como narrativa propia para lo que no se puede decidir; el gráfico de arriba y los enlaces a los casos usan este último: conteos enteros y navegables, coherentes con el filtro de «/cases». Las dos vistas dan cifras algo distintas porque son estimadores distintos (esperado vs modal), no porque se contradigan. La distribución completa de cada caso —con su masa de incertidumbre repartida entre las narrativas que apoya— vive en el detalle del caso."
            en="Per-case posteriors are structured analytical judgments, not empirically calibrated frequencies: comparability is not the same as truth. The model says which explanation is most coherent with each case's analysis, not which is objectively correct. There are two ways to aggregate the corpus, and both cover the same incidents —document cases are left out: they are evidence, not events. The 'expected number of cases per explanation' (the sum of each narrative's probabilities) is linear and comparable, holding even if cases are correlated, and it spreads the 'indeterminable' mass fractionally: it is shown on /calidad. The modal-hypothesis count assigns each case —forced classification— to its single most probable narrative, keeping 'Indeterminate' as its own narrative for what cannot be decided; the chart above and the links to the cases use the latter: integer, navigable counts, consistent with the '/cases' filter. The two views give slightly different figures because they are different estimators (expected vs modal), not because they contradict each other. Each case's full distribution —with its uncertainty mass spread across the narratives it supports— lives in the case detail."
            locale={locale}
          />
        </Body>
        <Body className="mt-4 text-sm text-muted">
          <T
            es="Dos ejes independientes, fácil de confundir: el «tier» (S/A/B) mide la fuerza de la evidencia —cuán difícil es descartar el caso—, mientras que esta partición de explicaciones mide qué fue. No son lo mismo: un caso bien documentado (Tier S o A) puede tener como explicación más plausible un posible fraude, y un caso de evidencia limitada (Tier B) no es, por eso, un fraude. De hecho, los casos clasificados como posible fraude se reparten por igual entre Tier A y Tier B."
            en="Two independent axes, easy to confuse: the «tier» (S/A/B) measures the strength of the evidence —how hard the case is to dismiss— while this partition of explanations measures what it was. They are not the same: a well-documented case (Tier S or A) can have a possible hoax as its most plausible explanation, and a case with limited evidence (Tier B) is not, for that reason, a hoax. In fact, the cases classified as possible hoax split evenly between Tier A and Tier B."
            locale={locale}
          />
        </Body>
      </section>
    </main>
  );
}
