import type { Metadata } from "next";
import { STATS } from "@/lib/siteStats";

export const metadata: Metadata = {
  title: "Página no encontrada (404)",
  description: "La página que buscas no existe o cambió de dirección.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Error 404 · Página no encontrada
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-text">
        Esta entrada no existe en el corpus.
      </h1>
      <p className="mt-4 text-muted">
        O lo borramos al limpiar el archivo. Si buscabas un caso específico,
        prueba la lista completa de los {STATS.cases}.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="/"
          className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-text"
        >
          Volver al inicio
        </a>
        <a
          href="/cases"
          className="rounded-none border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          Ver los {STATS.cases} casos
        </a>
      </div>
    </div>
  );
}
