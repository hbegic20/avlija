import type { ReactNode } from "react";

export function ErrorPanel({
  code,
  title,
  text,
  children,
}: {
  code: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex max-w-[640px] flex-col gap-5 py-14 md:py-20">
      <div aria-hidden="true" className="hatch h-28 w-full border" />
      <p className="border-t-2 border-t-tinta pt-3 font-mono text-label tracking-[0.08em] text-tinta-2 uppercase">{code}</p>
      <h1 className="font-display text-h1">{title}</h1>
      <p className="text-tinta-2">{text}</p>
      {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}
