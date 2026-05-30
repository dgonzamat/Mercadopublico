import { researchers, getFramework } from "@/lib/data";

export const metadata = {
  title: "Ecosistema de disclosure · UAP Atlas",
  description: "Investigadores, whistleblowers, políticos, periodistas y figuras ontológico-religiosas que sostienen el disclosure UAP contemporáneo",
};

const sections = [
  { code: "A", label: "Investigadores científicos / Teóricos" },
  { code: "B", label: "Insiders / Whistleblowers" },
  { code: "C", label: "Actores políticos formales" },
  { code: "D", label: "Periodistas investigativos" },
  { code: "E", label: "Investigación ontológico-religiosa" },
];

export default function ResearchersPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text">Ecosistema de disclosure</h1>
        <p className="mt-2 text-muted">Categoría epistemológica IV del corpus. Cinco sub-categorías de figuras que producen <strong className="text-text">metodología, testimonio o acción bajo riesgo personal/político</strong> — no opinión.</p>
      </header>

      {sections.map((section) => {
        const sectionResearchers = researchers.filter((r) => r.section === section.code);
        if (sectionResearchers.length === 0) return null;
        return (
          <section key={section.code}>
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Sección {section.code} · {section.label}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {sectionResearchers.map((r) => {
                const fw = r.framework ? getFramework(r.framework) : undefined;
                return (
                  <a key={r.id} href={`/researchers/${r.id}`} className="rounded-lg border border-border bg-panel p-4 transition hover:border-accent/50">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-medium text-text">{r.name}</h3>
                      <span className="font-mono text-xs text-muted">{r.born}{r.death ? `–${r.death}` : "–"}</span>
                    </div>
                    {fw && (<p className="mt-1 text-xs text-accent">{fw.name}</p>)}
                    <p className="mt-2 line-clamp-3 text-xs text-muted">{r.bio_short}</p>
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
