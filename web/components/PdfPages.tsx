"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Worker same-origin, bundleado por el toolchain (no CDN de terceros).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Props = {
  src: string;
  fallbackUrl?: string;
};

/**
 * Visor PDF inline (canvas) que funciona en móvil y escritorio — a diferencia
 * del <iframe>, que los navegadores móviles no embeben. Paginado (una página a
 * la vez) para soportar documentos de cientos de páginas sin colgar el móvil.
 * Se carga vía dynamic(ssr:false) desde PdfDoc, así que pdfjs solo corre en el
 * navegador. Capas de texto/anotación desactivadas: solo render visual.
 */
export default function PdfPages({ src, fallbackUrl }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w) setWidth(Math.floor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (failed) {
    return (
      <div className="flex h-[60vh] min-h-[360px] w-full flex-col items-center justify-center gap-3 border border-text/15 bg-surface-2 text-center">
        <p className="text-sm text-muted">No se pudo renderizar el PDF aquí.</p>
        <a
          href={fallbackUrl ?? src}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-accent px-4 py-2 text-sm text-bg"
        >
          Abrir documento
        </a>
      </div>
    );
  }

  return (
    <div className="w-full border border-text/15 bg-surface-2">
      <div ref={boxRef} className="max-h-[80vh] overflow-auto">
        <Document
          file={src}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setFailed(true)}
          loading={
            <div className="flex h-[60vh] min-h-[360px] items-center justify-center text-sm text-muted">
              Cargando PDF…
            </div>
          }
          error={
            <div className="flex h-[60vh] min-h-[360px] items-center justify-center text-sm text-muted">
              Error al cargar el PDF.
            </div>
          }
        >
          <Page
            pageNumber={page}
            width={width || undefined}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex h-[60vh] min-h-[360px] items-center justify-center text-sm text-muted">
                Cargando página…
              </div>
            }
          />
        </Document>
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-text/15 px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-1 disabled:opacity-30"
            aria-label="Página anterior"
          >
            ‹
          </button>
          <span>
            {page} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            className="px-2 py-1 disabled:opacity-30"
            aria-label="Página siguiente"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
