import Link from "next/link";
import { cases } from "@/lib/data";
import { researchersForCase } from "@/lib/researcherCases";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { WorldMapLazy } from "@/components/WorldMapLazy";

export const metadata = {
  title: "Atlas — mapa global de casos",
  description: `Mapa global de los ${STATS.cases} casos UAP institucionales documentados entre ${STATS.startYear} y ${STATS.endYear}.`,

  alternates: { canonical: "/atlas/" },
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
    <div className="space-y-8 py-8">
      {/* AT-2 · mismo patrón de header que /cases: Eyebrow + H1 + Lede */}
      <header className="space-y-4">
        <Eyebrow>
          <T
            es={`El territorio · ${STATS.countries} países`}
            en={`The territory · ${STATS.countries} countries`}
          />
        </Eyebrow>
        <H1>
          <T
            es="Dónde pasa lo que no debería estar pasando"
            en="Where the things that shouldn't happen, happen"
          />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es={`${STATS.cases} casos georeferenciados. Si fuera fenómeno gringo, la mancha estaría sobre Nevada. Mira dónde está realmente. Toca un marcador para abrir el caso.`}
            en={`${STATS.cases} georeferenced cases. If it were a US-only phenomenon, the cluster would be over Nevada. Look at where it actually is. Tap a marker to open the case.`}
          />
        </Lede>
      </header>

      <WorldMapLazy countryResearchers={countryResearchers} />

      <nav className="flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        {/* AT-4 · puente al archivo · T-1 esquinas vivas · T-2 sin emoji */}
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T
            es={`Los ${STATS.cases} casos en el archivo →`}
            en={`The ${STATS.cases} cases in the archive →`}
          />
        </Link>
        <Link
          href="/researchers#agencias"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="Agencias oficiales del fenómeno" en="Official agencies for the phenomenon" />
        </Link>
        <Link
          href="/patterns"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T
            es={`Patrones documentados (${STATS.patterns})`}
            en={`Documented patterns (${STATS.patterns})`}
          />
        </Link>
      </nav>
    </div>
  );
}
