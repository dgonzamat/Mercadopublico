import { AboutView } from "@/app/about/page";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Metodología: cómo se pesa la evidencia",
  description:
    "Cómo se pesa la evidencia: tres niveles (S, A y B), por qué un caso repetido aporta poco y cómo seis explicaciones se reparten cada caso.",
  enPath: "/about/",
});

export default function EsAboutPage() {
  return <AboutView locale="es" />;
}
