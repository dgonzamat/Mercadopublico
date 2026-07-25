import { notFound } from "next/navigation";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { posts, getPost } from "@/lib/posts";
import { postJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { T } from "@/components/T";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { PrevNext } from "@/components/PrevNext";
import { Eyebrow, H1 } from "@/lib/typography";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.id }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const p = getPost(params.slug);
  if (!p) return { title: "Post not found" };
  return {
    ...pageMeta({
      title: p.title_en ?? p.title,
      description: p.summary_en ?? p.summary,
      path: `/blog/${p.id}/`,
    }),
    alternates: {
      canonical: `/blog/${p.id}/`,
      languages: hreflangFor(`/blog/${p.id}/`),
    },
  };
}

export async function PostDetailPage(
  props: {
    params: Promise<{ slug: string }>;
    locale?: "es" | "en";
  }
) {
  const locale = props.locale ?? "en";
  const params = await props.params;
  const p = getPost(params.slug);
  if (!p) notFound();

  // Orden cronológico de publicación (num) para prev/next.
  const byNum = [...posts].sort((a, b) => a.num - b.num);
  const idx = byNum.findIndex((x) => x.id === p.id);
  const prev = idx > 0 ? byNum[idx - 1] : null;
  const next = idx < byNum.length - 1 ? byNum[idx + 1] : null;

  // Un solo idioma por URL: se renderiza solo la prosa del locale activo.
  const paras = (locale === "es" ? p.body : p.body_en ?? p.body).split("\n\n");

  return (
    <article className="mx-auto max-w-3xl space-y-10 py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(postJsonLd(p, locale)),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { href: "/", label: locale === "es" ? "Inicio" : "Home" },
          { href: "/blog/", label: "Blog" },
          { label: locale === "es" ? p.title : p.title_en ?? p.title },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/blog", es: "Blog", en: "Blog" },
            { es: p.title, en: p.title_en ?? p.title },
          ]}
          locale={locale}
        />
        <ShareButton title={p.title} locale={locale} />
      </div>

      <header className="space-y-4 border-b-2 border-text pb-6">
        <Eyebrow>
          <time dateTime={p.date}>{p.date}</time>
          {p.tags && p.tags.length > 0 && <> · {p.tags.join(" · ")}</>}
        </Eyebrow>
        <H1>
          <T es={p.title} en={p.title_en ?? p.title} locale={locale} />
        </H1>
      </header>

      {/* Cuerpo: un solo idioma por URL (el locale activo). */}
      <div lang={locale} data-lang={locale} className="space-y-5">
        {paras.map((para, i) => (
          <p key={i} className="text-lg leading-relaxed text-text md:text-xl">
            {para}
          </p>
        ))}
      </div>

      <PrevNext
        label="Navegación entre posts"
        locale={locale}
        prev={
          prev
            ? {
                href: `/blog/${prev.id}`,
                es: "← Anterior",
                en: "← Previous",
                title: (
                  <T
                    es={prev.title}
                    en={prev.title_en ?? prev.title}
                    locale={locale}
                  />
                ),
              }
            : null
        }
        next={
          next
            ? {
                href: `/blog/${next.id}`,
                es: "Siguiente →",
                en: "Next →",
                title: (
                  <T
                    es={next.title}
                    en={next.title_en ?? next.title}
                    locale={locale}
                  />
                ),
              }
            : null
        }
      />
    </article>
  );
}

export default PostDetailPage;
