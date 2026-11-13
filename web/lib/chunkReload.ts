import { useEffect } from "react";

// Cada deploy publica gh-pages con force_orphan y borra los chunks del
// anterior. Una pestaña abierta antes del deploy pide un chunk viejo (el mapa
// del Atlas, el visor PDF, el laboratorio), recibe 404 y lanza un
// ChunkLoadError; reset() vuelve a pedir el mismo archivo borrado, así que
// solo una recarga lo arregla (nov 2026).
export const isChunkError = (e: Error) =>
  e.name === "ChunkLoadError" ||
  /Failed to load chunk|Loading chunk/i.test(e.message);

const RELOAD_KEY = "chunk-error-reload";

/** Recarga la página una vez ante un ChunkLoadError, pero no dos veces en
 * 30 s: si el chunk falta también en la versión nueva, se queda el aviso. */
export function useChunkReload(error: Error) {
  const chunk = isChunkError(error);
  useEffect(() => {
    if (!chunk) return;
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
  }, [chunk]);
  return chunk;
}
