import Link from "next/link";
import { cases, patterns } from "@/lib/data";
import {
  tierDistribution,
  topPatterns,
  eraDistribution,
  countryCount,
} from "@/lib/corpusStats";
import { Eyebrow, H2, Caption } from "@/lib/typography";

/**
 * Verifiable descriptive statistics over the corpus. Counts only, no
 * inference. Anchors the ICD-203 probability chart with raw data the
 * reader can check against /cases.
 *
 * Tufte cleanup: removed nested card containers. Three sub-sections
 * separated by whitespace only, not borders. Data-ink high.
 */
export function CorpusStats() {
  const tiers = tierDistribution(cases);
  const top = topPatterns(cases, patterns, 5);
  const eras = eraDistribution(cases);
  const countries = countryCount(cases);

  return (
    <section aria-labelledby="corpus-stats-title" className="space-y-8">
      <div className="space-y-2">
        <Eyebrow>Corpus · hechos verificables</Eyebrow>
        <H2 id="corpus-stats-title">Lo que sí podemos contar</H2>
        <Caption className="max-w-2xl">
          {tiers.total} casos · {countries} países · 1947–2026. Las
          probabilidades de arriba son juicios sobre qué significan estos
          hechos.
        </Caption>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-3">
          <Eyebrow>Tier de evidencia</Eyebrow>
          <div className="space-y-2">
            <TierRow
              label="Tier S"
              count={tiers.S}
              total={tiers.total}
              color="bg-tierS"
            />
            <TierRow
              label="Tier A"
              count={tiers.A}
              total={tiers.total}
              color="bg-tierA"
            />
            <TierRow
              label="Tier B"
              count={tiers.B}
              total={tiers.total}
              color="bg-tierB"
            />
          </div>
          <Caption>
            <strong className="text-text">S</strong> militar+sensor+multi-witness
            · <strong className="text-text">A</strong> institucional civil
            multi-witness · <strong className="text-text">B</strong> folklórico
            recurrente
          </Caption>
        </div>

        <div className="space-y-3">
          <Eyebrow>Distribución por era</Eyebrow>
          <div className="space-y-2">
            {eras.map((e) => (
              <div key={e.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-text">{e.label}</span>
                  <span className="font-mono text-xs text-muted">
                    {e.start}–{String(e.end).slice(-2)} · {e.count}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-panel">
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

      <div className="space-y-3">
        <Eyebrow>Top 5 patrones por frecuencia</Eyebrow>
        <div className="space-y-2">
          {top.map((p) => (
            <Link
              key={p.id}
              href={`/patterns/${p.letter}`}
              className="-mx-2 flex min-h-[44px] flex-col justify-center rounded px-2 py-1 transition hover:bg-panel/50"
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
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-panel">
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
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
