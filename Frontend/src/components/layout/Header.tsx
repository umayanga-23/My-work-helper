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
  ChevronDown,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user, isAuthenticated, isDemoMode, demoVisitorName, logout, exitDemoMode } = useAuth();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

        {/* User Account / Profile Menu */}
        {isAuthenticated && user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] hover:bg-[#E8F7EF] dark:hover:bg-[#20372B] border border-[#DCE9E1] dark:border-[#20372B] transition-all cursor-pointer"
              title="User Account"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] leading-tight">
                  {user.fullName || user.username}
                </span>
                <span className="text-[10px] text-[#237A57] dark:text-[#6DD6A0] font-semibold leading-none">
                  {user.role === 'ROLE_ADMIN' ? 'Super Admin' : 'Private User'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A9890]" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0E1C15] rounded-2xl shadow-xl border border-[#DCE9E1] dark:border-[#20372B] p-2 z-50 animate-fadeIn">
                  <div className="p-2.5 border-b border-[#DCE9E1]/80 dark:border-[#20372B]/80 mb-1">
                    <p className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] truncate">
                      {user.email}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[10px] font-bold text-[#237A57] dark:text-[#6DD6A0]">
                      <Shield className="w-3 h-3" />
                      <span>{user.role === 'ROLE_ADMIN' ? 'Super Admin' : 'Private Workspace'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Demo Mode Badge in Header */}
        {isDemoMode && (
          <button
            onClick={exitDemoMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Click to Exit Demo"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guest:</span>
            <span className="truncate max-w-[100px]">{demoVisitorName || 'Demo'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100">Exit</span>
          </button>
        )}
      </div>
    </header>
  );
};
