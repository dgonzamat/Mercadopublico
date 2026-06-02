"use client";

import { useEffect } from "react";

/**
 * Auto-expand details elements whose id matches the URL hash.
 *
 * Solves the UX bug where a link to #anchor lands the viewport on a
 * collapsed <details> — the user clicked "see reasoning" but landed
 * on a closed accordion. This runs on mount + on hashchange and
 * opens the matching details, then scrolls it into view.
 */
export function AnchorExpander() {
  useEffect(() => {
    function openTarget() {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;
      // Open the <details> itself if the anchor is one
      if (el.tagName === "DETAILS") {
        (el as HTMLDetailsElement).open = true;
      }
      // Or open any <details> ancestor (when anchor lands inside)
      const parentDetails = el.closest("details");
      if (parentDetails) parentDetails.open = true;
      // Also open any <details> descendant whose first <summary> contains the anchor
      // (covers the case where the anchor id is on the section, not on details)
      el.querySelectorAll("details").forEach((d) => {
        d.open = true;
      });
      // Re-scroll after opening (browser default scroll happens before expand)
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, []);

  return null;
}
