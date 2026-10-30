import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn("border-t-2 border-t-tinta pt-3 font-display text-h1", className)}>{children}</h1>;
}
