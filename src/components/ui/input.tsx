import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, controlClasses, describedBy } from "./field";

type InputProps = Omit<ComponentProps<"input">, "children"> & {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  unit?: string;
  fieldClassName?: string;
};

export function Input({
  id,
  label,
  helper,
  error,
  unit,
  className,
  fieldClassName,
  type = "text",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isNumeric = type === "number" || props.inputMode === "numeric" || props.inputMode === "decimal";

  return (
    <Field id={inputId} label={label} helper={helper} error={error} className={fieldClassName}>
      <div className="relative">
        <input
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, helper, error)}
          className={cn(controlClasses, "h-11 px-3", isNumeric && "font-mono", unit && (unit.length <= 2 ? "pr-10" : "pr-14"), className)}
          {...props}
        />
        {unit ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-mono text-tinta-2"
          >
            {unit}
          </span>
        ) : null}
      </div>
    </Field>
  );
}
