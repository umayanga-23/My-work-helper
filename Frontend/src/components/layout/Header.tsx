import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Moon,
  Sun,
  Plus,
  Menu,
  CheckSquare,
  Globe,
  FileText,
  FolderArchive,
  HardDrive,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onOpenSearch?: () => void;
  onOpenQuickAction: (type: 'task' | 'website' | 'note' | 'document' | 'drive') => void;
  setMobileOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAction,
  setMobileOpen,
}) => {
  const { setTheme, isDark } = useTheme();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDay = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FFFFFF]/95 dark:bg-[#0E1C15]/95 backdrop-blur-md border-b border-[#DCE9E1] dark:border-[#20372B] px-4 lg:px-6 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Left section: Mobile menu trigger & Live Day, Date, and Time */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-[#66736B] hover:text-[#17211B] dark:text-[#9BB5A5] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Date, Day & Time Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] shadow-xs select-none">
          {/* Calendar & Day / Date */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF]">
            <Calendar className="w-4 h-4 text-[#237A57] dark:text-[#6DD6A0] flex-shrink-0" />
            <span className="font-bold">{formattedDay}</span>
            <span className="text-[#8A9890] dark:text-[#6F8A7A] hidden sm:inline">•</span>
            <span className="text-[#66736B] dark:text-[#9BB5A5] hidden sm:inline">{formattedDate}</span>
          </div>

          <span className="w-1 h-1 rounded-full bg-[#8A9890] dark:bg-[#6F8A7A]" />

          {/* Clock & Live Time */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)]">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono tracking-wide">{formattedTime}</span>
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse ml-0.5" />
          </div>
        </div>
      </div>

      {/* Right section: Quick Create and Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Dropdown (+ New Resource) */}
        <div className="relative">
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            id="btn-new-resource"
            title="Create new resource"
          >
            <Plus className="w-4 h-4" />
            <span className="inline">New Resource</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${quickMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {quickMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setQuickMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#FFFFFF] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider">
                  Create Resource
                </div>
                <button
                  onClick={() => {
                    onOpenQuickAction('task');
                    setQuickMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl text-left transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-[#5FBF8F]" />
                  <span>Add Task</span>
                </button>
                <button
                  onClick={() => {
                    onOpenQuickAction('website');
                    setQuickMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl text-left transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-[#5FBF8F]" />
                  <span>Add Website</span>
                </button>
                <button
                  onClick={() => {
                    onOpenQuickAction('note');
                    setQuickMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl text-left transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#5FBF8F]" />
                  <span>Create Note</span>
                </button>
                <button
                  onClick={() => {
                    onOpenQuickAction('document');
                    setQuickMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl text-left transition-colors cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4 text-[#5FBF8F]" />
                  <span>Upload Document</span>
                </button>
                <button
                  onClick={() => {
                    onOpenQuickAction('drive');
                    setQuickMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl text-left transition-colors cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-[#5FBF8F]" />
                  <span>Add Drive Link</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Button (Light / Dark mode) */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-[#237A57] dark:text-[#6DD6A0] bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-[#DCE9E1] dark:hover:bg-[#20372B] border border-[#DCE9E1] dark:border-[#20372B] transition-all duration-200 cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
          id="btn-theme-toggle"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-[#6DD6A0] transition-transform duration-200 hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 text-[#237A57] transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>
      </div>
    </header>
  );
};
