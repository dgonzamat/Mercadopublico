import { corpusPosteriors } from "@/lib/meceModel";
import { MecePartition } from "@/components/MeceChart";
import { T } from "@/components/T";

/**
 * Snapshot de las hipótesis para la Home (fondo oscuro bg-text).
 * Clasifica los INCIDENTES por la naturaleza del objeto; los casos-documento
 * quedan fuera (son evidencia, no sucesos). Los incidentes que no se pueden
 * decidir caen en «Indeterminado», una narrativa MECE del mismo eje. El centro
 * marca el nº de incidentes y las porciones (clases prosaicas + hipótesis +
 * Indeterminado) lo suman. El reparto por valor esperado —comparable— vive en
 * /calidad; aquí es el conteo modal navegable.
 *
 * Wrapper delgado de MecePartition con tone="dark" y showDerived=false.
 */
export function HypothesesSnapshot({ locale }: { locale: "es" | "en" }) {
  const scored = corpusPosteriors();
  const N = scored.length;

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          locale={locale}
          es={`Cómo se reparten los ${N} incidentes del archivo entre las explicaciones (suman 100 %)`}
          en={`How the archive's ${N} incidents split among the explanations (they sum to 100%)`}
        />
      </p>
      <div className="mt-8">
        <MecePartition
          items={scored}
          locale={locale}
          tone="dark"
          consolidateNonHuman
          keepIndet
          showDerived={false}
          hrefFor={(key) => `/probabilidades/#hyp-${key}`}
          totalLabelEs=""
          totalLabelEn=""
        />
      </div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          locale={locale}
          es="Cada incidente cuenta una vez, en la explicación más probable para ese caso. Las explicaciones ordinarias se nombran por lo que era el objeto (un astro, un avión, un globo…), un fenómeno natural o un posible fraude; las dos explicaciones no humanas van juntas. «Indeterminado» reúne los casos que no se pueden decidir. «Con menos del 50 %» cuenta los casos en que esa explicación es la más probable sin llegar a la mitad. Los documentos no cuentan: son evidencia de los casos, no casos. En /calidad está el reparto que suma las probabilidades en vez de contar casos."
          en="Each incident counts once, under the most likely explanation for that case. Ordinary explanations are named by what the object was (a star or planet, an aircraft, a balloon…), a natural phenomenon or a possible hoax; the two non-human explanations are grouped. 'Indeterminate' holds the cases that cannot be decided. 'Below 50%' counts the cases where that explanation is the most likely without reaching half. Documents do not count: they are evidence for the cases, not cases. /calidad shows the split that adds up probabilities instead of counting cases."
        />
      </p>
    </div>
  );
}
