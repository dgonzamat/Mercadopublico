import type { MetadataRoute } from "next";

// Web App Manifest. App Router lo cablea automáticamente como
// <link rel="manifest" href="/manifest.webmanifest">.
// Estático para ser compatible con output: "export".
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UAP Codex — Análisis institucional del fenómeno UAP",
    short_name: "UAP Codex",
    description:
      "Cuaderno de investigación abierto sobre UAP institucionales, 1947–2026.",
    start_url: "/",
    // "browser" (no "standalone"): es un sitio de lectura, no una app.
    // Evita el prompt de instalación PWA en móvil; conserva ícono y theme-color.
    display: "browser",
    background_color: "#f7f2e8",
    theme_color: "#c41e3a",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
