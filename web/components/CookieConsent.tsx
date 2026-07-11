"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/T";

/**
 * GDPR cookie-consent banner · Google Consent Mode v2.
 *
 * gtag.js is loaded eagerly in the root layout <head> (so Google detects the
 * tag), but with ALL storage denied by default — no cookies or personal data
 * until the visitor accepts here. This banner just issues the `consent update`:
 * `granted` on Accept, `denied` on Reject. The choice is stored in localStorage
 * so the banner shows once per device (and the layout snippet re-grants a
 * returning consenter on load).
 *
 * Why Consent Mode instead of the old "don't load gtag.js until accept" gate:
 * that gate kept the tag out of the static HTML, so Google's tag checker (and
 * GA "data received") reported it missing. Consent Mode is detectable AND
 * privacy-compliant. Lives in the root layout (persists across client nav).
 */

const STORAGE_KEY = "uap-ga-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateConsent(value: "granted" | "denied") {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", { analytics_storage: value });
}

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let consent: string | null = null;
    try {
      consent = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable (private mode, etc.) — show the banner.
    }
    // A stored "granted" is already re-applied by the layout gtag snippet on
    // load; only surface the banner when there's no prior decision.
    if (consent !== "granted" && consent !== "denied") {
      // Consentimiento leído de localStorage en mount (no disponible en SSR).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, []);

  function decide(value: "granted" | "denied") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore persistence failure
    }
    updateConsent(value);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-text bg-panel"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-snug text-muted">
          <T
            es="Usamos Google Analytics para medir visitas. No guardamos cookies ni datos personales hasta que aceptes; tu decisión se guarda en este dispositivo."
            en="We use Google Analytics to measure visits. We store no cookies or personal data until you accept; your choice is saved on this device."
          />
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="min-h-[44px] border-2 border-text px-4 font-display text-sm font-medium hover:bg-text hover:text-bg"
          >
            <T es="Rechazar" en="Reject" />
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="min-h-[44px] bg-accent px-4 font-display text-sm font-medium text-bg hover:bg-text"
          >
            <T es="Aceptar" en="Accept" />
          </button>
        </div>
      </div>
    </div>
  );
}
