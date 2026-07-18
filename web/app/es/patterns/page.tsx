import PatternsPage from "@/app/patterns/page";
import { STATS } from "@/lib/siteStats";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Patrones recurrentes del fenómeno",
  description: `${STATS.patterns} patrones recurrentes (8a–8r) identificados a lo largo del corpus de casos UAP institucionales.`,
  enPath: "/patterns/",
});

export default PatternsPage;
