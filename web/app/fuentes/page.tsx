import Link from "next/link";
import { getAllSources, groupByCategory, CATEGORY_LABELS } from "@/lib/sources";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Caption } from "@/lib/typography";

export const metadata = {
  title: "Fuentes y bibliografía del corpus",
  description:
    "Todas las fuentes citadas en el corpus UAP — documentos FOIA oficiales, archivos desclasificados, artículos académicos, prensa de investigación, libros y código.",

  alternates: { canonical: "/fuentes/" },
};

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
                referencias en total — incluyendo documentos FOIA, archivos
                desclasificados, papers académicos, periodismo, libros, audio,
                video, código y otros. Cada entrada muestra dónde aparece
                dentro del sitio para que puedas auditar la cita.
              </>
            }
            en={
              <>
                Every source cited in the corpus, deduplicated and grouped by
                category. <strong className="text-text">{totalCount}</strong>{" "}
                references in total — including FOIA documents, declassified
                archives, academic papers, press, books, audio, video, code,
                and other. Each entry shows where it appears in the site so
                you can audit the citation.
              </>
            }
          />
        </Lede>
      </header>

      <nav
        aria-label="Saltar a categoría"
        className="grid gap-2 border-y-2 border-text/15 py-6 sm:grid-cols-2"
      >
        {grouped.map((g) => (
          <a
            key={g.category}
            href={`#${g.category}`}
            className="flex items-baseline justify-between gap-3 py-1 font-mono text-xs uppercase tracking-widest text-muted hover:text-accent"
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

      <div className="space-y-20">
        {grouped.map((g) => (
          <section
            key={g.category}
            id={g.category}
            className="scroll-mt-20 space-y-6"
          >
            <header className="space-y-3 border-b-2 border-text pb-4">
              <Eyebrow>
                <T
                  es={`${g.items.length} referencias`}
                  en={`${g.items.length} references`}
                />
              </Eyebrow>
              <H2>
                <T
                  es={CATEGORY_LABELS[g.category].es}
                  en={CATEGORY_LABELS[g.category].en}
                />
              </H2>
              <Caption>
                <T
                  es={CATEGORY_LABELS[g.category].description_es}
                  en={CATEGORY_LABELS[g.category].description_en}
                />
              </Caption>
            </header>

            <ol className="divide-y divide-text/10 border-y border-text/15">
              {g.items.map((s, i) => (
                <li
                  key={`${g.category}-${i}-${s.name.slice(0, 30)}`}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 text-sm"
                >
                  <span
                    aria-hidden
                    className="font-mono text-xs tabular-nums text-muted"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 space-y-2">
                    <p className="text-base leading-snug text-text md:text-lg">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text underline decoration-text/30 underline-offset-4 hover:text-accent hover:decoration-accent"
                        >
                          {s.name} <span aria-hidden>↗</span>
                        </a>
                      ) : (
                        <span className="text-text">{s.name}</span>
                      )}
                    </p>
                    {s.note && (
                      <p className="text-sm leading-snug text-muted">
                        {s.note}
                      </p>
                    )}
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1 font-mono text-[11px] uppercase tracking-widest text-muted">
                      <span>
                        <T es="Aparece en" en="Appears in" />
                      </span>
                      {s.appearances.map((a, idx) => (
                        <span key={`${a.label}-${idx}`}>
                          {idx > 0 && (
                            <span className="text-text/30"> · </span>
                          )}
                          {a.href ? (
                            <Link
                              href={a.href}
                              className="text-text hover:text-accent hover:underline"
                            >
                              {a.label}
                            </Link>
                          ) : (
                            <span className="text-text">{a.label}</span>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="space-y-4 border-t-2 border-text pt-8">
        <Eyebrow>
          <T es="Nota metodológica" en="Methodological note" />
        </Eyebrow>
        <Caption>
          <T
            es="Categorización por dominio URL (best-effort). Una fuente puede aparecer en múltiples casos; la deduplicación es por URL idéntica o por nombre normalizado cuando no hay URL. Cada cita es auditable directamente desde su link."
            en="Categorization is by URL domain (best-effort). A source may appear in multiple cases; deduplication is by identical URL or by normalized name when no URL is present. Every citation is auditable directly from its link."
          />
        </Caption>
      </section>
    </article>
  );
}
