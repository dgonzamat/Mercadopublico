import { LocaleLink } from "@/components/LocaleLink";
import type { UAPCase } from "@/lib/types";
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
      className="cr group"
    >
      <span className="cr-num">
        {String(caseData.num).padStart(2, "0")}
      </span>
      <span className="cr-flag" aria-hidden>
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
          <p className="cr-title">
            <T es={caseData.name} en={caseData.name_en ?? caseData.name} locale={locale} />
            <span className="cr-year-sm">
              · {year}
            </span>
          </p>
        </div>
        <p className="cr-sum">
          {/* La fila muestra una línea truncada: mandar el resumen entero
              (hasta 1.500 caracteres, dos veces en el HTML y en el payload de
              Next) inflaba /cases a 2 MB sin que el lector viera más. Con 160
              caracteres la página seguía en ~14.700 palabras; 90 (~15
              palabras) bastan para la línea visible (oct 2026). */}
          <T es={clip(caseData.summary)} en={clip(caseData.summary_en ?? caseData.summary)} locale={locale} />
        </p>
      </div>
      <span className="cr-year">
        {year}
      </span>
      <span className={`cr-tier ${tierColor}`}>
        {caseData.tier}
      </span>
    </LocaleLink>
  );
}

export function clip(t: string, max = 90): string {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}
