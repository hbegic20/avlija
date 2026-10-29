import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { choiceBoxClasses } from "./checkbox";
import { FieldError, fieldMessageIds } from "./field";

type RadioProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  label: ReactNode;
};

export function Radio({ id, label, className, ...props }: RadioProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span className="relative mt-0.5 flex">
        <input id={inputId} type="radio" className={choiceBoxClasses} {...props} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto hidden size-2 bg-papir peer-checked:block"
        />
      </span>
      <label htmlFor={inputId} className="text-body text-tinta peer-disabled:text-tinta-3">
        {label}
      </label>
    </div>
  );
}

export function RadioGroup({
  legend,
  error,
  className,
  children,
}: {
  legend: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const { errorId } = fieldMessageIds(id);

  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cn("flex flex-col gap-2.5", className)}
    >
      <legend className="mb-1.5 text-label text-tinta-2 uppercase">{legend}</legend>
      {children}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
