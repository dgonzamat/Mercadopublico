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

      {/* ────────── CIERRE — 3 CTAs visuales ────────── */}
      <section className="space-y-10 border-t-2 border-text pt-16">
        <div className="space-y-3">
          <Eyebrow>Seguir leyendo</Eyebrow>
          <h2 className="font-display text-3xl font-medium leading-tight text-text md:text-5xl">
            ¿Por dónde sigues?
          </h2>
        </div>
        <div className="grid gap-px bg-text md:grid-cols-3">
          <CtaCard
            number="01"
            eyebrow="10 minutos"
            title="Resumen"
            desc="Versión accesible del análisis completo en lenguaje claro."
            href="/resumen"
          />
          <CtaCard
            number="02"
            eyebrow="Metodología"
            title="Cómo se construyó"
            desc="Framework de cuatro tiers, principio Bayesiano, evidencia auditable."
            href="/about"
          />
          <CtaCard
            number="03"
            eyebrow="Visualización"
            title="Mapa global"
            desc="52 casos georeferenciados sobre 12 países, 1947–2026."
            href="/atlas"
          />
        </div>
      </section>
    </div>
  );
}

function CtaCard({
  number,
  eyebrow,
  title,
  desc,
  href,
}: {
  number: string;
  eyebrow: string;
  title: string;
  desc: string;
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
          {eyebrow}
        </span>
      </div>
      <p className="font-display text-3xl font-medium leading-tight text-text group-hover:text-bg md:text-4xl">
        {title}
      </p>
      <p className="text-sm leading-relaxed text-muted group-hover:text-bg/80">
        {desc}
      </p>
      <span
        aria-hidden
        className="mt-auto font-mono text-xs uppercase tracking-widest text-accent group-hover:text-accent"
      >
        Continuar →
      </span>
    </Link>
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
