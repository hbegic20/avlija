"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

export type ToastTone = "success" | "info" | "warning" | "error";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const toastDurationMs = 5000;

const toneBarClasses: Record<ToastTone, string> = {
  success: "border-l-vranica",
  info: "border-l-vrbas",
  warning: "border-l-upozorenje",
  error: "border-l-greska",
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), toastDurationMs);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      <section
        aria-label={bs.toast.region}
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col gap-2 md:top-auto md:right-auto md:bottom-6 md:left-6 md:w-[380px]"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start justify-between gap-3 border border-l-4 bg-papir-2 py-3 pr-2 pl-4 text-small text-tinta",
              "transition-opacity duration-180 ease-paper starting:opacity-0",
              toneBarClasses[toast.tone],
            )}
          >
            <p className="pt-0.5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={bs.common.close}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-tinta-2 transition-colors hover:bg-papir-3 hover:text-tinta"
            >
              <X aria-hidden="true" size={18} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </section>
    </ToastContext>
  );
}
