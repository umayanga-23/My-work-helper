import React from 'react';
import {
  Check,
  Sun,
  Moon,
  Laptop,
  Palette,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ALL_THEMES } from '../../themes';
import { clsx } from 'clsx';

export const ThemeSettings: React.FC = () => {
  const { theme, setTheme, isDark, colorTheme, setColorTheme } = useTheme();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE9E1] dark:border-[#20372B] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Palette className="w-5 h-5 text-[var(--color-primary)]" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#17211B] dark:text-[#EAF7EF] tracking-tight">
                Workspace Appearance
              </h2>
              <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5] mt-0.5">
                Customize the visual identity of your AIU Workspace across 5 curated themes.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Mode Toggle (Light / Dark / System) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xs self-start sm:self-center">
          <button
            onClick={() => setTheme('light')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
              theme === 'light'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
            )}
            title="Switch to Light Mode"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
              theme === 'dark'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
            )}
            title="Switch to Dark Mode"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
              theme === 'system'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
            )}
            title="Follow System Preferences"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 5 Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ALL_THEMES.map((t) => {
          const isSelected = colorTheme === t.id;
          const activePalette = isDark ? t.dark : t.light;

          return (
            <div
              key={t.id}
              onClick={() => setColorTheme(t.id)}
              className={clsx(
                'group relative rounded-3xl p-5 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl',
                isSelected
                  ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 bg-white dark:bg-[#0E1C15]'
                  : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[var(--color-primary)]/50 bg-white/70 dark:bg-[#0E1C15]/70'
              )}
            >
              {/* Miniature Realistic UI Mockup */}
              <div
                className="w-full h-32 rounded-2xl p-3 flex flex-col justify-between overflow-hidden border shadow-inner transition-colors duration-200"
                style={{
                  backgroundColor: activePalette.background,
                  borderColor: activePalette.border,
                }}
              >
                {/* Mockup Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
                  </div>
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: activePalette.surfaceSecondary,
                      color: activePalette.textPrimary,
                    }}
                  >
                    AIU • {isDark ? 'Dark' : 'Light'}
                  </span>
                </div>

                {/* Mockup Mini Card */}
                <div
                  className="rounded-xl p-2.5 border shadow-xs flex items-center justify-between"
                  style={{
                    backgroundColor: activePalette.surface,
                    borderColor: activePalette.border,
                  }}
                >
                  <div className="space-y-1">
                    <div
                      className="h-2 w-20 rounded-full"
                      style={{ backgroundColor: activePalette.textPrimary }}
                    />
                    <div
                      className="h-1.5 w-14 rounded-full"
                      style={{ backgroundColor: activePalette.textSecondary }}
                    />
                  </div>
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: activePalette.primary }}
                  >
                    ✓
                  </div>
                </div>

                {/* Mockup Mini Bottom Action Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div
                    className="h-1.5 w-12 rounded-full"
                    style={{ backgroundColor: activePalette.textMuted }}
                  />
                  <div
                    className="px-2.5 py-0.5 rounded-md text-[9px] font-bold shadow-xs text-white"
                    style={{ backgroundColor: activePalette.primary }}
                  >
                    Action
                  </div>
                </div>
              </div>

              {/* Theme Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl select-none">{t.icon}</span>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#17211B] dark:text-[#EAF7EF]">
                      {t.name}
                    </h3>
                  </div>

                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[var(--color-primary)] text-white shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#8A9890] dark:text-[#6F8A7A] group-hover:text-[var(--color-primary)] transition-colors">
                      Click to apply
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] leading-relaxed">
                  {t.description}
                </p>

                {/* Color Palette Swatch Row */}
                <div className="pt-2 border-t border-[#DCE9E1]/60 dark:border-[#20372B]/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: t.light.primary }}
                      title={`Primary: ${t.light.primary}`}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: t.light.primaryHover }}
                      title={`Hover: ${t.light.primaryHover}`}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: t.light.accent }}
                      title={`Accent: ${t.light.accent}`}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: t.light.surfaceSecondary }}
                      title={`Surface Tint: ${t.light.surfaceSecondary}`}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: t.dark.background }}
                      title={`Dark Canvas: ${t.dark.background}`}
                    />
                  </div>

                  <span className="font-mono text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                    {t.light.primary}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2 text-[#237A57] dark:text-[#6DD6A0]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">
            Theme selection is automatically persisted in your browser and applies instantly across all workspace pages.
          </span>
        </div>
        <div className="text-[#66736B] dark:text-[#9BB5A5] font-mono text-[11px]">
          Storage Key: <code>aiu-workspace-theme</code>
        </div>
      </div>
    </div>
  );
};
