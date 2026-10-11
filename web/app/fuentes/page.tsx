import { getAllSources, groupByCategory, CATEGORY_LABELS } from "@/lib/sources";
import { pageMeta } from "@/lib/seo";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede, Caption } from "@/lib/typography";

export const metadata = pageMeta({
  title: "Sources and bibliography of the corpus",
  description:
    "Every source cited in the UAP corpus — official FOIA documents, declassified archives, academic papers, investigative press, books and code.",
  path: "/fuentes/",
});

export default function FuentesPage() {
  const all = getAllSources();
  const grouped = groupByCategory(all);
  const totalCount = all.length;

  return (
    <article className="mx-auto max-w-4xl space-y-16 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Bibliografía completa" en="Full bibliography" />
        </Eyebrow>
        <H1>
          <T
            es="De dónde sale todo esto"
            en="Where all this comes from"
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={
              <>
                Toda fuente citada en el corpus, deduplicada y agrupada por
                categoría. <strong className="text-text">{totalCount}</strong>{" "}
                referencias en total: documentos FOIA, archivos
                desclasificados, papers académicos, periodismo, libros, audio,
                video, código y otros. Elige una categoría para ver sus fuentes y en qué
                casos aparece cada una.
              </>
            }
            en={
              <>
                Every source cited in the corpus, deduplicated and grouped by
                category. <strong className="text-text">{totalCount}</strong>{" "}
                references in total: FOIA documents, declassified
                archives, academic papers, press, books, audio, video, code,
                and other. Pick a category to see its sources and which cases
                each one appears in.
              </>
            }
          />
        </Lede>
      </header>

      <nav
        aria-label="Categorías de fuentes"
        className="grid gap-2 border-y-2 border-text/15 py-6 sm:grid-cols-2"
      >
        {grouped.map((g) => (
          <a
            key={g.category}
            href={`/fuentes/${g.category}/`}
            className="flex items-baseline justify-between gap-3 py-2 text-sm text-text hover:text-accent"
          >
            <span>
              <T
                es={CATEGORY_LABELS[g.category].es}
                en={CATEGORY_LABELS[g.category].en}
              />
            </span>
            <span className="shrink-0 tabular-nums text-text">
              {g.items.length}
            </span>
          </a>
        ))}
      </nav>

      <section className="space-y-4 border-t-2 border-text pt-8">
        <Eyebrow>
          <T es="Nota metodológica" en="Methodological note" />
        </Eyebrow>
        <Caption>
          <T
            es="Agrupadas por dominio. Cada cita enlaza a su fuente."
            en="Grouped by domain. Every citation links to its source."
          />
        </Caption>
      </section>
    </article>
  );
}
