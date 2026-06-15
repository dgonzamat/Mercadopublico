"use client";

import { useState } from "react";
import { Researcher } from "@/lib/types";

// Static size lookup — Tailwind JIT won't compile dynamic class strings.
const SIZES = {
  sm: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-2xl",
} as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function ResearcherAvatar({
  researcher,
  size = "sm",
}: {
  researcher: Pick<Researcher, "name" | "photo">;
  size?: keyof typeof SIZES;
}) {
  const box = SIZES[size];
  // Si la foto remota (Wikimedia, etc.) falla o el archivo se movió, caemos
  // al avatar de iniciales en vez de mostrar una imagen rota. Client por el
  // onError.
  const [failed, setFailed] = useState(false);

  if (researcher.photo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={researcher.photo}
        alt={researcher.name}
        onError={() => setFailed(true)}
        className={`${box} shrink-0 border border-border object-cover`}
        loading="lazy"
      />
    );
  }
  return (
    // SE-1 · fallback como monograma intencional (tinta + crema, ~12:1) en vez
    // de iniciales muted sobre surface-2 (~2.7:1, leía como imagen rota). Cuadrado
    // como la foto: registro de dossier de archivo, coherente con el sistema.
    <div
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center border border-text bg-text font-mono font-medium text-bg`}
    >
      {initials(researcher.name)}
    </div>
  );
}
