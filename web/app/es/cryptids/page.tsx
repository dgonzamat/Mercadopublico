import { CryptidsView } from "@/app/cryptids/page";
import { esMeta } from "@/lib/seo";

/** Archivo de críptidos en español (/es/cryptids/). */
export const metadata = esMeta({
  title: "Archivo de críptidos",
  description: "Expedientes oficiales sobre críptidos como Bigfoot: una colección aparte con su propio modelo de seis explicaciones, fuera de todo total UAP.",
  enPath: "/cryptids/",
});

export default function EsCryptidsPage() {
  return <CryptidsView locale="es" />;
}
