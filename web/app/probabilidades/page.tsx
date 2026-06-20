import Link from "next/link";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { MECE_CLASSES, corpusPosteriors, documentPosteriors, modal } from "@/lib/meceModel";
import { STATS } from "@/lib/siteStats";
import type { MeceClassId } from "@/lib/types";

export const metadata = {
  title: "Probabilidades por explicación (modelo MECE)",
  description:
    "Distribución comparable sobre narrativas mutuamente excluyentes (objeto + postura institucional): cada caso reparte 100% entre seis narrativas; el corpus las reparte de forma comparable. Preserva las hipótesis del marco anterior.",
  alternates: { canonical: "/probabilidades/" },
};

/** Qué significa cada clase (y qué hipótesis del marco anterior preserva). */
const BLURB: Record<MeceClassId, { es: string; en: string }> = {
  mundano_natural: {
    es: "Objeto conocido, ilusión, error o fraude, o un fenómeno natural. Sin anomalía ni encubrimiento. Absorbe «misidentificación» y «fenómenos naturales».",
    en: "Known object, illusion, error or hoax, or a natural phenomenon. No anomaly, no cover-up. Absorbs 'misidentification' and 'natural phenomena'.",
  },
  humana_clasificada: {
    es: "Programa secreto propio o aliado (el encubrimiento es intrínseco). Antigua hipótesis «programas clasificados».",
    en: "A secret own or allied program (cover-up is intrinsic). Former 'classified programs' hypothesis.",
  },
  adversaria: {
    es: "Tecnología de vigilancia de otro Estado. Antigua hipótesis «tecnología adversaria».",
    en: "Another state's surveillance technology. Former 'adversary technology' hypothesis.",
  },
  nohumano_encubierto: {
    es: "Inteligencia o tecnología no humana que un Estado conoce, controla u oculta — incluye ingeniería inversa y la narrativa de tratado. Es la combinación «no-humano + ocultación militar» como clase propia.",
    en: "Non-human intelligence or technology that a state knows, controls or hides — includes reverse-engineering and the treaty narrative. The 'non-human + military cover-up' combination as its own class.",
  },
  nohumano_abierto: {
    es: "Fenómeno genuinamente no humano que ninguna institución controla ni oculta (el «sistema de control» tipo Vallée; interdimensional / ontológico).",
    en: "A genuinely non-human phenomenon that no institution controls or hides (the Vallée-style 'control system'; interdimensional / ontological).",
  },
  indet: {
    es: "Evidencia insuficiente para asignar una narrativa. La honestidad del modelo: no todo se puede resolver.",
    en: "Insufficient evidence to assign a narrative. The model's honesty: not everything can be resolved.",
  },
};

export default function ProbabilidadesPage() {
  const scored = corpusPosteriors();
  const docScored = documentPosteriors();
  const allScored = [...scored, ...docScored];

  type ModalCase = { id: string; name: string; tier: string; p: number };
  const casesByModal = Object.fromEntries(
    MECE_CLASSES.map((c) => [c.id, [] as ModalCase[]]),
  ) as Record<MeceClassId, ModalCase[]>;
  for (const s of allScored) {
    const m = modal(s.posterior);
    casesByModal[m.id].push({ id: s.id, name: s.name, tier: s.tier, p: m.prob });
  }
  for (const id of Object.keys(casesByModal) as MeceClassId[]) {
    casesByModal[id].sort((a, b) => b.p - a.p);
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
          es={`Las ${STATS.cases} piezas del corpus reparten cada una el 100% entre las mismas seis narrativas mutuamente excluyentes: los ${scored.length} casos de incidente por la naturaleza del objeto, y los ${STATS.cases - scored.length} casos-documento (memos, audiencias, filtraciones) por el lean evidencial de su contenido —hacia qué explicación pesan—. Sumadas, reparten el corpus de forma comparable: se puede decir, coherentemente, qué explicación da cuenta de más casos. Cada narrativa bundlea objeto + postura institucional; «no-humano + encubrimiento estatal» es una clase propia. Las hipótesis del marco anterior se preservan como mapeo (ver cada narrativa) y como vistas derivadas.`}
          en={`Each of the corpus's ${STATS.cases} pieces splits 100% among the same six mutually-exclusive narratives: the ${scored.length} incident cases by the nature of the object, and the ${STATS.cases - scored.length} document cases (memos, hearings, leaks) by the evidential lean of their content —which explanation they weigh toward. Summed, they partition the corpus comparably: one can coherently say which explanation accounts for more cases. Each narrative bundles object + institutional stance; 'non-human + state cover-up' is its own class. The prior framework's hypotheses are preserved as a mapping (see each narrative) and as derived views.`}
        />
      </Lede>

      <section className="mt-12">
        <H2>
          <T es="La partición del corpus" en="The corpus partition" />
        </H2>
        <Caption>
          <T
            es={`Las ${STATS.cases} piezas: ${scored.length} incidentes (por objeto) + ${STATS.cases - scored.length} documentos (por lean del registro). Una sola partición comparable.`}
            en={`All ${STATS.cases} pieces: ${scored.length} incidents (by object) + ${STATS.cases - scored.length} documents (by record lean). A single comparable partition.`}
          />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <MecePartition
            items={allScored}
            totalLabelEs={`Suman 100% · ${allScored.length} casos · partición exhaustiva`}
            totalLabelEn={`Sum to 100% · ${allScored.length} cases · exhaustive partition`}
          />
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="Las seis narrativas" en="The six narratives" />
        </H2>
        <Caption>
          <T
            es="Qué significa cada una, qué hipótesis del marco anterior preserva, y los casos donde es la explicación más probable."
            en="What each means, which prior-framework hypothesis it preserves, and the cases where it is the most probable explanation."
          />
        </Caption>
        <div className="mt-6 space-y-8">
          {MECE_CLASSES.map((c) => {
            const top = casesByModal[c.id].slice(0, 6);
            return (
              <div key={c.id} className="border-l-4 pl-4" style={{ borderColor: c.color }}>
                <h3 className="font-mono text-sm uppercase tracking-wider text-text">
                  <T es={c.label} en={c.labelEn} />
                  <span className="ml-2 font-normal text-muted">
                    · {casesByModal[c.id].length} <T es="casos modales" en="modal cases" />
                  </span>
                </h3>
                <Body className="mt-1 text-sm text-muted">
                  <T es={BLURB[c.id].es} en={BLURB[c.id].en} />
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
            es="Los posteriores por caso son juicios analíticos estructurados, no frecuencias calibradas empíricamente: comparabilidad no es lo mismo que verdad. El modelo dice qué explicación es más coherente con el análisis de cada caso, no cuál es objetivamente correcta. El agregado «nº esperado de casos por explicación» es lineal, así que es válido aunque los casos estén correlacionados. Una nota sobre la partición única: para los incidentes el posterior mide la naturaleza del objeto; para los casos-documento mide el «lean» evidencial (hacia qué explicación pesa el documento, no qué era un objeto). Son preguntas distintas que comparten el mismo vocabulario de seis narrativas, y se grafican juntas para ver el corpus completo — pero esa diferencia de sentido conviene tenerla presente al leer el total."
            en="Per-case posteriors are structured analytical judgments, not empirically calibrated frequencies: comparability is not the same as truth. The model says which explanation is most coherent with each case's analysis, not which is objectively correct. The 'expected number of cases per explanation' aggregate is linear, so it holds even if cases are correlated. A note on the single partition: for incidents the posterior measures the nature of the object; for document cases it measures the evidential 'lean' (which explanation the document weighs toward, not what an object was). These are different questions sharing the same six-narrative vocabulary, charted together to see the whole corpus — but that difference in meaning is worth keeping in mind when reading the total."
          />
        </Body>
      </section>
    </main>
  );
}
