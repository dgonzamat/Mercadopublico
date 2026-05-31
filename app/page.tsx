import Link from "next/link";
import { cases } from "@/lib/data";
import { IcdProbabilityChart } from "@/components/IcdProbabilityChart";
import { CorpusStats } from "@/components/CorpusStats";
import { Eyebrow, H1, Lede, DisplayNumber } from "@/lib/typography";
import { countryCount } from "@/lib/corpusStats";

export default function HomePage() {
  const countries = countryCount(cases);
  return (
    <div className="space-y-40 md:space-y-56">
      {/* ────────── HERO — one idea, full viewport breath ────────── */}
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

      {/* ────────── BIG NUMBERS — corpus en 3 cifras ────────── */}
      <section className="border-y-2 border-text/15 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          <BigStat number={cases.length} label="Casos documentados" sub="institucionales · 1947–2026" />
          <BigStat number={79} label="Años de fenómeno" sub="desde Roswell hasta PURSUE" />
          <BigStat number={countries} label="Países con registros" sub="militares · civiles · folklóricos" />
        </div>
      </section>

      {/* ────────── THE CHART — la pregunta core ────────── */}
      <IcdProbabilityChart />

      {/* ────────── CORPUS STATS — la evidencia bajo el juicio ────────── */}
      <CorpusStats />

      {/* ────────── CTAS ────────── */}
      <section className="border-t-2 border-text/15 pt-12">
        <div className="space-y-6">
          <Eyebrow>Seguir leyendo</Eyebrow>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/probabilidades"
              className="inline-flex min-h-[48px] items-center rounded-none bg-accent px-8 py-3 text-base font-medium text-bg hover:bg-accent/90"
            >
              Razonamiento detallado →
            </Link>
            <Link
              href="/cases"
              className="inline-flex min-h-[48px] items-center rounded-none border-2 border-text px-8 py-3 text-base font-medium text-text hover:bg-text hover:text-bg"
            >
              Explorar los {cases.length} casos
            </Link>
            <Link
              href="/resumen"
              className="inline-flex min-h-[48px] items-center px-2 py-3 text-base font-medium text-text underline decoration-text/20 underline-offset-8 hover:decoration-accent"
            >
              Leer el resumen en 10 min
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
