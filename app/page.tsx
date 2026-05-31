import Link from "next/link";
import { cases } from "@/lib/data";
import { TimelineByYear } from "@/components/TimelineByYear";
import { HYPOTHESES } from "@/lib/hypotheses";
import { Eyebrow, Lede, DisplayNumber } from "@/lib/typography";
import { countryCount } from "@/lib/corpusStats";

export default function HomePage() {
  const countries = countryCount(cases);
  const mainHypothesis = HYPOTHESES[0]; // Pluralidad — the corpus's position

  return (
    <div className="space-y-40 md:space-y-56">
      {/* ────────── HERO ────────── */}
      <section className="grid min-h-[70vh] grid-cols-1 items-end gap-12 pt-12 md:pt-24">
        <div className="space-y-8">
          <Eyebrow>UAP Atlas · análisis institucional</Eyebrow>
          <h1 className="font-display text-[12vw] font-medium leading-[0.95] tracking-tight text-text md:text-[7vw] lg:text-[6rem]">
            Qué tan probable
            <br />
            es <span className="text-accent italic">cada hipótesis</span>
            <br />
            sobre los UAP.
          </h1>
          <Lede className="max-w-xl text-muted">
            Probabilidad como juicio analítico calibrado (estándar ICD-203)
            sobre {cases.length} casos institucionales documentados desde 1947.
          </Lede>
        </div>
      </section>

      {/* ────────── BIG NUMBERS ────────── */}
      <section className="border-y-2 border-text/15 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          <BigStat
            number={cases.length}
            label="Casos documentados"
            sub="institucionales · 1947–2026"
          />
          <BigStat
            number={79}
            label="Años de fenómeno"
            sub="desde Roswell hasta PURSUE"
          />
          <BigStat
            number={countries}
            label="Países con registros"
            sub="militares · civiles · folklóricos"
          />
        </div>
      </section>

      {/* ────────── LA TESIS — una sola respuesta visible ────────── */}
      <section className="full-bleed bg-text py-32 text-bg md:py-48">
        <div className="mx-auto max-w-6xl space-y-16 px-4">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
              La respuesta principal
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl lg:text-6xl">
              "El corpus apoya{" "}
              <span className="text-accent">pluralidad de inteligencias</span>{" "}
              — probablemente son varios fenómenos distintos, no uno solo."
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
                {mainHypothesis.icd.label} · {mainHypothesis.icd.min}–
                {mainHypothesis.icd.max}%
              </p>
              <p className="font-display text-2xl leading-snug text-bg md:text-3xl">
                Las otras 5 hipótesis son <em>improbables</em> según ICD-203,
                pero el corpus las documenta para que puedas auditarlas.
              </p>
            </div>
            <Link
              href="/probabilidades"
              className="inline-flex min-h-[48px] items-center self-start whitespace-nowrap border-2 border-accent bg-accent px-8 py-3 text-base font-medium text-bg hover:bg-bg hover:text-accent md:self-end"
            >
              Ver las 6 hipótesis →
            </Link>
          </div>
        </div>
      </section>

      {/* ────────── TIMELINE — visual stand-alone ────────── */}
      <section className="full-bleed bg-text py-20 md:py-28">
        <div className="mx-auto max-w-6xl space-y-10 px-4">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <h2 className="font-display text-3xl font-medium leading-tight text-bg md:text-5xl">
              79 años,{" "}
              <span className="text-accent italic">{cases.length} casos</span>,
              <br />
              una huella temporal.
            </h2>
            <p className="font-mono text-xs uppercase tracking-widest text-bg/60 md:text-right">
              cada barra = 1 año
              <br />
              altura ∝ # casos
            </p>
          </div>
          <TimelineByYear />
          <Link
            href="/cases"
            className="inline-flex min-h-[48px] items-center border-2 border-bg px-8 py-3 text-base font-medium text-bg hover:bg-bg hover:text-text"
          >
            Explorar los {cases.length} casos →
          </Link>
        </div>
      </section>

      {/* ────────── CIERRE ────────── */}
      <section className="border-t-2 border-text/15 pt-12">
        <div className="space-y-6">
          <Eyebrow>Seguir leyendo</Eyebrow>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Link
              href="/resumen"
              className="font-display text-2xl text-text underline decoration-text/20 underline-offset-8 hover:decoration-accent md:text-3xl"
            >
              Resumen en 10 minutos →
            </Link>
            <Link
              href="/about"
              className="font-display text-2xl text-text underline decoration-text/20 underline-offset-8 hover:decoration-accent md:text-3xl"
            >
              Cómo se construyó →
            </Link>
            <Link
              href="/atlas"
              className="font-display text-2xl text-text underline decoration-text/20 underline-offset-8 hover:decoration-accent md:text-3xl"
            >
              Mapa global →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function BigStat({
  number,
  label,
  sub,
}: {
  number: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="space-y-3">
      <DisplayNumber className="text-[clamp(4.5rem,12vw,9rem)] text-accent">
        {number}
      </DisplayNumber>
      <div className="space-y-1 border-t border-text/20 pt-2">
        <p className="text-lg font-semibold text-text">{label}</p>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {sub}
        </p>
      </div>
    </div>
  );
}
