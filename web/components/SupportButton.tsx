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

  const onClick = () => {
    setThanked(true);
    recordSupportIntent(source);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={thanked}
        className="inline-flex min-h-[44px] items-center gap-2 border-2 border-text bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden>♥</span>
        <T es="Apoya UAP Codex" en="Support UAP Codex" locale={locale} />
      </button>
      <p role="status" className="text-sm text-text">
        {thanked && (
          <T
            locale={locale}
            es="Gracias por la intención. Todavía no recibimos aportes: antes de abrirlos queremos saber si hay interés, y tu clic quedó contado, sin ningún dato personal."
            en="Thank you for the intention. We don't accept contributions yet: before opening them we want to know whether there is interest, and your click has been counted, with no personal data."
          />
        )}
      </p>
    </div>
  );
}
