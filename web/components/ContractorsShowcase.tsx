import { LocaleLink } from "@/components/LocaleLink";

import { getCase } from "@/lib/data";
import { researchersForCase } from "@/lib/researcherCases";
import { T } from "@/components/T";
import { countryEn } from "@/lib/i18n-geo";

/**
 * Showcase de la capa de contratistas / FFRDCs del fenómeno — las empresas e
 * institutos privados que el aparato estatal usó para estudiar, analizar o
 * archivar material UAP. Mismo patrón que OfficialAgencies: toma casos por id y
 * filtra los que existan, así que se completa solo a medida que se agregan.
 */
const CONTRACTOR_IDS = [
  "mitre-ffrdc-2026",
  "aawsap-skinwalker-2008",
  "battelle-special-report-1952",
];

export function ContractorsShowcase({ locale }: { locale: "es" | "en" }) {
  const contractors = CONTRACTOR_IDS.map((id) => getCase(id)).filter(
    (c): c is NonNullable<ReturnType<typeof getCase>> => Boolean(c),
  );
  if (contractors.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
        <T
          es={`Contratistas del fenómeno (${contractors.length})`}
          en={`Contractors of the phenomenon (${contractors.length})`}
          locale={locale}
        />
      </h2>
      <p className="max-w-3xl text-xs text-muted">
        <T
          es="La capa menos visible: empresas e institutos privados (FFRDCs, contratistas de la DIA, institutos de análisis) que el Estado usó para estudiar, analizar o archivar material UAP. Cada uno, con su persona del roster cuando existe."
          en="The least visible layer: private firms and institutes (FFRDCs, DIA contractors, analysis institutes) the state used to study, analyze or archive UAP material. Each one, with its roster person where one exists."
          locale={locale}
        />
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contractors.map((c) => {
          const people = researchersForCase(c.id);
          return (
            <LocaleLink
              key={c.id}
              href={`/cases/${c.id}`}
              className="block border border-border bg-panel p-4 transition hover:border-accent/50"
            >
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-medium text-text">{c.name}</h3>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted">
                <T es={c.country_name} en={countryEn(c.country_name)} locale={locale} /> ·{" "}
                {c.year_start}
              </p>
              {people.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  {people.map((d) => d.name).join(" · ")}
                </p>
              )}
            </LocaleLink>
          );
        })}
      </div>
    </section>
  );
}
