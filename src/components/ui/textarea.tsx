import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, controlClasses, describedBy } from "./field";

type TextareaProps = Omit<ComponentProps<"textarea">, "children"> & {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  fieldClassName?: string;
};

export function Textarea({ id, label, helper, error, className, fieldClassName, rows = 6, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <Field id={textareaId} label={label} helper={helper} error={error} className={fieldClassName}>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, helper, error)}
        className={cn(controlClasses, "min-h-28 px-3 py-2.5", className)}
        {...props}
      />
    </Field>
  );
}
