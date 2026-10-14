import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { HeterogeneityByDecade } from "@/components/HeterogeneityByDecade";
import { corpusPosteriors, expandedHypotheses, modalHypothesis, PROSAIC_CLASSES } from "@/lib/meceModel";
import { DETAIL_UNSPECIFIED, OBJECT_DETAILS, type ProsaicKey } from "@/lib/meceClasses";
import { cases } from "@/lib/data";

export const metadata = {
  ...pageMeta({
  title: "Probabilities by explanation (MECE model)",
  description:
    "Six mutually exclusive narratives (object + institutional stance): each UAP case allocates 100% and the corpus aggregates them comparably (MECE model).",
  path: "/probabilidades/",
}),
  alternates: { canonical: "/probabilidades/", languages: hreflangFor("/probabilidades/") },
};

/** Qué significa cada hipótesis (y qué hipótesis del marco anterior preserva). */
/** Detalle de los casos cuya clase aún no se contrastó con la fuente. */
const PENDING_REVIEW = { key: "pendiente", label: "Pendiente de revisión", labelEn: "Pending review" } as const;
const SOURCED_DETAIL = { ...DETAIL_UNSPECIFIED, label: "La fuente no fija el objeto", labelEn: "Source does not pin the object" };

const BLURB: Record<string, { es: string; en: string }> = {
  // Lo prosaico se nombra por el OBJETO, no por el error del testigo: las clases
  // de objeto salen de `misidSubtype` (dato), ver PROSAIC_CLASSES; su detalle de
  // segundo nivel (`objectDetail`) se desglosa bajo cada bloque.
  astronomico: {
    es: "Un objeto astronómico tomado por otra cosa: un planeta brillante (Venus, Júpiter), una estrella, la Luna o un meteoro o bólido.",
    en: "An astronomical object taken for something else: a bright planet (Venus, Jupiter), a star, the Moon or a meteor or fireball.",
  },
  aeronave: {
    es: "Una aeronave: avión, helicóptero, dron o globo (meteorológico, de investigación, de fiesta).",
    en: "An aircraft: plane, helicopter, drone or balloon (weather, research, party).",
  },
  espacial: {
    es: "Un objeto espacial: cohete o misil, satélite o reentrada —lanzamientos, etapas y restos que reentran, trenes de satélites—.",
    en: "A space object: rocket or missile, satellite or reentry —launches, stages and debris reentering, satellite trains.",
  },
  luces_tierra: {
    es: "Una luz o una actividad humana (un faro, una bengala o pirotecnia, un vehículo, una llama industrial o una persona) que la distancia o la oscuridad hicieron parecer otra cosa.",
    en: "A human light or activity (a beacon, a flare or fireworks, a vehicle, an industrial flame or a person) that distance or darkness made look like something else.",
  },
  terrestre_otros: {
    es: "El análisis apunta a algo ordinario, como un reflejo o un error de percepción, pero la evidencia no dice de qué objeto se trata.",
    en: "The analysis points to something ordinary, such as a reflection or a perceptual error, but the evidence does not say what object it was.",
  },
  natural: {
    es: "Atmosférico (plasma, rayo en bola, nubes) u óptico (espejismo, refracción). Los meteoros y bólidos se cuentan como objeto astronómico.",
    en: "Atmospheric (plasma, ball lightning, clouds) or optical (mirage, refraction). Meteors and fireballs are counted as astronomical objects.",
  },
  fraude: {
    es: "Montaje o fabricación deliberada.",
    en: "Deliberate staging or fabrication.",
  },
  animal: {
    es: "Aves que reflejan la luz o insectos cerca de la lente, que la cámara convierte en objetos rápidos y lejanos.",
    en: "Birds catching the light or insects near the lens, which the camera turns into fast, distant objects.",
  },
  instrumento: {
    es: "Un defecto de película, un artefacto de sensor, un eco falso de radar o una avería atribuida al objeto.",
    en: "A film defect, a sensor artifact, a false radar echo or a failure blamed on the object.",
  },
  psicosocial: {
    es: "Contagio colectivo, sugestión, parálisis del sueño o una condición médica.",
    en: "Collective contagion, suggestion, sleep paralysis or a medical condition.",
  },
  sin_propuesta: {
    es: "Ninguna fuente propone una causa concreta, pero los casos parecidos que sí se investigaron resultaron casi siempre algo ordinario.",
    en: "No source proposes a specific cause, but similar cases that were investigated almost always turned out to be ordinary.",
  },
  folclore: {
    es: "Leyendas y relatos de época sin testigo verificable.",
    en: "Legends and period tales with no verifiable witness.",
  },
  humana_clasificada: {
    es: "Un programa secreto propio o aliado.",
    en: "A secret own or allied program.",
  },
  adversaria: {
    es: "Tecnología de vigilancia de otro Estado.",
    en: "Another state's surveillance technology.",
  },
  nohumano: {
    es: "Inteligencia o tecnología no humana, la controle u oculte un Estado o no la controle nadie.",
    en: "Non-human intelligence or technology, whether a state controls or hides it or no one does.",
  },
  indet: {
    es: "La evidencia no inclina hacia ninguna explicación.",
    en: "The evidence leans toward no explanation.",
  },
};

export default function ProbabilidadesPage() {
  return <ProbabilidadesView locale="en" />;
}

export function ProbabilidadesView({ locale }: { locale: "es" | "en" }) {
  // Solo los INCIDENTES, por la naturaleza del objeto. Los casos-documento son
  // evidencia, no sucesos: se listan en /cases pero no entran en ningún agregado.
  // Los incidentes que no se pueden decidir caen en «Indeterminado» (keepIndet),
  // una narrativa MECE del mismo eje. Mismo conjunto que la home, /cases y /calidad.
  const scored = corpusPosteriors();
  const incidents = scored.length;
  const docCount = cases.filter((c) => c.category === "document").length;

  // Conjunto expandido de narrativas (mundano abierto en 3 sub-tipos, no-humano
  // consolidado, «Indeterminado» conservado), clasificación forzada. Por masa.
  const hypRows = expandedHypotheses(scored, { consolidateNonHuman: true, keepIndet: true });

  // Nº de casos donde cada narrativa es la explicación modal (misma lógica que
  // el filtro de /cases). Solo necesitamos el conteo: el listado vive en /cases.
  // En la misma pasada, el desglose de SEGUNDO nivel (`objectDetail`) de cada
  // clase prosaica, también modal: qué objeto concreto era, o «sin precisar».
  const modalCount: Record<string, number> = {};
  const detailCount: Record<string, Record<string, number>> = {};
  // Cuántos casos de cada clase tienen su «Por qué» citado de una fuente; el
  // resto conserva una clase heredada que aún no se contrastó.
  const sourcedCount: Record<string, number> = {};
  for (const r of hypRows) modalCount[r.key] = 0;
  for (const s of scored) {
    const m = modalHypothesis(s, { consolidateNonHuman: true, keepIndet: true });
    modalCount[m.key] = (modalCount[m.key] ?? 0) + 1;
    if (s.classSourced) sourcedCount[m.key] = (sourcedCount[m.key] ?? 0) + 1;
    if (OBJECT_DETAILS[m.key as ProsaicKey]) {
      const d = (detailCount[m.key] ??= {});
      // «Sin precisar» se parte en dos: la fuente fija la clase pero no el
      // objeto, o la clase todavía no se ha contrastado con ninguna fuente.
      const k = OBJECT_DETAILS[m.key as ProsaicKey]!.some((x) => x.key === s.objectDetail)
        ? s.objectDetail!
        : s.classSourced
          ? DETAIL_UNSPECIFIED.key
          : PENDING_REVIEW.key;
      d[k] = (d[k] ?? 0) + 1;
    }
  }
  const PROSAIC_KEYS = new Set<string>(PROSAIC_CLASSES.map((c) => c.key));

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <Eyebrow>
        <T es="Probabilidades" en="Probabilities" locale={locale} />
      </Eyebrow>
      <H1>
        <T es="Qué explica cada caso" en="What explains each case" locale={locale} />
      </H1>
      <Lede>
        <T
          es={<>Los {incidents} incidentes del archivo, cada uno en su explicación más probable. <span className="text-base"><LocaleLink href="/about#non-exclusive" className="text-accent underline-offset-4 hover:underline">Cómo se calcula →</LocaleLink></span></>}
          en={<>The archive&apos;s {incidents} incidents, each under its most likely explanation. <span className="text-base"><LocaleLink href="/about#non-exclusive" className="text-accent underline-offset-4 hover:underline">How it is calculated →</LocaleLink></span></>}
          locale={locale}
        />
      </Lede>

      <section className="mt-12">
        <H2>
          <T es="Reparto de los incidentes" en="How the incidents split" locale={locale} />
        </H2>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <MecePartition
            items={scored}
            keepIndet
            consolidateNonHuman
            locale={locale}
            hrefFor={(key) => `#hyp-${key}`}
            totalLabelEs={`Suman 100 % · ${incidents} incidentes`}
            totalLabelEn={`Sum to 100% · ${incidents} incidents`}
          />
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="Lo que queda sin explicación ordinaria, década a década" en="What lacks an ordinary explanation, decade by decade" locale={locale} />
        </H2>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <HeterogeneityByDecade locale={locale} />
        </div>
      </section>

      <section className="mt-16">
        <H2>
          <T es="Cada explicación" en="Each explanation" locale={locale} />
        </H2>

        <div className="mt-8 space-y-10">
          {hypRows.map((c) => {
            const total = modalCount[c.key] ?? 0;
            return (
              <div key={c.key} id={`hyp-${c.key}`} className="scroll-mt-24">
                {/* Cabecera: barra de color de la hipótesis + nombre + nº de casos */}
                <div
                  className="flex items-baseline justify-between gap-3 border-b-2 pb-2"
                  style={{ borderColor: c.color }}
                >
                  <h3 className="font-mono text-sm font-medium text-text">
                    <T es={c.label} en={c.labelEn} locale={locale} />
                  </h3>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {total} <T es="casos" en="cases" locale={locale} />
                  </span>
                </div>

                <Body className="mt-3 text-sm leading-relaxed text-muted">
                  <T es={BLURB[c.key].es} en={BLURB[c.key].en} locale={locale} />
                </Body>

                {/* Segundo nivel: detalle del objeto dentro de la clase (modal). */}
                {total > 0 && OBJECT_DETAILS[c.key as ProsaicKey] && (
                  <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    {[...OBJECT_DETAILS[c.key as ProsaicKey]!, SOURCED_DETAIL, PENDING_REVIEW].filter((d) => (detailCount[c.key]?.[d.key] ?? 0) > 0).map((d) => (
                      <li key={d.key} className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1 font-mono text-[11px]">
                        <span className="text-text">
                          <T es={d.label} en={d.labelEn} locale={locale} />
                        </span>
                        <span className="tabular-nums text-muted">{detailCount[c.key]?.[d.key] ?? 0}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {total > 0 && (
                  <LocaleLink
                    href={`/cases/#${c.key}`}
                    className="group mt-4 inline-flex min-h-[44px] items-center gap-2 font-mono text-xs text-text underline-offset-4 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="group-hover:underline">
                      <T es={`Ver los ${total} casos`} en={`See the ${total} cases`} locale={locale} />
                    </span>
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                  </LocaleLink>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA: explorar el corpus completo */}
        <div className="mt-12 border-t border-border pt-6">
          <LocaleLink
            href="/cases"
            className="group inline-flex min-h-[44px] items-center gap-2 border-2 border-text px-5 font-display text-base font-medium text-text hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T es="Explorar los casos en orden cronológico" en="Explore the cases in chronological order" locale={locale} />
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </LocaleLink>
        </div>
      </section>
    </main>
  );
}
