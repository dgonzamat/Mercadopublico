import { MECE_CLASSES, corpusPosteriors, documentPosteriors, expectedCounts } from "@/lib/meceModel";
import { T } from "@/components/T";

/**
 * Snapshot de la partición MECE para la Home (fondo oscuro bg-text).
 * Las seis narrativas mutuamente excluyentes reparten el 100% del corpus
 * (incidentes por objeto + documentos por lean) — distribución COMPARABLE.
 * Barras crema sobre oscuro; server component, cero JS.
 */
export function HypothesesSnapshot() {
  const scored = [...corpusPosteriors(), ...documentPosteriors()];
  const N = scored.length;
  const counts = expectedCounts(scored);
  // Vista consolidada: las dos narrativas no-humanas se muestran como una sola
  // barra "No-humano" (los datos por caso conservan la distinción).
  type Row = { key: string; label: string; labelEn: string; count: number };
  const rows: Row[] = [];
  for (const c of MECE_CLASSES) {
    if (c.id === "nohumano_encubierto") continue;
    if (c.id === "nohumano_abierto") {
      rows.push({ key: "nohumano", label: "No-humano", labelEn: "Non-human", count: counts.nohumano_encubierto + counts.nohumano_abierto });
    } else {
      rows.push({ key: c.id, label: c.label, labelEn: c.labelEn, count: counts[c.id] });
    }
  }
  rows.sort((a, b) => b.count - a.count);

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es={`Cómo se reparten los ${N} casos del corpus entre las seis narrativas — suman 100%`}
          en={`How the corpus's ${N} cases split among the six narratives — they sum to 100%`}
        />
      </p>
      {rows.map((c, i) => (
        <div
          key={c.key}
          className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 border-b border-bg/10 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,18rem)_5rem]"
        >
          <span className="font-mono text-xs tabular-nums text-bg/40">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="text-base font-medium leading-snug text-bg">
            <T es={c.label} en={c.labelEn} />
          </p>
          <div className="col-start-2 h-1.5 bg-bg/10 md:col-start-3">
            <div className="h-full bg-bg/80" style={{ width: `${(c.count / N) * 100}%` }} />
          </div>
          <p className="col-start-2 font-mono text-[11px] uppercase tracking-wider text-accent-bright md:col-start-4 md:text-right">
            {((c.count / N) * 100).toFixed(1)}%
          </p>
        </div>
      ))}
      <p className="pt-4 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="Partición exhaustiva y comparable — las narrativas reparten el 100% del corpus (incidentes por objeto + documentos por lean del registro)"
          en="Exhaustive, comparable partition — the narratives split 100% of the corpus (incidents by object + documents by record lean)"
        />
      </p>
    </div>
  );
}
