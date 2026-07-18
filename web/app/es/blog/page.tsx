import BlogPage from "@/app/blog/page";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Blog — notas del cuaderno de investigación",
  description:
    "Notas de método, decisiones de análisis y avances del cuaderno de investigación UAP Codex.",
  enPath: "/blog/",
});

export default BlogPage;
