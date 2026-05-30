import dynamic from "next/dynamic";
import { cases, patterns } from "@/lib/data";

const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-panel text-muted">Cargando mapa…</div>
  ),
});

export const metadata = {
  title: "Atlas · UAP",
  description: "Mapa global de casos institucionales UAP 1947-2026",
};

export default function AtlasPage() {
  const tierS = cases.filter((c) => c.tier === "S").length;
  const tierA = cases.filter((c) => c.tier === "A").length;
  const tierB = cases.filter((c) => c.tier === "B").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-text">Pattern Atlas</h1>
        <p className="mt-2 text-muted">{cases.length} casos UAP institucionales distribuidos globalmente (1947–2026). Click un marcador para ver el caso.</p>
      </header>

      <div className="flex flex-wrap gap-3 text-xs">
        <Legend color="#ff4d4d" label={`Tier S · ${tierS} casos`} />
        <Legend color="#ffb347" label={`Tier A · ${tierA} casos`} />
        <Legend color="#7fdbff" label={`Tier B · ${tierB} casos`} />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <WorldMap />
      </div>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Patrones documentados ({patterns.length})</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {patterns.map((p) => (
            <a key={p.id} href={`/patterns/${p.letter}`} className="rounded border border-border bg-panel px-2.5 py-1 text-xs hover:border-accent/50" style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}>
              <span className="font-mono text-accent">{p.id}</span> <span className="text-text">{p.name}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded border border-border bg-panel px-2 py-1 font-mono text-muted">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
