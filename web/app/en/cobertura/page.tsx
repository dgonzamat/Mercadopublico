import CoberturaPage from "@/app/cobertura/page";
import { STATS } from "@/lib/siteStats";
import { enMeta } from "@/lib/seo";

export const metadata = enMeta({
  title: "Corpus coverage · country × decade",
  description: `Coverage matrix of the ${STATS.cases} institutional UAP cases by country and decade — where the corpus is dense and where it is thin.`,
  esPath: "/cobertura/",
});

export default CoberturaPage;
