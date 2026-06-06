import type { ReactNode } from "react";
import Link from "next/link";
import { T } from "@/components/T";

type PrevNextItem = {
  href: string;
  /** Kicker bilingüe (p. ej. "← Anterior" / "← Previous"). */
  es: string;
  en: string;
  /** Título mostrado (ReactNode para soportar texto bilingüe vía <T>). */
  title: ReactNode;
};

/**
 * Navegación secuencial anterior/siguiente entre páginas de detalle.
 * Extraído del patrón inline de /cases/[slug] para reusar en investigadores
 * y patrones. Server component puro.
 */
export function PrevNext({
  label,
  prev,
  next,
}: {
  label: string;
  prev: PrevNextItem | null;
  next: PrevNextItem | null;
}) {
  return (
    <nav
      aria-label={label}
      className="grid grid-cols-2 gap-px border-y-2 border-text bg-text"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col gap-1 bg-bg p-5 hover:bg-text hover:text-bg"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
            <T es={prev.es} en={prev.en} />
          </span>
          <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="bg-bg p-5" aria-hidden />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex flex-col gap-1 bg-bg p-5 text-right hover:bg-text hover:text-bg"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-bg/60">
            <T es={next.es} en={next.en} />
          </span>
          <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="bg-bg p-5" aria-hidden />
      )}
    </nav>
  );
}
