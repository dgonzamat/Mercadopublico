import Link from "next/link";
import { cases } from "@/lib/data";
import { IcdProbabilityChart } from "@/components/IcdProbabilityChart";
import { CorpusStats } from "@/components/CorpusStats";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export default function HomePage() {
  return (
    <div className="space-y-16 py-8 md:py-16">
      <section className="space-y-6">
        <Eyebrow>UAP Atlas · análisis institucional</Eyebrow>
        <H1 className="max-w-3xl text-4xl md:text-5xl">
          Qué tan probable es cada hipótesis sobre los UAP.
        </H1>
        <Lede className="max-w-2xl text-muted">
          Probabilidad expresada como juicio analítico calibrado (estándar
          ICD-203) sobre {cases.length} casos institucionales documentados
          desde 1947.
        </Lede>
      </section>

      <IcdProbabilityChart />

      <CorpusStats />

      <section className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href="/probabilidades"
          className="inline-flex min-h-[44px] items-center rounded-md bg-accent px-6 py-2 text-sm font-medium text-bg hover:bg-accent/90"
        >
          Ver razonamiento detallado →
        </Link>
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-6 py-2 text-sm font-medium text-text hover:bg-panel"
        >
          Explorar los {cases.length} casos
        </Link>
      </section>
    </div>
  );
}
