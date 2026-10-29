import type { StampVariant } from "@/lib/domain/enums";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

const variantClasses: Record<StampVariant, string> = {
  uknjizeno: "text-vranica",
  prodano: "text-crijep",
  novo: "text-vrbas",
  istice: "text-upozorenje",
};

export function Stamp({ variant, className }: { variant: StampVariant; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block -rotate-3 border-2 border-double border-current bg-papir px-2 py-1.5 font-mono text-label font-semibold tracking-[0.12em] uppercase opacity-85",
        variantClasses[variant],
        className,
      )}
    >
      {bs.enums.stamp[variant]}
    </span>
  );
}
