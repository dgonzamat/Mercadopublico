"use client";

import dynamic from "next/dynamic";

// Frontera cliente: carga react-pdf solo en el navegador (ssr:false). Necesario
// porque pdfjs usa APIs del DOM y el sitio es SSG (output: export). El placeholder
// se muestra durante el prerender y mientras carga el bundle del visor.
const PdfPages = dynamic(() => import("./PdfPages"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] min-h-[360px] w-full items-center justify-center border border-text/15 bg-surface-2 text-sm text-muted">
      Cargando visor…
    </div>
  ),
});

export default function PdfDoc({
  src,
  fallbackUrl,
}: {
  src: string;
  fallbackUrl?: string;
}) {
  return <PdfPages src={src} fallbackUrl={fallbackUrl} />;
}
