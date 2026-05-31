import Link from "next/link";
import { cases, patterns } from "@/lib/data";
import { tierDistribution, topPatterns, eraDistribution, countryCount } from "@/lib/corpusStats";

/**
 * Verifiable descriptive statistics over the corpus. Counts only, no
 * inference. Anchors the ICD-203 probability chart with raw data the
 * reader can check against /cases.
 */
export function CorpusStats() {
  const tiers = tierDistribution(cases);
  const top = topPatterns(cases, patterns, 5);
  const eras = eraDistribution(cases);
  const countries = countryCount(cases);

  return (
    <section aria-labelledby="corpus-stats-title">
      <h2 id="corpus-stats-title" className="text-sm font-mono uppercase tracking-widest text-muted">
        Lo que sí podemos contar
      </h2>
      <p className="mt-3 max-w-2xl text-muted">
        Conteos verificables del corpus ({tiers.total} casos, {countries} países, 1947–2026).
        Estos son hechos. Las probabilidades arriba son juicios sobre qué significan estos hechos.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Tier distribution */}
        <div className="rounded-lg border border-border bg-panel p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
            Distribución por tier de evidencia
          </h3>
          <div className="mt-3 space-y-2">
            <TierRow label="Tier S" count={tiers.S} total={tiers.total} color="bg-tierS" />
            <TierRow label="Tier A" count={tiers.A} total={tiers.total} color="bg-tierA" />
            <TierRow label="Tier B" count={tiers.B} total={tiers.total} color="bg-tierB" />
          </div>
          <p className="mt-3 text-xs text-muted">
            <strong className="text-text">S</strong> = militar+sensor+multi-witness ·{" "}
            <strong className="text-text">A</strong> = institucional civil multi-witness ·{" "}
            <strong className="text-text">B</strong> = folklórico/recurrente local
          </p>
        </div>

        {/* Era distribution */}
        <div className="rounded-lg border border-border bg-panel p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
            Distribución por era
          </h3>
          <div className="mt-3 space-y-2">
            {eras.map((e) => (
              <div key={e.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-text">{e.label}</span>
                  <span className="font-mono text-xs text-muted">
                    {e.start}–{String(e.end).slice(-2)} · {e.count}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(e.count / tiers.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top patterns */}
      <div className="mt-4 rounded-lg border border-border bg-panel p-5">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
          Top 5 patrones por frecuencia en el corpus
        </h3>
        <div className="mt-3 space-y-2">
          {top.map((p) => (
            <Link
              key={p.id}
              href={`/patterns/${p.letter}`}
              className="flex min-h-[44px] items-center rounded -mx-2 px-2 py-1 transition hover:bg-bg/50"
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-accent">{p.id}</span>{" "}
                  <span className="text-text">{p.name}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {p.count} casos
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(p.count / tiers.total) * 100}%`,
                    backgroundColor: p.color,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          ¿Quieres ver los 18 patrones?{" "}
          <Link href="/patterns" className="text-accent hover:underline">
            Lista completa
          </Link>
        </p>
      </div>
    </section>
  );
}

function TierRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-mono text-text">{label}</span>
        <span className="font-mono text-xs text-muted">
          {count} · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
