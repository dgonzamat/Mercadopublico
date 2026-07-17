import { corpusPosteriors, documentPosteriors, modalCounts } from "@/lib/meceModel";
import { MeceDonut } from "@/components/MeceDonut";
import { T } from "@/components/T";

/**
 * Snapshot de las hipótesis para la Home (fondo oscuro bg-text).
 * Clasifica el CORPUS COMPLETO (STATS.cases): los incidentes por la naturaleza
 * del objeto y los casos-documento por la inclinación (lean) de su contenido —la
 * mayoría trae una en los datos—; los que no se pueden decidir (documentos sin
 * lean, incidentes inconclusos) caen en «Indeterminado», que es una narrativa
 * MECE del mismo eje, no un tipo de caso aparte. Así el centro marca el total y
 * las 7 porciones (6 hipótesis + Indeterminado) lo suman. El reparto por valor
 * esperado —comparable— vive en /calidad; aquí es el conteo modal navegable.
 */
export function HypothesesSnapshot() {
  const scored = [...corpusPosteriors(), ...documentPosteriors()];
  const N = scored.length;
  // Conteo por hipótesis MODAL (argmax) conservando «Indeterminado»: enteros y
  // navegables (coinciden con /cases y /probabilidades). Cada caso cuenta 1.
  const rows = modalCounts(scored, { consolidateNonHuman: true, keepIndet: true });

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es={`Cómo se clasifican los ${N} casos del corpus entre las narrativas — suman 100%`}
          en={`How the corpus's ${N} cases classify among the narratives — they sum to 100%`}
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
            href: `/probabilidades/#hyp-${r.key}`,
          }))}
        />
      </div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="Clasificación forzada y navegable — cada caso cuenta 1 en su narrativa más probable (argmax); mundano abierto en misid/natural/posible fraude, no-humano consolidado. Los incidentes se clasifican por el objeto y los casos-documento por el lean de su contenido; «Indeterminado» recoge lo que no se puede decidir. El reparto por valor esperado —comparable, que reparte la incertidumbre— está en /calidad."
          en="Forced, navigable classification — each case counts once in its most-likely narrative (argmax); mundane opened into misid/natural/possible hoax, non-human consolidated. Incidents are classified by the object and document cases by their content's lean; 'Indeterminate' gathers what cannot be decided. The expected-value split —comparable, spreading the uncertainty— is on /calidad."
        />
      </p>
    </div>
  );
}
