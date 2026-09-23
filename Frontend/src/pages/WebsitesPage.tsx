import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Plus,
  Search,
  Star,
  ExternalLink,
  Trash2,
  Edit,
  Copy,
  Check,
  LayoutGrid,
  List as ListIcon,
  FolderKanban,
  FolderPlus,
  Download,
  Link2,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckSquare
} from 'lucide-react';
import type { Website, Category } from '../types';
import { websiteService } from '../services/websiteService';
import { categoryService } from '../services/categoryService';
import { WebsiteModal } from '../components/websites/WebsiteModal';
import { CategoryModal } from '../components/categories/CategoryModal';
import { BookmarkImportExportModal } from '../components/websites/BookmarkImportExportModal';
import { LinkToTaskModal } from '../components/websites/LinkToTaskModal';
import { extractDominantColor } from '../utils/colorExtractor';
import { useConfirm } from '../contexts/ConfirmDialogContext';
import { clsx } from 'clsx';

type ViewMode = 'SECTIONS' | 'GRID' | 'LIST';

export const WebsitesPage: React.FC = () => {
  const confirm = useConfirm();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('SECTIONS');
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | undefined>(undefined);
  const [presetCategoryId, setPresetCategoryId] = useState<string | undefined>(undefined);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [linkModalWebsite, setLinkModalWebsite] = useState<Website | null>(null);

  // Copied feedback map: websiteId -> boolean
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Collapsed categories in grouped view: categoryName -> boolean
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const loadWebsites = async () => {
    try {
      const [fetchedWebsites, fetchedCats] = await Promise.all([
        websiteService.getWebsites({
          search: search || undefined,
          categoryId: selectedCategory || undefined,
          isFavorite: onlyFavorites || undefined,
        }),
        categoryService.getCategories(),
      ]);
      setWebsites(fetchedWebsites);
      setCategories(fetchedCats);
    } catch (err) {
      console.error('Failed to load websites:', err);
    }
  };

  useEffect(() => {
    loadWebsites();
    const handleCreated = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.type === 'website') loadWebsites();
    };
    const handleCategoryUpdate = () => loadWebsites();

    window.addEventListener('workspace-resource-created', handleCreated);
    window.addEventListener('workspace-category-updated', handleCategoryUpdate);
    return () => {
      window.removeEventListener('workspace-resource-created', handleCreated);
      window.removeEventListener('workspace-category-updated', handleCategoryUpdate);
    };
  }, [search, selectedCategory, onlyFavorites]);

  // Top Speed Dial / Most Visited items
  const speedDialItems = useMemo(() => {
    const list = [...websites];
    return list
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return (b.visitCount || 0) - (a.visitCount || 0);
      })
      .slice(0, 8);
  }, [websites]);

  const handleToggleFavorite = async (e: React.MouseEvent, website: Website) => {
    e.stopPropagation();
    const nextVal = !(website.isFavorite || (website as any).favorite);
    // Instant optimistic UI update
    setWebsites((prev) =>
      prev.map((w) => (w.id === website.id ? { ...w, isFavorite: nextVal, favorite: nextVal } as any : w))
    );
    try {
      const updated = await websiteService.toggleFavorite(website.id);
      setWebsites((prev) =>
        prev.map((w) =>
          w.id === website.id
            ? { ...w, ...updated, isFavorite: updated.isFavorite ?? nextVal, favorite: updated.isFavorite ?? nextVal } as any
            : w
        )
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleLaunch = (website: Website) => {
    websiteService.recordVisit(website.id);
    setWebsites((prev) =>
      prev.map((w) =>
        w.id === website.id
          ? {
              ...w,
              visitCount: (w.visitCount || 0) + 1,
              lastVisitedAt: new Date().toISOString(),
            }
          : w
      )
    );
    window.open(website.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUrl = (e: React.MouseEvent, website: Website) => {
    e.stopPropagation();
    navigator.clipboard.writeText(website.url);
    setCopiedId(website.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Remove Bookmark',
      message: 'Are you sure you want to remove this bookmark?',
      confirmText: 'Remove Bookmark',
      variant: 'danger',
    });
    if (ok) {
      await websiteService.deleteWebsite(id);
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const handleSaveWebsite = async (websiteData: Partial<Website>) => {
    if (editingWebsite) {
      const updated = await websiteService.updateWebsite(editingWebsite.id, websiteData);
      setWebsites((prev) =>
        prev.map((w) => (w.id === editingWebsite.id ? { ...w, ...updated } : w))
      );
    } else {
      const created = await websiteService.createWebsite(websiteData);
      setWebsites((prev) => [created, ...prev]);
    }
    setEditingWebsite(undefined);
    setPresetCategoryId(undefined);
  };

  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCat.id || c.name.toLowerCase() === newCat.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newCat];
    });
  };

  const handleDeleteCategory = async (sec: { id?: string; name: string; items: Website[] }) => {
    if (sec.name === 'General & Uncategorized' || sec.name === 'General') {
      alert('Default General category cannot be deleted.');
      return;
    }

    const ok = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete the "${sec.name}" category?`,
      description:
        sec.items.length > 0
          ? `The ${sec.items.length} bookmark(s) inside will remain safely stored as Uncategorized.`
          : undefined,
      confirmText: 'Delete Category',
      variant: 'danger',
    });

    if (!ok) return;

    try {
      if (sec.id) {
        await categoryService.deleteCategory(sec.id);
      }
      // Remove from categories state
      setCategories((prev) => prev.filter((c) => (sec.id ? c.id !== sec.id : c.name !== sec.name)));

      // If any websites belonged to this category, unassign category
      setWebsites((prev) =>
        prev.map((w) =>
          w.categoryId === sec.id || w.categoryName === sec.name
            ? { ...w, categoryId: undefined, categoryName: undefined }
            : w
        )
      );

      // If currently filtered by this category, reset filter
      if (selectedCategory === sec.id) {
        setSelectedCategory('');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      // Optimistic local removal if backend throws or is offline
      setCategories((prev) => prev.filter((c) => (sec.id ? c.id !== sec.id : c.name !== sec.name)));
    }
  };

  const handleOpenAddForCategory = (catId?: string) => {
    setEditingWebsite(undefined);
    setPresetCategoryId(catId);
    setModalOpen(true);
  };

  // Grouped websites by category
  const categorySections = useMemo(() => {
    // Collect all unique categories that have bookmarks or exist in `categories`
    const sections: { id?: string; name: string; color?: string; items: Website[] }[] = [];

    // First map all known categories
    categories.forEach((cat) => {
      const items = websites.filter((w) => w.categoryId === cat.id || w.categoryName === cat.name);
      // If a category filter is active, only show that category
      if (!selectedCategory || selectedCategory === cat.id) {
        sections.push({
          id: cat.id,
          name: cat.name,
          color: cat.color || '#10B981',
          items,
        });
      }
    });

    // Also include any bookmarks that don't belong to known categories
    const uncategorizedItems = websites.filter(
      (w) => !w.categoryId && (!w.categoryName || w.categoryName === 'General' || w.categoryName === 'General & Uncategorized')
    );
    if ((!selectedCategory || selectedCategory === 'uncategorized') && uncategorizedItems.length > 0) {
      sections.push({
        id: undefined,
        name: 'General & Uncategorized',
        color: '#10B981',
        items: uncategorizedItems,
      });
    }

    // Include any other category names that might not be in the categories table
    const otherWebsites = websites.filter(
      (w) =>
        w.categoryName &&
        !categories.some((c) => c.id === w.categoryId || c.name === w.categoryName) &&
        w.categoryName !== 'General' &&
        w.categoryName !== 'General & Uncategorized'
    );
    const otherGroups: Record<string, Website[]> = {};
    otherWebsites.forEach((w) => {
      const name = w.categoryName || 'Other';
      if (!otherGroups[name]) otherGroups[name] = [];
      otherGroups[name].push(w);
    });

    Object.entries(otherGroups).forEach(([name, items]) => {
      if (!selectedCategory) {
        sections.push({
          id: undefined,
          name,
          color: items[0]?.color || '#10B981',
          items,
        });
      }
    });

    return sections;
  }, [websites, categories, selectedCategory]);

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-400 shadow-sm">
              <Globe className="w-6 h-6" />
            </div>
            Website Bookmark Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#3D7858] dark:text-[#72B38F] mt-0.5">
            Organize bookmarks into dedicated category sections, speed dial favorites, and attach links to tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add New Category Button */}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] text-xs font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
            title="Create a new Category Section"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>+ New Category</span>
          </button>

          {/* Import / Export Backup Button */}
          <button
            onClick={() => setImportExportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] text-xs font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
            title="Import or Export Bookmarks"
          >
            <Download className="w-4 h-4 text-[#25935C] dark:text-[#5FBF8F]" />
            <span className="hidden sm:inline">Import / Export</span>
          </button>

          {/* Add Website Bookmark Button */}
          <button
            onClick={() => handleOpenAddForCategory()}
            className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Bookmark
          </button>
        </div>
      </div>

      {/* Speed Dial Quick Launch Dock (Leaf Green) */}
      {speedDialItems.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#F0FAF4] via-[#E6F8EE] to-[#DCF5E6] dark:from-[#0B1E14] dark:via-[#0F281B] dark:to-[#133322] border border-[#BBEAD0] dark:border-[#1E4933] shadow-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2D1E] dark:text-[#E8FAF0]">
                Speed Dial & Quick Launch
              </h2>
            </div>
            <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F]">
              Frequently Visited & Starred
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {speedDialItems.map((web) => (
              <button
                key={web.id}
                onClick={() => handleLaunch(web)}
                className="p-2.5 rounded-2xl bg-white/90 dark:bg-[#08170F]/90 border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] hover:shadow-md transition-all group flex flex-col items-center text-center relative"
                title={`${web.name} (${web.url}) - Visited ${web.visitCount || 0} times`}
              >
                {web.isFavorite && (
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 absolute top-1.5 right-1.5" />
                )}
                <div className="w-8 h-8 rounded-xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] flex items-center justify-center p-1 mb-1.5 group-hover:scale-110 transition-transform">
                  <img
                    src={
                      web.faviconUrl ||
                      `https://www.google.com/s2/favicons?domain=${web.url}&sz=64`
                    }
                    alt={web.name}
                    className="w-5 h-5 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://www.google.com/s2/favicons?domain=example.com&sz=64';
                    }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] group-hover:text-[#25935C] dark:group-hover:text-[#5FBF8F] truncate w-full">
                  {web.name}
                </span>
                <span className="text-[9px] text-[#3D7858] dark:text-[#72B38F] mt-0.5">
                  {web.visitCount || 0} visits
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Horizontal Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('')}
          className={clsx(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border shadow-2xs',
            !selectedCategory
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
              : 'bg-white dark:bg-[#0D2218] border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
          )}
        >
          <span>All Categories</span>
          <span className={clsx('px-1.5 py-0.2 rounded-full text-[10px]', !selectedCategory ? 'bg-emerald-700 text-white' : 'bg-[#E8F7EF] dark:bg-[#13261C]')}>
            {websites.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = websites.filter((w) => w.categoryId === cat.id || w.categoryName === cat.name).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border shadow-2xs',
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                  : 'bg-white dark:bg-[#0D2218] border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color || '#10B981' }}
              />
              <span>{cat.name}</span>
              <span className={clsx('px-1.5 py-0.2 rounded-full text-[10px]', isSelected ? 'bg-emerald-700 text-white' : 'bg-[#E8F7EF] dark:bg-[#13261C]')}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Quick Add Category Pill */}
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          title="Create a new category"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Search, Star Filter & View Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#3D7858] dark:text-[#72B38F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks, URLs, tags..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-xs text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 outline-none focus:border-[#48C78E]"
          />
        </div>

        {/* Right: Filters & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Starred Filter */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
              onlyFavorites
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                : 'bg-[#F2FBF6] dark:bg-[#132D20] border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
            )}
          >
            <Star className={clsx('w-3.5 h-3.5', onlyFavorites && 'fill-current text-amber-500')} />
            <span>Favorites</span>
          </button>

          {/* View Switcher: Sections (Default), Grid, List */}
          <div className="flex items-center bg-[#F2FBF6] dark:bg-[#132D20] p-1 rounded-xl border border-[#BBEAD0] dark:border-[#1E4933]">
            <button
              onClick={() => setViewMode('SECTIONS')}
              className={clsx(
                'p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-medium',
                viewMode === 'SECTIONS'
                  ? 'bg-white dark:bg-[#08170F] text-[#25935C] dark:text-[#5FBF8F] shadow-sm'
                  : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
              title="Category Sections View"
            >
              <FolderKanban className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Sections</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={clsx(
                'p-1.5 rounded-lg text-xs transition-colors',
                viewMode === 'GRID'
                  ? 'bg-white dark:bg-[#08170F] text-[#25935C] dark:text-[#5FBF8F] shadow-sm'
                  : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
              title="Flat Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={clsx(
                'p-1.5 rounded-lg text-xs transition-colors',
                viewMode === 'LIST'
                  ? 'bg-white dark:bg-[#08170F] text-[#25935C] dark:text-[#5FBF8F] shadow-sm'
                  : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {websites.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] text-center space-y-3 shadow-sm">
          <Globe className="w-12 h-12 text-[#48C78E] mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
            No websites found
          </h3>
          <p className="text-xs text-[#3D7858] dark:text-[#72B38F] max-w-sm mx-auto">
            {search
              ? `No bookmarks matching "${search}". Try clearing search filter.`
              : 'Add your first developer link or import bookmarks from Chrome / Firefox.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0]"
            >
              + Create Category
            </button>
            <button
              onClick={() => handleOpenAddForCategory()}
              className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl text-xs font-bold shadow"
            >
              + Add Bookmark
            </button>
          </div>
        </div>
      ) : viewMode === 'SECTIONS' ? (
        /* CATEGORY SECTIONS VIEW: Clean, Open Layout with Sleek Category Headers */
        <div className="space-y-8">
          {categorySections.map((sec) => {
            const isCollapsed = collapsedCategories[sec.name];
            return (
              <div key={sec.name} className="space-y-3">
                {/* Clean Category Header with Accent Dot, Title, Count, Divider Line & Add Button */}
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#D5F2E2] dark:border-[#193A29]">
                  <div
                    onClick={() => toggleCategoryCollapse(sec.name)}
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                  >
                    <button
                      className="p-1 rounded-lg hover:bg-emerald-500/10 text-[#3D7858] dark:text-[#72B38F] transition-colors"
                      title={isCollapsed ? 'Expand category' : 'Collapse category'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-2xs"
                      style={{ backgroundColor: sec.color || '#10B981' }}
                    />
                    <h2 className="font-bold text-base sm:text-lg text-[#0F2D1E] dark:text-[#E8FAF0] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      {sec.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F7EF] dark:bg-[#13261C] text-[#1E7247] dark:text-[#5FBF8F] border border-[#BBEAD0] dark:border-[#20372B]">
                      {sec.items.length} {sec.items.length === 1 ? 'link' : 'links'}
                    </span>
                  </div>

                  {/* Action buttons for this category */}
                  <div className="flex items-center gap-1.5">
                    {/* Add Bookmark button for this category */}
                    <button
                      onClick={() => handleOpenAddForCategory(sec.id)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-xs font-bold text-[#1E7247] dark:text-[#5FBF8F] transition-all flex items-center gap-1.5 shadow-2xs"
                      title={`Add bookmark to ${sec.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Link</span>
                    </button>

                    {/* Delete Category Button (if custom category) */}
                    {sec.name !== 'General & Uncategorized' && sec.name !== 'General' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(sec);
                        }}
                        className="p-1.5 rounded-xl border border-[#BBEAD0] dark:border-[#1E4933] bg-white dark:bg-[#0D2218] text-[#3D7858] dark:text-[#72B38F] hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-400/50 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all shadow-2xs"
                        title={`Delete "${sec.name}" category`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Grid */}
                {!isCollapsed && (
                  <div>
                    {sec.items.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-[#BBEAD0] dark:border-[#1E4933] rounded-2xl bg-[#F9FDFB] dark:bg-[#08170F]/50">
                        <p className="text-xs text-[#3D7858] dark:text-[#72B38F] mb-2.5">
                          No bookmarks in <span className="font-semibold text-[#0F2D1E] dark:text-[#E8FAF0]">{sec.name}</span> yet.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenAddForCategory(sec.id)}
                            className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add First Bookmark
                          </button>
                          {sec.name !== 'General & Uncategorized' && sec.name !== 'General' && (
                            <button
                              onClick={() => handleDeleteCategory(sec)}
                              className="px-3 py-1.5 border border-rose-300 dark:border-rose-900/60 hover:border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              title={`Delete ${sec.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Category
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                        {sec.items.map((web) => (
                          <BookmarkCard
                            key={web.id}
                            web={web}
                            isCopied={copiedId === web.id}
                            onLaunch={() => handleLaunch(web)}
                            onToggleFavorite={(e) => handleToggleFavorite(e, web)}
                            onCopyUrl={(e) => handleCopyUrl(e, web)}
                            onEdit={() => {
                              setEditingWebsite(web);
                              setPresetCategoryId(web.categoryId);
                              setModalOpen(true);
                            }}
                            onDelete={(e) => handleDelete(e, web.id)}
                            onLinkTask={(e) => {
                              e.stopPropagation();
                              setLinkModalWebsite(web);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID VIEW: Flat Squarish Cards */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {websites.map((web) => (
            <BookmarkCard
              key={web.id}
              web={web}
              isCopied={copiedId === web.id}
              onLaunch={() => handleLaunch(web)}
              onToggleFavorite={(e) => handleToggleFavorite(e, web)}
              onCopyUrl={(e) => handleCopyUrl(e, web)}
              onEdit={() => {
                setEditingWebsite(web);
                setPresetCategoryId(web.categoryId);
                setModalOpen(true);
              }}
              onDelete={(e) => handleDelete(e, web.id)}
              onLinkTask={(e) => {
                e.stopPropagation();
                setLinkModalWebsite(web);
              }}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#BBEAD0] dark:border-[#1E4933] overflow-hidden shadow-sm">
          <div className="divide-y divide-[#D5F2E2] dark:divide-[#193A29]">
            {websites.map((web) => (
              <BookmarkRow
                key={web.id}
                web={web}
                isCopied={copiedId === web.id}
                onLaunch={() => handleLaunch(web)}
                onToggleFavorite={(e) => handleToggleFavorite(e, web)}
                onCopyUrl={(e) => handleCopyUrl(e, web)}
                onEdit={() => {
                  setEditingWebsite(web);
                  setPresetCategoryId(web.categoryId);
                  setModalOpen(true);
                }}
                onDelete={(e) => handleDelete(e, web.id)}
                onLinkTask={(e) => {
                  e.stopPropagation();
                  setLinkModalWebsite(web);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Website Modal */}
      <WebsiteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingWebsite(undefined);
          setPresetCategoryId(undefined);
        }}
        onSave={handleSaveWebsite}
        categories={categories}
        initialWebsite={editingWebsite ? editingWebsite : (presetCategoryId ? { categoryId: presetCategoryId } as any : undefined)}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Create New Category Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
        defaultType="WEBSITE"
      />

      {/* Import / Export Backup Modal */}
      <BookmarkImportExportModal
        isOpen={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        websites={websites}
        onImportComplete={loadWebsites}
      />

      {/* Direct Link to Task Modal */}
      <LinkToTaskModal
        isOpen={!!linkModalWebsite}
        onClose={() => setLinkModalWebsite(null)}
        website={linkModalWebsite}
        onLinked={loadWebsites}
      />
    </div>
  );
};

/* --- Visual Squarish Leaf-Green Bookmark Card Component --- */
interface BookmarkCardProps {
  web: Website;
  isCopied: boolean;
  onLaunch: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onCopyUrl: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onLinkTask: (e: React.MouseEvent) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  web,
  isCopied,
  onLaunch,
  onToggleFavorite,
  onCopyUrl,
  onEdit,
  onDelete,
  onLinkTask,
}) => {
  const domain = web.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  const tagsList = web.tags
    ? web.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const isFav = Boolean(web.isFavorite || (web as any).favorite);
  const [brandColor, setBrandColor] = useState<string>(web.color || '#10B981');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const favicon =
      web.faviconUrl || `https://www.google.com/s2/favicons?domain=${web.url}&sz=64`;
    extractDominantColor(favicon, domain).then((color) => {
      if (isMounted && color) {
        setBrandColor(color);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [web.faviconUrl, web.url, domain]);

  return (
    <div
      onClick={onLaunch}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `linear-gradient(180deg, ${brandColor}18 0%, ${brandColor}08 100%)`,
        borderColor: isHovered ? brandColor : `${brandColor}45`,
        boxShadow: isHovered ? `0 12px 28px -4px ${brandColor}35, 0 8px 12px -6px ${brandColor}20` : undefined,
      }}
      className="p-3.5 sm:p-4 rounded-3xl border transition-all duration-200 shadow-sm flex flex-col justify-between cursor-pointer group relative aspect-square"
    >
      {/* Top Row: Category Pill & Star Button */}
      <div className="flex items-center justify-between gap-1 w-full">
        {web.categoryName ? (
          <span
            style={{
              backgroundColor: `${brandColor}20`,
              color: brandColor,
              borderColor: `${brandColor}45`,
            }}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold truncate max-w-[120px] border shadow-2xs"
          >
            {web.categoryName}
          </span>
        ) : (
          <span
            style={{
              backgroundColor: `${brandColor}15`,
              color: brandColor,
              borderColor: `${brandColor}30`,
            }}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
          >
            General
          </span>
        )}

        <div className="flex items-center gap-1">
          {/* Linked Tasks Indicator */}
          {(web.linkedTaskCount || 0) > 0 && (
            <span
              style={{
                backgroundColor: `${brandColor}25`,
                color: brandColor,
                borderColor: `${brandColor}50`,
              }}
              className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
              title={`${web.linkedTaskCount} linked tasks`}
            >
              <CheckSquare className="w-2.5 h-2.5" />
              {web.linkedTaskCount}
            </span>
          )}

          <button
            onClick={onToggleFavorite}
            className="p-1 rounded-lg hover:bg-amber-400/10 text-emerald-800/60 dark:text-emerald-400/60 hover:text-amber-400 transition-colors flex-shrink-0"
            title={isFav ? 'Unstar favorite' : 'Star as favorite'}
          >
            <Star
              className={clsx(
                'w-4 h-4 transition-all duration-200',
                isFav ? 'fill-amber-400 text-amber-400 scale-110' : 'hover:scale-110'
              )}
            />
          </button>
        </div>
      </div>

      {/* Center: Hero App-Tile Favicon & Title */}
      <div className="flex flex-col items-center text-center my-auto py-1">
        <div
          style={{
            borderColor: isHovered ? brandColor : `${brandColor}50`,
            boxShadow: isHovered ? `0 6px 16px ${brandColor}30` : undefined,
          }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-[#08170F] border shadow-sm flex items-center justify-center p-2.5 group-hover:scale-105 transition-all"
        >
          <img
            src={
              web.faviconUrl ||
              `https://www.google.com/s2/favicons?domain=${web.url}&sz=64`
            }
            alt={web.name}
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src =
                'https://www.google.com/s2/favicons?domain=example.com&sz=64';
            }}
          />
        </div>

        <h4
          style={{
            color: isHovered ? brandColor : undefined,
          }}
          className="font-bold text-xs sm:text-sm text-[#0F2D1E] dark:text-[#E8FAF0] transition-colors truncate w-full mt-2"
        >
          {web.name}
        </h4>

        <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F] truncate w-full block font-mono">
          {domain}
        </span>

        {/* Optional Tag Pills if available */}
        {tagsList.length > 0 && (
          <div className="flex items-center justify-center gap-1 flex-wrap mt-1">
            {tagsList.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: `${brandColor}12`,
                  color: brandColor,
                  borderColor: `${brandColor}30`,
                }}
                className="px-1.5 py-0.2 rounded text-[9px] font-medium border"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Frosted Action Dock with Logo Color Tint */}
      <div
        style={{
          borderColor: `${brandColor}35`,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
        }}
        className="dark:!bg-[#08170F]/85 backdrop-blur-sm px-2 py-1 rounded-2xl border flex items-center justify-around text-xs opacity-90 group-hover:opacity-100 transition-opacity"
      >
        {/* Quick Copy Link */}
        <button
          onClick={onCopyUrl}
          className="p-1 text-[#3D7858] dark:text-[#72B38F] hover:text-[#1E7247] dark:hover:text-[#5FBF8F] rounded-lg transition-colors relative"
          title="Copy URL"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {isCopied && (
            <span
              style={{ backgroundColor: brandColor }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 text-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-in fade-in font-bold"
            >
              Copied!
            </span>
          )}
        </button>

        {/* Attach to Task */}
        <button
          onClick={onLinkTask}
          className="p-1 text-[#3D7858] dark:text-[#72B38F] hover:text-indigo-500 dark:hover:text-indigo-300 rounded-lg transition-colors"
          title="Attach to task"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        {/* Edit */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] rounded-lg transition-colors"
          title="Edit bookmark"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="p-1 text-[#3D7858] dark:text-[#72B38F] hover:text-rose-500 rounded-lg transition-colors"
          title="Delete bookmark"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Launch */}
        <span
          style={{ color: brandColor }}
          className="p-1 transition-transform group-hover:scale-110"
          title="Launch website"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

/* --- Compact Row Component for List View --- */
const BookmarkRow: React.FC<BookmarkCardProps> = ({
  web,
  isCopied,
  onLaunch,
  onToggleFavorite,
  onCopyUrl,
  onEdit,
  onDelete,
  onLinkTask,
}) => {
  const domain = web.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];

  const isFav = Boolean(web.isFavorite || (web as any).favorite);

  return (
    <div
      onClick={onLaunch}
      className="p-3 sm:px-4 flex items-center justify-between gap-4 hover:bg-[#F3FBF7] dark:hover:bg-[#13261C]/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Favicon */}
        <div className="w-8 h-8 rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-center flex-shrink-0 p-1.5">
          <img
            src={
              web.faviconUrl ||
              `https://www.google.com/s2/favicons?domain=${web.url}&sz=64`
            }
            alt={web.name}
            className="w-4 h-4 object-contain rounded"
            onError={(e) => {
              e.currentTarget.src =
                'https://www.google.com/s2/favicons?domain=example.com&sz=64';
            }}
          />
        </div>

        {/* Title & Domain */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] group-hover:text-[#5FBF8F] transition-colors truncate">
              {web.name}
            </h4>
            {isFav && (
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
            )}
          </div>
          <span className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A] truncate block font-mono">
            {domain}
          </span>
        </div>
      </div>

      {/* Center: Category & Visit stats */}
      <div className="hidden md:flex items-center gap-3">
        {web.categoryName && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: `${web.color || '#0c93e7'}15`,
              color: web.color || '#0c93e7',
            }}
          >
            {web.categoryName}
          </span>
        )}

        <span className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A] flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#5FBF8F]" />
          {web.visitCount || 0} visits
        </span>

        {(web.linkedTaskCount || 0) > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
            <CheckSquare className="w-3 h-3" />
            {web.linkedTaskCount} tasks
          </span>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleFavorite}
          className="p-1.5 text-[#8A9890] dark:text-[#6F8A7A] hover:text-amber-400 transition-colors"
          title={isFav ? 'Unstar favorite' : 'Star as favorite'}
        >
          <Star
            className={clsx(
              'w-3.5 h-3.5 transition-all',
              isFav && 'fill-amber-400 text-amber-400 scale-110'
            )}
          />
        </button>

        <button
          onClick={onCopyUrl}
          className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#5FBF8F] rounded-lg transition-colors relative"
          title="Copy URL"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={onLinkTask}
          className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-indigo-400 rounded-lg transition-colors"
          title="Attach to task"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-lg transition-colors"
          title="Edit"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDelete}
          className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <span className="p-1 text-[#5FBF8F]">
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};


