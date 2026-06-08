import { notFound } from "next/navigation";
import { posts, getPost } from "@/lib/posts";
import { postJsonLd } from "@/lib/jsonld";
import { T } from "@/components/T";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { PrevNext } from "@/components/PrevNext";
import { Eyebrow, H1 } from "@/lib/typography";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getPost(params.slug);
  if (!p) return { title: "Post no encontrado" };
  return { title: `${p.title}`, description: p.summary };
}

export default function PostDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const p = getPost(params.slug);
  if (!p) notFound();

  // Orden cronológico de publicación (num) para prev/next.
  const byNum = [...posts].sort((a, b) => a.num - b.num);
  const idx = byNum.findIndex((x) => x.id === p.id);
  const prev = idx > 0 ? byNum[idx - 1] : null;
  const next = idx < byNum.length - 1 ? byNum[idx + 1] : null;

  const parasEs = p.body.split("\n\n");
  const parasEn = (p.body_en ?? p.body).split("\n\n");

  return (
    <article className="mx-auto max-w-3xl space-y-10 py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(p)) }}
      />
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/blog", es: "Blog", en: "Blog" },
            { es: p.title, en: p.title_en ?? p.title },
          ]}
        />
        <ShareButton title={p.title} />
      </div>

      <header className="space-y-4 border-b-2 border-text pb-6">
        <Eyebrow>
          <time dateTime={p.date}>{p.date}</time>
          {p.tags && p.tags.length > 0 && <> · {p.tags.join(" · ")}</>}
        </Eyebrow>
        <H1>
          <T es={p.title} en={p.title_en ?? p.title} />
        </H1>
      </header>

      {/* Cuerpo bilingüe: divs data-lang (no <T>) para contenido en bloque. */}
      <div lang="es" data-lang="es" className="space-y-5">
        {parasEs.map((para, i) => (
          <p key={i} className="text-lg leading-relaxed text-text md:text-xl">
            {para}
          </p>
        ))}
      </div>
      <div lang="en" data-lang="en" className="space-y-5">
        {parasEn.map((para, i) => (
          <p key={i} className="text-lg leading-relaxed text-text md:text-xl">
            {para}
          </p>
        ))}
      </div>

      <PrevNext
        label="Navegación entre posts"
        prev={
          prev
            ? {
                href: `/blog/${prev.id}`,
                es: "← Anterior",
                en: "← Previous",
                title: <T es={prev.title} en={prev.title_en ?? prev.title} />,
              }
            : null
        }
        next={
          next
            ? {
                href: `/blog/${next.id}`,
                es: "Siguiente →",
                en: "Next →",
                title: <T es={next.title} en={next.title_en ?? next.title} />,
              }
            : null
        }
      />
    </article>
  );
}
