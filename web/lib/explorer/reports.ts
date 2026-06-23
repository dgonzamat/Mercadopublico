import { supabase } from "@/lib/supabase/client";
import type { Filters } from "./aggregate";
import type { VisualConfig } from "./visuals";

/**
 * Reportes con nombre, persistidos por usuario en Supabase (tabla
 * `public.reports`, protegida por RLS: cada quien ve solo los suyos).
 */

export interface ReportConfig {
  filters: Filters;
  visuals: VisualConfig[];
}

export interface SavedReport {
  id: string;
  name: string;
  config: ReportConfig;
  updated_at: string;
}

export async function listReports(): Promise<SavedReport[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reports")
    .select("id, name, config, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SavedReport[];
}

export async function saveReport(
  name: string,
  config: ReportConfig,
): Promise<SavedReport> {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase
    .from("reports")
    .insert({ name, config })
    .select("id, name, config, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data as SavedReport;
}

export async function updateReport(
  id: string,
  config: ReportConfig,
): Promise<void> {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase
    .from("reports")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReport(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
