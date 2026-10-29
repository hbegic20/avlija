import { Skeleton } from "@/components/ui/skeleton";

export default function ListingsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-6 w-full max-w-xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
