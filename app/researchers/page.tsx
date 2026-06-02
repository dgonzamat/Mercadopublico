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
    es: "Investigadores científicos / Teóricos",
    en: "Scientific researchers / Theorists",
  },
  {
    code: "B",
    es: "Insiders / Whistleblowers",
    en: "Insiders / Whistleblowers",
  },
  {
    code: "C",
    es: "Actores políticos formales",
    en: "Formal political actors",
  },
  {
    code: "D",
    es: "Periodistas investigativos",
    en: "Investigative journalists",
  },
  {
    code: "E",
    es: "Investigación ontológico-religiosa",
    en: "Ontological-religious research",
  },
];

export default function ResearchersPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium text-text md:text-4xl">
          <T es="Ecosistema de disclosure" en="Disclosure ecosystem" />
        </h1>
        <p className="mt-2 text-muted">
          <T
            es={
              <>
                Categoría epistemológica IV del corpus. Cinco sub-categorías de
                figuras que producen{" "}
                <strong className="text-text">
                  metodología, testimonio o acción bajo riesgo personal/político
                </strong>{" "}
                — no opinión.
              </>
            }
            en={
              <>
                Epistemological category IV of the corpus. Five sub-categories
                of figures who produce{" "}
                <strong className="text-text">
                  methodology, testimony or action under personal/political risk
                </strong>{" "}
                — not opinion.
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
