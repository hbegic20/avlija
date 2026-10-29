import type { ReactNode } from "react";

export function ProfileSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t py-8 md:grid-cols-[260px_1fr] md:gap-10">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-label text-tinta-2">{number}</p>
        <h2 className="font-display text-h2">{title}</h2>
        <p className="text-small text-tinta-2">{description}</p>
      </div>
      <div className="flex max-w-[520px] flex-col gap-8">{children}</div>
    </section>
  );
}

export function ProfileSubheading({ children }: { children: ReactNode }) {
  return <h3 className="border-b pb-2 text-label text-tinta-2 uppercase">{children}</h3>;
}
