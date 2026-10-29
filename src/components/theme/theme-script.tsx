"use client";

import { useLayoutEffect } from "react";
import { applyThemeToDocument, readThemeCookie, themeBootScript } from "@/lib/theme/theme";

export function ThemeScript() {
  useLayoutEffect(() => {
    applyThemeToDocument(readThemeCookie(document.cookie));
  }, []);

  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeBootScript }}
    />
  );
}
