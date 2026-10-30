import type { ReactNode } from "react";

export function HatchNotice({ children }: { children: ReactNode }) {
  return (
    <p className="hatch border p-6">
      <span className="bg-papir px-2 py-1 text-tinta-2">{children}</span>
    </p>
  );
}
