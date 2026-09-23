import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';
import {
  ColorThemeId,
  ColorThemeDefinition,
  getThemeById,
  DEFAULT_THEME_ID,
  THEME_MAP
} from '../themes';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  colorTheme: ColorThemeId;
  setColorTheme: (colorTheme: ColorThemeId) => void;
  activeThemeDef: ColorThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_THEME_STORAGE_KEY = 'aiu-workspace-theme';
const MODE_STORAGE_KEY = 'app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Appearance Mode: 'light' | 'dark' | 'system'
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    return (saved as ThemeMode) || 'dark';
  });

  // Color Theme: 'emerald' | 'rose' | 'ocean' | 'orange' | 'gold'
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() => {
    const saved = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    return (saved && THEME_MAP[saved as ColorThemeId]) ? (saved as ColorThemeId) : DEFAULT_THEME_ID;
  });

  const [isDark, setIsDark] = useState<boolean>(true);

  // Apply Appearance Mode (light vs dark)
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem(MODE_STORAGE_KEY, theme);

    const applyDark = (dark: boolean) => {
      setIsDark(dark);
      if (dark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyDark(theme === 'dark');
    }
  }, [theme]);

  // Apply Color Theme (data-theme attribute and primary-rgb on documentElement)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', colorTheme);
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);

    const themeDef = getThemeById(colorTheme);
    if (themeDef) {
      root.style.setProperty('--primary-rgb', themeDef.primaryRgb);
    }
  }, [colorTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setColorTheme = (newColorTheme: ColorThemeId) => {
    setColorThemeState(newColorTheme);
  };

  const activeThemeDef = getThemeById(colorTheme);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        colorTheme,
        setColorTheme,
        activeThemeDef,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
