import dynamic from "next/dynamic";
import { patterns } from "@/lib/data";
import { STATS } from "@/lib/siteStats";
import { OfficialAgencies } from "@/components/OfficialAgencies";
import { T } from "@/components/T";

const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-panel text-muted">
      <T es="Cargando mapa…" en="Loading map…" />
    </div>
  ),
});

export const metadata = {
  title: "Atlas · UAP Codex",
  description: `Global map of ${STATS.cases} institutional UAP cases ${STATS.startYear}-${STATS.endYear}`,
};

export default function AtlasPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium text-text md:text-4xl">
          <T
            es="Dónde pasa lo que no debería estar pasando"
            en="Where the things that shouldn't happen, happen"
          />
        </h1>
        <p className="mt-2 text-muted">
          <T
            es={`${STATS.cases} casos georeferenciados. Si fuera fenómeno gringo, la mancha estaría sobre Nevada. Mirá dónde realmente está. Click un marcador para ver el caso.`}
            en={`${STATS.cases} georeferenced cases. If it were a US-only phenomenon, the cluster would be over Nevada. Look at where it actually is. Click a marker to see the case.`}
          />
        </p>
      </header>

      <WorldMap />

      <OfficialAgencies />

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es={`Patrones documentados (${STATS.patterns})`}
            en={`Documented patterns (${STATS.patterns})`}
          />
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {patterns.map((p) => (
            <a
              key={p.id}
              href={`/patterns/${p.letter}`}
              className="inline-flex min-h-[44px] items-center rounded border border-border bg-panel px-2.5 py-1 text-xs hover:border-accent/50"
              style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
            >
              <span className="font-mono text-accent">{p.id}</span>{" "}
              <span className="text-text">{p.name}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
