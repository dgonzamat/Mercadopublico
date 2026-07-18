import ReleasesPage from "@/app/releases/page";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Releases del PURSUE / AARO — desclasificaciones UAP",
  description:
    "Las entregas de archivos UAP desclasificados por el Department of War (PURSUE / AARO) y los casos del corpus UAP Codex que citan cada una.",
  enPath: "/releases/",
});

export default ReleasesPage;
