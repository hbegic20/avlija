import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const containerClasses = "mx-auto w-full max-w-page px-4 md:px-8 lg:px-12";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(containerClasses, className)}>{children}</div>;
}
