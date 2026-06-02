import dynamic from "next/dynamic";
import { cases, patterns } from "@/lib/data";
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
  title: "Atlas · UAP",
  description: "Global map of institutional UAP cases 1947-2026",
};

export default function AtlasPage() {
  const tierS = cases.filter((c) => c.tier === "S").length;
  const tierA = cases.filter((c) => c.tier === "A").length;
  const tierB = cases.filter((c) => c.tier === "B").length;

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
            es={`${cases.length} casos georeferenciados. Si fuera fenómeno gringo, la mancha estaría sobre Nevada. Mirá dónde realmente está. Click un marcador para ver el caso.`}
            en={`${cases.length} georeferenced cases. If it were a US-only phenomenon, the cluster would be over Nevada. Look at where it actually is. Click a marker to see the case.`}
          />
        </p>
      </header>

      <div className="flex flex-wrap gap-3 text-xs">
        <Legend
          color="#8b0000"
          es={`Sólido (S) · ${tierS} casos`}
          en={`Solid (S) · ${tierS} cases`}
        />
        <Legend
          color="#b86b1f"
          es={`Aceptable (A) · ${tierA} casos`}
          en={`Acceptable (A) · ${tierA} cases`}
        />
        <Legend
          color="#1e4f8b"
          es={`Folklórico (B) · ${tierB} casos`}
          en={`Folkloric (B) · ${tierB} cases`}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <WorldMap />
      </div>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es={`Patrones documentados (${patterns.length})`}
            en={`Documented patterns (${patterns.length})`}
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

function Legend({
  color,
  es,
  en,
}: {
  color: string;
  es: string;
  en: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded border border-border bg-panel px-2 py-1 font-mono text-muted">
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <T es={es} en={en} />
    </span>
  );
}
