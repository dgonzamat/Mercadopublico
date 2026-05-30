import Link from "next/link";
import type { UAPCase } from "@/lib/types";

export function CaseRow({ caseData }: { caseData: UAPCase }) {
  const tierColor =
    caseData.tier === "S"
      ? "text-tierS"
      : caseData.tier === "A"
        ? "text-tierA"
        : "text-tierB";
  const year = caseData.year_end
    ? `${caseData.year_start}–${String(caseData.year_end).slice(-2)}`
    : caseData.year_start.toString();
  return (
    <Link
      href={`/cases/${caseData.id}`}
      className="group flex items-center gap-3 border-b border-border py-3 transition hover:bg-panel sm:gap-4"
    >
      <span className="hidden w-10 text-right font-mono text-xs text-muted sm:inline">
        #{caseData.num}
      </span>
      <span className="text-xl" aria-hidden>
        {caseData.flag}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text group-hover:text-accent">
          {caseData.name}
          <span className="ml-2 font-mono text-xs text-muted sm:hidden">
            · {year}
          </span>
        </p>
        <p className="truncate text-xs text-muted">{caseData.summary}</p>
      </div>
      <span className="hidden w-14 text-right font-mono text-xs text-muted sm:inline">
        {year}
      </span>
      <span className={`w-12 shrink-0 text-right font-mono text-xs ${tierColor} sm:w-10`}>
        Tier {caseData.tier}
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-sm font-bold text-text">
        {caseData.probability}%
      </span>
    </Link>
  );
}
