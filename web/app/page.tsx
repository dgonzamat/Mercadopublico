import { TimelineByYear } from "@/components/TimelineByYear";
import { Cta } from "@/components/Cta";
import { HeroRadar } from "@/components/HeroRadar";
import { CountUp } from "@/components/CountUp";
import { HypothesesSnapshot } from "@/components/HypothesesSnapshot";
import { InstagramLink } from "@/components/InstagramLink";
import { PinterestLink } from "@/components/PinterestLink";
import { T } from "@/components/T";
import { Eyebrow, Lede, DisplayNumber } from "@/lib/typography";
import { STATS } from "@/lib/siteStats";

export const metadata = {
  title: "UAP Codex — The institutional evidence",
  description: `${STATS.cases} UAP cases (${STATS.startYear}–${STATS.endYear}) documented by governments, militaries and the press, each with its sources, evidence tier and a comparable probability across six explanations.`,
  // Canonical/hreflang específicos de la home. NO van en el layout: ahí se
  // heredan a todas las páginas y hacían que cada ruta canonicalizara a "/".
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      es: "/es/",
      "x-default": "/",
    },
  },
};

export default function HomePage() {
  return <HomeView locale="en" />;
}

export function HomeView({ locale }: { locale: "es" | "en" }) {
  return (
    <div className="space-y-24 md:space-y-40">
      {/* ────────── 1 · HERO (radar oscuro + count-up) ────────── */}
      <section className="full-bleed relative -mt-8 overflow-hidden bg-text">
        <HeroRadar contacts={STATS.cases} />
        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-6xl grid-cols-1 items-end gap-12 px-4 pb-20 pt-16 md:pt-28">
          {/* readout de instrumento — alineado a la columna de contenido (mismo
              eje que el header) y bajo el header fijo. Cableado a STATS; punto
              cuadrado para no reintroducir rounded. */}
          <div className="pointer-events-none absolute right-4 top-[88px] hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bg/55 md:flex">
            <span className="h-1.5 w-1.5 animate-pulse bg-accent-bright" />
            <T
              locale={locale}
              es={`Barrido activo · ${STATS.cases} contactos`}
              en={`Sweep active · ${STATS.cases} contacts`}
            />
          </div>
          <div className="max-w-2xl space-y-8">
            <Eyebrow className="!text-bg/55">
              <T
                locale={locale}
                es="UAP Codex · investigación abierta"
                en="UAP Codex · open research"
              />
            </Eyebrow>
            <h1 className="font-display text-[clamp(2.75rem,7vw,5rem)] font-medium leading-[1.05] tracking-tight text-bg">
              <T
                locale={locale}
                es={
                  <>
                    <span className="text-accent-bright italic">
                      <CountUp to={STATS.years} /> años
                    </span>{" "}
                    sin explicación oficial.
                  </>
                }
                en={
                  <>
                    <span className="text-accent-bright italic">
                      <CountUp to={STATS.years} /> years
                    </span>{" "}
                    without an official explanation.
                  </>
                }
              />
            </h1>
            <Lede className="max-w-2xl !text-bg/70">
              <T
                locale={locale}
                es={`Hay algo que las instituciones no pudieron — o no quisieron — explicar desde 1947. Un compendio de ${STATS.cases} casos documentados por gobiernos, militares y prensa, cada uno con sus fuentes, su nivel de evidencia y una probabilidad comparable. No es una lista de avistamientos: incluye también los que tienen explicación ordinaria, para que se vea qué se explica y qué no.`}
                en={`There's something institutions couldn't — or wouldn't — explain since 1947. A compendium of ${STATS.cases} cases documented by governments, militaries and the press, each with its sources, its evidence tier and a comparable probability. Not a sightings list: it also includes the ones with an ordinary explanation, so you can see what is explained and what is not.`}
              />
            </Lede>
            <div className="flex flex-wrap gap-3 pt-2">
              <Cta href="/cases" variant="primary" onDark>
                <T
                  locale={locale}
                  es={`Explorar los ${STATS.cases} casos`}
                  en={`Explore the ${STATS.cases} cases`}
                />
                <span aria-hidden>→</span>
              </Cta>
              <Cta href="/probabilidades" variant="ghost" onDark>
                <T
                  locale={locale}
                  es="Qué tan probable es cada explicación"
                  en="How likely each explanation is"
                />
                <span aria-hidden>→</span>
              </Cta>
            </div>
            {/* Social · Instagram. Tono "dark" por el hero oscuro (D1 contraste);
                target 44px en el componente (D4). */}
            <div className="flex items-center gap-3 pt-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-bg/55">
                <T locale={locale} es="Síguenos" en="Follow" />
              </span>
              <InstagramLink tone="dark" />
              <PinterestLink tone="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* ────────── 2 · EL ALCANCE (big numbers + CTA) ────────── */}
      <section className="border-y-2 border-text/15 py-16 md:py-24">
        <div className="space-y-4">
          <Eyebrow>
            <T locale={locale} es="El alcance" en="The scope" />
          </Eyebrow>
          <h2 className="max-w-3xl font-display text-2xl font-medium leading-snug text-text md:text-3xl">
            <T
              locale={locale}
              es="Una colección documentada de evidencia, caso por caso."
              en="A documented collection of evidence, case by case."
            />
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          <BigStat
            locale={locale}
            number={STATS.cases}
            es={{
              label: "Casos institucionales",
              sub: `Y ${STATS.documents} documentos oficiales que los respaldan`,
            }}
            en={{
              label: "Institutional cases",
              sub: `Plus ${STATS.documents} official documents that back them`,
            }}
          />
          <BigStat
            locale={locale}
            number={STATS.years}
            es={{
              label: "Años de fenómeno",
              sub: "Más tiempo del que duró toda la Guerra Fría (1947–1991)",
            }}
            en={{
              label: "Years of phenomenon",
              sub: "Longer than the entire Cold War (1947–1991)",
            }}
          />
          <BigStat
            locale={locale}
            number={STATS.countries}
            es={{
              label: "Países con registros",
              sub: "Cada continente menos Antártida — no es fenómeno gringo",
            }}
            en={{
              label: "Countries with records",
              sub: "Every continent except Antarctica — not a US-only phenomenon",
            }}
          />
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Cta href="/atlas" variant="secondary">
            <T
              locale={locale}
              es={`Ver el mapa global · ${STATS.countries} países →`}
              en={`See the global map · ${STATS.countries} countries →`}
            />
          </Cta>
        </div>
      </section>

      {/* ────────── 3 · TESIS + TIMELINE (una sola banda oscura · RD-1) ────────── */}
      <section className="full-bleed bg-text py-32 text-bg md:py-48">
        <div className="mx-auto max-w-6xl space-y-16 px-4">
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
              <T
                locale={locale}
                es={`La respuesta del archivo, en una frase y en números`}
                en={`What the archive says, in one sentence and in numbers`}
              />
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl lg:text-6xl">
              <T
                locale={locale}
                es={
                  <>
                    Los UAP{" "}
                    <span className="text-accent-bright italic">
                      no son una sola cosa
                    </span>
                    . Son varias cosas distintas mezcladas bajo la misma
                    etiqueta — y eso es justamente lo que hace difícil
                    explicarlos.
                  </>
                }
                en={
                  <>
                    UAP{" "}
                    <span className="text-accent-bright italic">
                      are not one single thing
                    </span>
                    . They are several distinct things mixed under the same
                    label — and that&apos;s exactly what makes them hard to
                    explain.
                  </>
                }
              />
            </h2>
            <p className="max-w-prose text-lg leading-relaxed text-bg/80">
              <T
                locale={locale}
                es={`En buena parte de los ${STATS.cases} casos la explicación más probable es ordinaria: aviones, globos, astros, satélites o fenómenos naturales. Otra parte sigue sin explicación con lo que se sabe hoy. Una minoría apunta a tecnología humana secreta —como lo fueron el U-2 en los cincuenta y el F-117 en los ochenta— o de otro Estado, y otra minoría a entidades no humanas. El gráfico de abajo lo reparte caso a caso.`}
                en={`In a good share of the ${STATS.cases} cases the most likely explanation is ordinary: aircraft, balloons, celestial bodies, satellites or natural phenomena. Another share remains unexplained with what is known today. A minority points to secret human technology —as the U-2 was in the 1950s and the F-117 in the 1980s— or another state's, and another minority to non-human entities. The chart below splits it case by case.`}
              />
            </p>
          </div>

          {/* PB-1 · el foco del sitio: la respuesta en números, no solo detrás de un CTA */}
          <HypothesesSnapshot locale={locale} />

          <div className="flex flex-wrap items-center gap-4">
            <Cta
              href="/probabilidades"
              variant="primary"
              onDark
              className="whitespace-nowrap"
            >
              <T
                locale={locale}
                es="Cómo se reparte el archivo entre explicaciones →"
                en="How the archive splits among the explanations →"
              />
            </Cta>
          </div>
        </div>

        {/* RD-1 · La timeline es la evidencia visual de la tesis — misma banda oscura,
            separada por un border sutil en vez de un hueco crema entre dos bloques negros. */}
        <div className="mx-auto mt-20 max-w-6xl space-y-10 border-t border-bg/20 px-4 pt-16 md:mt-28 md:pt-20">
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
              <T
                locale={locale}
                es="Distribución temporal"
                en="Temporal distribution"
              />
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl">
              <T
                locale={locale}
                es={
                  <>
                    Los reportes no se distribuyen al azar.
                    <br />
                    Cuatro <span className="text-accent-bright italic">picos</span> marcan rupturas institucionales.
                  </>
                }
                en={
                  <>
                    Reports don&apos;t distribute randomly.
                    <br />
                    Four <span className="text-accent-bright italic">peaks</span> mark institutional ruptures.
                  </>
                }
              />
            </h2>
            <p className="max-w-3xl text-base leading-snug text-bg/80 md:text-lg">
              <T
                locale={locale}
                es={
                  <>
                    <strong className="text-accent-bright">1947</strong> Roswell — USAF crea Project Sign · <strong className="text-accent-bright">1973</strong> Pascagoula — Senate hearings · <strong className="text-accent-bright">2004</strong> Nimitz — primer video oficial ATFLIR · <strong className="text-accent-bright">2026</strong> PURSUE — primera divulgación presidencial. Cada pico es un momento donde una institución no pudo seguir negando.
                  </>
                }
                en={
                  <>
                    <strong className="text-accent-bright">1947</strong> Roswell — USAF creates Project Sign · <strong className="text-accent-bright">1973</strong> Pascagoula — Senate hearings · <strong className="text-accent-bright">2004</strong> Nimitz — first official ATFLIR video · <strong className="text-accent-bright">2026</strong> PURSUE — first presidential disclosure. Each peak is a moment when an institution could no longer keep denying.
                  </>
                }
              />
            </p>
          </div>
          <TimelineByYear />
          <Cta href="/cases" variant="secondary" onDark>
            <T
              locale={locale}
              es={`Caminar los ${STATS.cases} casos en orden cronológico →`}
              en={`Walk the ${STATS.cases} cases chronologically →`}
            />
          </Cta>
        </div>
      </section>

    </div>
  );
}

function BigStat({
  number,
  es,
  en,
  locale,
}: {
  number: number;
  es: { label: string; sub: string };
  en: { label: string; sub: string };
  locale: "es" | "en";
}) {
  return (
    <div className="space-y-3">
      <DisplayNumber className="text-[clamp(4.5rem,12vw,9rem)] text-accent">
        {number}
      </DisplayNumber>
      <div className="space-y-1 border-t border-text/20 pt-2">
        <p className="text-lg font-semibold text-text">
          <T locale={locale} es={es.label} en={en.label} />
        </p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <T locale={locale} es={es.sub} en={en.sub} />
        </p>
      </div>
    </div>
  );
}
