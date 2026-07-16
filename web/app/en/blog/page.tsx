import BlogPage from "@/app/blog/page";
import { enMeta } from "@/lib/seo";

export const metadata = enMeta({
  title: "Blog — research notebook notes",
  description:
    "Method notes, analytical decisions and progress from the UAP Codex research notebook.",
  esPath: "/blog/",
});

export default BlogPage;
