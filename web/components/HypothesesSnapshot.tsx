import { corpusPosteriors, documentPosteriors, expandedHypotheses } from "@/lib/meceModel";
import { MeceDonut } from "@/components/MeceDonut";
import { T } from "@/components/T";

/**
 * Snapshot de las hipótesis para la Home (fondo oscuro bg-text).
 * Clasificación forzada sobre el corpus (incidentes por objeto + documentos por
 * lean), con mundano/natural abierto en sus 3 sub-tipos y no-humano consolidado.
 * Mismo donut interactivo de /probabilidades, en variante de tono oscuro, para
 * unificar la visualización entre la home y el detalle.
 */
export function HypothesesSnapshot() {
  const scored = [...corpusPosteriors(), ...documentPosteriors()];
  const N = scored.length;
  const rows = expandedHypotheses(scored, { consolidateNonHuman: true });

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es={`Cómo se clasifican los ${N} casos del corpus entre las hipótesis — suman 100%`}
          en={`How the corpus's ${N} cases classify among the hypotheses — they sum to 100%`}
        />
      </p>
      <div className="mt-8">
        <MeceDonut
          tone="dark"
          N={N}
          rows={rows.map((r) => ({ key: r.key, color: r.color, count: r.count, label: r.label, labelEn: r.labelEn }))}
        />
      </div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="Clasificación forzada y comparable — las hipótesis reparten el 100% del corpus (mundano abierto en misid/natural/posible fraude; no-humano consolidado)"
          en="Forced, comparable classification — the hypotheses split 100% of the corpus (mundane opened into misid/natural/possible hoax; non-human consolidated)"
        />
      </p>
    </div>
  );
}
