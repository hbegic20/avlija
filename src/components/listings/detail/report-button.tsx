"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Flag } from "lucide-react";
import { bs } from "@/lib/i18n/bs";

const ReportDialog = dynamic(() => import("./report-dialog").then((module) => module.ReportDialog), { ssr: false });

const triggerClasses =
  "inline-flex items-center gap-1.5 text-small text-tinta-2 underline-offset-3 hover:text-greska hover:underline";

export function ReportButton({
  listingId,
  isLoggedIn,
  loginHref,
}: {
  listingId: string;
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);

  const icon = <Flag aria-hidden="true" size={16} strokeWidth={1.5} />;

  if (!isLoggedIn) {
    return (
      <Link href={loginHref} className={triggerClasses}>
        {icon}
        {bs.detail.report}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRequested(true);
          setOpen(true);
        }}
        className={triggerClasses}
      >
        {icon}
        {bs.detail.report}
      </button>
      {requested ? <ReportDialog listingId={listingId} open={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
