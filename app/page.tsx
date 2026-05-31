import Link from "next/link";
import { cases } from "@/lib/data";
import { IcdProbabilityChart } from "@/components/IcdProbabilityChart";
import { CorpusStats } from "@/components/CorpusStats";

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* HERO — objetivo en 30 seg */}
      <section className="pt-12">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Análisis institucional de UAP — Unidentified Anomalous Phenomena
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-text sm:text-6xl">
          Qué tan probable es
          <br />
          <span className="text-muted">cada hipótesis sobre UAP</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Probabilidad expresada como juicio analítico calibrado (estándar ICD-203),
          sobre {cases.length} casos institucionales documentados desde 1947.
        </p>
      </section>

      {/* CAPA 1 — Juicio analítico via ICD-203 */}
      <IcdProbabilityChart />

      {/* CAPA 2 — Hechos verificables del corpus */}
      <CorpusStats />

      {/* CTAs */}
      <section className="flex flex-wrap gap-3 border-t border-border pt-8">
        <Link
          href="/probabilidades"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:bg-accent/90"
        >
          Ver el razonamiento detallado →
        </Link>
        <Link
          href="/cases"
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-panel"
        >
          Explorar los {cases.length} casos
        </Link>
      </section>
    </div>
  );
}
