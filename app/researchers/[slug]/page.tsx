import Link from "next/link";
import { notFound } from "next/navigation";
import { researchers, getFramework } from "@/lib/data";
import { T } from "@/components/T";
import { Eyebrow, H1, Body, Caption } from "@/lib/typography";

export function generateStaticParams() {
  return researchers.map((r) => ({ slug: r.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const r = researchers.find((x) => x.id === params.slug);
  if (!r) return { title: "No encontrado" };
  return {
    title: `${r.name} · UAP Codex`,
    description: r.bio_short.slice(0, 160),
  };
}

export default function ResearcherDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const r = researchers.find((x) => x.id === params.slug);
  if (!r) notFound();

  const fw = r.framework ? getFramework(r.framework) : undefined;
  const lifespan = r.death ? `${r.born}–${r.death}` : `${r.born}–`;

  return (
    <article className="mx-auto max-w-3xl space-y-12 py-4">
      <Link
        href="/researchers"
        className="inline-block text-sm text-muted hover:text-accent"
      >
        ← Volver a researchers
      </Link>

      {/* Zone A — Identification */}
      <header className="rounded-lg border border-border bg-surface-2 p-6 md:p-8">
        <div className="space-y-4">
          <Eyebrow>
            Sección {r.section} · {r.section_label} · {lifespan}
          </Eyebrow>
          <H1>{r.name}</H1>
          {fw && (
            <p className="text-sm text-text">
              <span className="text-muted">Framework principal:</span>{" "}
              <Link
                href={`/frameworks#${fw.id}`}
                className="text-accent hover:underline"
              >
                {fw.name}
              </Link>
            </p>
          )}
        </div>
        <Caption className="mt-4 border-t border-border pt-4">
          {r.credentials}
        </Caption>
      </header>

      {/* Zone B — Narrative */}
      <section className="space-y-3">
        <Eyebrow>Biografía</Eyebrow>
        <Body>{r.bio_short}</Body>
      </section>

      {/* Zone C — Apparatus: works as timeline */}
      {r.works.length > 0 && (
        <section className="space-y-3 border-t border-border pt-10">
          <Eyebrow>
            <T
              es={`Por qué está acá · ${r.works.length} piezas`}
              en={`Why they're here · ${r.works.length} pieces`}
            />
          </Eyebrow>
          <ol className="space-y-3">
            {r.works.map((w) => (
              <li
                key={`${w.year}-${w.title}`}
                className="grid grid-cols-[4rem_1fr] gap-4 border-l border-border pl-4"
              >
                <span className="font-mono text-sm tabular-nums text-accent">
                  {w.year}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text">{w.title}</p>
                  <p className="text-xs text-muted">{w.contribution}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Caption className="border-t border-border pt-6">
        <T
          es="Bio sintetizada del ecosistema de disclosure UAP — categorizada por sección epistemológica (A-E)."
          en="Synthesized bio from the UAP disclosure ecosystem — categorized by epistemological section (A-E)."
        />
      </Caption>
    </article>
  );
}
