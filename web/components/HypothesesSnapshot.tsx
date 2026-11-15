import { corpusPosteriors } from "@/lib/meceModel";
import { MecePartition } from "@/components/MeceChart";
import { T } from "@/components/T";
import { LocaleLink } from "@/components/LocaleLink";

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

  return (
    <div>
      <div>
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
      <p className="mt-8 font-mono text-[11px] text-bg/50">
        <T
          locale={locale}
          es={<>Cada incidente cuenta una vez, en su explicación más probable. <LocaleLink href="/about#non-exclusive" className="underline underline-offset-4 hover:text-bg">Cómo se calcula →</LocaleLink></>}
          en={<>Each incident counts once, under its most likely explanation. <LocaleLink href="/about#non-exclusive" className="underline underline-offset-4 hover:text-bg">How it is calculated →</LocaleLink></>}
        />
      </p>
    </div>
  );
}
