import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Globe,
  FileText,
  FolderArchive,
  HardDrive,
  Briefcase,
  Lightbulb,
  ShieldLock,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: "Today's Tasks", path: '/tasks', icon: CheckSquare },
  { name: 'Websites', path: '/websites', icon: Globe },
  { name: 'Notes & Knowledge', path: '/notes', icon: FileText },
  { name: 'Documents', path: '/documents', icon: FolderArchive },
  { name: 'Drive & Resources', path: '/drive', icon: HardDrive },
  { name: 'Projects', path: '/projects', icon: Briefcase },
  { name: 'Ideas Vault', path: '/ideas', icon: Lightbulb },
  { name: 'Password Vault', path: '/vault', icon: ShieldLock },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Admin Dashboard', path: '/admin/dashboard', icon: ShieldAlert, adminOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const location = useLocation();

  const renderNavLinks = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <li key={item.path}>
            <NavLink
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] font-semibold border-l-3 border-[#5FBF8F] shadow-xs'
                  : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF]/60 dark:hover:bg-[#13261C]/60'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={clsx(
                  'w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive
                    ? 'text-[#237A57] dark:text-[#6DD6A0]'
                    : 'text-[#8A9890] dark:text-[#6F8A7A] group-hover:text-[#237A57] dark:group-hover:text-[#6DD6A0]'
                )}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]">
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#0E1C15] text-[#17211B] dark:text-[#EAF7EF] text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap border border-[#DCE9E1] dark:border-[#20372B]">
                  {item.name}
                </div>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#08120D]/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#FFFFFF]/95 dark:bg-[#0E1C15]/95 backdrop-blur-md border-r border-[#DCE9E1] dark:border-[#20372B] transition-all duration-300 flex flex-col justify-between select-none',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header with AIU Logo */}
        <div className="p-4 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/aiu-logo.jpg"
              alt="AIU Workspace Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-[#DCE9E1] dark:border-[#20372B] shadow-xs flex-shrink-0"
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base tracking-tight leading-none flex items-center gap-1.5">
                  AIU <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] uppercase tracking-wide">Workspace</span>
                </span>
                <span className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium tracking-wide mt-1">
                  Your Personal Workspace
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          <div>
            {!collapsed && (
              <h3 className="px-3 text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider mb-2">
                Workspace
              </h3>
            )}
            {renderNavLinks(mainNavItems)}
          </div>

          <div>
            {!collapsed && (
              <h3 className="px-3 text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider mb-2">
                System
              </h3>
            )}
            {renderNavLinks(secondaryNavItems)}
          </div>
        </div>

        {/* Brand Footer Badge */}
        {!collapsed && (
          <div className="p-3 m-3 rounded-xl bg-[#E8F7EF]/60 dark:bg-[#13261C]/70 border border-[#DCE9E1] dark:border-[#20372B] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">AIU Command</span>
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            </div>
            <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5]">Personal Developer Workspace</p>
          </div>
        )}
      </aside>
    </>
  );
};
