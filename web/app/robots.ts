import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Requerido por Next 16 con output: "export" para rutas de metadata.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
