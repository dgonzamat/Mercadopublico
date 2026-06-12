import type { ReactNode } from "react";

/**
 * Typography primitives — Editorial Swiss System.
 *
 * Modular scale: ratio 1.250 (Major Third) → 12 · 14 · 16 · 20 · 24 · 32 · 40 · 48 · 64
 * Three voices: sans (body) · display (serif H1/H2/numbers) · mono (codes/IDs only)
 *
 * Each primitive encapsulates the standard's classes so pages compose semantic
 * elements, not utility soup. To restrict drift, use these instead of raw <h1>/<p>.
 */

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Section kicker — mono, small, uppercase. Sits above headlines.
export function Eyebrow({ children, className }: Props) {
  return (
    <p
      className={cx(
        "font-mono text-xs uppercase tracking-widest text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

// Page-level headline. Serif display, tight leading.
export function H1({ children, className, id }: Props) {
  return (
    <h1
      id={id}
      className={cx(
        "font-display text-4xl font-medium leading-[1.1] tracking-tight text-text md:text-5xl lg:text-6xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}

// Section heading. Serif display.
export function H2({ children, className, id }: Props) {
  return (
    <h2
      id={id}
      className={cx(
        "font-display text-2xl font-medium leading-snug tracking-tight text-text md:text-3xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

// Sub-section heading. Sans, larger than body.
export function H3({ children, className, id }: Props) {
  return (
    <h3
      id={id}
      className={cx("text-xl font-semibold leading-snug text-text", className)}
    >
      {children}
    </h3>
  );
}

// Lede — first paragraph after a headline. Larger, snug leading.
export function Lede({ children, className }: Props) {
  return (
    <p className={cx("text-lg leading-snug text-text", className)}>
      {children}
    </p>
  );
}

// Body paragraph. Default reading text.
export function Body({ children, className }: Props) {
  return (
    <p className={cx("text-base leading-relaxed text-text", className)}>
      {children}
    </p>
  );
}

// Caption — for metadata, footnotes, image captions.
export function Caption({ children, className }: Props) {
  return (
    <p className={cx("text-xs leading-normal text-muted", className)}>
      {children}
    </p>
  );
}

// Display number — hero stats, killer figures. Tabular nums.
export function DisplayNumber({ children, className }: Props) {
  // Sin color de base: cn() es clsx puro (no deduplica) y un text-* del
  // caller quedaría compitiendo con el de aquí — gana el orden del CSS
  // generado, no el del atributo (así los BigStat de la Home rendían
  // negros pese a pasar text-accent). El color llega por className o se
  // hereda del body (tinta).
  return (
    <span
      className={cx(
        "font-display text-5xl leading-none tracking-tight tabular-nums md:text-6xl",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Pull quote — for emphasized statements inside editorial flow.
export function PullQuote({ children, className }: Props) {
  return (
    <blockquote
      className={cx(
        "border-l-2 border-accent pl-6 font-display text-xl leading-snug text-text",
        className,
      )}
    >
      {children}
    </blockquote>
  );
}
