import { corpusPosteriors, modalCounts } from "@/lib/meceModel";
import { MeceDonut } from "@/components/MeceDonut";
import { T } from "@/components/T";

/**
 * Snapshot de las hipótesis para la Home (fondo oscuro bg-text).
 * Clasificación forzada sobre los casos de INCIDENTE (por la naturaleza del
 * objeto), con mundano/natural abierto en sus 3 sub-tipos y no-humano
 * consolidado. Los casos-documento se excluyen: la partición «qué era el objeto»
 * no les aplica (misma regla que /calidad y CLAUDE.md). Denominador unificado en
 * 248 incidentes entre la home, /probabilidades, /cases y /calidad.
 */
export function HypothesesSnapshot() {
  const scored = corpusPosteriors();
  const N = scored.length;
  // Conteo por hipótesis MODAL (argmax): enteros y consistentes con /cases y con
  // /probabilidades. Cada caso cuenta 1 en su narrativa más probable.
  const rows = modalCounts(scored, { consolidateNonHuman: true });

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es={`Cómo se clasifican los ${N} casos de incidente entre las hipótesis — suman 100%`}
          en={`How the ${N} incident cases classify among the hypotheses — they sum to 100%`}
        />
      </p>
      <div className="mt-8">
        <MeceDonut
          tone="dark"
          N={N}
          rows={rows.map((r) => ({
            key: r.key,
            color: r.color,
            count: r.count,
            label: r.label,
            labelEn: r.labelEn,
            // Cada hipótesis enlaza a su sección en /probabilidades, donde se
            // listan los casos donde es la explicación más probable. Sin esto
            // las filas del donut de la home no eran clicables (a diferencia
            // del MecePartition de /probabilidades).
            href: `/probabilidades/#hyp-${r.key}`,
          }))}
        />
      </div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="Clasificación forzada y navegable — cada caso cuenta 1 en su hipótesis más probable (argmax); mundano abierto en misid/natural/posible fraude, no-humano consolidado. Solo casos de incidente: los documentos se excluyen (no tienen «objeto» que clasificar). No hay «indeterminable»: esa masa se reparte para que toda hipótesis sea listable. El reparto por valor esperado —que sí conserva la incertidumbre— está en /calidad."
          en="Forced, navigable classification — each case counts once in its most-likely hypothesis (argmax); mundane opened into misid/natural/possible hoax, non-human consolidated. Incident cases only: documents are excluded (they have no 'object' to classify). There is no 'indeterminable': that mass is redistributed so every hypothesis is listable. The expected-value split —which does keep the uncertainty— is on /calidad."
        />
      </p>
    </div>
  );
}
