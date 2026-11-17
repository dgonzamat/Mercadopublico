"use client";

import { useState } from "react";
import { T } from "@/components/T";
import { supabase } from "@/lib/supabase/client";
import { fireRpc } from "@/lib/supabase/track";
import { skipTracking } from "@/components/VisitorBeacon";

/**
 * Botón «Apoya UAP Codex» en modo de medición (17 nov 2026, decisión del dueño):
 * los aportes aún no están abiertos. Al pulsarlo agradece la intención, lo dice
 * claramente y cuenta un clic anónimo (`increment_support_intent`, migración
 * 0009), como mucho uno por dispositivo y uno por IP al día. Sirve para saber
 * cuánta gente estaría dispuesta antes de abrir una cuenta de aportes. Cuando
 * se abran, este botón pasa a ser un enlace a la plataforma.
 */
const KEY = "uap-support-intent";
export type SupportSource = "footer" | "about" | "header";

/** Cuenta la intención una sola vez por dispositivo (y el servidor, una por IP
 *  y día). La usan el botón y el enlace «Apoya» de la barra superior. */
export function recordSupportIntent(source: SupportSource): void {
  let already = false;
  try {
    already = localStorage.getItem(KEY) === "1";
    localStorage.setItem(KEY, "1");
  } catch {
    // Sin localStorage: decide el dedup por IP del servidor.
  }
  const sb = supabase;
  if (!already && sb && !skipTracking()) {
    fireRpc(sb, "increment_support_intent", { p_source: source });
  }
}

export function SupportButton({
  source,
  locale,
}: {
  source: SupportSource;
  locale?: "es" | "en";
}) {
  const [thanked, setThanked] = useState(false);
  // Corazones que suben desde el botón en cada clic (decorativos, aria-hidden).
  const [hearts, setHearts] = useState<{ id: number; dx: number; delay: number }[]>([]);

  const onClick = () => {
    setThanked(true);
    recordSupportIntent(source);
    const base = Date.now();
    const burst = [-28, -12, 4, 18, 32].map((dx, i) => ({ id: base + i, dx, delay: i * 90 }));
    setHearts((h) => [...h, ...burst]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id < base || x.id > base + 4)), 1600);
  };

  return (
    <div className="space-y-2">
      <span className="relative inline-block">
        <button
          type="button"
          onClick={onClick}
          aria-expanded={thanked}
          className="inline-flex min-h-[44px] items-center gap-2 border-2 border-text bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden>♥</span>
          <T es="Apoya UAP Codex" en="Support UAP Codex" locale={locale} />
        </button>
        {hearts.map((h) => (
          <span
            key={h.id}
            aria-hidden
            className="heart-float pointer-events-none absolute left-1/2 top-0 text-lg text-accent"
            style={{ ["--dx" as string]: `${h.dx}px`, animationDelay: `${h.delay}ms` } as React.CSSProperties}
          >
            ♥
          </span>
        ))}
      </span>
      <p role="status" className="text-sm text-text">
        {thanked && (
          <T
            locale={locale}
            es="Gracias por tu interés. Aún no recibimos aportes: primero queremos saber cuántas personas apoyarían el proyecto. Tu interés se cuenta una sola vez y sin datos personales."
            en="Thanks for your interest. We don't accept donations yet: first we want to know how many people would support the project. Your interest is counted only once, with no personal data."
          />
        )}
      </p>
    </div>
  );
}
