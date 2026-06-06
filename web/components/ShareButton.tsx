"use client";

import { useState } from "react";
import { T } from "@/components/T";

/**
 * Botón "Compartir" para páginas de detalle. Usa la Web Share API nativa
 * (hoja del SO) donde existe — móvil y varios navegadores desktop — y cae
 * a "copiar link" al portapapeles donde no. Server-safe: toda la lógica
 * corre en el click. Con el og:image del sitio, el preview compartido
 * muestra imagen.
 */
export function ShareButton({ title }: { title?: string }) {
  const [copied, setCopied] = useState(false);

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

  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex min-h-[44px] shrink-0 items-center gap-2 border-2 border-text px-4 font-mono text-xs uppercase tracking-widest text-text hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden>↗</span>
      {copied ? (
        <T es="¡Link copiado!" en="Link copied!" />
      ) : (
        <T es="Compartir" en="Share" />
      )}
    </button>
  );
}
