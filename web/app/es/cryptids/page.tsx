import { CryptidsView } from "@/app/cryptids/page";
import { esMeta } from "@/lib/seo";

/** Archivo de críptidos en español (/es/cryptids/). */
export const metadata = esMeta({
  title: "Archivo de críptidos",
  description: "Bigfoot, el yeti, monstruos marinos y momias «no humanas»: qué encontraron los laboratorios, las fiscalías y las agencias del Estado al examinarlos, caso por caso, con documentos oficiales y estudios científicos.",
  enPath: "/cryptids/",
});

export default function EsCryptidsPage() {
  return <CryptidsView locale="es" />;
}
