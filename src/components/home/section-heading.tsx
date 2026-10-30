import Link from "next/link";

export function SectionHeading({ title, linkHref, linkLabel }: { title: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4 border-t-2 border-t-tinta pt-3">
      <h2 className="font-display text-h2">{title}</h2>
      {linkHref && linkLabel ? (
        <Link href={linkHref} className="text-small font-medium text-vranica underline underline-offset-3 hover:text-crijep">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
