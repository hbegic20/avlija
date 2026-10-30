import { Skeleton } from "@/components/ui/skeleton";

export function ResultsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]" aria-hidden="true">
      <div className="hidden flex-col gap-4 lg:flex">
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-24 w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-11 w-48" />
        <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
