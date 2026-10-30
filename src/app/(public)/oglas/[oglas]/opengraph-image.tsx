import { ImageResponse } from "next/og";
import { ListingOgCard } from "@/components/seo/listing-og-card";
import { bs } from "@/lib/i18n/bs";
import { getPublicListing } from "@/lib/listings/public-listing";
import { parseListingSegment } from "@/lib/listings/public-listing-segment";
import { loadOgFonts, ogColours as c, ogSize } from "@/lib/seo/og-fonts";

export const alt = bs.site.name;
export const size = ogSize;
export const contentType = "image/png";

export default async function ListingOpenGraphImage({ params }: { params: Promise<{ oglas: string }> }) {
  const [{ oglas }, fonts] = await Promise.all([params, loadOgFonts()]);
  const listingNumber = parseListingSegment(oglas);
  const bundle = listingNumber === null ? null : await getPublicListing(listingNumber);

  if (!bundle) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: c.papir, fontFamily: "Fraunces", fontSize: 96, color: c.tinta }}>
          {bs.site.name}
          <span style={{ color: c.crijep }}>.</span>
        </div>
      ),
      { ...size, fonts },
    );
  }

  return new ImageResponse(<ListingOgCard bundle={bundle} />, { ...size, fonts });
}
