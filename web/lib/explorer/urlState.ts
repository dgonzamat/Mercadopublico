import { EMPTY_FILTERS, type Filters } from "./aggregate";
import type { VisualConfig } from "./visuals";

/**
 * Comparte el tablero por URL codificando {filters, visuals} en el hash
 * (`#r=...`). El hash es ideal para hosting estático (no llega al servidor)
 * y evita recargas. Base64-URL de JSON, con tope de tamaño defensivo.
 */

export interface ShareState {
  filters: Filters;
  visuals: VisualConfig[];
}

const HASH_KEY = "r";
const MAX_LEN = 8000;

function toBase64Url(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeStateToHash(state: ShareState): string | null {
  try {
    const encoded = toBase64Url(JSON.stringify(state));
    if (encoded.length > MAX_LEN) return null;
    return `${HASH_KEY}=${encoded}`;
  } catch {
    return null;
  }
}

export function buildShareUrl(state: ShareState): string | null {
  const hash = encodeStateToHash(state);
  if (!hash) return null;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${hash}`;
}

export function readStateFromHash(): ShareState | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith(`${HASH_KEY}=`)) return null;
  try {
    const raw = fromBase64Url(hash.slice(HASH_KEY.length + 1));
    const parsed = JSON.parse(raw) as Partial<ShareState>;
    if (!Array.isArray(parsed.visuals)) return null;
    return {
      filters: { ...EMPTY_FILTERS, ...(parsed.filters ?? {}) },
      visuals: parsed.visuals,
    };
  } catch {
    return null;
  }
}

export function clearHash() {
  if (typeof window === "undefined") return;
  history.replaceState(null, "", window.location.pathname + window.location.search);
}
