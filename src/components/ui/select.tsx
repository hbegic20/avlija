import { useId, type ComponentProps, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, controlClasses, describedBy } from "./field";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  options: readonly SelectOption[];
  placeholder?: string;
  fieldClassName?: string;
};

export function Select({
  id,
  label,
  helper,
  error,
  options,
  placeholder,
  className,
  fieldClassName,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field id={selectId} label={label} helper={helper} error={error} className={fieldClassName}>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, helper, error)}
          className={cn(controlClasses, "h-11 appearance-none pr-10 pl-3", className)}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={18}
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-tinta-2"
        />
      </div>
    </Field>
  );
}
