export type ColorThemeId = 'emerald' | 'rose' | 'ocean' | 'orange' | 'gold';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  accent: string;
  deep: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export interface ColorThemeDefinition {
  id: ColorThemeId;
  name: string;
  description: string;
  icon: string;
  primaryRgb: string; // e.g. "95, 191, 143" for scrollbar and glow calculations
  light: ThemeColors;
  dark: ThemeColors;
}
