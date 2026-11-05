import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Ledger({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col", className)}>
      {title ? <h2 className="mb-1.5 text-label text-tinta-2 uppercase">{title}</h2> : null}
      <dl>{children}</dl>
    </section>
  );
}
