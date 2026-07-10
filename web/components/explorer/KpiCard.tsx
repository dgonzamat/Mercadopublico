"use client";

import type { UAPCase } from "@/lib/types";
import { casesClient as allCases } from "@/lib/dataClient";
import {
  kpiValue,
  kpiShare,
  kpiDistinct,
  kpiThreshold,
} from "@/lib/explorer/aggregate";
import {
  AGG_LABEL,
  getDimension,
  getMeasure,
  pickLabel,
  type Locale,
} from "@/lib/explorer/fields";
import type { KpiConfig } from "@/lib/explorer/visuals";

export function KpiCard({
  config,
  rows,
  locale,
  onEdit,
  onRemove,
}: {
  config: KpiConfig;
  rows: UAPCase[];
  locale: Locale;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const mode = config.mode ?? (config.share ? "share" : "value");
  const measure = getMeasure(config.measure);

  let value = 0;
  let suffix = "";
  let sub = "";
  let delta: number | null = null;

  if (mode === "share" && config.share) {
    value = kpiShare(rows, config.share.field, config.share.value);
    suffix = "%";
    sub =
      locale === "en" ? `share of ${rows.length} cases` : `del total de ${rows.length} casos`;
  } else if (mode === "distinct" && config.distinctDimension) {
    value = kpiDistinct(rows, config.distinctDimension);
    const dim = getDimension(config.distinctDimension);
    sub =
      (locale === "en" ? "distinct · " : "distintos · ") +
      (dim ? pickLabel(dim.label, locale) : config.distinctDimension);
    if (config.compare) {
      delta = value - kpiDistinct(allCases, config.distinctDimension);
    }
  } else if (mode === "threshold" && config.threshold) {
    value = kpiThreshold(rows, config.threshold.measure, config.threshold.value);
    suffix = "%";
    const tm = getMeasure(config.threshold.measure);
    sub = `${tm ? pickLabel(tm.label, locale) : config.threshold.measure} ≥ ${config.threshold.value}`;
  } else {
    value = kpiValue(rows, config.measure, config.agg);
    suffix = config.measure === "probability" ? "%" : "";
    sub = `${pickLabel(AGG_LABEL[config.agg], locale)} · ${
      measure ? pickLabel(measure.label, locale) : config.measure
    }`;
    if (config.compare) {
      delta = Math.round((value - kpiValue(allCases, config.measure, config.agg)) * 10) / 10;
    }
  }

  // Mostrar el delta solo cuando es significativo (evita un "=%" de ruido
  // cuando no hay filtro y el valor coincide con el corpus completo).
  const showDelta = delta !== null && Math.abs(delta) >= 0.05;

  return (
    <article className="group relative flex flex-col justify-between gap-3 border border-border bg-panel p-5">
      <CardActions onEdit={onEdit} onRemove={onRemove} locale={locale} />
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {pickLabel(config.title, locale)}
      </p>
      <div className="flex items-baseline gap-0.5">
        <span className="font-display text-6xl font-medium leading-none tracking-tight tabular-nums text-accent">
          {value.toLocaleString(locale === "en" ? "en-US" : "es-CL")}
        </span>
        {suffix && (
          <span className="font-display text-2xl font-medium leading-none text-muted">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">{sub}</p>
        {showDelta && (
          <span
            className={`shrink-0 font-mono text-xs tabular-nums ${
              delta! > 0 ? "text-tierB" : "text-accent"
            }`}
            title={locale === "en" ? "vs. whole corpus" : "vs. todo el corpus"}
          >
            {delta! > 0 ? "▲ +" : "▼ "}
            {Math.abs(delta!).toLocaleString(locale === "en" ? "en-US" : "es-CL")}
            {suffix}
          </span>
        )}
      </div>
    </article>
  );
}

export function CardActions({
  onEdit,
  onRemove,
  onExport,
  locale,
}: {
  onEdit?: () => void;
  onRemove?: () => void;
  onExport?: () => void;
  locale: Locale;
}) {
  if (!onEdit && !onRemove && !onExport) return null;
  return (
    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          aria-label={locale === "en" ? "Export PNG" : "Exportar PNG"}
          className="inline-flex h-7 w-7 items-center justify-center border border-border bg-bg text-sm text-muted hover:border-accent hover:text-accent"
        >
          ⤓
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={locale === "en" ? "Edit visual" : "Editar visual"}
          className="inline-flex h-7 w-7 items-center justify-center border border-border bg-bg text-sm text-muted hover:border-accent hover:text-accent"
        >
          ✎
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={locale === "en" ? "Remove visual" : "Eliminar visual"}
          className="inline-flex h-7 w-7 items-center justify-center border border-border bg-bg text-sm text-muted hover:border-accent hover:text-accent"
        >
          ✕
        </button>
      )}
    </div>
  );
}
