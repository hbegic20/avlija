import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataRowTone = "default" | "positive" | "negative";

const toneClasses: Record<DataRowTone, string> = {
  default: "text-tinta",
  positive: "text-vranica",
  negative: "text-tinta-2",
};

export function DataRow({
  label,
  value,
  tone = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: DataRowTone;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2 py-1.5", className)}>
      <dt className="text-small text-tinta-2">{label}</dt>
      <span aria-hidden="true" className="leader" />
      <dd className={cn("text-right font-mono text-mono", toneClasses[tone])}>{value}</dd>
    </div>
  );
}
