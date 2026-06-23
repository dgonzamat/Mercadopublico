"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const ACCESO_PATH = "/acceso/";
const APP_PATH = "/laboratorio/";

function redirect(path: string): string | undefined {
  return typeof window !== "undefined" ? `${window.location.origin}${path}` : undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      signInPassword: async (email, password) => {
        if (!supabase) return { error: "Supabase no está configurado." };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUpPassword: async (email, password) => {
        if (!supabase) return { error: "Supabase no está configurado.", needsConfirmation: false };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect(ACCESO_PATH) },
        });
        // Si el proyecto exige confirmación de email, no habrá sesión todavía.
        const needsConfirmation = !error && !data.session;
        return { error: error?.message ?? null, needsConfirmation };
      },
      signInMagicLink: async (email) => {
        if (!supabase) return { error: "Supabase no está configurado." };
        // Registro abierto: shouldCreateUser:true crea la cuenta si no existe.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirect(ACCESO_PATH), shouldCreateUser: true },
        });
        return { error: error?.message ?? null };
      },
      signInGoogle: async () => {
        if (!supabase) return { error: "Supabase no está configurado." };
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirect(APP_PATH) },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
