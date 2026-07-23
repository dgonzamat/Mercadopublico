import { ResumenView } from "@/app/resumen/page";
import { STATS } from "@/lib/siteStats";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Resumen en 10 minutos",
  description: `Versión accesible del análisis: ${STATS.years} años de fenómeno UAP institucional, ${STATS.cases} casos en ${STATS.countries} países, en 10 minutos de lectura.`,
  enPath: "/resumen/",
});

export default function EsResumenPage() {
  return <ResumenView locale="es" />;
}
