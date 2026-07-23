import { FrameworksView } from "@/app/frameworks/page";
import { STATS } from "@/lib/siteStats";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Marcos teóricos comparados",
  description: `${STATS.frameworks} marcos teóricos serios sobre el fenómeno UAP, comparados por poder explicativo y evidencia.`,
  enPath: "/frameworks/",
});

export default function EsFrameworksPage() {
  return <FrameworksView locale="es" />;
}
