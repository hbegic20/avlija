import { useId, type ComponentProps, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { FieldError, describedBy, fieldMessageIds } from "./field";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  label: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
};

export const choiceBoxClasses = cn(
  "peer size-4.5 shrink-0 appearance-none border border-tinta bg-papir transition-colors",
  "checked:border-vranica checked:bg-vranica",
  "disabled:cursor-not-allowed disabled:border-tinta-3",
  "aria-invalid:border-greska",
);

export function Checkbox({ id, label, helper, error, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { helperId, errorId } = fieldMessageIds(inputId);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 flex">
          <input
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(inputId, helper, error)}
            className={choiceBoxClasses}
            {...props}
          />
          <Check
            aria-hidden="true"
            size={14}
            strokeWidth={2.5}
            className="pointer-events-none absolute inset-0 m-auto hidden text-papir peer-checked:block"
          />
        </span>
        <label htmlFor={inputId} className="text-body text-tinta peer-disabled:text-tinta-3">
          {label}
        </label>
      </div>
      {helper ? (
        <p id={helperId} className="pl-7 text-small text-tinta-2">
          {helper}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
