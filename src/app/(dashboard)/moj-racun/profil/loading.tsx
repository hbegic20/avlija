import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <Skeleton className="h-12 w-48" />
      {[0, 1, 2].map((section) => (
        <div key={section} className="grid gap-6 border-t pt-8 md:grid-cols-[260px_1fr]">
          <Skeleton className="h-8 w-40" />
          <div className="flex max-w-[520px] flex-col gap-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
