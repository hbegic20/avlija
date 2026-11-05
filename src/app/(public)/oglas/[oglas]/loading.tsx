import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ListingLoading() {
  return (
    <Container className="flex flex-col gap-14 py-8">
      <div className="flex flex-col gap-10" aria-hidden="true">
        <Skeleton className="aspect-4/3 w-full md:aspect-16/9" />
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-12 w-full max-w-xl" />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </Container>
  );
}
