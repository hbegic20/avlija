import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

function stepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function Stepper({
  steps,
  currentIndex,
  className,
}: {
  steps: readonly string[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <nav aria-label={bs.stepper.label} className={className}>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step} className="flex items-center gap-3">
              {index > 0 ? (
                <span aria-hidden="true" className="h-px w-6 bg-linija" />
              ) : null}
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 text-small font-medium",
                  isCurrent && "text-crijep",
                  isDone && "text-vranica",
                  !isCurrent && !isDone && "text-tinta-2",
                )}
              >
                {isDone ? (
                  <Check aria-hidden="true" size={18} strokeWidth={1.5} />
                ) : (
                  <span className="font-mono text-mono">{stepNumber(index)}</span>
                )}
                <span>{step}</span>
                {isDone ? <span className="sr-only">, {bs.stepper.done}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
