/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// In CI, the GitHub Pages action sets NEXT_PUBLIC_BASE_PATH to the canonical
// path (e.g. "/Mercadopublico"). We use that directly to avoid case mismatch.
// Fallback to lowercase repo name for local prod builds.
const basePath = isProd
  ? (process.env.NEXT_PUBLIC_BASE_PATH || "/mercadopublico")
  : "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
};

export default nextConfig;
