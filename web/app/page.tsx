import Link from "next/link";
import { TimelineByYear } from "@/components/TimelineByYear";
import { T } from "@/components/T";
import { Eyebrow, Lede, DisplayNumber } from "@/lib/typography";
import { STATS } from "@/lib/siteStats";
import { cases } from "@/lib/data";
import { getHypothesis } from "@/lib/hypotheses";
import { effectiveCalibration } from "@/lib/hypothesisMapping";
import { pctToIcdLabel } from "@/lib/icd203";

function effectiveLabelFor(id: string): { pct: number; es: string; en: string } {
  const h = getHypothesis(id);
  if (!h) return { pct: 0, es: "—", en: "—" };
  const pct = Math.round(effectiveCalibration(h, cases).pct);
  const icd = pctToIcdLabel(pct);
  return { pct, es: icd.labelEs, en: icd.label };
}

export const metadata = {
  title: "UAP Codex — La evidencia institucional",
  description: `Compendio de ${STATS.cases} casos UAP institucionales ${STATS.startYear}–${STATS.endYear} — los que sobrevivieron filtros militares, congresionales y periodísticos. Probabilidades calibradas vía ICD-203.`,
  // Canonical/hreflang específicos de la home. NO van en el layout: ahí se
  // heredan a todas las páginas y hacían que cada ruta canonicalizara a "/".
  alternates: {
    canonical: "/",
    languages: {
      es: "/",
      en: "/",
      "x-default": "/",
    },
  },
};

export default function HomePage() {
  return (
    <div className="space-y-40 md:space-y-56">
      {/* ────────── 1 · HERO (hook humano + sub-hero filtro) ────────── */}
      <section className="grid min-h-[70vh] grid-cols-1 items-end gap-12 pt-12 md:pt-24">
        <div className="space-y-8">
          <Eyebrow>
            <T
              es="UAP Codex · investigación abierta"
              en="UAP Codex · open research"
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
              es={`Un compendio de los ${STATS.cases} casos institucionales mejor documentados — los que sobrevivieron filtros militares, congresionales y periodísticos. No es lista de avistamientos. Es la evidencia que no se explica fácil.`}
              en={`A compendium of the ${STATS.cases} best-documented institutional cases — the ones that survived military, congressional, and journalistic filters. Not a sightings list. The evidence that doesn't explain away easily.`}
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

      {/* ────────── 2 · EL ALCANCE (big numbers + CTA) ────────── */}
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
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/cases"
            className="inline-flex min-h-[48px] items-center border-2 border-text px-8 py-3 text-base font-medium text-text hover:bg-text hover:text-bg"
          >
            <T
              es={`Explorar los ${STATS.cases} casos →`}
              en={`Explore the ${STATS.cases} cases →`}
            />
          </Link>
        </div>
      </section>

      {/* ────────── 3 · TESIS (NYT lead pattern) ────────── */}
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
                es={`La mayoría apunta a programas militares clasificados — lo sabemos desde el U-2 (1950s) y el F-117 (1980s). Una porción no menor involucra entidades no humanas que aún no sabemos categorizar. Algunos pueden ser fenómenos naturales raros (plasma, sprites), aunque la evidencia multi-sensora militar excluye esa lectura en la mayoría de los Tier S. Las identificaciones equivocadas se filtran antes — quedan los ${STATS.cases} casos que las superaron.`}
                en={`Most point to classified military programs — we've known since the U-2 (1950s) and the F-117 (1980s). A non-trivial portion involves non-human entities we don't yet know how to categorize. Some may be rare natural phenomena (plasma, sprites), though multi-sensor military evidence rules that out for most Tier S cases. Misidentifications get filtered out first — what remains are the ${STATS.cases} cases that survived that culling.`}
              />
            </p>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-bg/70">
            <T
              es={`Antes de mirar el corpus: la gran mayoría de reportes UAP en la población general son confusiones — globos, satélites, aves, lens flares. Project Blue Book resolvió cerca del 97% así. Lo que sigue son las explicaciones para el resto: los ${STATS.cases} casos que pasaron el filtro institucional.`}
              en={`Before looking at the corpus: the vast majority of UAP reports in the general population are confusions — balloons, satellites, birds, lens flares. Project Blue Book resolved roughly 97% that way. What follows are the explanations for the rest: the ${STATS.cases} cases that passed the institutional filter.`}
            />
          </p>

          <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
            <T
              es={
                <>
                  Las 3 explicaciones principales del corpus — el cuadro completo en{" "}
                  <Link href="/probabilidades" className="text-accent hover:underline">
                    /probabilidades
                  </Link>
                </>
              }
              en={
                <>
                  The 3 main corpus explanations — full breakdown at{" "}
                  <Link href="/probabilidades" className="text-accent hover:underline">
                    /probabilidades
                  </Link>
                </>
              }
            />
          </p>
          <div className="grid gap-px bg-bg/15 md:grid-cols-3">
            {(() => {
              const c1 = effectiveLabelFor("programas-clasificados");
              return (
                <CategoryFact
                  icdEs={c1.es}
                  icdEn={c1.en}
                  pct={c1.pct}
                  es={{ label: "Programa clasificado", desc: "Casi seguro que parte son drones experimentales no acknowledged — pasó con el U-2, el F-117 y el B-2" }}
                  en={{ label: "Classified program", desc: "Almost certain part are unannounced experimental drones — happened with the U-2, F-117 and B-2" }}
                />
              );
            })()}
            {(() => {
              const c2 = effectiveLabelFor("fenomenos-naturales");
              return (
                <CategoryFact
                  icdEs={c2.es}
                  icdEn={c2.en}
                  pct={c2.pct}
                  es={{ label: "Natural raro", desc: "Plasma atmosférico, sprites, ionización (recurrencias en Hessdalen, Marfa, Popocatépetl)" }}
                  en={{ label: "Rare natural", desc: "Atmospheric plasma, sprites, ionization (recurrences at Hessdalen, Marfa, Popocatépetl)" }}
                />
              );
            })()}
            {(() => {
              const c3 = effectiveLabelFor("entidades-no-humanas");
              return (
                <CategoryFact
                  icdEs={c3.es}
                  icdEn={c3.en}
                  pct={c3.pct}
                  es={{ label: "Entidades no humanas", desc: "La categoría más amplia — donde realmente vive el debate. Calibrada al alza por presión multi-sensora del corpus." }}
                  en={{ label: "Non-human entities", desc: "The broadest category — where the real debate lives. Calibrated upward by multi-sensor pressure from the corpus." }}
                />
              );
            })()}
          </div>

          <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
            <T
              es="Cada % es independiente — no suman 100, porque un mismo caso puede caer en más de una."
              en="Each % is independent — they don't sum to 100, because a single case can fall into more than one."
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
                    <strong className="text-accent">1947</strong> Roswell — USAF crea Project Sign · <strong className="text-accent">1973</strong> Pascagoula — Senate hearings · <strong className="text-accent">2004</strong> Nimitz — primer video oficial ATFLIR · <strong className="text-accent">2026</strong> PURSUE — primera divulgación presidencial. Cada pico es un momento donde una institución no pudo seguir negando.
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
              desc: `Los ${STATS.tierS} casos del corpus con evidencia más sólida: militares con sensor, múltiples testigos, paper trail verificable.`,
            }}
            en={{
              eyebrow: "The strongest case",
              title: "What's the best evidence?",
              desc: `The ${STATS.tierS} corpus cases with the strongest evidence: military with sensor, multiple witnesses, verifiable paper trail.`,
            }}
            href="/cases"
          />
          <CtaCard
            number="02"
            es={{
              eyebrow: "El razonamiento",
              title: "¿Por qué nadie acuerda qué son?",
              desc: "6 explicaciones plausibles, cada una con su nivel de confianza. La de entidades no humanas es la que más se discute — y la única que un solo experimento podría mover.",
            }}
            en={{
              eyebrow: "The reasoning",
              title: "Why does no one agree what they are?",
              desc: "6 plausible explanations, each with its confidence level. The non-human entities one is the most debated — and the only one a single experiment could move.",
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
  icdEs,
  icdEn,
  pct,
  es,
  en,
}: {
  icdEs: string;
  icdEn: string;
  pct: number;
  es: { label: string; desc: string };
  en: { label: string; desc: string };
}) {
  return (
    <div className="space-y-2 bg-text p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        <T es={icdEs} en={icdEn} />{" "}
        <span className="text-bg/50">({pct}%)</span>
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
