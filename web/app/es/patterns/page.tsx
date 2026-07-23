import { PatternsView } from "@/app/patterns/page";
import { STATS } from "@/lib/siteStats";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Patrones recurrentes del fenómeno",
  description: `${STATS.patterns} patrones recurrentes (8a–8r) identificados a lo largo del corpus de casos UAP institucionales.`,
  enPath: "/patterns/",
});

// El espejo /es reutiliza la vista raíz pero fija `locale="es"`, así el HTML de
// /es/patterns lleva solo español (la raíz sirve solo inglés).
export default function EsPatternsPage() {
  return <PatternsView locale="es" />;
}
