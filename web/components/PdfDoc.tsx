"use client";

import dynamic from "next/dynamic";

// Frontera cliente: carga react-pdf solo en el navegador (ssr:false). Necesario
// porque pdfjs usa APIs del DOM y el sitio es SSG (output: export). El placeholder
// se muestra durante el prerender y mientras carga el bundle del visor.
// `loading` no recibe props, así que hay una instancia por idioma (el mismo
// chunk): así el placeholder sale en el idioma de la URL.
const placeholder = (text: string) =>
  function Loading() {
    return (
      <div className="flex h-[60vh] min-h-[360px] w-full items-center justify-center border border-text/15 bg-surface-2 text-sm text-muted">
        {text}
      </div>
    );
  };
const PdfPagesEs = dynamic(() => import("./PdfPages"), {
  ssr: false,
  loading: placeholder("Cargando visor…"),
});
const PdfPagesEn = dynamic(() => import("./PdfPages"), {
  ssr: false,
  loading: placeholder("Loading viewer…"),
});

export default function PdfDoc({
  src,
  fallbackUrl,
  page,
  locale,
}: {
  src: string;
  fallbackUrl?: string;
  page?: number;
  locale: "es" | "en";
}) {
  const PdfPages = locale === "es" ? PdfPagesEs : PdfPagesEn;
  return <PdfPages src={src} fallbackUrl={fallbackUrl} initialPage={page} locale={locale} />;
}
