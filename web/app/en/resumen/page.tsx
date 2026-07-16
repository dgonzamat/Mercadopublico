import ResumenPage from "@/app/resumen/page";
import { STATS } from "@/lib/siteStats";
import { enMeta } from "@/lib/seo";

export const metadata = enMeta({
  title: "10-minute summary",
  description: `The accessible version of the analysis: ${STATS.years} years of institutional UAP phenomenon, ${STATS.cases} cases across ${STATS.countries} countries, in a 10-minute read.`,
  esPath: "/resumen/",
});

export default ResumenPage;
