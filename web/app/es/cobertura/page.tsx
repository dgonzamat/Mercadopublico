import CoberturaPage from "@/app/cobertura/page";
import { STATS } from "@/lib/siteStats";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Cobertura del corpus · país × década",
  description: `Matriz de cobertura de los ${STATS.cases} casos institucionales UAP por país y década — dónde el corpus es denso y dónde está flaco.`,
  enPath: "/cobertura/",
});

export default CoberturaPage;
