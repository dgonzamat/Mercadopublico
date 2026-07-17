import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { corpusPosteriors, documentPosteriors, expandedHypotheses, modalHypothesis } from "@/lib/meceModel";
import { AnalyzerCta } from "@/components/AnalyzerCta";

export const metadata = {
  ...pageMeta({
  title: "Probabilidades por explicación (modelo MECE)",
  description:
    "Seis narrativas mutuamente excluyentes (objeto + postura institucional): cada caso UAP reparte el 100% y el corpus las agrega de forma comparable (modelo MECE).",
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
};

export default function ProbabilidadesPage() {
  // SOLO casos de incidente: la partición «qué era el objeto» no aplica a los
  // casos-documento, que se excluyen (canon CLAUDE.md). Denominador unificado en
  // 248 con la home, /cases y /calidad. Los documentos se cuentan aparte.
  const scored = corpusPosteriors();
  const docCount = documentPosteriors().length;

  // Conjunto expandido de hipótesis (mundano abierto en 3 sub-tipos, no-humano
  // consolidado), clasificación forzada. Ordenado por masa.
  const hypRows = expandedHypotheses(scored, { consolidateNonHuman: true });

  // Nº de casos donde cada hipótesis es la explicación modal (misma lógica que
  // el filtro de /cases). Solo necesitamos el conteo: el listado vive en /cases.
  const modalCount: Record<string, number> = {};
  for (const r of hypRows) modalCount[r.key] = 0;
  for (const s of scored) {
    const m = modalHypothesis(s, { consolidateNonHuman: true });
    modalCount[m.key] = (modalCount[m.key] ?? 0) + 1;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <Eyebrow>
        <T es="Probabilidades · modelo comparable" en="Probabilities · comparable model" />
      </Eyebrow>
      <H1>
        <T es="Qué explica el corpus" en="What the corpus explains" />
      </H1>
      <Lede>
        <T
          es={`Los ${scored.length} casos de incidente se clasifican, cada uno, en una hipótesis por la naturaleza del objeto. Es una clasificación forzada: ningún caso queda en «indeterminable». Lo prosaico se abre en tres hipótesis propias —misidentificación, fenómeno natural y posible fraude— y «no-humano» agrupa encubierto + abierto. Sumadas, reparten los incidentes de forma comparable: se puede decir qué hipótesis da cuenta de más casos. Los ${docCount} casos-documento no reciben hipótesis —la partición «qué era el objeto» no les aplica—: aparecen como una porción aparte del donut, para que el centro marque el total del corpus, y se exploran en /cases.`}
          en={`The ${scored.length} incident cases are each classified into one hypothesis by the nature of the object. It is a forced classification: no case rests in 'indeterminable'. The prosaic opens into three hypotheses of its own —misidentification, natural phenomenon and possible hoax— and 'non-human' groups covert + open. Summed, they partition the incidents comparably: one can say which hypothesis accounts for more cases. The ${docCount} document cases get no hypothesis —the 'what was the object' partition does not apply to them—: they appear as a separate slice of the donut, so the center marks the corpus total, and are explored in /cases.`}
        />
      </Lede>

      <section className="mt-12">
        <H2>
          <T es="Las hipótesis del corpus" en="The corpus hypotheses" />
        </H2>
        <Caption>
          <T
            es={`El centro marca el total del corpus (${scored.length + docCount}): ${scored.length} incidentes clasificados por hipótesis (forzada, sin indeterminable) + ${docCount} casos-documento aparte, sin clasificar por objeto.`}
            en={`The center marks the corpus total (${scored.length + docCount}): ${scored.length} incidents classified by hypothesis (forced, no indeterminable) + ${docCount} document cases counted separately, not classified by object.`}
          />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <MecePartition
            items={scored}
            documentCount={docCount}
            consolidateNonHuman
            hrefFor={(key) => `#hyp-${key}`}
            totalLabelEs={`Suman 100% · ${scored.length + docCount} del corpus · ${scored.length} incidentes por hipótesis + ${docCount} documentos`}
            totalLabelEn={`Sum to 100% · ${scored.length + docCount} of the corpus · ${scored.length} incidents by hypothesis + ${docCount} documents`}
          />
        </div>
      </section>

      <div className="mt-12">
        <AnalyzerCta />
      </div>

      <section className="mt-16">
        <H2>
          <T es="Las hipótesis, una por una" en="The hypotheses, one by one" />
        </H2>
        <Caption>
          <T
            es="Qué significa cada una y qué hipótesis del marco anterior preserva. Cada bloque enlaza al listado de casos donde es la explicación más probable, ya filtrado."
            en="What each means and which prior-framework hypothesis it preserves. Each block links to the list of cases where it is the most probable explanation, pre-filtered."
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
                    <T es={c.label} en={c.labelEn} />
                  </h3>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {total} <T es="casos" en="cases" />
                  </span>
                </div>

                <Body className="mt-3 text-sm leading-relaxed text-muted">
                  <T es={BLURB[c.key].es} en={BLURB[c.key].en} />
                </Body>

                {total > 0 && (
                  <LocaleLink
                    href={`/cases/#${c.key}`}
                    className="group mt-4 inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-widest text-text underline-offset-4 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="group-hover:underline">
                      <T es={`Ver los ${total} casos`} en={`See the ${total} cases`} />
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
            <T es="Explorar los casos en orden cronológico" en="Explore the cases in chronological order" />
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </LocaleLink>
        </div>
      </section>

      <section className="mt-16 border-t border-border pt-6">
        <H2>
          <T es="Honestidad del modelo" en="Model honesty" />
        </H2>
        <Body className="mt-2 text-sm text-muted">
          <T
            es="Los posteriores por caso son juicios analíticos estructurados, no frecuencias calibradas empíricamente: comparabilidad no es lo mismo que verdad. El modelo dice qué explicación es más coherente con el análisis de cada caso, no cuál es objetivamente correcta. Hay dos maneras de agregar el corpus, y ambas usan el mismo conjunto de casos de incidente (los casos-documento se excluyen: la partición «qué era el objeto» no les aplica). El «nº esperado de casos por explicación» (la suma de las probabilidades de cada narrativa) es lineal y comparable, válido aunque los casos estén correlacionados, y conserva la masa «indeterminable»: se muestra en /calidad. El conteo por hipótesis modal asigna cada caso —clasificación forzada, sin «indeterminable»— a su narrativa más probable; el gráfico de arriba y los enlaces a los casos usan este último: conteos enteros y navegables, coherentes con el filtro de «/cases». Las dos vistas dan cifras distintas porque son estimadores distintos, no porque se contradigan. La distribución completa de cada caso —con su masa de incertidumbre repartida entre las narrativas que apoya— vive en el detalle del caso."
            en="Per-case posteriors are structured analytical judgments, not empirically calibrated frequencies: comparability is not the same as truth. The model says which explanation is most coherent with each case's analysis, not which is objectively correct. There are two ways to aggregate the corpus, and both use the same set of incident cases (document cases are excluded: the 'what was the object' partition does not apply to them). The 'expected number of cases per explanation' (the sum of each narrative's probabilities) is linear and comparable, holding even if cases are correlated, and it keeps the 'indeterminable' mass: it is shown on /calidad. The modal-hypothesis count assigns each case —forced classification, no 'indeterminable'— to its single most probable narrative; the chart above and the links to the cases use the latter: integer, navigable counts, consistent with the '/cases' filter. The two views give different figures because they are different estimators, not because they contradict each other. Each case's full distribution —with its uncertainty mass spread across the narratives it supports— lives in the case detail."
          />
        </Body>
        <Body className="mt-4 text-sm text-muted">
          <T
            es="Dos ejes independientes, fácil de confundir: el «tier» (S/A/B) mide la fuerza de la evidencia —cuán difícil es descartar el caso—, mientras que esta partición de explicaciones mide qué fue. No son lo mismo: un caso bien documentado (Tier S o A) puede tener como explicación más plausible un posible fraude, y un caso de evidencia limitada (Tier B) no es, por eso, un fraude. De hecho, los casos clasificados como posible fraude se reparten por igual entre Tier A y Tier B."
            en="Two independent axes, easy to confuse: the «tier» (S/A/B) measures the strength of the evidence —how hard the case is to dismiss— while this partition of explanations measures what it was. They are not the same: a well-documented case (Tier S or A) can have a possible hoax as its most plausible explanation, and a case with limited evidence (Tier B) is not, for that reason, a hoax. In fact, the cases classified as possible hoax split evenly between Tier A and Tier B."
          />
        </Body>
      </section>
    </main>
  );
}
