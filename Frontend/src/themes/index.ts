import { ColorThemeId, ColorThemeDefinition } from './types';
import { emeraldTheme } from './emerald';
import { roseTheme } from './rose';
import { oceanTheme } from './ocean';
import { orangeTheme } from './orange';
import { goldTheme } from './gold';

export * from './types';
export { emeraldTheme, roseTheme, oceanTheme, orangeTheme, goldTheme };

export const ALL_THEMES: ColorThemeDefinition[] = [
  emeraldTheme,
  roseTheme,
  oceanTheme,
  orangeTheme,
  goldTheme,
];

export const THEME_MAP: Record<ColorThemeId, ColorThemeDefinition> = {
  emerald: emeraldTheme,
  rose: roseTheme,
  ocean: oceanTheme,
  orange: orangeTheme,
  gold: goldTheme,
};

export const DEFAULT_THEME_ID: ColorThemeId = 'emerald';

export function getThemeById(id: string): ColorThemeDefinition {
  return THEME_MAP[id as ColorThemeId] || emeraldTheme;
}
