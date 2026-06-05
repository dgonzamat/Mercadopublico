/**
 * Site-wide URL constant.
 *
 * Drives metadataBase, canonical, sitemap, robots, and JSON-LD. Override
 * via NEXT_PUBLIC_SITE_URL at build time for staging/preview deploys.
 * Trailing slash is stripped so callers can do `${SITE_URL}/path`.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://uapcodex.org"
).replace(/\/$/, "");
