import { listingGridClasses } from "@/components/listings/listing-card";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerLoading() {
  return (
    <Container className="flex flex-col gap-12 py-10">
      <div className="flex flex-col gap-12" aria-hidden="true">
        <div className="flex items-center gap-5 border-t-2 border-t-tinta pt-6">
          <Skeleton className="size-24" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <div className={listingGridClasses}>
          {[0, 1, 2, 3].map((card) => (
            <Skeleton key={card} className="aspect-3/4 w-full" />
          ))}
        </div>
      </div>
    </Container>
  );
}
