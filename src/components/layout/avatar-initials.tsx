import { cn } from "@/lib/cn";

export function AvatarInitials({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-tinta bg-papir-2 font-mono text-label font-semibold text-tinta",
        className,
      )}
    >
      {initials}
    </span>
  );
}
