import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  // Light cn() — no twMerge dependency. shadcn uses twMerge to dedupe
  // conflicting Tailwind classes; for our use cases the inputs are
  // already deconflicted, so plain clsx is enough.
  return clsx(inputs);
}

export type TierKey = "S" | "A" | "B";

export const TIER_META: Record<TierKey, {
  label: string;
  plain: string;
  plain_en: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  description_en: string;
}> = {
  S: {
    label: "Tier S",
    plain: "Sólido",
    plain_en: "Solid",
    color: "text-tierS",
    bg: "bg-tierS/10",
    border: "border-tierS/40",
    description: "Evidencia fuerte: un registro instrumental de la época (radar, sensor, película o foto con procedencia conocida) que corrobora a varios testigos independientes",
    description_en: "Strong evidence: a contemporary instrumental record (radar, sensor, film or photo of known provenance) that corroborates several independent witnesses",
  },
  A: {
    label: "Tier A",
    plain: "Aceptable",
    plain_en: "Acceptable",
    color: "text-tierA",
    bg: "bg-tierA/10",
    border: "border-tierA/40",
    description: "Evidencia institucional: varios testigos independientes identificados, o documentación oficial de la época, sin un registro instrumental que los corrobore",
    description_en: "Institutional evidence: several identified independent witnesses, or contemporary official documentation, without an instrumental record to corroborate them",
  },
  B: {
    label: "Tier B",
    plain: "Indiciario",
    plain_en: "Indicative",
    color: "text-tierB",
    bg: "bg-tierB/10",
    border: "border-tierB/40",
    description: "Evidencia limitada: un solo testigo, un testimonio recogido años después o un relato sin documentación primaria de la época",
    description_en: "Limited evidence: a single witness, testimony gathered years later, or an account without contemporary primary documentation",
  },
};

// Tier de los DOCUMENTOS: mide autenticidad e integridad, no testigos ni
// sensores (decisión del dueño, oct 2026; regla en CLAUDE.md y /about).
export const DOC_TIER_META: Record<TierKey, { description: string; description_en: string }> = {
  S: {
    description: "Documento oficial íntegro, publicado o desclasificado por quien lo emitió o por un archivo público",
    description_en: "Intact official document, published or declassified by its issuer or by a public archive",
  },
  A: {
    description: "Documento oficial incompleto o muy tachado, testimonio jurado, estudio revisado por pares o filtración autenticada",
    description_en: "Incomplete or heavily redacted official document, sworn testimony, peer-reviewed study or authenticated leak",
  },
  B: {
    description: "Filtración sin autenticar, procedencia dudosa o prensa sin confirmar",
    description_en: "Unauthenticated leak, doubtful provenance or unconfirmed press reporting",
  },
};

export const CATEGORY_META: Record<
  string,
  { icon: string; label: string; label_en: string }
> = {
  document: { icon: "📄", label: "Documento", label_en: "Document" },
  incident: { icon: "👁", label: "Incidente", label_en: "Incident" },
  contactee: { icon: "🧑", label: "Contactado", label_en: "Contactee" },
  crop_circle: { icon: "🌾", label: "Círculo de cultivo", label_en: "Crop circle" },
};
