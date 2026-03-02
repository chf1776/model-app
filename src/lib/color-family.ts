import type { ColorFamily } from "@/shared/types";

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.substring(0, 2), 16) / 255;
  const g = parseInt(raw.substring(2, 4), 16) / 255;
  const b = parseInt(raw.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getColorFamily(hex: string): ColorFamily {
  if (!hex || hex.length < 6) return "greys";

  const { h, s, l } = hexToHsl(hex);

  // 1. Lightness extremes
  if (l < 10) return "blacks";
  if (l > 90) return "whites";

  // 2. Low saturation → greys
  if (s < 15) return "greys";

  // 3. Browns & tans: warm hues with moderate-low saturation and mid-low lightness
  if ((h <= 40 || h >= 340) && s >= 15 && s <= 65 && l >= 10 && l <= 50) {
    return "browns";
  }

  // 4. Hue-based families
  if (h < 30 || h >= 330) return "reds_oranges";
  if (h >= 30 && h < 60) return "yellows";
  if (h >= 90 && h < 150) return "greens";
  if (h >= 210 && h < 270) return "blues";
  if (h >= 270 && h < 330) return "purples";

  // Transition zones: 60–90 yellow-green → greens, 150–210 cyan-blue → blues
  if (h >= 60 && h < 90) return "greens";
  if (h >= 150 && h < 210) return "blues";

  return "greys";
}
