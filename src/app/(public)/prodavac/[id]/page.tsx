import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/layout/avatar";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ListingSheet } from "@/components/listings/listing-card";
import { formatDate } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import { getPublicSeller } from "@/lib/listings/public-listing";
import { sellerActiveListings } from "@/lib/search/queries";
import { initialsOf } from "@/lib/text/initials";
import { listingIdSchema } from "@/lib/validation/listing";
import { HatchNotice } from "@/components/ui/hatch-notice";


export const instant = false;

type SellerPageProps = PageProps<"/prodavac/[id]">;

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = listingIdSchema.safeParse(id).success ? await getPublicSeller(id) : null;
  return seller ? { title: bs.sellerPage.title(seller.fullName) } : {};
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  if (!listingIdSchema.safeParse(id).success) {
    notFound();
  }
  const [seller, listings] = await Promise.all([getPublicSeller(id), sellerActiveListings(id)]);
  if (!seller) {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-12 py-10">
      <header className="flex items-center gap-5 border-t-2 border-t-tinta pt-6">
        <Avatar
          fullName={seller.fullName}
          initials={initialsOf(seller.fullName)}
          avatarUrl={seller.avatarUrl}
          size="lg"
          decorative={false}
        />
        <div className="flex flex-col gap-1">
          <p className="text-label text-tinta-2 uppercase">{bs.detail.seller}</p>
          <h1 className="font-display text-h1">{seller.fullName}</h1>
          <p className="font-mono text-mono text-tinta-2">{bs.detail.memberSince(formatDate(seller.memberSince))}</p>
        </div>
      </header>
      <section>
        <SectionHeading title={bs.sellerPage.activeListings} />
        {listings.length > 0 ? (
          <ListingSheet listings={listings} eagerCount={4} />
        ) : (
          <HatchNotice>{bs.sellerPage.noListings}</HatchNotice>
        )}
      </section>
    </Container>
  );
}
