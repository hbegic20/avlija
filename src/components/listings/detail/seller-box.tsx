import Link from "next/link";
import { Avatar } from "@/components/layout/avatar";
import { initialsOf } from "@/lib/text/initials";
import { formatDate } from "@/lib/format";
import { bs } from "@/lib/i18n/bs";
import type { PublicSeller } from "@/lib/listings/public-listing";
import type { ReactNode } from "react";

export function sellerPath(sellerId: string): string {
  return `/prodavac/${sellerId}`;
}

export function SellerBox({ seller, children }: { seller: PublicSeller; children?: ReactNode }) {
  return (
    <section aria-label={bs.detail.seller} className="flex flex-col gap-4 border p-5">
      <p className="text-label text-tinta-2 uppercase">{bs.detail.seller}</p>
      <div className="flex items-center gap-3">
        <Avatar
          fullName={seller.fullName}
          initials={initialsOf(seller.fullName)}
          avatarUrl={seller.avatarUrl}
          className="size-12 text-small"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{seller.fullName}</span>
          <span className="font-mono text-label text-tinta-2">{bs.detail.memberSince(formatDate(seller.memberSince))}</span>
        </div>
      </div>
      {children}
      <Link
        href={sellerPath(seller.id)}
        className="w-fit text-small font-medium text-vranica underline underline-offset-3 hover:text-crijep"
      >
        {bs.detail.sellerListings}
      </Link>
    </section>
  );
}
