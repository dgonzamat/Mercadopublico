import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase del navegador. Las claves son públicas por diseño
 * (la `anon` key es segura en el bundle; la seguridad real la da RLS).
 * Se leen de envs `NEXT_PUBLIC_*` inyectadas en build (CI) o `.env.local`.
 *
 * Si faltan las envs, `supabase` es `null` y la UI degrada con un aviso
 * de "configuración pendiente" en vez de romper el build estático.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
