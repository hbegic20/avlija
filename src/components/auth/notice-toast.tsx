"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast, type ToastTone } from "@/components/ui/toast";
import { noticeParam, notices, type NoticeCode } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";

const noticeMessages: Record<NoticeCode, { message: string; tone: ToastTone }> = {
  [notices.passwordChanged]: { message: bs.auth.notices.passwordChanged, tone: "success" },
  [notices.signedOut]: { message: bs.auth.notices.signedOut, tone: "info" },
  [notices.linkInvalid]: { message: bs.auth.notices.linkInvalid, tone: "error" },
};

function isNoticeCode(value: string | null): value is NoticeCode {
  return value !== null && value in noticeMessages;
}

export function NoticeToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const code = searchParams.get(noticeParam);

  useEffect(() => {
    if (!isNoticeCode(code)) {
      return;
    }
    const { message, tone } = noticeMessages[code];
    showToast(message, tone);
    const remaining = new URLSearchParams(searchParams);
    remaining.delete(noticeParam);
    const query = remaining.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [code, pathname, router, searchParams, showToast]);

  return null;
}
