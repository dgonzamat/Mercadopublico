import { ResearchersView } from "@/app/researchers/page";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Actores del ecosistema de divulgación UAP",
  description:
    "Investigadores, denunciantes, políticos, periodistas y figuras ontológico-religiosas que sostienen la divulgación UAP contemporánea.",
  enPath: "/researchers/",
});

export default function EsResearchersPage() {
  return <ResearchersView locale="es" />;
}
