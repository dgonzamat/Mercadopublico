/**
 * ICD-203 (Intelligence Community Directive 2007) probability framework.
 * Standard USIC convention for expressing analytical probability when
 * formal Bayesian inference is not possible — i.e., expert judgment over
 * limited institutional evidence. Used here instead of single-decimal
 * percentages, which imply false precision the data doesn't support.
 *
 * https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf
 */

export interface IcdLabel {
  id: string;
  label: string;
  labelEs: string;
  min: number;
  max: number;
}

export const ICD_LABELS: IcdLabel[] = [
  { id: "almost-certain", label: "Almost Certain", labelEs: "Casi cierto", min: 95, max: 99 },
  { id: "very-likely", label: "Very Likely", labelEs: "Muy probable", min: 80, max: 95 },
  { id: "likely", label: "Likely", labelEs: "Probable", min: 55, max: 80 },
  { id: "roughly-even", label: "Roughly Even Chance", labelEs: "Probabilidad pareja", min: 45, max: 55 },
  { id: "unlikely", label: "Unlikely", labelEs: "Improbable", min: 20, max: 45 },
  { id: "very-unlikely", label: "Very Unlikely", labelEs: "Muy improbable", min: 5, max: 20 },
  { id: "almost-none", label: "Almost No Chance", labelEs: "Casi imposible", min: 1, max: 5 },
];

export function pctToIcdLabel(pct: number): IcdLabel {
  // Find the label whose range contains pct.
  // Ranges overlap at boundaries; we use [min, max) except the top.
  for (const lbl of ICD_LABELS) {
    if (pct >= lbl.min && pct <= lbl.max) return lbl;
  }
  // Default to the closest if out of range (shouldn't happen with sane inputs).
  return pct < 1 ? ICD_LABELS[6] : ICD_LABELS[0];
}
