import { bs } from "@/lib/i18n/bs";
import { absoluteUrl } from "@/lib/seo/site-url";
import { JsonLd } from "./json-ld";

export function SiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: bs.site.name,
        alternateName: bs.site.homeTitle,
        description: bs.site.description,
        url: absoluteUrl("/"),
        inLanguage: "bs",
      }}
    />
  );
}
