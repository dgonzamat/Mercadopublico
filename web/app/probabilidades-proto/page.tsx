import Link from "next/link";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import {
  MECE_CLASSES,
  PROTO_CASES,
  expectedCounts,
  roundedShares,
  modal,
  validatePosteriors,
  type MeceClassId,
} from "@/lib/mecePrototype";

export const metadata = {
  title: "PROTOTIPO · Probabilidades comparables (MECE)",
  description:
    "Prueba de concepto: posterior por caso sobre explicaciones mutuamente excluyentes, agregado comparable. No es el modelo vivo del sitio.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/probabilidades-proto/" },
};

const LABEL: Record<MeceClassId, { es: string; en: string; color: string }> =
  Object.fromEntries(
    MECE_CLASSES.map((c) => [c.id, { es: c.label, en: c.labelEn, color: c.color }]),
  ) as Record<MeceClassId, { es: string; en: string; color: string }>;

const pct = (x: number) => (x * 100).toFixed(0);

export default function ProbabilidadesProtoPage() {
  const N = PROTO_CASES.length;
  const broken = validatePosteriors();
  const counts = expectedCounts();
  const shares = roundedShares();
  const rankedClasses = [...MECE_CLASSES].sort(
    (a, b) => counts[b.id] - counts[a.id],
  );
  const maxCount = Math.max(...MECE_CLASSES.map((c) => counts[c.id]));

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      {/* Banner prototipo */}
      <div className="mb-8 border-l-4 border-accent bg-panel px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
          <T es="Prototipo · no es el modelo vivo" en="Prototype · not the live model" />
        </p>
        <Body className="mt-1 text-sm text-muted">
          <T
            es={`Prueba de concepto sobre ${N} casos de incidente reales, recodificados con posteriores ilustrativos (anclados en la narrativa de cada expediente). Evalúa reemplazar las 10 hipótesis existenciales solapadas —no comparables— por un posterior por caso sobre explicaciones mutuamente excluyentes.`}
            en={`Proof of concept over ${N} real incident cases, recoded with illustrative posteriors (anchored in each file's narrative). It evaluates replacing the 10 overlapping existential hypotheses —not comparable— with a per-case posterior over mutually-exclusive explanations.`}
          />
        </Body>
        {broken.length > 0 && (
          <p className="mt-2 font-mono text-[11px] text-red-400">
            posteriores que no suman 1: {broken.join(", ")}
          </p>
        )}
      </div>

      <Eyebrow>
        <T es="Modelo comparable (MECE)" en="Comparable model (MECE)" />
      </Eyebrow>
      <H1>
        <T es="Qué explica el corpus" en="What the corpus explains" />
      </H1>
      <Lede>
        <T
          es="Cada caso recibe una distribución sobre las mismas seis explicaciones excluyentes, que suma 100%. Eso vuelve los números comparables: se puede decir, de forma coherente, qué explicación da cuenta de más casos."
          en="Each case gets a distribution over the same six mutually-exclusive explanations, summing to 100%. That makes the numbers comparable: one can coherently say which explanation accounts for more cases."
        />
      </Lede>

      {/* === Agregado comparable === */}
      <section className="mt-12">
        <H2>
          <T
            es="Las seis explicaciones reparten el 100% del corpus"
            en="The six explanations partition 100% of the corpus"
          />
        </H2>
        <Caption>
          <T
            es={`Eⱼ = Σᵢ P(explicaciónⱼ | casoᵢ). Suman ${N} (el nº de casos) y son comparables entre sí. Como la esperanza es lineal, este agregado vale aunque los casos estén correlacionados.`}
            en={`Eⱼ = Σᵢ P(explanationⱼ | caseᵢ). They sum to ${N} (the case count) and are mutually comparable. Because expectation is linear, this aggregate holds even if cases are correlated.`}
          />
        </Caption>
        <div className="mt-6 space-y-3">
          {rankedClasses.map((c) => (
            <div key={c.id}>
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="uppercase tracking-wider text-text">
                  <T es={LABEL[c.id].es} en={LABEL[c.id].en} />
                </span>
                <span className="text-muted">
                  {counts[c.id].toFixed(2)}{" "}
                  <T es="casos" en="cases" /> · {shares[c.id]}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full bg-border/40">
                <div
                  className="h-2"
                  style={{
                    width: `${(counts[c.id] / maxCount) * 100}%`,
                    backgroundColor: c.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted">
          <T
            es="Suman 100% · partición exhaustiva del corpus"
            en="Sum to 100% · exhaustive partition of the corpus"
          />
        </p>
      </section>

      {/* === Posterior por caso === */}
      <section className="mt-16">
        <H2>
          <T es="Posterior por caso" en="Per-case posterior" />
        </H2>
        <Caption>
          <T
            es="Cada fila suma 100%. La explicación modal es la más probable para ese caso — eso es lo que de verdad significa «una explicación es más probable que otra»."
            en="Each row sums to 100%. The modal explanation is the most probable for that case — that is what 'one explanation is more probable than another' actually means."
          />
        </Caption>
        <div className="mt-6 space-y-5">
          {PROTO_CASES.map((c) => {
            const m = modal(c.posterior);
            return (
              <div key={c.id} className="border-t border-border pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <Link
                    href={`/cases/${c.id}`}
                    className="font-mono text-sm text-text hover:text-accent hover:underline"
                  >
                    {c.name}{" "}
                    <span className="text-muted">· {c.tier}</span>
                  </Link>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    <T es="modal" en="modal" />:{" "}
                    <span style={{ color: LABEL[m.id].color }} className="font-semibold">
                      <T es={LABEL[m.id].es} en={LABEL[m.id].en} />
                    </span>{" "}
                    {pct(m.prob)}%
                  </span>
                </div>
                {/* barra apilada 100% */}
                <div className="mt-2 flex h-3 w-full overflow-hidden">
                  {MECE_CLASSES.map((k) =>
                    c.posterior[k.id] > 0 ? (
                      <div
                        key={k.id}
                        title={`${LABEL[k.id].es}: ${pct(c.posterior[k.id])}%`}
                        style={{
                          width: `${c.posterior[k.id] * 100}%`,
                          backgroundColor: k.color,
                        }}
                      />
                    ) : null,
                  )}
                </div>
                <Caption className="mt-2">{c.note}</Caption>
              </div>
            );
          })}
        </div>
      </section>

      {/* === Honestidad === */}
      <section className="mt-16 border-t border-border pt-6">
        <Caption>
          <T
            es="Honestidad: los posteriores por caso siguen siendo juicios subjetivos, no frecuencias calibradas. Comparabilidad ≠ verdad — el modelo dice qué explicación es más coherente con el análisis, no cuál es objetivamente correcta. No hay bucle de resolución que calibre estos números empíricamente. Los casos-documento (memos, audiencias, leaks) no se modelan aquí: la partición «qué era el objeto» no aplica a ellos."
            en="Honesty: per-case posteriors remain subjective judgments, not calibrated frequencies. Comparability ≠ truth — the model says which explanation is most coherent with the analysis, not which is objectively correct. There is no resolution loop calibrating these numbers empirically. Document cases (memos, hearings, leaks) are not modeled here: the 'what was the object' partition does not apply to them."
          />
        </Caption>
      </section>
    </main>
  );
}
