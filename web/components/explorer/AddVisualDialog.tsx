"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/T";
import {
  AGG_LABEL,
  CATEGORY_LABEL,
  DIMENSIONS,
  MEASURES,
  getMeasure,
  pickLabel,
  type AggFn,
  type Locale,
} from "@/lib/explorer/fields";
import {
  CHART_TYPE_LABEL,
  newVisualId,
  type ChartType,
  type KpiMode,
  type VisualConfig,
} from "@/lib/explorer/visuals";

const CHART_TYPES: ChartType[] = ["bar", "barH", "line", "area", "pie", "scatter"];
type Kind = "kpi" | "chart" | "pivot" | "heatmap";

const KIND_LABEL: Record<Kind, { es: string; en: string }> = {
  chart: { es: "Gráfico", en: "Chart" },
  kpi: { es: "KPI", en: "KPI" },
  pivot: { es: "Tabla dinámica", en: "Pivot table" },
  heatmap: { es: "Mapa de calor", en: "Heatmap" },
};

const KPI_MODE_LABEL: Record<KpiMode, { es: string; en: string }> = {
  value: { es: "Valor (medida + agregación)", en: "Value (measure + aggregation)" },
  distinct: { es: "Conteo distinto (cobertura)", en: "Distinct count (coverage)" },
  threshold: { es: "% sobre umbral", en: "% over threshold" },
  share: { es: "% por categoría", en: "% by category" },
};

const TIER_VALUES = ["S", "A", "B"];

export function AddVisualDialog({
  initial,
  locale,
  onSave,
  onClose,
}: {
  initial: VisualConfig | null;
  locale: Locale;
  onSave: (v: VisualConfig) => void;
  onClose: () => void;
}) {
  const editing = !!initial;
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "chart");
  const [chartType, setChartType] = useState<ChartType>(
    initial?.kind === "chart" ? initial.chartType : "bar",
  );
  const [dimension, setDimension] = useState<string>(
    initial && "dimension" in initial ? initial.dimension : "tier",
  );
  const [dimensionY, setDimensionY] = useState<string>(
    initial?.kind === "heatmap" ? initial.dimensionY : "country",
  );
  const [dimensionX, setDimensionX] = useState<string>(
    initial?.kind === "heatmap" ? initial.dimensionX : "decade",
  );
  const [measure, setMeasure] = useState<string>(initial?.measure ?? "count");
  const [agg, setAgg] = useState<AggFn>(initial?.agg ?? "count");
  const [topN, setTopN] = useState<string>(
    initial && "topN" in initial && initial.topN ? String(initial.topN) : "",
  );
  const [cumulative, setCumulative] = useState<boolean>(
    initial?.kind === "chart" ? !!initial.cumulative : false,
  );
  const [compare, setCompare] = useState<boolean>(
    initial?.kind === "kpi" ? !!initial.compare : false,
  );
  // KPI: modo y campos específicos
  const [kpiMode, setKpiMode] = useState<KpiMode>(
    initial?.kind === "kpi" ? initial.mode ?? (initial.share ? "share" : "value") : "value",
  );
  const [distinctDimension, setDistinctDimension] = useState<string>(
    initial?.kind === "kpi" ? initial.distinctDimension ?? "country" : "country",
  );
  const [thresholdMeasure, setThresholdMeasure] = useState<string>(
    initial?.kind === "kpi" ? initial.threshold?.measure ?? "probability" : "probability",
  );
  const [thresholdValue, setThresholdValue] = useState<string>(
    initial?.kind === "kpi" && initial.threshold ? String(initial.threshold.value) : "70",
  );
  const [shareField, setShareField] = useState<"tier" | "category">(
    initial?.kind === "kpi" ? initial.share?.field ?? "tier" : "tier",
  );
  const [shareValue, setShareValue] = useState<string>(
    initial?.kind === "kpi" ? initial.share?.value ?? "S" : "S",
  );
  const [titleEs, setTitleEs] = useState(initial?.title.es ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title.en ?? "");

  const allowedAggs = getMeasure(measure)?.aggs ?? ["count"];
  const canCumulate = kind === "chart" && (chartType === "line" || chartType === "area");

  useEffect(() => {
    if (!allowedAggs.includes(agg)) setAgg(allowedAggs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const deriveTitle = (): { es: string; en: string } => {
    const meas = getMeasure(measure);
    const ml = meas ? meas.label : { es: measure, en: measure };
    const dl = (k: string) => {
      const d = DIMENSIONS.find((x) => x.key === k);
      return d ? d.label : { es: k, en: k };
    };
    if (kind === "kpi") {
      if (kpiMode === "distinct")
        return { es: dl(distinctDimension).es, en: dl(distinctDimension).en };
      if (kpiMode === "threshold") {
        const tm = getMeasure(thresholdMeasure);
        const tl = tm ? tm.label : { es: thresholdMeasure, en: thresholdMeasure };
        return { es: `% ${tl.es} ≥ ${thresholdValue}`, en: `% ${tl.en} ≥ ${thresholdValue}` };
      }
      if (kpiMode === "share") {
        const v =
          shareField === "category"
            ? pickLabel(CATEGORY_LABEL[shareValue as keyof typeof CATEGORY_LABEL] ?? { es: shareValue, en: shareValue }, "es")
            : `Tier ${shareValue}`;
        return { es: `% ${v}`, en: `% ${v}` };
      }
      return {
        es: `${pickLabel(AGG_LABEL[agg], "es")} · ${ml.es}`,
        en: `${pickLabel(AGG_LABEL[agg], "en")} · ${ml.en}`,
      };
    }
    if (kind === "heatmap")
      return {
        es: `${dl(dimensionY).es} × ${dl(dimensionX).es}`,
        en: `${dl(dimensionY).en} × ${dl(dimensionX).en}`,
      };
    return {
      es: `${ml.es} por ${dl(dimension).es.toLowerCase()}`,
      en: `${ml.en} by ${dl(dimension).en.toLowerCase()}`,
    };
  };

  const save = () => {
    const auto = deriveTitle();
    const title = { es: titleEs.trim() || auto.es, en: titleEn.trim() || auto.en };
    const id = initial?.id ?? newVisualId(kind);
    const n = topN ? Number(topN) : undefined;
    if (kind === "kpi") {
      if (kpiMode === "distinct") {
        onSave({ id, kind: "kpi", title, mode: "distinct", measure: "count", agg: "count", distinctDimension, compare });
      } else if (kpiMode === "threshold") {
        onSave({ id, kind: "kpi", title, mode: "threshold", measure: thresholdMeasure, agg: "count", threshold: { measure: thresholdMeasure, value: Number(thresholdValue) || 0 } });
      } else if (kpiMode === "share") {
        onSave({ id, kind: "kpi", title, mode: "share", measure: "count", agg: "count", share: { field: shareField, value: shareValue } });
      } else {
        onSave({ id, kind: "kpi", title, mode: "value", measure, agg, compare });
      }
    } else if (kind === "pivot") {
      onSave({ id, kind: "pivot", title, dimension, measure, agg, topN: n });
    } else if (kind === "heatmap") {
      onSave({ id, kind: "heatmap", title, dimensionX, dimensionY, measure, agg, topNY: n });
    } else {
      onSave({
        id,
        kind: "chart",
        title,
        chartType,
        dimension,
        measure,
        agg,
        topN: n,
        cumulative: canCumulate ? cumulative : undefined,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto border border-border bg-bg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-medium text-text">
            {editing ? <T es="Editar visual" en="Edit visual" /> : <T es="Agregar visual" en="Add visual" />}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={locale === "en" ? "Close" : "Cerrar"}
            className="text-xl text-muted hover:text-accent"
          >
            ✕
          </button>
        </div>

        <Field label={{ es: "Tipo de visual", en: "Visual type" }} locale={locale}>
          <Select value={kind} onChange={(v) => setKind(v as Kind)}>
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <option key={k} value={k}>
                {pickLabel(KIND_LABEL[k], locale)}
              </option>
            ))}
          </Select>
        </Field>

        {kind === "kpi" && (
          <Field label={{ es: "Métrica del KPI", en: "KPI metric" }} locale={locale}>
            <Select value={kpiMode} onChange={(v) => setKpiMode(v as KpiMode)}>
              {(Object.keys(KPI_MODE_LABEL) as KpiMode[]).map((m) => (
                <option key={m} value={m}>
                  {pickLabel(KPI_MODE_LABEL[m], locale)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {kind === "kpi" && kpiMode === "distinct" && (
          <Field label={{ es: "Dimensión a contar (única)", en: "Dimension to count (unique)" }} locale={locale}>
            <Select value={distinctDimension} onChange={setDistinctDimension}>
              {DIMENSIONS.map((d) => (
                <option key={d.key} value={d.key}>
                  {pickLabel(d.label, locale)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {kind === "kpi" && kpiMode === "threshold" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={{ es: "Medida", en: "Measure" }} locale={locale}>
              <Select value={thresholdMeasure} onChange={setThresholdMeasure}>
                {MEASURES.filter((m) => m.key !== "count").map((m) => (
                  <option key={m.key} value={m.key}>
                    {pickLabel(m.label, locale)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={{ es: "Umbral (≥)", en: "Threshold (≥)" }} locale={locale}>
              <input
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
          </div>
        )}

        {kind === "kpi" && kpiMode === "share" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={{ es: "Campo", en: "Field" }} locale={locale}>
              <Select
                value={shareField}
                onChange={(v) => {
                  const f = v as "tier" | "category";
                  setShareField(f);
                  setShareValue(f === "tier" ? "S" : "incident");
                }}
              >
                <option value="tier">{locale === "en" ? "Tier" : "Nivel (Tier)"}</option>
                <option value="category">{locale === "en" ? "Category" : "Categoría"}</option>
              </Select>
            </Field>
            <Field label={{ es: "Valor", en: "Value" }} locale={locale}>
              <Select value={shareValue} onChange={setShareValue}>
                {shareField === "tier"
                  ? TIER_VALUES.map((t) => (
                      <option key={t} value={t}>
                        Tier {t}
                      </option>
                    ))
                  : (Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((c) => (
                      <option key={c} value={c}>
                        {pickLabel(CATEGORY_LABEL[c], locale)}
                      </option>
                    ))}
              </Select>
            </Field>
          </div>
        )}

        {kind === "chart" && (
          <Field label={{ es: "Tipo de gráfico", en: "Chart type" }} locale={locale}>
            <Select value={chartType} onChange={(v) => setChartType(v as ChartType)}>
              {CHART_TYPES.map((t) => (
                <option key={t} value={t}>
                  {pickLabel(CHART_TYPE_LABEL[t], locale)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {(kind === "chart" || kind === "pivot") && (
          <Field label={{ es: "Dimensión (eje / categoría)", en: "Dimension (axis / category)" }} locale={locale}>
            <Select value={dimension} onChange={setDimension}>
              {DIMENSIONS.map((d) => (
                <option key={d.key} value={d.key}>
                  {pickLabel(d.label, locale)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {kind === "heatmap" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={{ es: "Filas (Y)", en: "Rows (Y)" }} locale={locale}>
              <Select value={dimensionY} onChange={setDimensionY}>
                {DIMENSIONS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {pickLabel(d.label, locale)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={{ es: "Columnas (X)", en: "Columns (X)" }} locale={locale}>
              <Select value={dimensionX} onChange={setDimensionX}>
                {DIMENSIONS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {pickLabel(d.label, locale)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {(kind !== "kpi" || kpiMode === "value") && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={{ es: "Medida", en: "Measure" }} locale={locale}>
              <Select value={measure} onChange={setMeasure}>
                {MEASURES.map((m) => (
                  <option key={m.key} value={m.key}>
                    {pickLabel(m.label, locale)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={{ es: "Agregación", en: "Aggregation" }} locale={locale}>
              <Select value={agg} onChange={(v) => setAgg(v as AggFn)}>
                {allowedAggs.map((a) => (
                  <option key={a} value={a}>
                    {pickLabel(AGG_LABEL[a], locale)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {(kind === "chart" || kind === "pivot" || kind === "heatmap") && (
          <Field
            label={kind === "heatmap"
              ? { es: "Top N filas (opcional)", en: "Top N rows (optional)" }
              : { es: "Top N (opcional)", en: "Top N (optional)" }}
            locale={locale}
          >
            <input
              type="number"
              min={1}
              value={topN}
              onChange={(e) => setTopN(e.target.value)}
              placeholder={locale === "en" ? "all" : "todos"}
              className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </Field>
        )}

        {canCumulate && (
          <Check checked={cumulative} onChange={setCumulative}>
            <T es="Acumulado (suma corrida)" en="Cumulative (running total)" />
          </Check>
        )}
        {kind === "kpi" && (kpiMode === "value" || kpiMode === "distinct") && (
          <Check checked={compare} onChange={setCompare}>
            <T es="Comparar vs. todo el corpus (delta)" en="Compare vs. whole corpus (delta)" />
          </Check>
        )}

        <Field label={{ es: "Título (opcional)", en: "Title (optional)" }} locale={locale}>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={titleEs}
              onChange={(e) => setTitleEs(e.target.value)}
              placeholder="ES"
              className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="EN"
              className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </div>
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent"
          >
            <T es="Cancelar" en="Cancel" />
          </button>
          <button
            type="button"
            onClick={save}
            className="bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            {editing ? <T es="Guardar" en="Save" /> : <T es="Agregar" en="Add" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  locale,
  children,
}: {
  label: { es: string; en: string };
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {pickLabel(label, locale)}
      </p>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
    >
      {children}
    </select>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-accent"
      />
      {children}
    </label>
  );
}
