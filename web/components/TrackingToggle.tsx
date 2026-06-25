"use client";

import { useSyncExternalStore } from "react";
import { T } from "@/components/T";

const KEY = "uap-notrack";
const EVT = "uap-notrack-change";

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVT, cb);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Toggle de opt-out: marca este navegador para NO contar sus visitas (país,
 * página y suscriptor). Útil para excluir las visitas propias del dueño del
 * sitio. La marca vive en localStorage, así que aplica por navegador/dispositivo.
 * Usa useSyncExternalStore para reflejar el estado sin set-state-in-effect.
 */
export function TrackingToggle() {
  const off = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toggle = () => {
    try {
      if (off) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, "1");
    } catch {
      // localStorage no disponible: nada que persistir.
    }
    window.dispatchEvent(new Event(EVT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={off}
      className="inline-flex min-h-[44px] items-center gap-2 border border-border bg-panel px-3 font-mono text-[11px] uppercase tracking-widest text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden>{off ? "☑" : "☐"}</span>
      <T
        es={off ? "No se cuentan tus visitas" : "No contar mis visitas"}
        en={off ? "Your visits aren’t counted" : "Don’t count my visits"}
      />
    </button>
  );
}
