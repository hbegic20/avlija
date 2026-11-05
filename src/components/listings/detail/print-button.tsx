"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bs } from "@/lib/i18n/bs";

export function PrintButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      <Printer aria-hidden="true" size={18} strokeWidth={1.5} />
      {bs.detail.print}
    </Button>
  );
}
