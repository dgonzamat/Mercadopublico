import { MECE_CLASSES, corpusPosteriors, expectedCounts, roundedShares } from "@/lib/meceModel";
import { T } from "@/components/T";

/**
 * Snapshot de la partición MECE para la Home (fondo oscuro bg-text).
 * Las seis narrativas mutuamente excluyentes reparten el 100% del corpus
 * — distribución COMPARABLE (a diferencia del marco anterior, donde los % no
 * sumaban 100). Barras crema sobre oscuro; server component, cero JS.
 */
export function HypothesesSnapshot() {
  const scored = corpusPosteriors();
  const N = scored.length;
  const counts = expectedCounts(scored);
  const shares = roundedShares(scored);
  const ranked = [...MECE_CLASSES].sort((a, b) => counts[b.id] - counts[a.id]);
  const max = Math.max(...MECE_CLASSES.map((c) => counts[c.id]));

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es={`Cómo se reparte el corpus (${N} casos) entre las seis narrativas — suman 100%`}
          en={`How the corpus (${N} cases) splits among the six narratives — they sum to 100%`}
        />
      </p>
      {ranked.map((c, i) => (
        <div
          key={c.id}
          className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 border-b border-bg/10 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,18rem)_5rem]"
        >
          <span className="font-mono text-xs tabular-nums text-bg/40">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="text-base font-medium leading-snug text-bg">
            <T es={c.label} en={c.labelEn} />
          </p>
          <div className="col-start-2 h-1.5 bg-bg/10 md:col-start-3">
            <div className="h-full bg-bg/80" style={{ width: `${(counts[c.id] / max) * 100}%` }} />
          </div>
          <p className="col-start-2 font-mono text-[11px] uppercase tracking-wider text-accent-bright md:col-start-4 md:text-right">
            {shares[c.id]}%
          </p>
        </div>
      ))}
      <p className="pt-4 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="Partición exhaustiva y comparable — las narrativas reparten el 100% del corpus"
          en="Exhaustive, comparable partition — the narratives split 100% of the corpus"
        />
      </p>
    </div>
  );
}
