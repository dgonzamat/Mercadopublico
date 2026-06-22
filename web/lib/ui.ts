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
    description: "Evidencia fuerte: registro de sensor instrumental + múltiples testigos (típicamente militar)",
    description_en: "Strong evidence: instrumental sensor record + multiple witnesses (typically military)",
  },
  A: {
    label: "Tier A",
    plain: "Aceptable",
    plain_en: "Acceptable",
    color: "text-tierA",
    bg: "bg-tierA/10",
    border: "border-tierA/40",
    description: "Evidencia institucional: múltiples testigos verificables o documentación oficial",
    description_en: "Institutional evidence: multiple verifiable witnesses or official documentation",
  },
  B: {
    label: "Tier B",
    plain: "Indiciario",
    plain_en: "Indicative",
    color: "text-tierB",
    bg: "bg-tierB/10",
    border: "border-tierB/40",
    description: "Evidencia limitada: testigo único, local o sin verificación primaria",
    description_en: "Limited evidence: single-witness, local or without primary verification",
  },
};

export const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  document: { icon: "📄", label: "Documento" },
  incident: { icon: "👁", label: "Incidente" },
  contactee: { icon: "🧑", label: "Contactado" },
  crop_circle: { icon: "🌾", label: "Círculo de cultivo" },
};
