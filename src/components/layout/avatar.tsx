import Image from "next/image";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

const sizeClasses = {
  sm: "size-8 text-label",
  lg: "size-24 text-h3",
} as const;

const sizePixels = { sm: 32, lg: 96 } as const;

export function Avatar({
  fullName,
  initials,
  avatarUrl,
  size = "sm",
  decorative = true,
  className,
}: {
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  size?: keyof typeof sizeClasses;
  decorative?: boolean;
  className?: string;
}) {
  const classes = cn(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-tinta bg-papir-2 font-mono font-semibold text-tinta",
    sizeClasses[size],
    className,
  );

  if (avatarUrl) {
    return (
      <span className={classes} aria-hidden={decorative || undefined}>
        <Image
          src={avatarUrl}
          alt={decorative ? "" : bs.profile.avatar.alt(fullName)}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="size-full object-cover"
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={classes}>
      {initials}
    </span>
  );
}
