import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { posts } from "@/lib/posts";
import { cases } from "@/lib/data";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

// Novedades del archivo: todo se DERIVA de los casos en cada build, para que
// el blog no parezca detenido entre una entrada escrita y la siguiente. Los
// casos y las entregas no guardan su fecha de entrada, así que se muestra el
// orden (`num` es secuencial; la entrega más alta es la última) y la única
// fecha real: el mes de la última revisión contra la fuente primaria.
const LATEST_RELEASE = Math.max(
  ...cases.flatMap((c) => c.pursueReleases ?? []),
);
const LATEST_RELEASE_CASES = cases.filter((c) =>
  c.pursueReleases?.includes(LATEST_RELEASE),
).length;
const RECENT_CASES = [...cases].sort((a, b) => b.num - a.num).slice(0, 5);
const LAST_REVIEW_MONTH = cases
  .map((c) => c.evidenceReviewed?.slice(0, 7) ?? "")
  .reduce((max, m) => (m > max ? m : max), "");
const REVIEWED_THAT_MONTH = cases.filter((c) =>
  c.evidenceReviewed?.startsWith(LAST_REVIEW_MONTH),
).length;
const pad = (n: number) => String(n).padStart(2, "0");

function monthLabel(ym: string, locale: "es" | "en") {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export const metadata = {
  ...pageMeta({
    title: "Blog — research notebook notes",
    description:
      "Method notes, analytical decisions and progress from the UAP Codex research notebook.",
    path: "/blog/",
  }),
  alternates: {
    canonical: "/blog/",
    languages: hreflangFor("/blog/"),
    types: { "application/rss+xml": "/feed.xml" },
  },
};

export default function BlogPage() {
  return <BlogView locale="en" />;
}

export function BlogView({ locale }: { locale: "es" | "en" }) {
  return (
    <div className="space-y-12 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="El cuaderno" en="The notebook" locale={locale} />
        </Eyebrow>
        <H1>
          <T es="Blog" en="Blog" locale={locale} />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es="Notas de método, decisiones de análisis y avances del corpus. Cómo se construye este cuaderno, en voz alta."
            en="Method notes, analysis decisions and corpus progress. How this notebook gets built, out loud."
            locale={locale}
          />
        </Lede>
        <a
          href="/feed.xml"
          className="inline-block font-mono text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <T es="Suscribirse · RSS →" en="Subscribe · RSS →" locale={locale} />
        </a>
      </header>

      <section className="space-y-4 border border-border bg-panel p-5">
        <Eyebrow>
          <T es="Novedades del archivo" en="Archive updates" locale={locale} />
        </Eyebrow>
        <ul className="space-y-3 text-sm text-text">
          <li>
            <LocaleLink
              href={`/releases/${pad(LATEST_RELEASE)}`}
              className="font-semibold hover:text-accent hover:underline"
            >
              <T
                es={`Entrega ${pad(LATEST_RELEASE)} de PURSUE`}
                en={`PURSUE release ${pad(LATEST_RELEASE)}`}
                locale={locale}
              />
            </LocaleLink>
            <span className="text-muted">
              <T
                es={`: aporta documentos a ${LATEST_RELEASE_CASES} casos.`}
                en={`: adds documents to ${LATEST_RELEASE_CASES} cases.`}
                locale={locale}
              />
            </span>
          </li>
          <li>
            <span className="font-semibold">
              <T es="Últimos casos incorporados" en="Most recently added cases" locale={locale} />
            </span>
            <ul className="mt-2 space-y-1 border-l border-border pl-3">
              {RECENT_CASES.map((c) => (
                <li key={c.id}>
                  <LocaleLink href={`/cases/${c.id}`} className="hover:text-accent hover:underline">
                    <T es={c.name} en={c.name_en ?? c.name} locale={locale} />
                  </LocaleLink>
                  <span className="text-muted"> · {c.year_start}</span>
                </li>
              ))}
            </ul>
          </li>
          {LAST_REVIEW_MONTH && (
            <li>
              <span className="font-semibold">
                <T
                  es={`Revisados contra su fuente primaria en ${monthLabel(LAST_REVIEW_MONTH, "es")}`}
                  en={`Checked against their primary source in ${monthLabel(LAST_REVIEW_MONTH, "en")}`}
                  locale={locale}
                />
              </span>
              <span className="text-muted">
                <T
                  es={`: ${REVIEWED_THAT_MONTH} casos.`}
                  en={`: ${REVIEWED_THAT_MONTH} cases.`}
                  locale={locale}
                />
              </span>
            </li>
          )}
        </ul>
      </section>

      <ul className="divide-y divide-text/15 border-y border-text/15">
        {posts.map((p) => (
          <li key={p.id}>
            <LocaleLink
              href={`/blog/${p.id}`}
              className="group block py-6 hover:-mx-4 hover:bg-panel hover:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {/* Sin fecha a la vista (decisión del dueño, 13 nov 2026): el post se lee
                  como texto vigente, no como noticia. La fecha sigue en el RSS y el JSON-LD. */}
              {p.tags && p.tags.length > 0 && (
                <p className="font-mono text-xs uppercase tracking-widest text-muted">{p.tags.join(" · ")}</p>
              )}
              <h2 className="mt-2 font-display text-2xl font-medium leading-tight text-text group-hover:text-accent">
                <T es={p.title} en={p.title_en ?? p.title} locale={locale} />
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                <T es={p.summary} en={p.summary_en ?? p.summary} locale={locale} />
              </p>
            </LocaleLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
