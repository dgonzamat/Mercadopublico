import Link from "next/link";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import {
  MECE_CLASSES,
  corpusPosteriors,
  expectedCounts,
  roundedShares,
  modal,
  entidadesNoHumanas,
  heterogeneidad,
  type ScoredCase,
} from "@/lib/meceModel";
import type { MeceClassId } from "@/lib/types";

export const metadata = {
  title: "PROTOTIPO · Probabilidades comparables (MECE)",
  description:
    "Prueba de concepto: posterior por caso sobre explicaciones mutuamente excluyentes, agregado comparable que preserva las 10 hipótesis. No es el modelo vivo.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/probabilidades-proto/" },
};

const LABEL = Object.fromEntries(
  MECE_CLASSES.map((c) => [c.id, c]),
) as Record<MeceClassId, (typeof MECE_CLASSES)[number]>;

const pct = (x: number) => (x * 100).toFixed(0);

export default function ProbabilidadesProtoPage() {
  const scored: ScoredCase[] = corpusPosteriors();
  const N = scored.length;
  const seededCount = scored.filter((s) => s.seeded).length;
  const counts = expectedCounts(scored);
  const shares = roundedShares(scored);
  const ranked = [...MECE_CLASSES].sort((a, b) => counts[b.id] - counts[a.id]);
  const maxCount = Math.max(...MECE_CLASSES.map((c) => counts[c.id]));

  // Vistas derivadas a nivel corpus (preservan hipótesis viejas).
  const enhExpected = scored.reduce((s, c) => s + entidadesNoHumanas(c.posterior), 0);
  const hetExpected = scored.reduce((s, c) => s + heterogeneidad(c.posterior), 0);

  const tierS = scored
    .filter((s) => s.tier === "S")
    .sort((a, b) => modal(b.posterior).prob - modal(a.posterior).prob)
    .slice(0, 20);

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <div className="mb-8 border-l-4 border-accent bg-panel px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
          <T es="Prototipo · no es el modelo vivo" en="Prototype · not the live model" />
        </p>
        <Body className="mt-1 text-sm text-muted">
          <T
            es={`Corre sobre los ${N} casos de incidente reales del corpus (los ${scored.length} no-documento). De ellos, ${seededCount} usan un posterior PROVISIONAL sembrado desde los campos legacy (a recodificar a mano en la migración). Las 10 hipótesis del modelo viejo se preservan: 5 como hojas, 3 como subclases, y entidades-no-humanas / heterogeneidad como vistas derivadas.`}
            en={`Runs over the ${N} real incident cases (the ${scored.length} non-document ones). Of those, ${seededCount} use a PROVISIONAL posterior seeded from legacy fields (to be hand-recoded in the migration). The 10 old-model hypotheses are preserved: 5 as leaves, 3 as subclasses, and non-human-entities / heterogeneity as derived views.`}
          />
        </Body>
      </div>

      <Eyebrow>
        <T es="Modelo comparable (MECE)" en="Comparable model (MECE)" />
      </Eyebrow>
      <H1>
        <T es="Qué explica el corpus" en="What the corpus explains" />
      </H1>
      <Lede>
        <T
          es="Cada caso reparte 100% sobre las mismas nueve explicaciones excluyentes. El agregado reparte el 100% del corpus entre ellas — comparable y coherente."
          en="Each case splits 100% over the same nine mutually-exclusive explanations. The aggregate partitions 100% of the corpus among them — comparable and coherent."
        />
      </Lede>

      {/* === Agregado comparable (9 hojas) === */}
      <section className="mt-12">
        <H2>
          <T es="Las explicaciones reparten el 100%" en="The explanations partition 100%" />
        </H2>
        <Caption>
          <T
            es={`Eⱼ = Σᵢ P(explicaciónⱼ | casoᵢ). Suman ${N} (el nº de casos) y son comparables. Lineal ⇒ válido aunque los casos estén correlacionados.`}
            en={`Eⱼ = Σᵢ P(explanationⱼ | caseᵢ). They sum to ${N} (case count) and are comparable. Linear ⇒ valid even under correlation.`}
          />
        </Caption>
        <div className="mt-6 space-y-3">
          {ranked.map((c) => (
            <div key={c.id}>
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="uppercase tracking-wider text-text">
                  <T es={c.label} en={c.labelEn} />
                </span>
                <span className="text-muted">
                  {counts[c.id].toFixed(1)} <T es="casos" en="cases" /> · {shares[c.id]}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full bg-border/40">
                <div className="h-2" style={{ width: `${(counts[c.id] / maxCount) * 100}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted">
          <T es="Suman 100% · partición exhaustiva del corpus" en="Sum to 100% · exhaustive partition" />
        </p>
      </section>

      {/* === Vistas derivadas (preservan hipótesis viejas) === */}
      <section className="mt-16">
        <H2>
          <T es="Hipótesis derivadas (preservadas)" en="Derived hypotheses (preserved)" />
        </H2>
        <Caption>
          <T
            es="No son hojas de la partición; se calculan a partir de ella, de modo que ninguna hipótesis del modelo viejo se pierde."
            en="Not partition leaves; computed from it, so no old-model hypothesis is lost."
          />
        </Caption>
        <div className="mt-4 space-y-2 font-mono text-xs">
          <div className="flex items-baseline justify-between">
            <span className="uppercase tracking-wider text-text">
              <T es="Entidades no humanas (= interdim. + ontológico + tratado)" en="Non-human entities (= interdim. + ontological + treaty)" />
            </span>
            <span className="text-muted">{enhExpected.toFixed(1)} <T es="casos" en="cases" /> · {pct(enhExpected / N)}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="uppercase tracking-wider text-text">
              <T es="Heterogeneidad (= 1 − mundano · ≥1 caso anómalo)" en="Heterogeneity (= 1 − mundane · ≥1 anomalous case)" />
            </span>
            <span className="text-muted">{hetExpected.toFixed(1)} <T es="casos" en="cases" /> · {pct(hetExpected / N)}%</span>
          </div>
        </div>
      </section>

      {/* === Posterior por caso (muestra Tier S) === */}
      <section className="mt-16">
        <H2>
          <T es="Posterior por caso · muestra Tier S" en="Per-case posterior · Tier S sample" />
        </H2>
        <Caption>
          <T
            es={`Cada fila suma 100%. La explicación modal es la más probable para ese caso. (${tierS.length} de los Tier S; el resto se ve igual.)`}
            en={`Each row sums to 100%. The modal explanation is the most probable for that case. (${tierS.length} of the Tier S cases shown.)`}
          />
        </Caption>
        <div className="mt-6 space-y-4">
          {tierS.map((c) => {
            const m = modal(c.posterior);
            return (
              <div key={c.id} className="border-t border-border pt-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <Link href={`/cases/${c.id}`} className="font-mono text-sm text-text hover:text-accent hover:underline">
                    {c.name} <span className="text-muted">· {c.tier}</span>
                    {c.seeded && <span className="ml-1 text-[10px] text-muted">(prov.)</span>}
                  </Link>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    <span style={{ color: LABEL[m.id].color }} className="font-semibold">
                      <T es={LABEL[m.id].label} en={LABEL[m.id].labelEn} />
                    </span>{" "}
                    {pct(m.prob)}%
                  </span>
                </div>
                <div className="mt-2 flex h-3 w-full overflow-hidden">
                  {MECE_CLASSES.map((k) =>
                    c.posterior[k.id] > 0 ? (
                      <div key={k.id} title={`${k.label}: ${pct(c.posterior[k.id])}%`} style={{ width: `${c.posterior[k.id] * 100}%`, backgroundColor: k.color }} />
                    ) : null,
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-16 border-t border-border pt-6">
        <Caption>
          <T
            es="Honestidad: los posteriores siguen siendo juicios subjetivos, no frecuencias calibradas. Comparabilidad ≠ verdad. Los que dicen «(prov.)» usan un sembrado provisional desde campos legacy, a reemplazar a mano. Los casos-documento no se modelan: la partición «qué era el objeto» no les aplica."
            en="Honesty: posteriors remain subjective judgments, not calibrated frequencies. Comparability ≠ truth. Those marked «(prov.)» use a provisional seed from legacy fields, to be hand-replaced. Document cases are not modeled: the 'what was the object' partition does not apply to them."
          />
        </Caption>
      </section>
    </main>
  );
}
