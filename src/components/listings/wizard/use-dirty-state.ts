"use client";

import { useEffect } from "react";
import { useWizard } from "./wizard-context";

export function useReportDirty(isDirty: boolean) {
  const { setDirty } = useWizard();
  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);
}
