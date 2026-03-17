import type { ThemeDefinition } from "./themes";
import { ACCESSORY_TYPE_COLORS_LIGHT, ACCESSORY_TYPE_COLORS_DARK } from "./themes";

const LIGHT_SHADOWS = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 12px rgba(0, 0, 0, 0.06)",
  lg: "0 8px 30px rgba(0, 0, 0, 0.08)",
};

const DARK_SHADOWS = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.20)",
  md: "0 4px 12px rgba(0, 0, 0, 0.25)",
  lg: "0 8px 30px rgba(0, 0, 0, 0.35)",
};

export function applyTheme(theme: ThemeDefinition): void {
  const root = document.documentElement;
  const set = (key: string, value: string) =>
    root.style.setProperty(`--color-${key}`, value);

  // Core tokens
  for (const [key, value] of Object.entries(theme.colors)) {
    set(key, value);
  }

  // Derived tokens
  set("status-building", theme.colors.accent);
  set("status-completed", theme.colors.success);
  set("status-wishlist", theme.colors.warning);
  set("status-shelf", theme.colors["text-tertiary"]);
  set("popover", theme.colors.card);
  set("popover-foreground", theme.colors["text-primary"]);

  // Shadows
  const shadows = theme.type === "dark" ? DARK_SHADOWS : LIGHT_SHADOWS;
  root.style.setProperty("--shadow-sm", shadows.sm);
  root.style.setProperty("--shadow-md", shadows.md);
  root.style.setProperty("--shadow-lg", shadows.lg);

  // Accessory type colors
  const typeColors =
    theme.type === "dark"
      ? ACCESSORY_TYPE_COLORS_DARK
      : ACCESSORY_TYPE_COLORS_LIGHT;
  set("type-pe", typeColors.pe);
  set("type-resin", typeColors.resin);
  set("type-decal", typeColors.decal);
  set("type-3d-print", typeColors["3d-print"]);

  // Toggle .dark class for shadcn dark: variants
  if (theme.type === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
