import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-12 w-2/3 max-w-md" />
      <Skeleton className="h-5 w-full max-w-xl" />
    </div>
  );
}
