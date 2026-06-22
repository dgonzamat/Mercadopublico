import Link from "next/link";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { corpusPosteriors, documentPosteriors, expandedHypotheses, modalHypothesis } from "@/lib/meceModel";
import { STATS } from "@/lib/siteStats";

export const metadata = {
  title: "Probabilidades por explicación (modelo MECE)",
  description:
    "Distribución comparable sobre narrativas mutuamente excluyentes (objeto + postura institucional): cada caso reparte 100% entre seis narrativas; el corpus las reparte de forma comparable. Preserva las hipótesis del marco anterior.",
  alternates: { canonical: "/probabilidades/" },
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
  const scored = corpusPosteriors();
  const docScored = documentPosteriors();
  const allScored = [...scored, ...docScored];

  // Conjunto expandido de hipótesis (mundano abierto en 3 sub-tipos, no-humano
  // consolidado), clasificación forzada. Ordenado por masa.
  const hypRows = expandedHypotheses(allScored, { consolidateNonHuman: true });

  type ModalCase = { id: string; name: string; tier: string; p: number };
  const casesByModal: Record<string, ModalCase[]> = {};
  for (const r of hypRows) casesByModal[r.key] = [];
  for (const s of allScored) {
    const m = modalHypothesis(s, { consolidateNonHuman: true });
    (casesByModal[m.key] ??= []).push({ id: s.id, name: s.name, tier: s.tier, p: m.count });
  }
  for (const k of Object.keys(casesByModal)) casesByModal[k].sort((a, b) => b.p - a.p);

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
          es={`Las ${STATS.cases} piezas del corpus se clasifican, cada una, en una hipótesis (los casos de incidente por la naturaleza del objeto; los casos-documento por el lean evidencial de su contenido). Es una clasificación forzada: ningún caso queda en «indeterminable». Lo prosaico se abre en tres hipótesis propias —misidentificación, fenómeno natural y posible fraude— y «no-humano» agrupa encubierto + abierto. Sumadas, reparten el corpus de forma comparable: se puede decir qué hipótesis da cuenta de más casos.`}
          en={`The corpus's ${STATS.cases} pieces are each classified into one hypothesis (incident cases by the nature of the object; document cases by the evidential lean of their content). It is a forced classification: no case rests in 'indeterminable'. The prosaic opens into three hypotheses of its own —misidentification, natural phenomenon and possible hoax— and 'non-human' groups covert + open. Summed, they partition the corpus comparably: one can say which hypothesis accounts for more cases.`}
        />
      </Lede>

      <section className="mt-12">
        <H2>
          <T es="Las hipótesis del corpus" en="The corpus hypotheses" />
        </H2>
        <Caption>
          <T
            es={`Las ${STATS.cases} piezas del corpus, clasificadas. Clasificación forzada, sin indeterminable.`}
            en={`All ${STATS.cases} corpus pieces, classified. Forced classification, no indeterminable.`}
          />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <MecePartition
            items={allScored}
            consolidateNonHuman
            hrefFor={(key) => `#hyp-${key}`}
            totalLabelEs={`Suman 100% · ${allScored.length} casos · mundano abierto en 3 · no-humano agrupado`}
            totalLabelEn={`Sum to 100% · ${allScored.length} cases · mundane opened into 3 · non-human grouped`}
          />
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="Las hipótesis, una por una" en="The hypotheses, one by one" />
        </H2>
        <Caption>
          <T
            es="Qué significa cada una, qué hipótesis del marco anterior preserva, y los casos donde es la explicación más probable."
            en="What each means, which prior-framework hypothesis it preserves, and the cases where it is the most probable explanation."
          />
        </Caption>
        <div className="mt-6 space-y-8">
          {hypRows.map((c) => {
            const top = casesByModal[c.key].slice(0, 6);
            return (
              <div key={c.key} id={`hyp-${c.key}`} className="scroll-mt-24 border-l-4 pl-4" style={{ borderColor: c.color }}>
                <h3 className="font-mono text-sm uppercase tracking-wider text-text">
                  <T es={c.label} en={c.labelEn} />
                  <span className="ml-2 font-normal text-muted">
                    · {casesByModal[c.key].length} <T es="casos modales" en="modal cases" />
                  </span>
                </h3>
                <Body className="mt-1 text-sm text-muted">
                  <T es={BLURB[c.key].es} en={BLURB[c.key].en} />
                </Body>
                {top.length > 0 && (
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    {top.map((t, i) => (
                      <span key={t.id}>
                        {i > 0 && " · "}
                        <Link href={`/cases/${t.id}`} className="hover:text-accent hover:underline">
                          {t.name}
                        </Link>{" "}
                        ({(t.p * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-16 border-t border-border pt-6">
        <H2>
          <T es="Honestidad del modelo" en="Model honesty" />
        </H2>
        <Body className="mt-2 text-sm text-muted">
          <T
            es="Los posteriores por caso son juicios analíticos estructurados, no frecuencias calibradas empíricamente: comparabilidad no es lo mismo que verdad. El modelo dice qué explicación es más coherente con el análisis de cada caso, no cuál es objetivamente correcta. El agregado «nº esperado de casos por explicación» es lineal, así que es válido aunque los casos estén correlacionados. Esta vista usa clasificación forzada: la masa de incertidumbre de cada caso (la antigua «indeterminable») se reparte entre las narrativas que el caso efectivamente apoya, de modo que ningún caso queda sin clasificar. Para los incidentes el posterior mide la naturaleza del objeto; para los casos-documento, el lean evidencial de su contenido. La incertidumbre subyacente sigue en el análisis de cada caso; aquí se compromete a la lectura más sostenida."
            en="Per-case posteriors are structured analytical judgments, not empirically calibrated frequencies: comparability is not the same as truth. The model says which explanation is most coherent with each case's analysis, not which is objectively correct. The 'expected number of cases per explanation' aggregate is linear, so it holds even if cases are correlated. This view uses forced classification: each case's uncertainty mass (the former 'indeterminable') is spread across the narratives the case actually supports, so no case is left unclassified. For incidents the posterior measures the nature of the object; for document cases, the evidential lean of their content. The underlying uncertainty still lives in each case's analysis; here it is committed to the best-supported reading."
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
