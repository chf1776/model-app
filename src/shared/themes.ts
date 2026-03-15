// ── Theme System ────────────────────────────────────────────────────────────

export type ThemeId =
  | "default"
  | "claude-light"
  | "claude-dark"
  | "blueprint"
  | "us-army"
  | "quarterdeck"
  | "instruction-sheet";

export interface ThemeColors {
  background: string;
  card: string;
  sidebar: string;
  border: string;
  muted: string;
  accent: string;
  "accent-hover": string;
  "text-primary": string;
  "text-secondary": string;
  "text-tertiary": string;
  success: string;
  warning: string;
  error: string;
  destructive: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  type: "light" | "dark";
  colors: ThemeColors;
}

// ── Theme Definitions ───────────────────────────────────────────────────────

const DEFAULT_THEME: ThemeDefinition = {
  id: "default",
  name: "Default",
  type: "light",
  colors: {
    background: "#F8F6F3",
    card: "#FFFFFF",
    sidebar: "#F2EFEB",
    border: "#E5E0DA",
    muted: "#EDEBE8",
    accent: "#4E7282",
    "accent-hover": "#3F5F6E",
    "text-primary": "#0C0A09",
    "text-secondary": "#44403C",
    "text-tertiary": "#78716C",
    success: "#5A9A5F",
    warning: "#C4913A",
    error: "#C84B3A",
    destructive: "#D43D3D",
  },
};

const CLAUDE_LIGHT: ThemeDefinition = {
  id: "claude-light",
  name: "Claude Light",
  type: "light",
  colors: {
    background: "#FFFFFF",
    card: "#FAF9F5",
    sidebar: "#F5F4ED",
    border: "#E9E9E8",
    muted: "#F0EEE6",
    accent: "#D97757",
    "accent-hover": "#C6613F",
    "text-primary": "#141413",
    "text-secondary": "#3D3D3A",
    "text-tertiary": "#73726C",
    success: "#2F7613",
    warning: "#C4913A",
    error: "#B53333",
    destructive: "#B53333",
  },
};

const CLAUDE_DARK: ThemeDefinition = {
  id: "claude-dark",
  name: "Claude Dark",
  type: "dark",
  colors: {
    background: "#30302E",
    card: "#262624",
    sidebar: "#1F1E1D",
    border: "#454542",
    muted: "#262624",
    accent: "#D97757",
    "accent-hover": "#C6613F",
    "text-primary": "#FAF9F5",
    "text-secondary": "#C2C0B6",
    "text-tertiary": "#9C9A92",
    success: "#65BB30",
    warning: "#D9A64E",
    error: "#DD5353",
    destructive: "#DD5353",
  },
};

const BLUEPRINT: ThemeDefinition = {
  id: "blueprint",
  name: "Blueprint",
  type: "dark",
  colors: {
    background: "#0A1628",
    card: "#0F1F35",
    sidebar: "#0C1A2E",
    border: "#1A3050",
    muted: "#122640",
    accent: "#38BDF8",
    "accent-hover": "#2EA8E0",
    "text-primary": "#D4E4F4",
    "text-secondary": "#7A9BBF",
    "text-tertiary": "#4A6A8A",
    success: "#5CB865",
    warning: "#D9A64E",
    error: "#D9675A",
    destructive: "#E06060",
  },
};

const US_ARMY: ThemeDefinition = {
  id: "us-army",
  name: "US Army",
  type: "dark",
  colors: {
    background: "#2C301E",
    card: "#363A26",
    sidebar: "#252918",
    border: "#4A5030",
    muted: "#30341F",
    accent: "#C8B46A",
    "accent-hover": "#B09E52",
    "text-primary": "#EAE4C8",
    "text-secondary": "#A89E78",
    "text-tertiary": "#706850",
    success: "#6AB06F",
    warning: "#D9A64E",
    error: "#D9675A",
    destructive: "#E06060",
  },
};

const QUARTERDECK: ThemeDefinition = {
  id: "quarterdeck",
  name: "Quarterdeck",
  type: "dark",
  colors: {
    background: "#0C1420",
    card: "#101C2E",
    sidebar: "#08101A",
    border: "#1C2E44",
    muted: "#0E1828",
    accent: "#E05C1C",
    "accent-hover": "#C44C0C",
    "text-primary": "#C8D6E4",
    "text-secondary": "#5C7488",
    "text-tertiary": "#384858",
    success: "#4CAF78",
    warning: "#D9A64E",
    error: "#D9675A",
    destructive: "#E06060",
  },
};

const INSTRUCTION_SHEET: ThemeDefinition = {
  id: "instruction-sheet",
  name: "Instruction Sheet",
  type: "light",
  colors: {
    background: "#F5F0E8",
    card: "#FDFAF4",
    sidebar: "#EDE8DC",
    border: "#C8C0B0",
    muted: "#EDE8DC",
    accent: "#C8200C",
    "accent-hover": "#A81808",
    "text-primary": "#1A1610",
    "text-secondary": "#5A5044",
    "text-tertiary": "#8A7E72",
    success: "#3A7A3A",
    warning: "#C4913A",
    error: "#B53333",
    destructive: "#B53333",
  },
};

export const THEMES: ThemeDefinition[] = [
  DEFAULT_THEME,
  CLAUDE_LIGHT,
  CLAUDE_DARK,
  BLUEPRINT,
  US_ARMY,
  QUARTERDECK,
  INSTRUCTION_SHEET,
];

export const THEME_MAP: Record<string, ThemeDefinition> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);

// ── Accessory type colors (lightened ~15% for dark themes) ──────────────

export const ACCESSORY_TYPE_COLORS_LIGHT = {
  pe: "#7B5EA7",
  resin: "#C47A2A",
  decal: "#3A7CA5",
  "3d-print": "#5B8A3C",
};

export const ACCESSORY_TYPE_COLORS_DARK = {
  pe: "#9B7EC7",
  resin: "#D49A4A",
  decal: "#5A9CC5",
  "3d-print": "#7BAA5C",
};
