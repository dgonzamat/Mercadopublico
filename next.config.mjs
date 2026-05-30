/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
// IMPORTANT: must match the GitHub repo name EXACTLY (case-sensitive).
// GitHub Pages serves at /Mercadopublico/, not /mercadopublico/.
const repoName = "Mercadopublico";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
};

export default nextConfig;
