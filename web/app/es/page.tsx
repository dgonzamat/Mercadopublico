import HomePage from "@/app/page";
import { STATS } from "@/lib/siteStats";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "UAP Codex — La evidencia institucional",
  description: `${STATS.cases} casos UAP institucionales (${STATS.startYear}–${STATS.endYear}) que sobrevivieron filtros militares, del Congreso y periodísticos; probabilidad comparable por caso (modelo MECE).`,
  enPath: "/",
});

export default HomePage;
