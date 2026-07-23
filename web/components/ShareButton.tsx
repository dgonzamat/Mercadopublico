"use client";

import { useState, useEffect } from "react";
import { T } from "@/components/T";

/**
 * Botón "Compartir". Usa la Web Share API nativa (hoja del SO) donde existe
 * — móvil y varios navegadores desktop — y cae a "copiar link" al
 * portapapeles donde no. Server-safe: toda la lógica corre en el click.
 *
 * - variant "default": botón con texto (páginas de detalle, footer).
 * - variant "icon": botón cuadrado solo-ícono (header), al lado de la lupa.
 */
export function ShareButton({
  title,
  variant = "default",
  dark = false,
  locale: localeProp,
}: {
  title?: string;
  variant?: "default" | "icon";
  dark?: boolean;
  /** Si la ruta sirve un idioma por URL, se fija aquí; el botón deja de
   *  observar data-locale y renderiza solo ese idioma. Sin él (chrome
   *  bilingüe) sigue observando el toggle. */
  locale?: "es" | "en";
}) {
  const [copied, setCopied] = useState(false);
  // X-3 · locale activo para los aria-label/title (atributos, no pueden usar <T>).
  // Antes estaban hard-codeados en español y el botón del header anunciaba
  // «Compartir» también en modo EN.
  const [observed, setObserved] = useState<"es" | "en">("es");
  useEffect(() => {
    if (localeProp) return; // idioma fijado por la ruta → no observar
    const el = document.documentElement;
    const read = () => setObserved((el.dataset.locale as "es" | "en") || "es");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-locale"] });
    return () => obs.disconnect();
  }, [localeProp]);
  const locale = localeProp ?? observed;
  const shareLabel = locale === "es" ? "Compartir" : "Share";
  const copiedLabel = locale === "es" ? "Link copiado" : "Link copied";

  async function onShare() {
    const url = window.location.href;
    const shareTitle = title || document.title;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        return; // el usuario canceló la hoja de compartir
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* portapapeles no disponible — sin acción */
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onShare}
        aria-label={copied ? copiedLabel : shareLabel}
        title={copied ? copiedLabel : shareLabel}
        className={`inline-flex h-9 w-9 items-center justify-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          dark
            ? "border-bg/30 bg-transparent text-bg hover:bg-bg hover:text-text"
            : "border-border bg-bg text-text hover:bg-text hover:text-bg"
        }`}
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex min-h-[44px] shrink-0 items-center gap-2 border-2 border-text px-4 font-mono text-xs uppercase tracking-widest text-text hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden>↗</span>
      {copied ? (
        <T es="¡Link copiado!" en="Link copied!" locale={localeProp} />
      ) : (
        <T es="Compartir" en="Share" locale={localeProp} />
      )}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
