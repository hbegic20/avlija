import type { MetadataRoute } from "next";
import { bs } from "@/lib/i18n/bs";
import { ogColours as c } from "@/lib/seo/og-fonts";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: bs.site.homeTitle,
    short_name: bs.site.name,
    description: bs.site.description,
    lang: "bs",
    start_url: "/",
    display: "standalone",
    background_color: c.papir,
    theme_color: c.tinta,
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
