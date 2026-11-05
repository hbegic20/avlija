import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-12 w-56" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
