import Link from "next/link";
import { TimelineByYear } from "@/components/TimelineByYear";
import { T } from "@/components/T";
import { Eyebrow, Lede, DisplayNumber } from "@/lib/typography";
import { STATS } from "@/lib/siteStats";

export const metadata = {
  title: "UAP Atlas — La evidencia institucional",
  description: `Atlas de ${STATS.cases} casos UAP institucionales ${STATS.startYear}–${STATS.endYear} — los que sobrevivieron filtros militares, congresionales y periodísticos. Probabilidades calibradas vía ICD-203.`,
};

export default function HomePage() {
  return (
    <div className="space-y-40 md:space-y-56">
      {/* ────────── 1 · HERO (hook humano + sub-hero filtro) ────────── */}
      <section className="grid min-h-[70vh] grid-cols-1 items-end gap-12 pt-12 md:pt-24">
        <div className="space-y-8">
          <Eyebrow>
            <T
              es="UAP Atlas · investigación abierta"
              en="UAP Atlas · open research"
            />
          </Eyebrow>
          <h1 className="font-display text-[10vw] font-medium leading-[1.02] tracking-tight text-text md:text-[6vw] lg:text-[5rem]">
            <T
              es={
                <>
                  Hay algo que las instituciones no pudieron explicar desde 1947.
                  <br />
                  Llevamos{" "}
                  <span className="text-accent italic">{STATS.years} años</span>{" "}
                  sin acordar qué es.
                </>
              }
              en={
                <>
                  There&apos;s something institutions couldn&apos;t explain since 1947.
                  <br />
                  We&apos;ve spent{" "}
                  <span className="text-accent italic">{STATS.years} years</span>{" "}
                  without agreeing what it is.
                </>
              }
            />
          </h1>
          <Lede className="max-w-2xl text-muted">
            <T
              es={`Un atlas de los ${STATS.cases} casos institucionales mejor documentados — los que sobrevivieron filtros militares, congresionales y periodísticos. No es lista de avistamientos. Es la evidencia que no se explica fácil.`}
              en={`An atlas of the ${STATS.cases} best-documented institutional cases — the ones that survived military, congressional, and journalistic filters. Not a sightings list. The evidence that doesn't explain away easily.`}
            />
          </Lede>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/atlas"
              className="inline-flex min-h-[44px] items-center gap-2 border-2 border-text px-5 py-2 text-sm font-medium text-text hover:bg-text hover:text-bg"
            >
              <T
                es={`Ver el mapa global · ${STATS.countries} países`}
                en={`See the global map · ${STATS.countries} countries`}
              />
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/cases"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted hover:text-accent"
            >
              <T
                es={`Caminar los ${STATS.cases} casos cronológicamente`}
                en={`Walk the ${STATS.cases} cases chronologically`}
              />
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ────────── 2 · TESIS (sube del beat 3 al 2 — NYT lead pattern) ────────── */}
      <section className="full-bleed bg-text py-32 text-bg md:py-48">
        <div className="mx-auto max-w-6xl space-y-16 px-4">
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
              <T
                es={`La respuesta del corpus en una frase`}
                en={`The corpus answer in one sentence`}
              />
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl lg:text-6xl">
              <T
                es={
                  <>
                    Los UAP{" "}
                    <span className="text-accent italic">
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
                    <span className="text-accent italic">
                      are not one single thing
                    </span>
                    . They are several distinct things mixed under the same
                    label — and that&apos;s exactly what makes them hard to
                    explain.
                  </>
                }
              />
            </h2>
            <p className="max-w-3xl font-display text-xl leading-snug text-bg/80 md:text-2xl">
              <T
                es={`Parte son programas militares clasificados (lo sabemos desde el U-2). Parte son fenómenos naturales raros (plasma, sprites, ionización). Parte son identificaciones equivocadas (siempre). Y en una porción no menor: algo no humano que aún no sabemos categorizar.`}
                en={`Part are classified military programs (we've known since the U-2). Part are rare natural phenomena (plasma, sprites, ionization). Part are misidentifications (always). And a non-trivial portion: something non-human we don't yet know how to categorize.`}
              />
            </p>
          </div>

          <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
            <T
              es={
                <>
                  Las 4 principales — el chart completo (8 hipótesis) en{" "}
                  <Link href="/probabilidades" className="text-accent hover:underline">
                    /probabilidades
                  </Link>
                </>
              }
              en={
                <>
                  The 4 main ones — full chart (8 hypotheses) at{" "}
                  <Link href="/probabilidades" className="text-accent hover:underline">
                    /probabilidades
                  </Link>
                </>
              }
            />
          </p>
          <div className="grid gap-px bg-bg/15 md:grid-cols-4">
            <CategoryFact
              eyebrow="97%"
              es={{ label: "Misidentificación", desc: "Globos, satélites, aves — siempre el grueso" }}
              en={{ label: "Misidentification", desc: "Balloons, satellites, birds — always the bulk" }}
            />
            <CategoryFact
              eyebrow="88%"
              es={{ label: "Programa clasificado", desc: "Casi seguro que parte del corpus es black-budget militar" }}
              en={{ label: "Classified program", desc: "Almost certain part of the corpus is military black-budget" }}
            />
            <CategoryFact
              eyebrow="70%"
              es={{ label: "Natural raro", desc: "Plasma, sprites, ionización (Hessdalen, Marfa)" }}
              en={{ label: "Rare natural", desc: "Plasma, sprites, ionization (Hessdalen, Marfa)" }}
            />
            <CategoryFact
              eyebrow="45%"
              es={{ label: "Algo no humano", desc: "Aquí está la frontera analítica real" }}
              en={{ label: "Something non-human", desc: "This is the actual analytical frontier" }}
            />
          </div>

          <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
            <T
              es="Cada % es independiente — no suman 100, porque pueden ser varias cosas al mismo tiempo."
              en="Each % is independent — they don't sum to 100, because they can be several things at once."
            />
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/probabilidades"
              className="inline-flex min-h-[48px] items-center whitespace-nowrap bg-accent px-8 py-3 text-base font-medium text-bg hover:bg-bg hover:text-text"
            >
              <T
                es="Por qué cada hipótesis tiene esa probabilidad →"
                en="Why each hypothesis has that probability →"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ────────── 3 · BIG NUMBERS (ahora con narrativa) ────────── */}
      <section className="border-y-2 border-text/15 py-16 md:py-24">
        <div className="space-y-4">
          <Eyebrow>
            <T es="El alcance" en="The scope" />
          </Eyebrow>
          <h2 className="max-w-3xl font-display text-2xl font-medium leading-snug text-text md:text-3xl">
            <T
              es="No es teoría — es una colección documentada de evidencia."
              en="It's not theory — it's a documented evidence collection."
            />
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          <BigStat
            number={STATS.cases}
            es={{
              label: "Casos institucionales",
              sub: "Sobrevivieron filtros militares, congresionales y periodísticos",
            }}
            en={{
              label: "Institutional cases",
              sub: "Survived military, congressional, and journalistic filters",
            }}
          />
          <BigStat
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
      </section>

      {/* ────────── 4 · TIMELINE con copy que cuenta ────────── */}
      <section className="full-bleed bg-text py-20 md:py-28">
        <div className="mx-auto max-w-6xl space-y-10 px-4">
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
              <T
                es="Distribución temporal"
                en="Temporal distribution"
              />
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl">
              <T
                es={
                  <>
                    Los reportes no se distribuyen al azar.
                    <br />
                    Cuatro <span className="text-accent italic">picos</span> marcan rupturas institucionales.
                  </>
                }
                en={
                  <>
                    Reports don&apos;t distribute randomly.
                    <br />
                    Four <span className="text-accent italic">peaks</span> mark institutional ruptures.
                  </>
                }
              />
            </h2>
            <p className="max-w-3xl text-base leading-snug text-bg/80 md:text-lg">
              <T
                es={
                  <>
                    <strong className="text-accent">1947</strong> Roswell — USAF crea Project Sign · <strong className="text-accent">1973</strong> Pascagoula — Senate hearings · <strong className="text-accent">2004</strong> Nimitz — primer video oficial ATFLIR · <strong className="text-accent">2026</strong> PURSUE — primer disclosure presidencial. Cada pico es un momento donde una institución no pudo seguir negando.
                  </>
                }
                en={
                  <>
                    <strong className="text-accent">1947</strong> Roswell — USAF creates Project Sign · <strong className="text-accent">1973</strong> Pascagoula — Senate hearings · <strong className="text-accent">2004</strong> Nimitz — first official ATFLIR video · <strong className="text-accent">2026</strong> PURSUE — first presidential disclosure. Each peak is a moment when an institution could no longer keep denying.
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
              es={`Caminar los ${STATS.cases} casos en orden cronológico →`}
              en={`Walk the ${STATS.cases} cases chronologically →`}
            />
          </Link>
        </div>
      </section>

      {/* ────────── 5 · CIERRE — CTAs en pregunta del lector ────────── */}
      <section className="space-y-10 border-t-2 border-text pt-16">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Empezá por la pregunta que más te importe" en="Start with the question that matters most to you" />
          </Eyebrow>
          <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-5xl">
            <T es="¿Por dónde sigues?" en="Where do you go next?" />
          </h2>
        </div>
        <div className="grid gap-px bg-text md:grid-cols-3">
          <CtaCard
            number="01"
            es={{
              eyebrow: "El caso más fuerte",
              title: "¿Cuál es la mejor evidencia?",
              desc: `Los ${STATS.tierS} casos Tier S del corpus: militar + sensor + múltiples testigos.`,
            }}
            en={{
              eyebrow: "The strongest case",
              title: "What's the best evidence?",
              desc: `The ${STATS.tierS} Tier S cases of the corpus: military + sensor + multiple witnesses.`,
            }}
            href="/cases"
          />
          <CtaCard
            number="02"
            es={{
              eyebrow: "El razonamiento",
              title: "¿Por qué nadie acuerda qué son?",
              desc: "8 explicaciones con su probabilidad. Una sola se queda 50-50 — ahí vive el debate real.",
            }}
            en={{
              eyebrow: "The reasoning",
              title: "Why does no one agree what they are?",
              desc: "8 explanations with their probability. Only one stays 50-50 — that's where the real debate lives.",
            }}
            href="/probabilidades"
          />
          <CtaCard
            number="03"
            es={{
              eyebrow: "La distribución global",
              title: "¿Es lo mismo en todo el mundo?",
              desc: `${STATS.cases} casos sobre ${STATS.countries} países. Bélgica, Chile, Brasil y España tienen casos militares oficiales tan sólidos como EEUU.`,
            }}
            en={{
              eyebrow: "Global distribution",
              title: "Is it the same everywhere?",
              desc: `${STATS.cases} cases across ${STATS.countries} countries. Belgium, Chile, Brazil and Spain have official military cases as solid as the US.`,
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
      <h3 className="font-display text-2xl font-medium leading-tight text-bg md:text-3xl">
        <T es={es.label} en={en.label} />
      </h3>
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
      <h3 className="font-display text-3xl font-medium leading-tight text-text group-hover:text-bg md:text-4xl">
        <T es={es.title} en={en.title} />
      </h3>
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
