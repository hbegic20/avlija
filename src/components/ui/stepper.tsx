import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

function stepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function Stepper({
  steps,
  currentIndex,
  completedIndexes,
  hrefForStep,
  className,
}: {
  steps: readonly string[];
  currentIndex: number;
  completedIndexes?: readonly number[];
  hrefForStep?: (index: number) => string | null;
  className?: string;
}) {
  return (
    <nav aria-label={bs.stepper.label} className={className}>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {steps.map((step, index) => {
          const isDone = completedIndexes ? completedIndexes.includes(index) && index !== currentIndex : index < currentIndex;
          const isCurrent = index === currentIndex;
          const href = isCurrent ? null : (hrefForStep?.(index) ?? null);
          const content = (
            <>
              {isDone ? (
                <Check aria-hidden="true" size={18} strokeWidth={1.5} />
              ) : (
                <span className="font-mono text-mono">{stepNumber(index)}</span>
              )}
              <span>{step}</span>
              {isDone ? <span className="sr-only">, {bs.stepper.done}</span> : null}
            </>
          );
          const classes = cn(
            "flex items-center gap-1.5 text-small font-medium",
            isCurrent && "text-crijep",
            isDone && !isCurrent && "text-vranica",
            !isCurrent && !isDone && "text-tinta-2",
          );
          return (
            <li key={step} className="flex items-center gap-3">
              {index > 0 ? <span aria-hidden="true" className="h-px w-6 bg-linija" /> : null}
              {href ? (
                <Link href={href} className={cn(classes, "underline-offset-3 hover:underline")}>
                  {content}
                </Link>
              ) : (
                <span aria-current={isCurrent ? "step" : undefined} className={cn(classes, !isCurrent && !isDone && "opacity-60")}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
