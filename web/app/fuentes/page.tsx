import Link from "next/link";
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
        aria-label="Categorías de fuentes · Source categories"
        className="grid gap-3 border-y-2 border-text/15 py-6 sm:grid-cols-2"
      >
        {/* Tarjetas con la descripción de cada categoría (nov 2026): antes eran
            enlaces desnudos de ~36 px sin decir qué guarda cada una. */}
        {grouped.map((g) => (
          <Link
            key={g.category}
            href={`/fuentes/${g.category}/`}
            className="block min-h-[44px] border border-border bg-panel p-4 transition hover:border-accent/50"
          >
            <span className="flex items-baseline justify-between gap-3 text-sm font-medium text-text">
              <T
                es={CATEGORY_LABELS[g.category].es}
                en={CATEGORY_LABELS[g.category].en}
              />
              <span className="shrink-0 tabular-nums">{g.items.length}</span>
            </span>
            <span className="mt-1 block text-xs leading-snug text-muted">
              <T
                es={CATEGORY_LABELS[g.category].description_es}
                en={CATEGORY_LABELS[g.category].description_en}
              />
            </span>
          </Link>
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
