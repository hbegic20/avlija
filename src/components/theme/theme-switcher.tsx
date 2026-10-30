"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { bs } from "@/lib/i18n/bs";
import type { ThemeChoice } from "@/lib/theme/theme";
import { getServerThemeSnapshot, getThemeSnapshot, setThemeChoice, subscribeToTheme } from "@/lib/theme/theme-store";

const iconProps = { "aria-hidden": true, size: 18, strokeWidth: 1.5 } as const;

const themeOptions: readonly SegmentedOption<ThemeChoice>[] = [
  { value: "light", label: bs.theme.options.light, icon: <Sun {...iconProps} /> },
  { value: "dark", label: bs.theme.options.dark, icon: <Moon {...iconProps} /> },
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
  const choice = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  return (
    <SegmentedControl
      name={name}
      legend={bs.theme.label}
      hideLegend={!labelled}
      iconOnly={!labelled}
      options={themeOptions}
      value={choice ?? null}
      onValueChange={setThemeChoice}
      className={className}
    />
  );
}
