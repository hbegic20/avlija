import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border", className)}>
      <div aria-hidden="true" className="hatch h-32 border-b" />
      <div className="flex flex-col items-start gap-3 bg-papir p-6">
        <h2 className="font-display text-h3">{title}</h2>
        <p className="text-body text-tinta-2">{description}</p>
        {action}
      </div>
    </section>
  );
}
