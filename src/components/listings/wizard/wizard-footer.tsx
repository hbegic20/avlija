import type { ReactNode } from "react";

export function WizardFooter({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">{children}</div>;
}
