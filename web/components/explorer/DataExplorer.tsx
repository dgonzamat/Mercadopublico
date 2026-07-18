"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { casesClient as cases } from "@/lib/dataClient";
import type { UAPCase } from "@/lib/types";
// meceClasses es data-free (E18d) — seguro de importar en el explorer cliente.
import { MECE_CLASSES, dominantNarrativeLabel } from "@/lib/meceClasses";
import { T } from "@/components/T";
import {
  applyFilters,
  EMPTY_FILTERS,
  type Filters,
} from "@/lib/explorer/aggregate";
import {
  DEFAULT_VISUALS,
  isPanel,
  type VisualConfig,
} from "@/lib/explorer/visuals";
import {
  listReports,
  saveReport,
  deleteReport,
  type SavedReport,
} from "@/lib/explorer/reports";
import { buildShareUrl, readStateFromHash, clearHash } from "@/lib/explorer/urlState";
import { exportNodePdf, exportNodePng } from "@/lib/explorer/exportImage";
import { FilterPanel, type FacetOptions } from "./FilterPanel";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { PivotCard } from "./PivotCard";
import { HeatmapCard } from "./HeatmapCard";
import { DataTable } from "./DataTable";
import { AddVisualDialog } from "./AddVisualDialog";
import { useLocale } from "./useLocale";

const STORAGE_KEY = "uap-explorer-state-v2";

/**
 * Estado inicial síncrono: URL (#r=) tiene prioridad, luego localStorage,
 * luego defaults. Se lee en el inicializador del useState (este componente
 * solo renderiza en cliente vía ssr:false), así es estable ante el doble
 * montaje de React StrictMode y ante la limpieza posterior del hash.
 */
function readInitialState(): { filters: Filters; visuals: VisualConfig[] } {
  if (typeof window !== "undefined") {
    const shared = readStateFromHash();
    if (shared) return shared;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { filters?: Filters; visuals?: VisualConfig[] };
        return {
          filters: { ...EMPTY_FILTERS, ...(parsed.filters ?? {}) },
          visuals: Array.isArray(parsed.visuals) ? parsed.visuals : DEFAULT_VISUALS,
        };
      }
    } catch {
      /* estado corrupto */
    }
  }
  return { filters: EMPTY_FILTERS, visuals: DEFAULT_VISUALS };
}

export default function DataExplorer() {
  const locale = useLocale();

  const [filters, setFilters] = useState<Filters>(() => readInitialState().filters);
  const [visuals, setVisuals] = useState<VisualConfig[]>(() => readInitialState().visuals);
  const [dialog, setDialog] = useState<{ open: boolean; editing: VisualConfig | null }>(
    { open: false, editing: null },
  );

  // Reportes guardados (Supabase)
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [reportName, setReportName] = useState("");
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // Limpiar el hash una vez consumido (no debe re-aplicarse al recargar).
  useEffect(() => {
    clearHash();
  }, []);

  // Persistir borrador en localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, visuals }));
    } catch {
      /* storage lleno/bloqueado */
    }
  }, [filters, visuals]);

  // Lista de reportes del usuario.
  const refreshReports = () => {
    listReports()
      .then(setReports)
      .catch(() => setReports([]));
  };
  useEffect(() => {
    refreshReports();
  }, []);

  const options: FacetOptions = useMemo(() => {
    const countries = Array.from(new Set(cases.map((c) => c.country_name)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const categories = Array.from(new Set(cases.map((c) => c.category))) as UAPCase["category"][];
    const years = cases.map((c) => c.year_start);
    // Narrativas MECE presentes en el corpus, en el orden canónico de MECE_CLASSES
    // (no alfabético). Solo incidentes con posterior participan de la partición.
    const narrPresent = new Set(
      cases
        .filter((c) => c.category !== "document" && c.posterior)
        .map((c) => dominantNarrativeLabel(c.posterior!)),
    );
    const narrativas = MECE_CLASSES.map((m) => m.label).filter((l) =>
      narrPresent.has(l),
    );
    return {
      tiers: ["S", "A", "B"],
      categories,
      countries,
      narrativas,
      yearMin: Math.min(...years),
      yearMax: Math.max(...years),
    };
  }, []);

  const filtered = useMemo(() => applyFilters(cases, filters), [filters]);

  const kpis = visuals.filter((v) => v.kind === "kpi");
  const panels = visuals.filter(isPanel);

  const removeVisual = (id: string) => setVisuals((vs) => vs.filter((v) => v.id !== id));
  const saveVisual = (v: VisualConfig) => {
    setVisuals((vs) => {
      const idx = vs.findIndex((x) => x.id === v.id);
      if (idx >= 0) {
        const next = [...vs];
        next[idx] = v;
        return next;
      }
      return [...vs, v];
    });
    setDialog({ open: false, editing: null });
  };

  // Reportes
  const onSaveReport = async () => {
    const name = reportName.trim();
    if (!name) return;
    setReportMsg(null);
    try {
      await saveReport(name, { filters, visuals });
      setReportName("");
      setReportMsg(locale === "en" ? "Report saved." : "Reporte guardado.");
      refreshReports();
    } catch (e) {
      setReportMsg((e as Error).message);
    }
  };
  const onLoadReport = (r: SavedReport) => {
    setFilters({ ...EMPTY_FILTERS, ...r.config.filters });
    setVisuals(r.config.visuals);
    setReportMsg(
      locale === "en" ? `Loaded “${r.name}”.` : `Cargado «${r.name}».`,
    );
  };
  const onDeleteReport = async (r: SavedReport) => {
    try {
      await deleteReport(r.id);
      refreshReports();
    } catch (e) {
      setReportMsg((e as Error).message);
    }
  };

  // Export / compartir
  const onExportPdf = () => {
    if (dashboardRef.current) exportNodePdf(dashboardRef.current, "uap-tablero.pdf");
  };
  const onExportPng = () => {
    if (dashboardRef.current) exportNodePng(dashboardRef.current, "uap-tablero.png");
  };
  const onShare = async () => {
    const url = buildShareUrl({ filters, visuals });
    if (!url) {
      setReportMsg(locale === "en" ? "Dashboard too large to share by URL." : "Tablero demasiado grande para compartir por URL.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setReportMsg(locale === "en" ? "Share link copied." : "Enlace copiado al portapapeles.");
    } catch {
      setReportMsg(url);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        options={options}
        locale={locale}
        filteredCount={filtered.length}
        totalCount={cases.length}
      />

      <div className="min-w-0 space-y-6">
        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Tablero" en="Dashboard" />
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDialog({ open: true, editing: null })}
              className="bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              + <T es="Agregar visual" en="Add visual" />
            </button>
            <ToolButton onClick={onShare}><T es="Compartir" en="Share" /></ToolButton>
            <ToolButton onClick={onExportPdf}><T es="PDF" en="PDF" /></ToolButton>
            <ToolButton onClick={onExportPng}><T es="PNG" en="PNG" /></ToolButton>
            <ToolButton
              onClick={() => {
                setVisuals(DEFAULT_VISUALS);
                setFilters(EMPTY_FILTERS);
              }}
            >
              <T es="Restablecer" en="Reset" />
            </ToolButton>
          </div>
        </div>

        {/* REPORTES */}
        <section className="space-y-3 border border-border bg-panel p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Reportes guardados" en="Saved reports" />
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder={locale === "en" ? "Report name…" : "Nombre del reporte…"}
              className="min-w-48 flex-1 border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={onSaveReport}
              className="border border-accent bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              <T es="Guardar actual" en="Save current" />
            </button>
          </div>
          {reports.length > 0 && (
            <ul className="divide-y divide-border/60">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => onLoadReport(r)}
                    className="truncate text-left text-sm text-text underline-offset-2 hover:text-accent hover:underline"
                  >
                    {r.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteReport(r)}
                    aria-label={locale === "en" ? "Delete report" : "Eliminar reporte"}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest text-muted hover:text-accent"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          {reportMsg && <p className="text-xs text-muted">{reportMsg}</p>}
        </section>

        {/* CONTENIDO EXPORTABLE */}
        <div ref={dashboardRef} className="space-y-6 bg-bg">
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {kpis.map((v) => (
                <KpiCard
                  key={v.id}
                  config={v as Extract<VisualConfig, { kind: "kpi" }>}
                  rows={filtered}
                  locale={locale}
                  onEdit={() => setDialog({ open: true, editing: v })}
                  onRemove={() => removeVisual(v.id)}
                />
              ))}
            </div>
          )}

          {panels.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {panels.map((v) => {
                const common = {
                  rows: filtered,
                  locale,
                  onEdit: () => setDialog({ open: true, editing: v }),
                  onRemove: () => removeVisual(v.id),
                };
                if (v.kind === "chart")
                  return <ChartCard key={v.id} config={v} {...common} />;
                if (v.kind === "pivot")
                  return <PivotCard key={v.id} config={v} {...common} />;
                if (v.kind === "heatmap")
                  return <HeatmapCard key={v.id} config={v} {...common} />;
                return null;
              })}
            </div>
          )}
        </div>

        {visuals.length === 0 && (
          <div className="border border-dashed border-border bg-panel p-10 text-center text-muted">
            <T
              es="No hay visuales. Usa «Agregar visual» para crear uno."
              en="No visuals. Use “Add visual” to create one."
            />
          </div>
        )}

        {/* TABLA */}
        <section className="space-y-4 border-t-2 border-text/10 pt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Planilla · datos filtrados" en="Spreadsheet · filtered data" />
          </p>
          <DataTable rows={filtered} locale={locale} />
        </section>
      </div>

      {dialog.open && (
        <AddVisualDialog
          initial={dialog.editing}
          locale={locale}
          onSave={saveVisual}
          onClose={() => setDialog({ open: false, editing: null })}
        />
      )}
    </div>
  );
}

function ToolButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-border px-3 py-2 text-sm text-muted hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  );
}
