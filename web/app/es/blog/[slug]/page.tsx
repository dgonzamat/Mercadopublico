import { PostDetailPage, generateStaticParams } from "@/app/blog/[slug]/page";
import { getPost } from "@/lib/posts";
import { esMeta } from "@/lib/seo";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const p = getPost(slug);
  if (!p) return { title: "Post no encontrado" };
  return esMeta({
    title: p.title,
    description: p.summary,
    enPath: `/blog/${p.id}/`,
  });
}

export default function EsBlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <PostDetailPage params={props.params} locale="es" />;
}
