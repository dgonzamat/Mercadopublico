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

  type ModalCase = { id: string; name: string; tier: string; p: number };
  const casesByModal = Object.fromEntries(
    MECE_CLASSES.map((c) => [c.id, [] as ModalCase[]]),
  ) as Record<MeceClassId, ModalCase[]>;
  for (const s of scored) {
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
          es={`El corpus tiene ${STATS.cases} casos. Los ${scored.length} de incidente reparten cada uno el 100% entre las mismas seis narrativas mutuamente excluyentes (qué era el objeto). Sumadas, reparten ese conjunto de forma comparable: se puede decir, coherentemente, qué explicación da cuenta de más casos. Los ${STATS.cases - scored.length} casos-documento (memos, audiencias, filtraciones) no tienen objeto que clasificar, pero su contenido inclina hacia una narrativa u otra: van en una partición aparte, más abajo. Cada narrativa bundlea objeto + postura institucional; «no-humano + encubrimiento estatal» es una clase propia. Las hipótesis del marco anterior se preservan como mapeo (ver cada narrativa) y como vistas derivadas.`}
          en={`The corpus has ${STATS.cases} cases. Each of the ${scored.length} incident cases splits 100% among the same six mutually-exclusive narratives (what the object was). Summed, they partition that set comparably: one can coherently say which explanation accounts for more cases. The ${STATS.cases - scored.length} document cases (memos, hearings, leaks) have no object to classify, but their content leans toward one narrative or another: they go in a separate partition, below. Each narrative bundles object + institutional stance; 'non-human + state cover-up' is its own class. The prior framework's hypotheses are preserved as a mapping (see each narrative) and as derived views.`}
        />
      </Lede>

      <section className="mt-12">
        <H2>
          <T es="La partición del corpus" en="The corpus partition" />
        </H2>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <MecePartition />
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="El registro institucional" en="The institutional record" />
        </H2>
        <Caption>
          <T
            es={`Los ${docScored.length} casos-documento no tienen objeto que clasificar, pero su contenido inclina hacia una narrativa u otra. Es un eje distinto —«hacia qué explicación pesa el documento», no «qué era el objeto»— y no se suma con la partición de incidentes. La mayoría cae en «indeterminable»: el grueso del registro es proceso o canal, no prueba sobre la naturaleza del fenómeno.`}
            en={`The ${docScored.length} document cases have no object to classify, but their content leans toward one narrative or another. It is a distinct axis —'which explanation the document weighs toward', not 'what the object was'— and is not summed with the incident partition. Most land in 'indeterminable': the bulk of the record is process or channel, not proof about the phenomenon's nature.`}
          />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <MecePartition
            items={docScored}
            showDerived={false}
            totalLabelEs={`Suman 100% · ${docScored.length} casos-documento · lean del registro`}
            totalLabelEn={`Sum to 100% · ${docScored.length} document cases · record lean`}
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
            es="Los posteriores por caso son juicios analíticos estructurados, no frecuencias calibradas empíricamente: comparabilidad no es lo mismo que verdad. El modelo dice qué explicación es más coherente con el análisis de cada caso, no cuál es objetivamente correcta. El agregado «nº esperado de casos por explicación» es lineal, así que es válido aunque los casos estén correlacionados. Los casos-documento llevan un posterior distinto —el «lean» evidencial: hacia qué explicación pesa el documento, no qué era un objeto— y se grafican aparte; los dos ejes nunca se suman."
            en="Per-case posteriors are structured analytical judgments, not empirically calibrated frequencies: comparability is not the same as truth. The model says which explanation is most coherent with each case's analysis, not which is objectively correct. The 'expected number of cases per explanation' aggregate is linear, so it holds even if cases are correlated. Document cases carry a different posterior —the evidential 'lean': which explanation the document weighs toward, not what an object was— and are charted separately; the two axes are never summed."
          />
        </Body>
      </section>
    </main>
  );
}
