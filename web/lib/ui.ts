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
  color: string;
  bg: string;
  border: string;
  description: string;
}> = {
  S: {
    label: "Tier S",
    plain: "Sólido",
    color: "text-tierS",
    bg: "bg-tierS/10",
    border: "border-tierS/40",
    description: "Caso militar con sensor y múltiples testigos (75–88% confianza)",
  },
  A: {
    label: "Tier A",
    plain: "Aceptable",
    color: "text-tierA",
    bg: "bg-tierA/10",
    border: "border-tierA/40",
    description: "Caso civil institucional con múltiples testigos verificables (65–85%)",
  },
  B: {
    label: "Tier B",
    plain: "Folklórico",
    color: "text-tierB",
    bg: "bg-tierB/10",
    border: "border-tierB/40",
    description: "Fenómeno recurrente local sin verificación primaria (50–65%)",
  },
};

export const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  document: { icon: "📄", label: "Documento" },
  incident: { icon: "👁", label: "Incidente" },
  contactee: { icon: "🧑", label: "Contactee" },
  crop_circle: { icon: "🌾", label: "Crop circle" },
};
