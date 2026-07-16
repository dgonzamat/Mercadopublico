import PatternsPage from "@/app/patterns/page";
import { STATS } from "@/lib/siteStats";
import { enMeta } from "@/lib/seo";

export const metadata = enMeta({
  title: "Recurring patterns of the phenomenon",
  description: `${STATS.patterns} recurring patterns (8a–8r) identified across the corpus of institutional UAP cases.`,
  esPath: "/patterns/",
});

export default PatternsPage;
