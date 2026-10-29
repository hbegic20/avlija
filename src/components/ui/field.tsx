import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export type FieldMessageIds = {
  helperId: string;
  errorId: string;
};

export function fieldMessageIds(id: string): FieldMessageIds {
  return { helperId: `${id}-helper`, errorId: `${id}-error` };
}

export function describedBy(id: string, helper?: ReactNode, error?: ReactNode): string | undefined {
  const { helperId, errorId } = fieldMessageIds(id);
  const ids = [helper ? helperId : null, error ? errorId : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("text-label text-tinta-2 uppercase", className)}>
      {children}
    </label>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-small text-greska">
      <CircleAlert aria-hidden="true" size={18} strokeWidth={1.5} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Field({
  id,
  label,
  helper,
  error,
  className,
  children,
}: {
  id: string;
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const { helperId, errorId } = fieldMessageIds(id);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      {children}
      {helper ? (
        <p id={helperId} className="text-small text-tinta-2">
          {helper}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

export const controlClasses = cn(
  "w-full rounded-xs border bg-papir text-body text-tinta transition-colors",
  "placeholder:text-tinta-3 hover:bg-papir-2",
  "disabled:cursor-not-allowed disabled:bg-papir disabled:text-tinta-3",
  "aria-invalid:border-greska",
);
