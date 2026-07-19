import { LocaleLink } from "@/components/LocaleLink";

import { cases, patterns } from "@/lib/data";
import {
  tierDistribution,
  topPatterns,
  eraDistribution,
} from "@/lib/corpusStats";
import { T } from "@/components/T";
import { Eyebrow, H2, Caption, DisplayNumber } from "@/lib/typography";

/**
 * Verifiable descriptive statistics over the corpus.
 *
 * Editorial layout: each stat is dramatically oversized. The numbers ARE
 * the visual, not labels on top of bars. Whitespace-heavy.
 */
export function CorpusStats() {
  const tiers = tierDistribution(cases);
  const top = topPatterns(cases, patterns, 5);
  const eras = eraDistribution(cases);

  return (
    <section aria-labelledby="corpus-stats-title" className="space-y-12">
      <div className="space-y-4">
        <Eyebrow>
          <T
            es={`Hechos verificables · ${tiers.total} casos`}
            en={`Verifiable facts · ${tiers.total} cases`}
          />
        </Eyebrow>
        <H2 id="corpus-stats-title" className="max-w-3xl">
          <T
            es={
              <>
                Lo que sí podemos contar.
                <br />
                <span className="text-muted">
                  Las probabilidades son juicios sobre estos hechos.
                </span>
              </>
            }
            en={
              <>
                What we can actually count.
                <br />
                <span className="text-muted">
                  Probabilities are judgments about these facts.
                </span>
              </>
            }
          />
        </H2>
      </div>

      <div className="space-y-6">
        <Eyebrow>
          <T
            es="Calidad de evidencia por caso"
            en="Evidence quality per case"
          />
        </Eyebrow>
        <div className="grid grid-cols-3 gap-8 md:gap-12">
          <TierStat
            es="Sólido"
            en="Solid"
            count={tiers.S}
            total={tiers.total}
            colorClass="text-tierS"
          />
          <TierStat
            es="Aceptable"
            en="Acceptable"
            count={tiers.A}
            total={tiers.total}
            colorClass="text-tierA"
          />
          <TierStat
            es="Indiciario"
            en="Indicative"
            count={tiers.B}
            total={tiers.total}
            colorClass="text-tierB"
          />
        </div>
        <Caption className="max-w-3xl pt-2">
          <T
            es={
              <>
                <strong className="text-text">Sólido (S)</strong> evidencia
                fuerte: sensor + múltiples testigos ·{" "}
                <strong className="text-text">Aceptable (A)</strong> evidencia
                institucional verificable ·{" "}
                <strong className="text-text">Indiciario (B)</strong> evidencia
                limitada: testigo único o sin verificación primaria
              </>
            }
            en={
              <>
                <strong className="text-text">Solid (S)</strong> strong
                evidence: sensor + multiple witnesses ·{" "}
                <strong className="text-text">Acceptable (A)</strong> verifiable
                institutional evidence ·{" "}
                <strong className="text-text">Indicative (B)</strong> limited
                evidence: single-witness or without primary verification
              </>
            }
          />
        </Caption>
      </div>

      <div className="space-y-6">
        <Eyebrow>
          <T es="Distribución por era" en="Distribution by era" />
        </Eyebrow>
        <div className="space-y-6 border-t border-text/15 pt-6">
          {eras.map((e) => {
            const pct = (e.count / tiers.total) * 100;
            return (
              <div
                key={e.label}
                className="grid grid-cols-[5rem_1fr] items-baseline gap-6 md:grid-cols-[7rem_1fr_auto] md:gap-8"
              >
                <span className="font-display text-4xl tabular-nums leading-none text-text md:text-5xl">
                  {e.count}
                </span>
                <div className="space-y-2 min-w-0">
                  <p className="font-display text-lg leading-tight text-text md:text-xl">
                    {e.label}
                  </p>
                  <div className="h-1.5 bg-text/10">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <p className="col-span-2 font-mono text-xs uppercase tracking-widest text-muted md:col-span-1 md:text-right">
                  {e.start}–{String(e.end).slice(-2)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <Eyebrow>
          <T
            es="Top 5 patrones por frecuencia"
            en="Top 5 patterns by frequency"
          />
        </Eyebrow>
        <ol className="divide-y divide-text/10 border-t border-text/15">
          {top.map((p, i) => (
            <li key={p.id}>
              <LocaleLink
                href={`/patterns/${p.letter}`}
                className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-6 py-5 transition hover:bg-panel/50 md:gap-8"
              >
                <span className="font-display text-2xl tabular-nums leading-none text-muted md:text-3xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-lg leading-tight text-text md:text-xl">
                    <T es={p.name} en={p.name_en} />
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    <T es={`Patrón ${p.id}`} en={`Pattern ${p.id}`} />
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-3xl tabular-nums leading-none text-accent md:text-4xl">
                    {p.count}
                  </span>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    <T es="casos" en="cases" />
                  </p>
                </div>
              </LocaleLink>
            </li>
          ))}
        </ol>
        <Caption>
          <T
            es={
              <>
                ¿Quieres ver los {patterns.length} patrones?{" "}
                <LocaleLink
                  href="/patterns"
                  className="text-accent hover:underline"
                >
                  Lista completa →
                </LocaleLink>
              </>
            }
            en={
              <>
                Want to see all {patterns.length} patterns?{" "}
                <LocaleLink
                  href="/patterns"
                  className="text-accent hover:underline"
                >
                  Full list →
                </LocaleLink>
              </>
            }
          />
        </Caption>
      </div>
    </section>
  );
}

function TierStat({
  es,
  en,
  count,
  total,
  colorClass,
}: {
  es: string;
  en: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2 border-t-2 border-text pt-3">
      <DisplayNumber
        className={`text-[clamp(3.5rem,10vw,7rem)] ${colorClass}`}
      >
        {count}
      </DisplayNumber>
      <div className="space-y-0.5">
        <p className="font-display text-xl font-medium text-text">
          <T es={es} en={en} />
        </p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted tabular-nums">
          <T es={`${pct.toFixed(0)}% del corpus`} en={`${pct.toFixed(0)}% of corpus`} />
        </p>
      </div>
    </div>
  );
}
