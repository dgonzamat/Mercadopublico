import { HomeView } from "@/app/page";
import { STATS } from "@/lib/siteStats";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "UAP Codex — La evidencia institucional",
  description: `${STATS.cases} casos UAP (${STATS.startYear}–${STATS.endYear}) documentados por gobiernos, militares y prensa, cada uno con sus fuentes, su nivel de evidencia y una probabilidad comparable entre seis explicaciones.`,
  enPath: "/",
});

export default function EsHomePage() {
  return <HomeView locale="es" />;
}
