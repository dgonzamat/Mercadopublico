import { researchers, getFramework } from "@/lib/data";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { LocaleLink } from "@/components/LocaleLink";
import { CategoryNav } from "@/components/CategoryNav";
import { ResearcherAvatar } from "@/components/ResearcherAvatar";
import { RegionFilter } from "@/components/RegionFilter";
import { OfficialAgencies } from "@/components/OfficialAgencies";
import { ContractorsShowcase } from "@/components/ContractorsShowcase";
import { regionOf, flagToCountry, type Region } from "@/lib/regions";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  ...pageMeta({
    title: "Actors of the UAP disclosure ecosystem",
    description:
      "Researchers, whistleblowers, politicians, journalists and ontological-religious figures who sustain contemporary UAP disclosure — plus a directory of abductees and contactees.",
    path: "/researchers/",
  }),
  alternates: {
    canonical: "/researchers/",
    languages: hreflangFor("/researchers/"),
  },
};

type SectionDef = {
  code: string;
  es: string;
  en: string;
  /** Nota editorial opcional bajo el título (solo la usa F). */
  noteEs?: string;
  noteEn?: string;
};

const sections: SectionDef[] = [
  {
    code: "A",
    es: "Los que estudian con instrumentos",
    en: "Those who study with instruments",
  },
  {
    code: "B",
    es: "Los que estuvieron adentro",
    en: "Those who were inside",
  },
  {
    code: "C",
    es: "Los que pelean en el Capitolio",
    en: "Those who fight on Capitol Hill",
  },
  {
    code: "D",
    es: "Los que publican el documento",
    en: "Those who publish the document",
  },
  {
    code: "E",
    es: "Los que se preguntan qué clase de cosa es esto",
    en: "Those who ask what kind of thing this is",
  },
  {
    code: "F",
    es: "Los que dicen que les pasó a ellos",
    en: "Those who say it happened to them",
    // Única sección con nota: acá el sujeto no investiga el fenómeno, dice
    // haberlo vivido. Sin ese encuadre, listar a un experiencer junto a un
    // investigador de la sección A se lee como aval del relato.
    noteEs:
      "A diferencia de las secciones anteriores, acá el sujeto no es quien investiga el fenómeno sino quien dice haberlo vivido. Se ordenan por el peso documental del expediente asociado —testigos, evaluación institucional, costo asumido—, no por la verosimilitud del relato: la sección incluye casos que su propio protagonista terminó desmintiendo.",
    noteEn:
      "Unlike the previous sections, here the subject is not the one investigating the phenomenon but the one who says they lived it. They are ordered by the documentary weight of the associated file —witnesses, institutional evaluation, cost incurred—, not by the plausibility of the account: the section includes cases their own protagonist ended up denying.",
  },
];

export default function ResearchersPage() {
  return <ResearchersView locale="en" />;
}

export function ResearchersView({ locale }: { locale: "es" | "en" }) {
  const sectionList = sections
    .map((section) => ({
      section,
      people: researchers.filter((r) => r.section === section.code),
    }))
    .filter(({ people }) => people.length > 0);

  const regionCounts: Partial<Record<Region, number>> = {};
  for (const r of researchers) {
    const reg = regionOf(flagToCountry(r.flag));
    if (reg) regionCounts[reg] = (regionCounts[reg] ?? 0) + 1;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Eyebrow>
          <T
            es={`El ecosistema · ${STATS.researchers} actores`}
            en={`The ecosystem · ${STATS.researchers} actors`}
            locale={locale}
          />
        </Eyebrow>
        <H1>
          <T
            es="Las personas que no se callaron"
            en="The people who didn't stay quiet"
            locale={locale}
          />
        </H1>
        <Lede className="text-muted">
          <T
            locale={locale}
            es={
              <>
                Investigadores, pilotos, congresistas, periodistas y filósofos
                religiosos, más quienes dicen haber vivido el fenómeno en carne
                propia. {STATS.researchers} personas: las que sostienen el
                discurso UAP en{" "}
                <strong className="text-text">
                  riesgo personal, político o profesional
                </strong>{" "}
                —producen metodología, testimonio o acción, no opinión— y, en la
                sección F, los experiencers cuyo relato es la materia prima que
                el resto examina.
              </>
            }
            en={
              <>
                Researchers, pilots, congresspeople, journalists, and religious
                philosophers, plus those who say they lived the phenomenon
                themselves. {STATS.researchers} people: those who sustain the UAP
                discourse at{" "}
                <strong className="text-text">
                  personal, political, or professional risk
                </strong>{" "}
                —producing methodology, testimony, or action, not opinion— and,
                in section F, the experiencers whose accounts are the raw
                material the rest examine.
              </>
            }
          />
        </Lede>
      </header>

      <CategoryNav
        locale={locale}
        label={{ es: "Saltar a una sección", en: "Jump to a section" }}
        items={sectionList.map(({ section, people }) => ({
          anchor: `seccion-${section.code.toLowerCase()}`,
          es: `${section.code} · ${section.es}`,
          en: `${section.code} · ${section.en}`,
          count: people.length,
        }))}
      />

      <RegionFilter counts={regionCounts} total={researchers.length} locale={locale}>
      {sectionList.map(({ section, people: sectionResearchers }) => {
        return (
          <section
            key={section.code}
            id={`seccion-${section.code.toLowerCase()}`}
            data-group
            className="scroll-mt-20"
          >
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
              <T
                es={`Sección ${section.code} · ${section.es}`}
                en={`Section ${section.code} · ${section.en}`}
                locale={locale}
              />
            </h2>
            {section.noteEs && section.noteEn && (
              <p className="mt-2 max-w-2xl border-l-2 border-border pl-3 text-xs leading-relaxed text-muted">
                <T es={section.noteEs} en={section.noteEn} locale={locale} />
              </p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {sectionResearchers.map((r) => {
                const fw = r.framework ? getFramework(r.framework) : undefined;
                return (
                  <div
                    key={r.id}
                    data-region={regionOf(flagToCountry(r.flag)) ?? "otro"}
                    className="contents"
                  >
                  <LocaleLink
                    href={`/researchers/${r.id}`}
                    prefetch={false}
                    className="flex gap-3 border border-border bg-panel p-4 transition hover:border-accent/50"
                  >
                    <ResearcherAvatar researcher={r} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-base font-medium text-text">
                          {r.name}
                        </h3>
                        <span className="font-mono text-xs text-muted">
                          {r.born ? (
                            <>
                              {r.born}
                              {r.death ? `–${r.death}` : "–"}
                            </>
                          ) : null}
                        </span>
                      </div>
                      {fw && (
                        <p className="mt-1 text-xs text-accent">
                          <T es={fw.name} en={fw.name_en} locale={locale} />
                        </p>
                      )}
                      <p className="mt-2 line-clamp-3 text-xs text-muted">
                        <T es={r.bio_short} en={r.bio_short_en} locale={locale} />
                      </p>
                    </div>
                  </LocaleLink>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      </RegionFilter>

      <section id="agencias" className="scroll-mt-20 border-t border-border pt-8">
        <OfficialAgencies locale={locale} />
      </section>

      <section id="contratistas" className="scroll-mt-20 border-t border-border pt-8">
        <ContractorsShowcase locale={locale} />
      </section>
    </div>
  );
}
