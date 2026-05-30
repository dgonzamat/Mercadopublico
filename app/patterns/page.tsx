import Link from "next/link";
import { patterns, cases } from "@/lib/data";

export const metadata = {
  title: "Patrones · UAP Atlas",
  description: "18 patrones recurrentes (8a-8r) identificados en el corpus",
};

export default function PatternsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text">Patrones recurrentes</h1>
        <p className="mt-2 text-muted">{patterns.length} patrones identificados a través de convergencia entre casos independientes. No se diseñaron a priori — emergieron tras acumulación de evidencia.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {patterns.map((p) => {
          const count = cases.filter((c) => c.patterns.includes(p.id)).length;
          return (
            <Link key={p.id} href={`/patterns/${p.letter}`} className="rounded-lg border border-border bg-panel p-4 transition hover:border-accent/50" style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-accent">{p.id}</p>
                  <h2 className="mt-1 text-base font-medium text-text">{p.name}</h2>
                </div>
                <span className="rounded bg-bg px-2 py-0.5 font-mono text-[10px] text-muted">{count} casos</span>
              </div>
              <p className="mt-2 text-xs text-muted">{p.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
