import { Skeleton } from "@/components/ui/skeleton";

export function WizardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <Skeleton className="h-12 w-72" />
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2, 3, 4].map((step) => (
          <Skeleton key={step} className="h-6 w-28" />
        ))}
      </div>
      <div className="flex max-w-[880px] flex-col gap-5">
        <Skeleton className="h-11 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
