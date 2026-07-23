import { LocaleLink } from "@/components/LocaleLink";
import type { UAPCase } from "@/lib/types";
import { EpistemicBadge } from "@/components/Badge";
import { T } from "@/components/T";
import { TIER_META } from "@/lib/ui";
import { countryEn } from "@/lib/i18n-geo";

export function CaseRow({
  caseData,
  locale,
}: {
  caseData: UAPCase;
  locale: "es" | "en";
}) {
  const tierColor = TIER_META[caseData.tier].color;
  const year = caseData.year_end
    ? `${caseData.year_start}–${String(caseData.year_end).slice(-2)}`
    : caseData.year_start.toString();
  return (
    <LocaleLink
      href={`/cases/${caseData.id}`}
      className="group grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-4 border-b border-border/50 py-3 transition hover:bg-panel/50"
    >
      <span className="hidden w-10 text-right font-mono text-xs tabular-nums text-muted sm:inline">
        {String(caseData.num).padStart(2, "0")}
      </span>
      <span className="w-6 shrink-0 text-lg leading-none" aria-hidden>
        {caseData.flag}
      </span>
      <span className="sr-only">
        <T
          es={caseData.country_name}
          en={countryEn(caseData.country_name)}
          locale={locale}
        />
        .
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-text group-hover:text-accent">
            <T es={caseData.name} en={caseData.name_en ?? caseData.name} locale={locale} />
            <span className="ml-2 font-mono text-xs text-muted sm:hidden">
              · {year}
            </span>
          </p>
          <EpistemicBadge status={caseData.epistemicStatus} compact />
        </div>
        <p className="truncate text-xs text-muted">
          <T es={caseData.summary} en={caseData.summary_en ?? caseData.summary} locale={locale} />
        </p>
      </div>
      <span className="hidden w-16 text-right font-mono text-xs tabular-nums text-muted sm:inline">
        {year}
      </span>
      <span
        className={`w-12 shrink-0 text-right font-mono text-xs ${tierColor}`}
        title="Nivel de evidencia · S sólido · A aceptable · B folklórico"
      >
        {caseData.tier}
      </span>
      <span
        className="w-12 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-text"
        title="Probabilidad del caso · qué tan probable es un fenómeno genuinamente no explicado (distinta de la partición de explicaciones)"
      >
        {caseData.probability}%
      </span>
    </LocaleLink>
  );
}
