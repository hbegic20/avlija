import type { ReactNode } from "react";
import { PageTitle } from "@/components/ui/page-title";

export function AuthPanel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-[440px] py-10 md:py-16">
      <PageTitle>{title}</PageTitle>
      {description ? <p className="mt-3 text-tinta-2">{description}</p> : null}
      <div className="mt-8">{children}</div>
      {footer ? <div className="mt-8 border-t pt-5 text-small text-tinta-2">{footer}</div> : null}
    </div>
  );
}
