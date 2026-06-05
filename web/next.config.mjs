/** @type {import('next').NextConfig} */
// basePath defaults to empty because the site is served from the apex of
// the uapcodex.org custom domain. The previous default "/Mercadopublico"
// was for the github.io URL; the workflow no longer overrides this and
// `||` treats an empty env value as falsy, so the default must be "".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
};

export default nextConfig;
