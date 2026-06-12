import Link from "next/link";
import type { ReactNode } from "react";

/**
 * CE-1 · Primitiva de CTA — tres variantes, una regla editorial:
 * primary = fill carmesí, máximo UNO por sección.
 * `onDark` invierte los colores para las bandas full-bleed bg-text.
 * Mismo movimiento que Badge: una sola fuente de verdad en vez de
 * re-declarar ~10 utilidades a mano en cada <Link>.
 */

type Variant = "primary" | "secondary" | "ghost";

const BASE =
  "inline-flex min-h-[48px] items-center gap-2 text-base font-medium transition";
const PAD = "px-8 py-3";

// Lookups estáticos — Tailwind JIT no compila clases dinámicas.
const LIGHT: Record<Variant, string> = {
  primary: "bg-accent text-bg hover:bg-text hover:text-bg",
  secondary: "border-2 border-text text-text hover:bg-text hover:text-bg",
  ghost: "text-muted hover:text-accent",
};
const DARK: Record<Variant, string> = {
  primary: "bg-accent text-bg hover:bg-bg hover:text-text",
  secondary: "border-2 border-bg text-bg hover:bg-bg hover:text-text",
  ghost: "text-bg/70 hover:text-accent-bright",
};

export function Cta({
  href,
  variant = "secondary",
  onDark = false,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  onDark?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const colors = onDark ? DARK[variant] : LIGHT[variant];
  const pad = variant === "ghost" ? "" : PAD;
  return (
    <Link
      href={href}
      className={[BASE, pad, colors, className].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  );
}
