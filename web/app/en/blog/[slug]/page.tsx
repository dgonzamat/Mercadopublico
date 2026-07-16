import BlogPostPage, { generateStaticParams } from "@/app/blog/[slug]/page";
import { getPost } from "@/lib/posts";
import { enMeta } from "@/lib/seo";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const p = getPost(slug);
  if (!p) return { title: "Post not found" };
  return enMeta({
    title: p.title_en ?? p.title,
    description: p.summary_en ?? p.summary,
    esPath: `/blog/${p.id}/`,
  });
}

export default BlogPostPage;
