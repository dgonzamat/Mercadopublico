import Link from "next/link";
import { cases } from "@/lib/data";
import { TimelineByYear } from "@/components/TimelineByYear";
import { HYPOTHESES } from "@/lib/hypotheses";
import { T } from "@/components/T";
import { Eyebrow, Lede, DisplayNumber } from "@/lib/typography";
import { countryCount } from "@/lib/corpusStats";

export default function HomePage() {
  const countries = countryCount(cases);
  const mainHypothesis = HYPOTHESES[0];

  return (
    <div className="space-y-40 md:space-y-56">
      {/* ────────── HERO ────────── */}
      <section className="grid min-h-[70vh] grid-cols-1 items-end gap-12 pt-12 md:pt-24">
        <div className="space-y-8">
          <Eyebrow>
            <T
              es="UAP Atlas · análisis institucional"
              en="UAP Atlas · institutional analysis"
            />
          </Eyebrow>
          <h1 className="font-display text-[12vw] font-medium leading-[0.95] tracking-tight text-text md:text-[7vw] lg:text-[6rem]">
            <T
              es={
                <>
                  Qué tan probable
                  <br />
                  es <span className="text-accent italic">cada hipótesis</span>
                  <br />
                  sobre los UAP.
                </>
              }
              en={
                <>
                  How likely is{" "}
                  <span className="text-accent italic">each hypothesis</span>
                  <br />
                  about UAP.
                </>
              }
            />
          </h1>
          <Lede className="max-w-xl text-muted">
            <T
              es={`Probabilidad como juicio analítico calibrado (estándar ICD-203) sobre ${cases.length} casos institucionales documentados desde 1947.`}
              en={`Probability as a calibrated analytical judgment (ICD-203 standard) over ${cases.length} institutional cases documented since 1947.`}
            />
          </Lede>
        </div>
      </section>

      {/* ────────── BIG NUMBERS ────────── */}
      <section className="border-y-2 border-text/15 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          <BigStat
            number={cases.length}
            es={{ label: "Casos documentados", sub: "institucionales · 1947–2026" }}
            en={{ label: "Documented cases", sub: "institutional · 1947–2026" }}
          />
          <BigStat
            number={79}
            es={{ label: "Años de fenómeno", sub: "desde Roswell hasta PURSUE" }}
            en={{ label: "Years of phenomenon", sub: "from Roswell to PURSUE" }}
          />
          <BigStat
            number={countries}
            es={{ label: "Países con registros", sub: "militares · civiles · folklóricos" }}
            en={{ label: "Countries with records", sub: "military · civil · folkloric" }}
          />
        </div>
      </section>

      {/* ────────── LA TESIS ────────── */}
      <section className="full-bleed bg-text py-32 text-bg md:py-48">
        <div className="mx-auto max-w-6xl space-y-16 px-4">
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
              <T
                es={`La respuesta de los ${cases.length} casos`}
                en={`The answer of the ${cases.length} cases`}
              />
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl lg:text-6xl">
              <T
                es={
                  <>
                    Los UAP{" "}
                    <span className="text-accent italic">
                      no son una sola cosa
                    </span>{" "}
                    — son varios fenómenos distintos mezclados bajo la misma
                    etiqueta.
                  </>
                }
                en={
                  <>
                    UAP{" "}
                    <span className="text-accent italic">
                      are not one single thing
                    </span>{" "}
                    — they are several distinct phenomena mixed under the same
                    label.
                  </>
                }
              />
            </h2>
            <p className="max-w-3xl font-display text-xl leading-snug text-bg/80 md:text-2xl">
              <T
                es={`Probablemente parte son programas militares clasificados, parte fenómenos naturales raros, parte algo no humano que aún no entendemos, parte identificaciones equivocadas. Una sola explicación no encaja en los ${cases.length} casos.`}
                en={`Probably some are classified military programs, some rare natural phenomena, some something non-human we don't yet understand, some misidentifications. No single explanation fits all ${cases.length} cases.`}
              />
            </p>
          </div>

          <div className="grid gap-px bg-bg/15 md:grid-cols-4">
            <CategoryFact
              eyebrow="48%"
              es={{ label: "Pluralidad", desc: "Son varias cosas, no una" }}
              en={{ label: "Plurality", desc: "Several things, not one" }}
            />
            <CategoryFact
              eyebrow="15%"
              es={{ label: "Interdimensional", desc: "Otras dimensiones, no otros planetas" }}
              en={{ label: "Interdimensional", desc: "Other dimensions, not other planets" }}
            />
            <CategoryFact
              eyebrow="12%"
              es={{ label: "Natural", desc: "Plasma, sprites, ionización" }}
              en={{ label: "Natural", desc: "Plasma, sprites, ionization" }}
            />
            <CategoryFact
              eyebrow="11+8+6%"
              es={{ label: "Otras 3", desc: "Clasificado · Greys · Psicoespiritual" }}
              en={{ label: "Other 3", desc: "Classified · Greys · Psychospiritual" }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/probabilidades"
              className="inline-flex min-h-[48px] items-center whitespace-nowrap bg-accent px-8 py-3 text-base font-medium text-bg hover:bg-bg hover:text-text"
            >
              <T
                es="Ver las 6 hipótesis con su razonamiento →"
                en="See the 6 hypotheses with their reasoning →"
              />
            </Link>
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
              {mainHypothesis.icd.label} ({mainHypothesis.icd.min}–
              {mainHypothesis.icd.max}%){" "}
              <T es="según ICD-203" en="per ICD-203" />
            </p>
          </div>
        </div>
      </section>

      {/* ────────── TIMELINE ────────── */}
      <section className="full-bleed bg-text py-20 md:py-28">
        <div className="mx-auto max-w-6xl space-y-10 px-4">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl">
              <T
                es={
                  <>
                    79 años,{" "}
                    <span className="text-accent italic">
                      {cases.length} casos
                    </span>
                    ,
                    <br />
                    una huella temporal.
                  </>
                }
                en={
                  <>
                    79 years,{" "}
                    <span className="text-accent italic">
                      {cases.length} cases
                    </span>
                    ,
                    <br />
                    a temporal fingerprint.
                  </>
                }
              />
            </h2>
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60 md:text-right">
              <T
                es={
                  <>
                    cada barra = 1 año
                    <br />
                    altura ∝ # casos
                  </>
                }
                en={
                  <>
                    each bar = 1 year
                    <br />
                    height ∝ # of cases
                  </>
                }
              />
            </p>
          </div>
          <TimelineByYear />
          <Link
            href="/cases"
            className="inline-flex min-h-[48px] items-center border-2 border-bg px-8 py-3 text-base font-medium text-bg hover:bg-bg hover:text-text"
          >
            <T
              es={`Explorar los ${cases.length} casos →`}
              en={`Explore the ${cases.length} cases →`}
            />
          </Link>
        </div>
      </section>

      {/* ────────── CIERRE ────────── */}
      <section className="space-y-10 border-t-2 border-text pt-16">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Seguir leyendo" en="Keep reading" />
          </Eyebrow>
          <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-5xl">
            <T es="¿Por dónde sigues?" en="Where do you go next?" />
          </h2>
        </div>
        <div className="grid gap-px bg-text md:grid-cols-3">
          <CtaCard
            number="01"
            es={{
              eyebrow: "10 minutos",
              title: "Resumen",
              desc: "Versión accesible del análisis completo en lenguaje claro.",
            }}
            en={{
              eyebrow: "10 minutes",
              title: "Summary",
              desc: "Accessible version of the full analysis in plain language.",
            }}
            href="/resumen"
          />
          <CtaCard
            number="02"
            es={{
              eyebrow: "Metodología",
              title: "Cómo se construyó",
              desc: "Framework de cuatro tiers, principio Bayesiano, evidencia auditable.",
            }}
            en={{
              eyebrow: "Method",
              title: "How it was built",
              desc: "Four-tier framework, Bayesian principle, auditable evidence.",
            }}
            href="/about"
          />
          <CtaCard
            number="03"
            es={{
              eyebrow: "Visualización",
              title: "Mapa global",
              desc: "52 casos georeferenciados sobre 12 países, 1947–2026.",
            }}
            en={{
              eyebrow: "Visualization",
              title: "Global map",
              desc: "52 georeferenced cases across 12 countries, 1947–2026.",
            }}
            href="/atlas"
          />
        </div>
      </section>
    </div>
  );
}

function CategoryFact({
  eyebrow,
  es,
  en,
}: {
  eyebrow: string;
  es: { label: string; desc: string };
  en: { label: string; desc: string };
}) {
  return (
    <div className="space-y-2 bg-text p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <p className="font-display text-2xl font-medium leading-tight text-bg md:text-3xl">
        <T es={es.label} en={en.label} />
      </p>
      <p className="text-sm leading-snug text-bg/70">
        <T es={es.desc} en={en.desc} />
      </p>
    </div>
  );
}

function CtaCard({
  number,
  es,
  en,
  href,
}: {
  number: string;
  es: { eyebrow: string; title: string; desc: string };
  en: { eyebrow: string; title: string; desc: string };
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 bg-bg p-8 transition hover:bg-text hover:text-bg md:p-10"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-3xl tabular-nums leading-none text-muted group-hover:text-bg/60">
          {number}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted group-hover:text-bg/60">
          <T es={es.eyebrow} en={en.eyebrow} />
        </span>
      </div>
      <p className="font-display text-3xl font-medium leading-tight text-text group-hover:text-bg md:text-4xl">
        <T es={es.title} en={en.title} />
      </p>
      <p className="text-sm leading-relaxed text-muted group-hover:text-bg/80">
        <T es={es.desc} en={en.desc} />
      </p>
      <span
        aria-hidden
        className="mt-auto font-mono text-xs uppercase tracking-widest text-accent group-hover:text-accent"
      >
        <T es="Continuar →" en="Continue →" />
      </span>
    </Link>
  );
}

function BigStat({
  number,
  es,
  en,
}: {
  number: number;
  es: { label: string; sub: string };
  en: { label: string; sub: string };
}) {
  return (
    <div className="space-y-3">
      <DisplayNumber className="text-[clamp(4.5rem,12vw,9rem)] text-accent">
        {number}
      </DisplayNumber>
      <div className="space-y-1 border-t border-text/20 pt-2">
        <p className="text-lg font-semibold text-text">
          <T es={es.label} en={en.label} />
        </p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <T es={es.sub} en={en.sub} />
        </p>
      </div>
    </div>
  );
}
