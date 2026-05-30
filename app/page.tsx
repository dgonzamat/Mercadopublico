import Link from "next/link";
import { cases, patterns, frameworks } from "@/lib/data";

export default function HomePage() {
  const tierS = cases.filter((c) => c.tier === "S").length;
  const featured = cases
    .filter((c) =>
      ["tehran-1976", "jal1628-1986", "grusch-testimony-2023", "pursue-r03-2026", "lake-huron-2023", "belgian-wave-1989"].includes(c.id)
    )
    .sort((a, b) => b.probability - a.probability);

  return (
    <div className="space-y-16">
      <section className="pt-12">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">1947 — 2026</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-text sm:text-6xl">
          79 años de fenómeno UAP
          <br />
          <span className="text-muted">documentados institucionalmente</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          {cases.length} casos verificables · {patterns.length} patrones recurrentes · {frameworks.length} frameworks teóricos comparados.
          Análisis bilingüe ES/EN con metodología Bayesiana explícita.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cases" className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:bg-accent/90">Explorar {cases.length} casos →</Link>
          <Link href="/resumen" className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-panel">Leer resumen 10 min</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Casos institucionales" value={cases.length.toString()} />
        <Stat label="Tier S (alta confianza)" value={tierS.toString()} />
        <Stat label="Patrones recurrentes" value={patterns.length.toString()} />
        <Stat label="Frameworks comparados" value={frameworks.length.toString()} />
      </section>

      <section>
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted">Los módulos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ModuleCard href="/atlas" badge="En vivo" title="Pattern Atlas" desc="Mapa mundial interactivo + filtros por tier. Visualiza convergencia de fenómenos a través de 79 años." />
          <ModuleCard badge="Roadmap" title="Bayesian Lab" desc="Calculadora interactiva. Ajusta tus priors sobre las 9 hipótesis y compara con el análisis del corpus." soon />
          <ModuleCard badge="Roadmap" title="Convergence Engine" desc="Buscador semántico. Selecciona un caso y encuentra los estructuralmente más similares en el corpus." soon />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted">Casos destacados</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (<FeaturedCase key={c.id} caseData={c} />))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-mono uppercase tracking-widest text-muted">La taxonomía de disclosure 8m/8n/8q/8r</h2>
        <p className="mt-3 max-w-2xl text-muted">El aporte analítico central. Cualquier evento UAP institucional cae en una de cuatro categorías según quién controla el contenido vs quién libera la información.</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-panel">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted"></th>
                <th className="px-4 py-3 text-left font-medium">Estado controla</th>
                <th className="px-4 py-3 text-left font-medium">Nadie controla</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="bg-panel px-4 py-3 font-medium text-muted">Info viene del estado</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8m</span> Cover-up clásico<br />
                  <span className="text-xs text-muted">“no hay nada que ver” · 1947-2016</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8r</span> Leaks/WikiLeaks<br />
                  <span className="text-xs text-muted">Cablegate · Podesta · 2010+</span>
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="bg-panel px-4 py-3 font-medium text-muted">Estado + sociedad</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8n</span> Ambigüedad estratégica<br />
                  <span className="text-xs text-muted">PURSUE 2026</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8q</span> Ecosystem disclosure<br />
                  <span className="text-xs text-muted">Luna · Burchett · Coulthart · Grusch</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel px-4 py-3">
      <p className="text-3xl font-bold text-text">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

function ModuleCard({ href, badge, title, desc, soon }: { href?: string; badge: string; title: string; desc: string; soon?: boolean }) {
  const inner = (
    <div className={`rounded-lg border p-5 transition ${soon ? "border-border bg-panel opacity-70" : "group border-border bg-panel hover:border-accent/50"}`}>
      <div className="flex items-center gap-2">
        <span className="rounded bg-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">{badge}</span>
        {soon && (<span className="rounded bg-tierA/20 px-2 py-0.5 font-mono text-[10px] uppercase text-tierA">próximamente</span>)}
      </div>
      <h3 className={`mt-3 text-lg font-medium ${soon ? "text-muted" : "text-text group-hover:text-accent"}`}>{title}</h3>
      <p className="mt-2 text-sm text-muted">{desc}</p>
    </div>
  );
  return soon || !href ? inner : <Link href={href}>{inner}</Link>;
}

function FeaturedCase({ caseData }: { caseData: import("@/lib/types").UAPCase }) {
  const tierClasses = caseData.tier === "S" ? "border-tierS/40 bg-tierS/5" : caseData.tier === "A" ? "border-tierA/40 bg-tierA/5" : "border-tierB/40 bg-tierB/5";
  return (
    <Link href={`/cases/${caseData.id}`} className={`block rounded-lg border ${tierClasses} p-4 transition hover:border-accent/50`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text">{caseData.flag} {caseData.name}</p>
        <span className="font-mono text-xs text-muted">{caseData.year_start}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-2xl font-bold text-text">{caseData.probability}%</span>
        <span className="rounded bg-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">Tier {caseData.tier}</span>
      </div>
    </Link>
  );
}
