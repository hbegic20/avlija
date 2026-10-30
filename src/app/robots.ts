import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/moj-racun", "/admin", "/auth", "/dizajn", "/prijava", "/registracija", "/zaboravljena-lozinka", "/nova-lozinka"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
