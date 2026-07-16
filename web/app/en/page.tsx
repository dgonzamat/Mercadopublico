import HomePage from "@/app/page";
import { STATS } from "@/lib/siteStats";
import { enMeta } from "@/lib/seo";

export const metadata = enMeta({
  title: "UAP Codex — The institutional evidence",
  description: `${STATS.cases} institutional UAP cases (${STATS.startYear}–${STATS.endYear}) that survived military, congressional and journalistic filters; comparable per-case probability (MECE model).`,
  esPath: "/",
});

export default HomePage;
