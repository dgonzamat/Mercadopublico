import { researchers, getFramework } from "@/lib/data";
import { T } from "@/components/T";

export const metadata = {
  title: "Disclosure ecosystem · UAP Atlas",
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
                religiosos. Las 22 personas que sostienen el discurso UAP
                sin convertirse en celebridades de feria. Todas en{" "}
                <strong className="text-text">
                  riesgo personal, político o profesional
                </strong>{" "}
                — producen metodología, testimonio o acción, no opinión.
              </>
            }
            en={
              <>
                Researchers, pilots, congresspeople, journalists, and
                religious philosophers. The 22 people who sustain the UAP
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

      {sections.map((section) => {
        const sectionResearchers = researchers.filter(
          (r) => r.section === section.code,
        );
        if (sectionResearchers.length === 0) return null;
        return (
          <section key={section.code}>
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
                    className="rounded-lg border border-border bg-panel p-4 transition hover:border-accent/50"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-medium text-text">
                        {r.name}
                      </h3>
                      <span className="font-mono text-xs text-muted">
                        {r.born}
                        {r.death ? `–${r.death}` : "–"}
                      </span>
                    </div>
                    {fw && (
                      <p className="mt-1 text-xs text-accent">{fw.name}</p>
                    )}
                    <p className="mt-2 line-clamp-3 text-xs text-muted">
                      {r.bio_short}
                    </p>
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
