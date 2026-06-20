import Link from "next/link";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { MECE_CLASSES, corpusPosteriors, documentPosteriors, modal, classifiedPosterior } from "@/lib/meceModel";
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
    const m = modal(classifiedPosterior(s.posterior));
    casesByModal[m.id].push({ id: s.id, name: s.name, tier: s.tier, p: m.prob });
  }
  for (const id of Object.keys(casesByModal) as MeceClassId[]) {
    casesByModal[id].sort((a, b) => b.p - a.p);
  }

  // Apertura de "mundano/natural": su masa clasificada, por sub-tipo de
  // explicación prosaica (misidentificación / fenómeno natural / fraude).
  const MUNDANO_TYPES: { key: "misid" | "natural" | "fraude"; es: string; en: string }[] = [
    { key: "misid", es: "Misidentificación", en: "Misidentification" },
    { key: "natural", es: "Fenómeno natural", en: "Natural phenomenon" },
    { key: "fraude", es: "Fraude / hoax", en: "Hoax / fraud" },
  ];
  const mundanoBy: Record<string, number> = { misid: 0, natural: 0, fraude: 0 };
  let mundanoTotal = 0;
  for (const s of allScored) {
    const m = classifiedPosterior(s.posterior).mundano_natural || 0;
    if (m <= 0) continue;
    mundanoTotal += m;
    mundanoBy[s.mundanoType ?? "misid"] += m;
  }
  const mundColor = MECE_CLASSES.find((c) => c.id === "mundano_natural")!.color;

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
          es={`Las ${STATS.cases} piezas del corpus se clasifican cada una entre las narrativas mutuamente excluyentes: los ${scored.length} casos de incidente por la naturaleza del objeto, y los ${STATS.cases - scored.length} casos-documento (memos, audiencias, filtraciones) por el lean evidencial de su contenido —hacia qué explicación pesan—. Es una clasificación forzada: ningún caso queda en «indeterminable»; la incertidumbre de cada caso se reparte entre las narrativas que efectivamente apoya. Sumadas, reparten el corpus de forma comparable: se puede decir qué explicación da cuenta de más casos. Cada narrativa bundlea objeto + postura institucional; «no-humano» agrupa encubierto + abierto en la vista. Las hipótesis del marco anterior se preservan como mapeo (ver cada narrativa).`}
          en={`Each of the corpus's ${STATS.cases} pieces is classified among the mutually-exclusive narratives: the ${scored.length} incident cases by the nature of the object, and the ${STATS.cases - scored.length} document cases (memos, hearings, leaks) by the evidential lean of their content —which explanation they weigh toward. It is a forced classification: no case rests in 'indeterminable'; each case's uncertainty is spread across the narratives it actually supports. Summed, they partition the corpus comparably: one can say which explanation accounts for more cases. Each narrative bundles object + institutional stance; 'non-human' groups covert + open in this view. The prior framework's hypotheses are preserved as a mapping (see each narrative).`}
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
            consolidateNonHuman
            totalLabelEs={`Suman 100% · ${allScored.length} casos · «No-humano» agrupa encubierto + abierto`}
            totalLabelEn={`Sum to 100% · ${allScored.length} cases · 'Non-human' groups covert + open`}
          />
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="Dentro de mundano / natural" en="Inside mundane / natural" />
        </H2>
        <Caption>
          <T
            es={`«Mundano/natural» (${(mundanoTotal / allScored.length * 100).toFixed(0)}% del corpus) no es una sola cosa: separa el error humano sobre algo conocido, la física natural genuina y el engaño deliberado. Son lecturas prosaicas epistémicamente distintas.`}
            en={`'Mundane/natural' (${(mundanoTotal / allScored.length * 100).toFixed(0)}% of the corpus) is not one thing: it separates human error about a known object, genuine natural physics, and deliberate hoax. These are epistemically distinct prosaic readings.`}
          />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <div className="space-y-2.5">
            {MUNDANO_TYPES.map((t) => (
              <div key={t.key}>
                <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
                  <span className="min-w-0 uppercase tracking-wider text-text">
                    <T es={t.es} en={t.en} />
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-right text-muted">
                    {(mundanoBy[t.key] / mundanoTotal * 100).toFixed(0)}% · {mundanoBy[t.key].toFixed(1)} <T es="casos" en="cases" />
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-border/40">
                  <div className="h-2" style={{ width: `${(mundanoBy[t.key] / mundanoTotal) * 100}%`, backgroundColor: mundColor }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es={`${mundanoTotal.toFixed(0)} casos-equivalentes · sub-tipo de la explicación prosaica`} en={`${mundanoTotal.toFixed(0)} case-equivalents · sub-type of the prosaic explanation`} />
          </p>
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="Las narrativas" en="The narratives" />
        </H2>
        <Caption>
          <T
            es="Qué significa cada una, qué hipótesis del marco anterior preserva, y los casos donde es la explicación más probable."
            en="What each means, which prior-framework hypothesis it preserves, and the cases where it is the most probable explanation."
          />
        </Caption>
        <div className="mt-6 space-y-8">
          {MECE_CLASSES.filter((c) => c.id !== "indet").map((c) => {
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
            es="Los posteriores por caso son juicios analíticos estructurados, no frecuencias calibradas empíricamente: comparabilidad no es lo mismo que verdad. El modelo dice qué explicación es más coherente con el análisis de cada caso, no cuál es objetivamente correcta. El agregado «nº esperado de casos por explicación» es lineal, así que es válido aunque los casos estén correlacionados. Esta vista usa clasificación forzada: la masa de incertidumbre de cada caso (la antigua «indeterminable») se reparte entre las narrativas que el caso efectivamente apoya, de modo que ningún caso queda sin clasificar. Para los incidentes el posterior mide la naturaleza del objeto; para los casos-documento, el lean evidencial de su contenido. La incertidumbre subyacente sigue en el análisis de cada caso; aquí se compromete a la lectura más sostenida."
            en="Per-case posteriors are structured analytical judgments, not empirically calibrated frequencies: comparability is not the same as truth. The model says which explanation is most coherent with each case's analysis, not which is objectively correct. The 'expected number of cases per explanation' aggregate is linear, so it holds even if cases are correlated. This view uses forced classification: each case's uncertainty mass (the former 'indeterminable') is spread across the narratives the case actually supports, so no case is left unclassified. For incidents the posterior measures the nature of the object; for document cases, the evidential lean of their content. The underlying uncertainty still lives in each case's analysis; here it is committed to the best-supported reading."
          />
        </Body>
      </section>
    </main>
  );
}
