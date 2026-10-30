import { useId, type ChangeEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
};

type SegmentedControlProps<Value extends string> = {
  name: string;
  legend: string;
  options: readonly SegmentedOption<Value>[];
  value?: Value | null;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  iconOnly?: boolean;
  hideLegend?: boolean;
  className?: string;
};

export function SegmentedControl<Value extends string>({
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  iconOnly = false,
  hideLegend = false,
  className,
}: SegmentedControlProps<Value>) {
  const groupId = useId();
  const handleChange = onValueChange
    ? (event: ChangeEvent<HTMLInputElement>) => onValueChange(event.target.value as Value)
    : undefined;

  return (
    <fieldset className={cn("flex flex-col gap-1.5", className)}>
      <legend className={cn("mb-1.5 text-label text-tinta-2 uppercase", hideLegend && "sr-only")}>{legend}</legend>
      <div className="inline-flex w-fit rounded-xs border border-tinta">
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              title={iconOnly ? option.label : undefined}
              className={cn(
                "relative flex cursor-pointer items-center justify-center gap-2 border-r border-tinta font-medium text-tinta transition-colors last:border-r-0",
                "hover:bg-papir-2 has-checked:bg-tinta has-checked:text-papir",
                "has-focus-visible:z-10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-vranica",
                iconOnly ? "size-10" : "h-10 px-3.5 text-small",
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === undefined ? undefined : value === option.value}
                defaultChecked={defaultValue === undefined ? undefined : defaultValue === option.value}
                onChange={handleChange}
                aria-label={iconOnly ? option.label : undefined}
                className="sr-only"
              />
              {option.icon}
              {iconOnly ? null : <span>{option.label}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
