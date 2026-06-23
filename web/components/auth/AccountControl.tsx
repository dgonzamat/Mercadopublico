"use client";

import Link from "next/link";
import { T } from "@/components/T";
import { useAuth } from "./AuthProvider";

/**
 * Control de sesión para el header. `variant="header"` (desktop, compacto)
 * o `variant="drawer"` (menú móvil). Muestra "Entrar" o el email + "Salir".
 */
export function AccountControl({
  dark = false,
  variant = "header",
}: {
  dark?: boolean;
  variant?: "header" | "drawer";
}) {
  const { user, loading } = useAuth();

  // Variante compacta para el top-bar del drawer móvil (junto a ES/EN · Cerrar).
  if (variant === "drawer") {
    if (loading) {
      return <span className="font-mono text-xs text-bg/50">···</span>;
    }
    if (!user) {
      // Enlace de texto discreto: no compite con ES/EN ni Cerrar (chrome).
      return (
        <Link
          href="/acceso"
          className="inline-flex h-10 items-center px-1 font-mono text-xs uppercase tracking-widest text-bg/70 underline-offset-4 hover:text-bg hover:underline"
        >
          <T es="Entrar" en="Sign in" />
        </Link>
      );
    }
    return (
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          title={user.email ?? ""}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-bg/20 text-xs font-medium text-bg"
        >
          {(user.email ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <SignOutButton drawer />
      </span>
    );
  }

  const base =
    "inline-flex items-center border-l px-3 font-display text-base font-medium";
  const tone = dark
    ? "border-bg/15 text-bg/85 hover:bg-bg hover:text-text"
    : "border-text/15 text-text hover:bg-text hover:text-bg";

  if (loading) {
    return <span className={`${base} ${tone} opacity-50`}>···</span>;
  }

  if (!user) {
    return (
      <Link href="/acceso" className={`${base} ${tone}`}>
        <T es="Entrar" en="Sign in" />
      </Link>
    );
  }

  return (
    <span className={`${base} ${tone} gap-2`}>
      <span
        aria-hidden
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          dark ? "bg-bg/20 text-bg" : "bg-text/10 text-text"
        }`}
        title={user.email ?? ""}
      >
        {(user.email ?? "?").slice(0, 1).toUpperCase()}
      </span>
      <SignOutButton dark={dark} />
    </span>
  );
}

function SignOutButton({ dark = false, drawer = false }: { dark?: boolean; drawer?: boolean }) {
  const { signOut } = useAuth();
  if (drawer) {
    return (
      <button
        type="button"
        onClick={() => signOut()}
        className="inline-flex h-10 items-center border-2 border-bg/40 px-3 font-mono text-xs uppercase tracking-widest text-bg hover:bg-bg hover:text-text"
      >
        <T es="Salir" en="Sign out" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className={`font-mono text-xs uppercase tracking-widest underline-offset-4 hover:underline ${
        dark ? "text-bg/70" : "text-muted"
      }`}
    >
      <T es="Salir" en="Sign out" />
    </button>
  );
}
