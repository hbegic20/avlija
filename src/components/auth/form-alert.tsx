import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export function FormAlert({
  tone,
  children,
  action,
}: {
  tone: "error" | "success";
  children: ReactNode;
  action?: ReactNode;
}) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-2 border border-l-4 bg-papir-2 px-4 py-3 text-small",
        tone === "error" ? "border-l-greska" : "border-l-vranica",
      )}
    >
      <p className="flex items-start gap-2">
        <Icon
          aria-hidden="true"
          size={18}
          strokeWidth={1.5}
          className={cn("mt-px shrink-0", tone === "error" ? "text-greska" : "text-vranica")}
        />
        <span>{children}</span>
      </p>
      {action ? <div className="pl-[26px]">{action}</div> : null}
    </div>
  );
}
