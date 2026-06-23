import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase del navegador. Las claves son públicas por diseño
 * (la `anon`/publishable key es segura en el bundle; la seguridad real la
 * da RLS). Se leen de envs `NEXT_PUBLIC_*` (CI / `.env.local`) y, si faltan,
 * caen a los valores públicos del proyecto `uap-codex` — así producción
 * funciona aunque las Variables de GitHub Actions no estén/estén mal puestas.
 * Para apuntar a otro proyecto, basta definir las envs (tienen prioridad).
 */
const FALLBACK_URL = "https://hgbvdqckoosxesixhepr.supabase.co";
const FALLBACK_ANON = "sb_publishable_YCmulyZOWSMTqrrXM0E5QQ_OB8dme_I";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anon as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
