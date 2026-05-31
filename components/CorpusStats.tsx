import Link from "next/link";
import { cases, patterns } from "@/lib/data";
import {
  tierDistribution,
  topPatterns,
  eraDistribution,
} from "@/lib/corpusStats";
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
        <Eyebrow>Corpus · hechos verificables</Eyebrow>
        <H2 id="corpus-stats-title" className="max-w-3xl">
          Lo que sí podemos contar.
          <br />
          <span className="text-muted">
            Las probabilidades son juicios sobre estos hechos.
          </span>
        </H2>
      </div>

      {/* Tiers — three giant numbers */}
      <div className="space-y-6">
        <Eyebrow>Tier de evidencia</Eyebrow>
        <div className="grid grid-cols-3 gap-8 md:gap-12">
          <TierStat
            label="Tier S"
            count={tiers.S}
            total={tiers.total}
            colorClass="text-tierS"
          />
          <TierStat
            label="Tier A"
            count={tiers.A}
            total={tiers.total}
            colorClass="text-tierA"
          />
          <TierStat
            label="Tier B"
            count={tiers.B}
            total={tiers.total}
            colorClass="text-tierB"
          />
        </div>
        <Caption className="max-w-3xl pt-2">
          <strong className="text-text">S</strong> militar+sensor+multi-witness
          · <strong className="text-text">A</strong> institucional civil
          multi-witness · <strong className="text-text">B</strong> folklórico
          recurrente
        </Caption>
      </div>

      {/* Eras — horizontal bar chart with display numbers */}
      <div className="space-y-6">
        <Eyebrow>Distribución por era</Eyebrow>
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

      {/* Top patterns — numbered list with big numbers */}
      <div className="space-y-6">
        <Eyebrow>Top 5 patrones por frecuencia</Eyebrow>
        <ol className="divide-y divide-text/10 border-t border-text/15">
          {top.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/patterns/${p.letter}`}
                className="grid grid-cols-[3rem_1fr_auto] items-baseline gap-6 py-5 transition hover:bg-panel/50 md:gap-8"
              >
                <span className="font-display text-2xl tabular-nums leading-none text-muted md:text-3xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-lg leading-tight text-text md:text-xl">
                    {p.name}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    Patrón {p.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-3xl tabular-nums leading-none text-accent md:text-4xl">
                    {p.count}
                  </span>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    casos
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <Caption>
          ¿Quieres ver los 18 patrones?{" "}
          <Link href="/patterns" className="text-accent hover:underline">
            Lista completa →
          </Link>
        </Caption>
      </div>
    </section>
  );
}

function TierStat({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
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
        <p className="font-display text-xl font-medium text-text">{label}</p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted tabular-nums">
          {pct.toFixed(0)}% del corpus
        </p>
      </div>
    </div>
  );
}
