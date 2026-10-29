import Link from "next/link";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

type TagProps = {
  children: ReactNode;
  removeLabel?: string;
  removeHref?: string;
  onRemove?: () => void;
  className?: string;
};

const removeControlClasses =
  "-mr-1 inline-flex size-5 items-center justify-center rounded-xs text-tinta-2 transition-colors hover:bg-papir-2 hover:text-tinta";

export function Tag({ children, removeLabel, removeHref, onRemove, className }: TagProps) {
  const label = removeLabel ?? (typeof children === "string" ? bs.common.removeItem(children) : bs.common.remove);
  const icon = <X aria-hidden="true" size={14} strokeWidth={1.5} />;

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-xs border bg-papir px-2 text-small text-tinta",
        className,
      )}
    >
      <span>{children}</span>
      {removeHref ? (
        <Link href={removeHref} aria-label={label} className={removeControlClasses}>
          {icon}
        </Link>
      ) : onRemove ? (
        <button type="button" onClick={onRemove} aria-label={label} className={removeControlClasses}>
          {icon}
        </button>
      ) : null}
    </span>
  );
}
