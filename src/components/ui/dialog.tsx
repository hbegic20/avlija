"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, children, actions, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-[520px] border border-t-2 border-t-tinta bg-papir p-0 text-tinta",
        "opacity-0 transition-opacity duration-180 ease-paper open:opacity-100 starting:open:opacity-0",
        "backdrop:bg-tinta/40",
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-h3">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={bs.common.close}
            className="-mt-1 -mr-2 inline-flex size-8 items-center justify-center rounded-xs text-tinta-2 transition-colors hover:bg-papir-2 hover:text-tinta"
          >
            <X aria-hidden="true" size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="text-body">{children}</div>
        {actions ? <div className="flex flex-wrap justify-end gap-3">{actions}</div> : null}
      </div>
    </dialog>
  );
}
