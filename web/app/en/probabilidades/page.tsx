import ProbabilidadesPage from "@/app/probabilidades/page";
import { enMeta } from "@/lib/seo";

export const metadata = enMeta({
  title: "Probabilities by explanation (MECE model)",
  description:
    "Six mutually exclusive narratives (object + institutional stance): each UAP case allocates 100% and the corpus aggregates them comparably (MECE model).",
  esPath: "/probabilidades/",
});

export default ProbabilidadesPage;
