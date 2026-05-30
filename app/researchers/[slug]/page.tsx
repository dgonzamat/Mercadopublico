import Link from "next/link";
import { notFound } from "next/navigation";
import { researchers, getFramework } from "@/lib/data";

export function generateStaticParams() {
  return researchers.map((r) => ({ slug: r.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const r = researchers.find((x) => x.id === params.slug);
  if (!r) return { title: "No encontrado" };
  return { title: `${r.name} · UAP Atlas`, description: r.bio_short.slice(0, 160) };
}

export default function ResearcherDetailPage({ params }: { params: { slug: string } }) {
  const r = researchers.find((x) => x.id === params.slug);
  if (!r) notFound();

  const fw = r.framework ? getFramework(r.framework) : undefined;
  const lifespan = r.death ? `${r.born}–${r.death}` : `${r.born}–`;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/researchers" className="text-sm text-muted hover:text-accent">← Volver a researchers</Link>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Sección {r.section} · {r.section_label} · {lifespan}</p>
        <h1 className="mt-2 text-3xl font-bold text-text">{r.name}</h1>
        {fw && (
          <p className="mt-2 text-sm text-accent">Framework principal: <Link href={`/frameworks#${fw.id}`} className="font-medium hover:underline">{fw.name}</Link></p>
        )}
      </header>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Credenciales</h2>
        <p className="mt-2 text-sm text-text">{r.credentials}</p>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Biografía</h2>
        <p className="mt-2 text-text">{r.bio_short}</p>
      </section>

      {r.works.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Obras clave</h2>
          <ul className="mt-3 space-y-3">
            {r.works.map((w) => (
              <li key={`${w.year}-${w.title}`} className="rounded-md border border-border bg-panel p-3">
                <p className="text-sm">
                  <span className="font-mono text-xs text-accent">{w.year}</span> <span className="text-text">{w.title}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{w.contribution}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
