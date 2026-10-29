"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Tag } from "@/components/ui/tag";
import { useToast, type ToastTone } from "@/components/ui/toast";
import { demo } from "./demo-content";

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {demo.overlays.openDialog}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={demo.overlays.dialogTitle}
        actions={
          <>
            <Button variant="ghost" onClick={close}>
              {demo.buttons.cancel}
            </Button>
            <Button variant="danger" onClick={close}>
              {demo.buttons.remove}
            </Button>
          </>
        }
      >
        <p className="text-tinta-2">{demo.overlays.dialogBody}</p>
      </Dialog>
    </>
  );
}

const toastExamples: ReadonlyArray<{ tone: ToastTone; label: string; message: string }> = [
  { tone: "success", label: demo.overlays.showSuccess, message: demo.overlays.toastSuccess },
  { tone: "info", label: demo.overlays.showInfo, message: demo.overlays.toastInfo },
  { tone: "warning", label: demo.overlays.showWarning, message: demo.overlays.toastWarning },
  { tone: "error", label: demo.overlays.showError, message: demo.overlays.toastError },
];

export function ToastDemo() {
  const { showToast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      {toastExamples.map((example) => (
        <Button key={example.tone} variant="secondary" size="sm" onClick={() => showToast(example.message, example.tone)}>
          {example.label}
        </Button>
      ))}
    </div>
  );
}

const initialTags = [demo.tags.municipality, demo.tags.price, demo.tags.registered];

export function RemovableTagsDemo() {
  const [tags, setTags] = useState<readonly string[]>(initialTags);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Tag key={tag} onRemove={() => setTags((current) => current.filter((entry) => entry !== tag))}>
          {tag}
        </Tag>
      ))}
      <Tag>{demo.tags.plain}</Tag>
      {tags.length < initialTags.length ? (
        <Button variant="ghost" size="sm" onClick={() => setTags(initialTags)}>
          {demo.tags.reset}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      loading={loading}
      onClick={() => {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 2000);
      }}
    >
      {demo.buttons.publish}
    </Button>
  );
}
