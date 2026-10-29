"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { bs } from "@/lib/i18n/bs";
import type { ThemePreference } from "@/lib/theme/theme";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeToTheme,
} from "@/lib/theme/theme-store";

const iconProps = { "aria-hidden": true, size: 18, strokeWidth: 1.5 } as const;

const themeOptions: readonly SegmentedOption<ThemePreference>[] = [
  { value: "light", label: bs.theme.options.light, icon: <Sun {...iconProps} /> },
  { value: "dark", label: bs.theme.options.dark, icon: <Moon {...iconProps} /> },
  { value: "system", label: bs.theme.options.system, icon: <Monitor {...iconProps} /> },
];

export function ThemeSwitcher({
  name = "theme",
  labelled = false,
  className,
}: {
  name?: string;
  labelled?: boolean;
  className?: string;
}) {
  const preference = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  return (
    <SegmentedControl
      name={name}
      legend={bs.theme.label}
      hideLegend={!labelled}
      iconOnly={!labelled}
      options={themeOptions}
      value={preference}
      onValueChange={setThemePreference}
      className={className}
    />
  );
}
