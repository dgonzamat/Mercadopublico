import { researchers, getFramework } from "@/lib/data";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { CategoryNav } from "@/components/CategoryNav";
import { ResearcherAvatar } from "@/components/ResearcherAvatar";

export const metadata = {
  title: "Disclosure ecosystem · UAP Codex",
  description:
    "Researchers, whistleblowers, politicians, journalists and ontological-religious figures sustaining contemporary UAP disclosure",
};

const sections = [
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
];

export default function ResearchersPage() {
  const sectionList = sections
    .map((section) => ({
      section,
      people: researchers.filter((r) => r.section === section.code),
    }))
    .filter(({ people }) => people.length > 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium text-text md:text-4xl">
          <T
            es="Las personas que no se callaron"
            en="The people who didn't stay quiet"
          />
        </h1>
        <p className="mt-2 text-muted">
          <T
            es={
              <>
                Investigadores, pilotos, congresistas, periodistas y filósofos
                religiosos. Las {STATS.researchers} personas que sostienen el
                discurso UAP sin convertirse en celebridades de feria. Todas en{" "}
                <strong className="text-text">
                  riesgo personal, político o profesional
                </strong>{" "}
                — producen metodología, testimonio o acción, no opinión.
              </>
            }
            en={
              <>
                Researchers, pilots, congresspeople, journalists, and
                religious philosophers. The {STATS.researchers} people who sustain the UAP
                discourse without turning into carnival celebrities. All
                taking{" "}
                <strong className="text-text">
                  personal, political, or professional risk
                </strong>{" "}
                — producing methodology, testimony, or action, not opinion.
              </>
            }
          />
        </p>
      </header>

      <CategoryNav
        label={{ es: "Saltar a una sección", en: "Jump to a section" }}
        items={sectionList.map(({ section, people }) => ({
          anchor: `seccion-${section.code.toLowerCase()}`,
          es: `${section.code} · ${section.es}`,
          en: `${section.code} · ${section.en}`,
          count: people.length,
        }))}
      />

      {sectionList.map(({ section, people: sectionResearchers }) => {
        return (
          <section
            key={section.code}
            id={`seccion-${section.code.toLowerCase()}`}
            className="scroll-mt-20"
          >
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
              <T
                es={`Sección ${section.code} · ${section.es}`}
                en={`Section ${section.code} · ${section.en}`}
              />
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {sectionResearchers.map((r) => {
                const fw = r.framework ? getFramework(r.framework) : undefined;
                return (
                  <a
                    key={r.id}
                    href={`/researchers/${r.id}`}
                    className="flex gap-3 rounded-lg border border-border bg-panel p-4 transition hover:border-accent/50"
                  >
                    <ResearcherAvatar researcher={r} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-base font-medium text-text">
                          <span aria-hidden className="mr-1.5">{r.flag}</span>
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
                          <T es={fw.name} en={fw.name_en} />
                        </p>
                      )}
                      <p className="mt-2 line-clamp-3 text-xs text-muted">
                        <T es={r.bio_short} en={r.bio_short_en} />
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
