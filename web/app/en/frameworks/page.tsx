import FrameworksPage from "@/app/frameworks/page";
import { STATS } from "@/lib/siteStats";
import { enMeta } from "@/lib/seo";

export const metadata = enMeta({
  title: "Theoretical frameworks compared",
  description: `${STATS.frameworks} serious theoretical frameworks on the UAP phenomenon, compared by explanatory power and evidence.`,
  esPath: "/frameworks/",
});

export default FrameworksPage;
