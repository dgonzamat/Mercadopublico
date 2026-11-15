"use client";

import { useState } from "react";

/**
 * Reproductor oficial de Facebook para el video ORIGINAL que publicó el propio
 * testigo, cuando es el único registro del suceso (Anchorage 2026, nov 2026,
 * decisión del dueño). No se copia el archivo: sigue en la cuenta de su autor.
 *
 * Carga al pulsar, no al abrir la ficha: el reproductor trae los scripts y
 * las cookies de Meta, y el sitio no carga terceros sin un gesto del
 * visitante (GA4 también espera al consentimiento). Por eso la portada no
 * lleva miniatura: pedirla a Facebook ya sería contactar con Meta.
 *
 * Proporción 9:16 fija para que no haya salto de layout al cargar.
 */
export default function FacebookVideo({
  src,
  title,
  locale,
}: {
  src: string;
  title: string;
  locale: "es" | "en";
}) {
  const [on, setOn] = useState(false);
  const es = locale === "es";
  return (
    <div className="mx-auto aspect-[9/16] w-full max-w-[320px] border border-text/15 bg-surface-2">
      {on ? (
        <iframe
          src={src}
          title={title}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          className="h-full w-full"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <button
            type="button"
            onClick={() => setOn(true)}
            className="min-h-[44px] border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-bg"
          >
            {es ? "Ver el video en Facebook" : "Watch the video on Facebook"}
          </button>
          <p className="text-xs leading-snug text-muted">
            {es
              ? "Al pulsar, Facebook carga su reproductor y sus cookies."
              : "When you click, Facebook loads its player and its cookies."}
          </p>
        </div>
      )}
    </div>
  );
}
