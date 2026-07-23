import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { HeterogeneityByDecade } from "@/components/HeterogeneityByDecade";
import { corpusPosteriors, documentPosteriors, expandedHypotheses, modalHypothesis, MISID_SUBTYPES } from "@/lib/meceModel";
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
  misid: {
    es: "Misidentificación de un objeto conocido (avión, globo, satélite, planeta, dron) o error perceptual / ilusión. Error humano sobre algo ordinario.",
    en: "Misidentification of a known object (aircraft, balloon, satellite, planet, drone) or perceptual error / illusion. Human error about something ordinary.",
  },
  natural: {
    es: "Fenómeno natural genuino poco entendido: plasma atmosférico, rayo en bola, bólido / meteoro, óptica atmosférica. Física real, no una nave ni un engaño.",
    en: "A genuine, poorly-understood natural phenomenon: atmospheric plasma, ball lightning, bolide / meteor, atmospheric optics. Real physics, not a craft or a hoax.",
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
    es: "Indeterminado — la evidencia no inclina hacia ninguna narrativa: incidentes inconclusos y casos-documento cuyo contenido no marca una dirección clara. No es una explicación, es la ausencia honesta de una.",
    en: "Indeterminate — the evidence leans toward no narrative: inconclusive incidents and document cases whose content points in no clear direction. It is not an explanation but the honest absence of one.",
  },
};

export default function ProbabilidadesPage() {
  return <ProbabilidadesView locale="en" />;
}

export function ProbabilidadesView({ locale }: { locale: "es" | "en" }) {
  // El CORPUS COMPLETO: incidentes por la naturaleza del objeto + casos-documento
  // por la inclinación (lean) de su contenido. Los que no se pueden decidir caen
  // en «Indeterminado» (keepIndet), una narrativa MECE del mismo eje. Denominador
  // unificado en STATS.cases con la home, /cases y /calidad.
  const scored = [...corpusPosteriors(), ...documentPosteriors()];
  const incidents = corpusPosteriors().length;
  const docCount = documentPosteriors().length;

  // Conjunto expandido de narrativas (mundano abierto en 3 sub-tipos, no-humano
  // consolidado, «Indeterminado» conservado), clasificación forzada. Por masa.
  const hypRows = expandedHypotheses(scored, { consolidateNonHuman: true, keepIndet: true });

  // Nº de casos donde cada narrativa es la explicación modal (misma lógica que
  // el filtro de /cases). Solo necesitamos el conteo: el listado vive en /cases.
  const modalCount: Record<string, number> = {};
  for (const r of hypRows) modalCount[r.key] = 0;
  for (const s of scored) {
    const m = modalHypothesis(s, { consolidateNonHuman: true, keepIndet: true });
    modalCount[m.key] = (modalCount[m.key] ?? 0) + 1;
  }

  // Drill-down bajo «Misidentificación» (capa 2, MECE dentro de misid): con qué
  // objeto conocido se confundió cada INCIDENTE misid. Los documentos no llevan
  // subtipo. El bucket mayoritario («sin objeto único») se rotula con honestidad.
  const misidSub = MISID_SUBTYPES.map((s) => ({
    ...s,
    count: cases.filter((c) => c.category !== "document" && c.misidSubtype === s.key).length,
  })).sort((a, b) => b.count - a.count);
  const misidSubTotal = misidSub.reduce((a, s) => a + s.count, 0);

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
          es={`Los ${scored.length} casos del corpus se clasifican, cada uno, en una narrativa: los ${incidents} incidentes por la naturaleza del objeto y los ${docCount} casos-documento por la inclinación de su contenido. Lo prosaico se abre en tres narrativas propias —misidentificación, fenómeno natural y posible fraude— y «no-humano» agrupa encubierto + abierto. Lo que no se puede decidir —incidentes inconclusos, documentos sin dirección clara— cae en «Indeterminado». Sumadas, reparten el corpus de forma comparable: se puede decir qué narrativa da cuenta de más casos.`}
          en={`The corpus's ${scored.length} cases are each classified into one narrative: the ${incidents} incidents by the nature of the object and the ${docCount} document cases by their content's lean. The prosaic opens into three narratives of its own —misidentification, natural phenomenon and possible hoax— and 'non-human' groups covert + open. Whatever cannot be decided —inconclusive incidents, documents with no clear direction— falls into 'Indeterminate'. Summed, they partition the corpus comparably: one can say which narrative accounts for more cases.`}
          locale={locale}
        />
      </Lede>

      <section className="mt-12">
        <H2>
          <T es="Las hipótesis del corpus" en="The corpus hypotheses" locale={locale} />
        </H2>
        <Caption>
          <T
            es={`El centro marca el total del corpus (${scored.length}): ${incidents} incidentes por su objeto + ${docCount} casos-documento por su lean, y «Indeterminado» para lo que no se puede decidir. Clasificación forzada y navegable.`}
            en={`The center marks the corpus total (${scored.length}): ${incidents} incidents by their object + ${docCount} document cases by their lean, and 'Indeterminate' for what cannot be decided. Forced, navigable classification.`}
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
            totalLabelEs={`Suman 100% · ${scored.length} casos del corpus · mundano abierto en 3 · no-humano agrupado · Indeterminado aparte`}
            totalLabelEn={`Sum to 100% · ${scored.length} corpus cases · mundane opened into 3 · non-human grouped · Indeterminate separate`}
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
            es="Qué significa cada una y qué hipótesis del marco anterior preserva. Cada bloque enlaza al listado de casos donde es la explicación más probable, ya filtrado."
            en="What each means and which prior-framework hypothesis it preserves. Each block links to the list of cases where it is the most probable explanation, pre-filtered."
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

                {c.key === "misid" && misidSubTotal > 0 && (
                  <div className="mt-4 rounded-sm border border-border bg-panel/60 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                      <T
                        es={`¿Con qué se confundió? · ${misidSubTotal} incidentes`}
                        en={`Mistaken for what? · ${misidSubTotal} incidents`}
                        locale={locale}
                      />
                    </p>
                    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full">
                      {misidSub.filter((s) => s.count > 0).map((s) => (
                        <div
                          key={s.key}
                          title={`${s.label}: ${s.count}`}
                          style={{ width: `${(s.count / misidSubTotal) * 100}%`, backgroundColor: s.color }}
                        />
                      ))}
                    </div>
                    <ul className="mt-3 space-y-1">
                      {misidSub.map((s) => (
                        <li key={s.key} className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                          <span className="flex items-center gap-1.5 text-text">
                            <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: s.color }} />
                            <T es={s.label} en={s.labelEn} locale={locale} />
                          </span>
                          <span className="tabular-nums text-muted">
                            {s.count} · {Math.round((s.count / misidSubTotal) * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 font-mono text-[10px] leading-snug text-muted/80">
                      <T
                        es="Solo incidentes; los casos-documento misid no se sub-clasifican. «Sin objeto único» = el análisis inclina a lo prosaico pero no fija un objeto concreto (luz difusa, faro, o explicación mundana no determinada)."
                        en="Incidents only; misid document-cases are not sub-classified. 'No single object' = the analysis leans prosaic but pins no specific object (diffuse light, lighthouse, or an undetermined mundane explanation)."
                        locale={locale}
                      />
                    </p>
                  </div>
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
            es="Los posteriores por caso son juicios analíticos estructurados, no frecuencias calibradas empíricamente: comparabilidad no es lo mismo que verdad. El modelo dice qué explicación es más coherente con el análisis de cada caso, no cuál es objetivamente correcta. Hay dos maneras de agregar el corpus, y ambas cubren los mismos casos —incidentes por su objeto, casos-documento por el lean de su contenido—. El «nº esperado de casos por explicación» (la suma de las probabilidades de cada narrativa) es lineal y comparable, válido aunque los casos estén correlacionados, y reparte la masa «indeterminable» de forma fraccional: se muestra en /calidad. El conteo por hipótesis modal asigna cada caso —clasificación forzada— a su narrativa más probable, conservando «Indeterminado» como narrativa propia para lo que no se puede decidir; el gráfico de arriba y los enlaces a los casos usan este último: conteos enteros y navegables, coherentes con el filtro de «/cases». Las dos vistas dan cifras algo distintas porque son estimadores distintos (esperado vs modal), no porque se contradigan. La distribución completa de cada caso —con su masa de incertidumbre repartida entre las narrativas que apoya— vive en el detalle del caso."
            en="Per-case posteriors are structured analytical judgments, not empirically calibrated frequencies: comparability is not the same as truth. The model says which explanation is most coherent with each case's analysis, not which is objectively correct. There are two ways to aggregate the corpus, and both cover the same cases —incidents by their object, document cases by their content's lean. The 'expected number of cases per explanation' (the sum of each narrative's probabilities) is linear and comparable, holding even if cases are correlated, and it spreads the 'indeterminable' mass fractionally: it is shown on /calidad. The modal-hypothesis count assigns each case —forced classification— to its single most probable narrative, keeping 'Indeterminate' as its own narrative for what cannot be decided; the chart above and the links to the cases use the latter: integer, navigable counts, consistent with the '/cases' filter. The two views give slightly different figures because they are different estimators (expected vs modal), not because they contradict each other. Each case's full distribution —with its uncertainty mass spread across the narratives it supports— lives in the case detail."
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
