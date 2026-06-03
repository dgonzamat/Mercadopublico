import type { ReactNode } from "react";

/**
 * Layout containers — Editorial Swiss System.
 *
 * Each container declares a max-width tied to a content type. Pages compose
 * these instead of inventing max-w-* per page. This is how the 12-col grid
 * gets enforced consistently.
 */

type Props = {
  children: ReactNode;
  className?: string;
};

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Long-form reading: ~65ch. For pure prose pages (about, resumen narratives).
export function ReadingContainer({ children, className }: Props) {
  return (
    <div className={cx("mx-auto max-w-prose px-4 md:px-0", className)}>
      {children}
    </div>
  );
}

// Mixed editorial: prose + sidebar / metadata. Default for detail pages.
export function EditorialContainer({ children, className }: Props) {
  return (
    <div className={cx("mx-auto max-w-4xl px-4 md:px-6", className)}>
      {children}
    </div>
  );
}

// Data listing: grid 12-col, dense rows. For /cases, /patterns, /atlas.
export function DataContainer({ children, className }: Props) {
  return (
    <div className={cx("mx-auto max-w-7xl px-4 md:px-6", className)}>
      {children}
    </div>
  );
}

// Hero / display: edge-to-edge with side padding. For landing hero blocks.
export function DisplayContainer({ children, className }: Props) {
  return (
    <div className={cx("mx-auto w-full px-6 md:px-12", className)}>
      {children}
    </div>
  );
}
