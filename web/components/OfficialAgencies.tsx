import Link from "next/link";
import { getCase } from "@/lib/data";
import { researchersForCase } from "@/lib/researcherCases";
import { T } from "@/components/T";

/**
 * Showcase de las oficinas oficiales del fenómeno (los Estados que crearon una
 * ventanilla pública). Toma los casos institucionales por id y filtra los que
 * existan, así que se completa solo a medida que se agregan al corpus.
 */
const AGENCY_IDS = [
  "geipan-gepan-france",
  "cridovni-uruguay-1979",
  "oifaa-difaa-peru",
  "cefaa-chile-1997",
  "ciae-cefae-2011",
];

export function OfficialAgencies() {
  const agencies = AGENCY_IDS.map((id) => getCase(id)).filter(
    (c): c is NonNullable<ReturnType<typeof getCase>> => Boolean(c),
  );
  if (agencies.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
        <T
          es={`Agencias oficiales del fenómeno (${agencies.length})`}
          en={`Official agencies for the phenomenon (${agencies.length})`}
        />
      </h2>
      <p className="max-w-3xl text-xs text-muted">
        <T
          es="Los pocos Estados que crearon una oficina pública para recibir, investigar y archivar reportes. Cada una, con su director en el roster."
          en="The few states that created a public office to receive, investigate and archive reports. Each one, with its director in the roster."
        />
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agencies.map((a) => {
          const dirs = researchersForCase(a.id);
          return (
            <Link
              key={a.id}
              href={`/cases/${a.id}`}
              className="block border border-border bg-panel p-4 transition hover:border-accent/50"
            >
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-medium text-text">{a.name}</h3>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted">
                {a.country_name} · {a.year_start}
              </p>
              {dirs.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  {dirs.map((d) => d.name).join(" · ")}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
