import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { posts } from "@/lib/posts";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

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

      <ul className="divide-y divide-text/15 border-y border-text/15">
        {posts.map((p) => (
          <li key={p.id}>
            <LocaleLink
              href={`/blog/${p.id}`}
              className="group block py-6 hover:-mx-4 hover:bg-panel hover:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                <time dateTime={p.date}>{p.date}</time>
                {p.tags && p.tags.length > 0 && <span> · {p.tags.join(" · ")}</span>}
              </p>
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
