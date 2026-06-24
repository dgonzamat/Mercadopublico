"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/components/T";
import { useAuth } from "@/components/auth/AuthProvider";

type Mode = "signin" | "signup" | "magic";

export function AccessForm() {
  const {
    user,
    loading,
    configured,
    signInPassword,
    signUpPassword,
    signInMagicLink,
  } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/laboratorio");
  }, [loading, user, router]);

  const reset = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "signin") {
      const { error } = await signInPassword(email.trim(), password);
      if (error) setError(error);
    } else if (mode === "signup") {
      const { error, needsConfirmation } = await signUpPassword(email.trim(), password);
      if (error) setError(error);
      else if (needsConfirmation)
        setNotice(
          "es:Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.",
        );
      // Si no requiere confirmación, onAuthStateChange redirige solo.
    } else {
      const { error } = await signInMagicLink(email.trim());
      if (error) setError(error);
      else setNotice("es:Te enviamos un enlace de acceso. Revisa tu correo.");
    }
    setBusy(false);
  };

  if (!configured) {
    return (
      <p className="border border-border bg-panel p-4 text-sm text-muted">
        <T
          es="El acceso aún no está configurado (faltan variables de Supabase)."
          en="Access is not configured yet (Supabase variables missing)."
        />
      </p>
    );
  }

  return (
    <div className="space-y-5 border border-border bg-panel p-6">
      {/* MODO EMAIL */}
      <div className="flex gap-2">
        <Seg active={mode === "signin"} onClick={() => reset("signin")}>
          <T es="Entrar" en="Sign in" />
        </Seg>
        <Seg active={mode === "signup"} onClick={() => reset("signup")}>
          <T es="Crear cuenta" en="Sign up" />
        </Seg>
        <Seg active={mode === "magic"} onClick={() => reset("magic")}>
          <T es="Enlace" en="Link" />
        </Seg>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="Email" en="Email" />
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </label>

        {mode !== "magic" && (
          <label className="block space-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
              <T es="Contraseña" en="Password" />
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>
        )}

        {error && (
          <p className="border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        )}
        {notice && (
          <p className="border-l-2 border-accent px-3 py-2 text-sm text-text">
            {notice.startsWith("es:") ? (
              <T es={notice.slice(3)} en={notice.slice(3)} />
            ) : (
              notice
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-accent px-4 py-2.5 font-medium text-bg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? (
            <T es="Procesando…" en="Processing…" />
          ) : mode === "signin" ? (
            <T es="Iniciar sesión" en="Sign in" />
          ) : mode === "signup" ? (
            <T es="Crear cuenta" en="Create account" />
          ) : (
            <T es="Enviar enlace" en="Send link" />
          )}
        </button>
      </form>

      <p className="border-t border-border pt-4 text-xs text-muted">
        <T
          es="Regístrate con tu email para usar la herramienta de reporting."
          en="Sign up with your email to use the reporting tool."
        />
      </p>
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-accent bg-accent text-bg"
          : "border-border bg-bg text-text hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

