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
          es={`Cómo se clasifican los ${N} incidentes del corpus entre las narrativas — suman 100%`}
          en={`How the corpus's ${N} incidents classify among the narratives — they sum to 100%`}
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
          es="Clasificación forzada y navegable — cada incidente cuenta 1 en su narrativa más probable (argmax); lo prosaico se nombra por lo que era —clases de objeto, fenómeno natural, posible fraude—, no-humano consolidado. Los documentos no cuentan: son evidencia, no sucesos. «Indeterminado» recoge lo que no se puede decidir. «Con menos del 50 %» cuenta los casos cuya narrativa más probable gana solo por mayoría simple, sin llegar a la mitad de su reparto. El reparto por valor esperado —comparable, que reparte la incertidumbre— está en /calidad."
          en="Forced, navigable classification — each incident counts once in its most-likely narrative (argmax); the prosaic is named by what it was —object classes, natural phenomenon, possible hoax—, non-human consolidated. Documents do not count: they are evidence, not events. 'Indeterminate' gathers what cannot be decided. 'Below 50%' counts the cases whose most-likely narrative wins only by plurality, without reaching half of their split. The expected-value split —comparable, spreading the uncertainty— is on /calidad."
        />
      </p>
    </div>
  );
}
