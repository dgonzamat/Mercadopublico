"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { T } from "@/components/T";
import { useAuth } from "./AuthProvider";

/**
 * Gate de cliente. Restringe la herramienta de reporting a usuarios con
 * sesión (acceso por invitación). Los datos del corpus ya son públicos;
 * lo que se protege es la feature, no datos secretos.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        <T es="Verificando acceso…" en="Checking access…" />
      </div>
    );
  }

  if (!configured) {
    return (
      <Panel
        title={{ es: "Reporting no configurado", en: "Reporting not configured" }}
        body={{
          es: "Falta la configuración de Supabase (variables de entorno). El reporting estará disponible una vez configurado.",
          en: "Supabase configuration is missing (environment variables). Reporting will be available once configured.",
        }}
      />
    );
  }

  if (!user) {
    return (
      <Panel
        title={{ es: "Regístrate para usar el reporting", en: "Sign up to use reporting" }}
        body={{
          es: "Crea tu cuenta con tu email para crear gráficos, KPIs y reportes guardados.",
          en: "Create your account with your email to build charts, KPIs and saved reports.",
        }}
        cta
      />
    );
  }

  return <>{children}</>;
}

function Panel({
  title,
  body,
  cta = false,
}: {
  title: { es: string; en: string };
  body: { es: string; en: string };
  cta?: boolean;
}) {
  return (
    <div className="mx-auto max-w-xl border border-border bg-panel p-8 text-center">
      <p className="font-display text-2xl font-medium text-text">
        <T es={title.es} en={title.en} />
      </p>
      <p className="mt-3 text-muted">
        <T es={body.es} en={body.en} />
      </p>
      {cta && (
        <Link
          href="/acceso"
          className="mt-6 inline-flex items-center gap-2 bg-accent px-5 py-2.5 font-medium text-bg hover:opacity-90"
        >
          <T es="Entrar o registrarme" en="Sign in or sign up" />
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
