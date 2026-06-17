"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/T";

/**
 * GDPR cookie-consent banner that gates Google Analytics.
 *
 * GA4 (gtag.js) is NOT loaded until the visitor explicitly accepts —
 * this is the compliant approach (no tracking before consent), simpler
 * and more privacy-respecting than Consent Mode. The decision is stored
 * in localStorage so the banner only shows once per device.
 *
 * Lives in the root layout (persists across client navigations), so GA
 * loads once and GA4 enhanced measurement tracks subsequent page changes.
 */

const GA_ID = "G-MZHZC5ZLY5";
const STORAGE_KEY = "uap-ga-consent";

declare global {
  interface Window {
    __gaLoaded?: boolean;
    dataLayer?: unknown[];
  }
}

function loadGoogleAnalytics() {
  if (typeof window === "undefined" || window.__gaLoaded) return;
  window.__gaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_ID);
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
    if (consent === "granted") {
      loadGoogleAnalytics();
    } else if (consent !== "denied") {
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
    if (value === "granted") loadGoogleAnalytics();
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
            es="Usamos Google Analytics para medir visitas (cookies). No se carga hasta que aceptes; tu decisión se guarda en este dispositivo."
            en="We use Google Analytics to measure visits (cookies). It does not load until you accept; your choice is saved on this device."
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
