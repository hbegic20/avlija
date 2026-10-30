import { bs } from "@/lib/i18n/bs";
import type { PublicListingBundle } from "@/lib/listings/public-listing";
import { descriptionSnippet } from "@/lib/seo/description";
import { absoluteUrl } from "@/lib/seo/site-url";

function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function ListingJsonLd({ bundle }: { bundle: PublicListingBundle }) {
  const { listing } = bundle;
  const url = absoluteUrl(bundle.path);
  const offer =
    listing.price_km !== null && !listing.price_negotiable
      ? {
          "@type": "Offer",
          price: listing.price_km,
          priceCurrency: "BAM",
          availability: listing.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          url,
        }
      : undefined;
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: descriptionSnippet(listing.description) || listing.title,
    url,
    identifier: String(listing.number),
    datePosted: listing.published_at ?? undefined,
    image: bundle.images.map((image) => image.publicUrl),
    offers: offer,
    contentLocation: {
      "@type": "Place",
      name: bundle.municipalityName ?? undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: bundle.municipalityName ?? undefined,
        addressRegion: bs.site.region,
        addressCountry: "BA",
        streetAddress: listing.public_address ?? undefined,
      },
      geo:
        listing.location_precise && listing.public_lat !== null && listing.public_lng !== null
          ? { "@type": "GeoCoordinates", latitude: listing.public_lat, longitude: listing.public_lng }
          : undefined,
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}
