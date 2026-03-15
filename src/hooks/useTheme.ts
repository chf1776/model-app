import { useMemo } from "react";
import { useAppStore } from "@/store";
import { THEME_MAP } from "@/shared/themes";
import type { ThemeDefinition } from "@/shared/themes";

interface ThemeValues {
  theme: ThemeDefinition;
  isDark: boolean;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  background: string;
  card: string;
  border: string;
}

const DEFAULT = THEME_MAP["default"];

export function useTheme(): ThemeValues {
  const themeId = useAppStore((s) => s.settings.theme);

  return useMemo(() => {
    const theme = THEME_MAP[themeId] ?? DEFAULT;
    return {
      theme,
      isDark: theme.type === "dark",
      accent: theme.colors.accent,
      accentHover: theme.colors["accent-hover"],
      success: theme.colors.success,
      warning: theme.colors.warning,
      error: theme.colors.error,
      textPrimary: theme.colors["text-primary"],
      textSecondary: theme.colors["text-secondary"],
      textTertiary: theme.colors["text-tertiary"],
      background: theme.colors.background,
      card: theme.colors.card,
      border: theme.colors.border,
    };
  }, [themeId]);
}
