import { ProbabilidadesView } from "@/app/probabilidades/page";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Probabilidades por explicación (modelo MECE)",
  description:
    "Seis narrativas mutuamente excluyentes (objeto + postura institucional): cada caso UAP reparte el 100% y el corpus las agrega de forma comparable (modelo MECE).",
  enPath: "/probabilidades/",
});

export default function EsProbabilidadesPage() {
  return <ProbabilidadesView locale="es" />;
}
