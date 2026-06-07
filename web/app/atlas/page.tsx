import dynamic from "next/dynamic";
import Link from "next/link";
import { cases } from "@/lib/data";
import { researchersForCase } from "@/lib/researcherCases";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";

const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] min-h-[360px] items-center justify-center rounded-lg border border-border bg-panel text-muted md:h-[600px]">
      <T es="Cargando mapa…" en="Loading map…" />
    </div>
  ),
});

export const metadata = {
  title: "Atlas · UAP Codex",
  description: `Global map of ${STATS.cases} institutional UAP cases ${STATS.startYear}-${STATS.endYear}`,
};

export default function AtlasPage() {
  // Índice país → investigadores asociados (reverse lookup), computado en el
  // server y pasado como prop slim para no bundlear researchers.json al cliente.
  const countryResearchers: Record<
    string,
    { id: string; name: string; flag: string }[]
  > = {};
  for (const c of cases) {
    const list = (countryResearchers[c.country] ??= []);
    for (const r of researchersForCase(c.id)) {
      if (!list.some((x) => x.id === r.id)) {
        list.push({ id: r.id, name: r.name, flag: r.flag });
      }
    }
  }
  for (const code of Object.keys(countryResearchers)) {
    countryResearchers[code].sort((a, b) => a.name.localeCompare(b.name));
  }

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

      <WorldMap countryResearchers={countryResearchers} />

      <nav className="flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        <Link
          href="/researchers#agencias"
          className="inline-flex min-h-[44px] items-center rounded border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="🏛️ Agencias oficiales del fenómeno" en="🏛️ Official agencies for the phenomenon" />
        </Link>
        <Link
          href="/patterns"
          className="inline-flex min-h-[44px] items-center rounded border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T
            es={`🔁 Patrones documentados (${STATS.patterns})`}
            en={`🔁 Documented patterns (${STATS.patterns})`}
          />
        </Link>
      </nav>
    </div>
  );
}
