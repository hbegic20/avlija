import { bs } from "@/lib/i18n/bs";
import type { PublicListingBundle } from "@/lib/listings/public-listing";
import { descriptionSnippet } from "@/lib/seo/description";
import { listingsBasePath } from "@/lib/search/filters";
import { absoluteUrl } from "@/lib/seo/site-url";
import { JsonLd } from "./json-ld";

function breadcrumbs(bundle: PublicListingBundle) {
  const trail = [
    { name: bs.nav.listings, path: listingsBasePath },
    ...(bundle.municipalityName && bundle.municipalitySlug
      ? [{ name: bundle.municipalityName, path: `${listingsBasePath}/${bundle.municipalitySlug}` }]
      : []),
    { name: bundle.listing.title, path: bundle.path },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}

export function ListingJsonLd({ bundle }: { bundle: PublicListingBundle }) {
  const { listing } = bundle;
  const url = absoluteUrl(bundle.path);
  const offer =
    listing.price_km !== null
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
  return (
    <>
      <JsonLd data={data} />
      <JsonLd data={breadcrumbs(bundle)} />
    </>
  );
}
