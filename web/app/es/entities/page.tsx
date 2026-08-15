import { EntitiesView } from "@/app/entities/page";
import { esMeta } from "@/lib/seo";

export const metadata = esMeta({
  title: "Hipótesis de entidades no humanas",
  description:
    "Catálogo de las formas físicas atribuidas a entidades no humanas en el corpus, con el marco de origen hacia el que lee cada forma.",
  enPath: "/entities/",
});

// El espejo /es reutiliza la vista raíz pero fija `locale="es"`, así el HTML de
// /es/entities lleva solo español (la raíz sirve solo inglés).
export default function EsEntitiesPage() {
  return <EntitiesView locale="es" />;
}
