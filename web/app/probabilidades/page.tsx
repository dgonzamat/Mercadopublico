import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";
import { MecePartition } from "@/components/MeceChart";
import { HeterogeneityByDecade } from "@/components/HeterogeneityByDecade";
import { corpusPosteriors, expandedHypotheses, modalHypothesis, PROSAIC_CLASSES } from "@/lib/meceModel";
import { DETAIL_UNSPECIFIED, OBJECT_DETAILS, type ProsaicKey } from "@/lib/meceClasses";
import { cases } from "@/lib/data";
import { AnalyzerCta } from "@/components/AnalyzerCta";

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
    es: "Algo en tierra: un faro o reflector, una bengala o fuegos artificiales, los faros de un vehículo, la llama de una plataforma o una persona. La fuente estaba en el suelo o cerca de él, y la distancia, el relieve o el miedo la hicieron parecer otra cosa.",
    en: "Something on the ground: a beacon or searchlight, a flare or fireworks, a vehicle's headlights, a platform's gas flare or a person. The source was on or near the ground, and distance, terrain or fear made it look like something else.",
  },
  terrestre_otros: {
    es: "Un objeto convencional no precisado: el análisis apunta a algo ordinario, como un reflejo o un error de percepción, pero la evidencia no dice de qué clase de objeto se trata.",
    en: "A conventional object, not pinned down: the analysis points to something ordinary, such as a reflection or a perceptual error, but the evidence does not say what class of object it was.",
  },
  natural: {
    es: "Fenómeno natural genuino poco entendido: atmosférico (plasma, rayo en bola, nubes) u óptico (espejismo, refracción). Física real, no una nave ni un engaño. Los meteoros y bólidos se cuentan como objeto astronómico.",
    en: "A genuine, poorly-understood natural phenomenon: atmospheric (plasma, ball lightning, clouds) or optical (mirage, refraction). Real physics, not a craft or a hoax. Meteors and fireballs are counted as astronomical objects.",
  },
  fraude: {
    es: "Posible engaño deliberado: montaje, fabricación o hoax.",
    en: "Possible deliberate deception: staging, fabrication or hoax.",
  },
  animal: {
    es: "Un animal: aves que reflejan la luz en vuelo o insectos cerca de la lente, que la cámara convierte en objetos rápidos y lejanos.",
    en: "An animal: birds catching the light in flight or insects near the lens, which the camera turns into fast, distant objects.",
  },
  instrumento: {
    es: "Fallo de instrumento: lo anómalo lo produjo el equipo, no el cielo — un defecto de película o de revelado, un artefacto de sensor, un eco falso de radar o una avería que se atribuyó al objeto.",
    en: "Instrument artifact: the anomaly came from the equipment, not the sky — a film or processing defect, a sensor artifact, a false radar echo or a failure that was blamed on the object.",
  },
  psicosocial: {
    es: "Causa psicológica, médica o social: contagio colectivo, sugestión, parálisis del sueño o una condición médica (una crisis epiléptica, por ejemplo).",
    en: "Psychological, medical or social cause: collective contagion, suggestion, sleep paralysis or a medical condition (an epileptic seizure, for instance).",
  },
  sin_propuesta: {
    es: "Causa ordinaria probable, sin identificar: ninguna fuente propone una causa concreta, pero los casos parecidos que sí se investigaron resultaron casi siempre algo ordinario.",
    en: "Likely ordinary, unidentified: no source proposes a specific cause, but similar cases that were investigated almost always turned out to be ordinary.",
  },
  folclore: {
    es: "Relato folclórico o literario: leyendas y relatos de época sin testigo verificable.",
    en: "Folklore or literary account: legends and period tales with no verifiable witness.",
  },
  humana_clasificada: {
    es: "Programa secreto propio o aliado (el encubrimiento es intrínseco). Antigua hipótesis «programas clasificados».",
    en: "A secret own or allied program (cover-up is intrinsic). Former 'classified programs' hypothesis.",
  },
  adversaria: {
    es: "Tecnología de vigilancia de otro Estado. Antigua hipótesis «tecnología adversaria».",
    en: "Another state's surveillance technology. Former 'adversary technology' hypothesis.",
  },
  nohumano: {
    es: "Inteligencia o tecnología no humana, tanto si un Estado la controla u oculta (ingeniería inversa, un tratado) como si nadie la controla (la idea de Vallée, lo interdimensional).",
    en: "Non-human intelligence or technology, whether a state controls or hides it (reverse-engineering, a treaty) or no one controls it (Vallée's idea, the interdimensional).",
  },
  indet: {
    es: "Indeterminado: la evidencia no inclina hacia ninguna explicación. No es una explicación, sino la falta de una.",
    en: "Indeterminate: the evidence leans toward no explanation. It is not an explanation but the lack of one.",
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
        <T es="Probabilidades · modelo comparable" en="Probabilities · comparable model" locale={locale} />
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
          <T es="Las seis explicaciones" en="The six explanations" locale={locale} />
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
        <Caption>
          <T es="La parte de cada década sin explicación ordinaria." en="The share of each decade with no ordinary explanation." locale={locale} />
        </Caption>
        <div className="mt-6 rounded-sm border border-border bg-panel p-5">
          <HeterogeneityByDecade locale={locale} />
        </div>
      </section>

      <div className="mt-12">
        <AnalyzerCta locale={locale} />
      </div>

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
                  <h3 className="font-mono text-sm font-medium uppercase tracking-wider text-text">
                    <T es={c.label} en={c.labelEn} locale={locale} />
                  </h3>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {total} <T es="casos" en="cases" locale={locale} />
                  </span>
                </div>

                <Body className="mt-3 text-sm leading-relaxed text-muted">
                  <T es={BLURB[c.key].es} en={BLURB[c.key].en} locale={locale} />
                </Body>

                {total > 0 && PROSAIC_KEYS.has(c.key) && (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted">
                    <T
                      es={`${sourcedCount[c.key] ?? 0} de ${total} con su porqué citado de una fuente · ${total - (sourcedCount[c.key] ?? 0)} pendientes de revisión`}
                      en={`${sourcedCount[c.key] ?? 0} of ${total} with their reason cited from a source · ${total - (sourcedCount[c.key] ?? 0)} pending review`}
                      locale={locale}
                    />
                  </p>
                )}

                {/* Segundo nivel: detalle del objeto dentro de la clase (modal). */}
                {total > 0 && OBJECT_DETAILS[c.key as ProsaicKey] && (
                  <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    {[...OBJECT_DETAILS[c.key as ProsaicKey]!, SOURCED_DETAIL, PENDING_REVIEW].map((d) => (
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
                    className="group mt-4 inline-flex min-h-[44px] items-center gap-2 font-mono text-xs uppercase tracking-widest text-text underline-offset-4 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
