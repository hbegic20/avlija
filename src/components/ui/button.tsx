import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-crijep bg-crijep text-na-crijep hover:border-crijep-tamni hover:bg-crijep-tamni",
  secondary: "border-tinta bg-transparent text-tinta hover:bg-papir-2",
  ghost: "border-transparent bg-transparent text-tinta underline-offset-3 hover:underline",
  danger: "border-greska bg-transparent text-greska hover:bg-papir-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-small",
  md: "h-10 gap-2 px-4 text-body",
  lg: "h-12 gap-2 px-5 text-body",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xs border font-sans font-semibold whitespace-nowrap transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

function LoadingDots() {
  return (
    <span className="font-mono" aria-hidden="true">
      <span className="animate-dot">·</span>
      <span className="animate-dot [animation-delay:400ms]">·</span>
      <span className="animate-dot [animation-delay:800ms]">·</span>
    </span>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <>
          <LoadingDots />
          <span className="sr-only">{bs.common.loading}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
