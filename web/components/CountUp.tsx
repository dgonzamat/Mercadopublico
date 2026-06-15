"use client";

import { useEffect, useState } from "react";

/**
 * Animated count-up for the hero number (0 → `to`). Client-only.
 *
 * SSR/no-JS render the final value (SEO-safe, no hydration mismatch); the
 * 0→`to` animation only runs after mount. `prefers-reduced-motion` skips the
 * animation entirely and shows the final value. Number comes from STATS via
 * props — never hard-coded (repo anti-pattern).
 */
export function CountUp({
  to,
  durationMs = 1300,
  delayMs = 500,
}: {
  to: number;
  durationMs?: number;
  delayMs?: number;
}) {
  // Initial = `to` so the server-rendered HTML and first client render match.
  const [val, setVal] = useState(to);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(to);
      return;
    }
    let raf = 0;
    let startT = 0;
    setVal(0);
    const step = (t: number) => {
      if (!startT) startT = t;
      const k = Math.min(1, (t - startT) / durationMs);
      const eased = 1 - Math.pow(1 - k, 3);
      setVal(Math.round(to * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, durationMs, delayMs]);

  return <span className="tabular-nums">{val}</span>;
}
