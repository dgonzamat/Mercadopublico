import casesData from "@/data/cases.json";
import patternsData from "@/data/patterns.json";
import frameworksData from "@/data/frameworks.json";
import researchersData from "@/data/researchers.json";
import type { UAPCase, Pattern, Framework, Researcher } from "./types";

export const cases = casesData as UAPCase[];
export const patterns = patternsData as Pattern[];
export const frameworks = frameworksData as Framework[];
export const researchers = researchersData as Researcher[];

export function getResearcher(id: string): Researcher | undefined {
  return researchers.find((r) => r.id === id);
}

export function getCase(id: string): UAPCase | undefined {
  return cases.find((c) => c.id === id);
}

export function getPattern(id: string): Pattern | undefined {
  return patterns.find((p) => p.id === id);
}

export function getFramework(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

export function getCasesByPattern(patternId: string): UAPCase[] {
  return cases.filter((c) => c.patterns.includes(patternId));
}

export function tierLabel(tier: "S" | "A" | "B"): string {
  return `Tier ${tier}`;
}

export function tierColor(tier: "S" | "A" | "B"): string {
  return tier === "S" ? "tierS" : tier === "A" ? "tierA" : "tierB";
}
