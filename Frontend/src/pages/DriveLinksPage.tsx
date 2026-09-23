import React, { useState, useEffect, useMemo } from 'react';
import {
  HardDrive,
  Plus,
  Search,
  Star,
  ExternalLink,
  Trash2,
  Edit,
  Copy,
  Check,
  Play,
  Eye,
  Link2,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Columns,
  Briefcase
} from 'lucide-react';
import { DriveLink, Category, ResourcePlatform } from '../types';
import { driveService, detectPlatform } from '../services/driveService';
import { categoryService } from '../services/categoryService';
import { DriveLinkModal } from '../components/drive/DriveLinkModal';
import { ResourcePreviewModal } from '../components/drive/ResourcePreviewModal';
import { LinkResourceToTaskModal } from '../components/drive/LinkResourceToTaskModal';
import { DriveResourceAiSummaryModal } from '../components/drive/DriveResourceAiSummaryModal';
import { CategoryModal } from '../components/categories/CategoryModal';
import { BrandIcon } from '../components/drive/BrandIcons';
import { useConfirm } from '../contexts/ConfirmDialogContext';
import { clsx } from 'clsx';

type ViewMode = 'SECTIONS' | 'GRID' | 'LIST';
type PlatformFilter = 'ALL' | 'GOOGLE_DRIVE' | 'CHATGPT' | 'YOUTUBE' | 'LINKEDIN' | 'FACEBOOK' | 'GITHUB' | 'WEB';

export const DriveLinksPage: React.FC = () => {
  const confirm = useConfirm();
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('SECTIONS');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DriveLink | undefined>(undefined);
  const [presetCategoryId, setPresetCategoryId] = useState<string | undefined>(undefined);
  const [previewResource, setPreviewResource] = useState<DriveLink | null>(null);
  const [linkTaskResource, setLinkTaskResource] = useState<DriveLink | null>(null);
  const [summaryResource, setSummaryResource] = useState<DriveLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDriveLinks = async () => {
    try {
      const [fetchedLinks, fetchedCats] = await Promise.all([
        driveService.getDriveLinks({
          search: search || undefined,
          categoryId: selectedCategory || undefined,
          isFavorite: onlyFavorites || undefined,
        }),
        categoryService.getCategories(),
      ]);
      setDriveLinks(fetchedLinks);
      setCategories(fetchedCats);
    } catch (err) {
      console.error('Failed to load drive links:', err);
    }
  };

  useEffect(() => {
    loadDriveLinks();
    const handleCategoryUpdate = () => loadDriveLinks();
    window.addEventListener('workspace-category-updated', handleCategoryUpdate);
    return () => window.removeEventListener('workspace-category-updated', handleCategoryUpdate);
  }, [search, selectedCategory, onlyFavorites]);

  // Speed Dock Pinned links (Top 8 Starred)
  const speedDockLinks = useMemo(() => {
    return driveLinks
      .filter((d) => Boolean(d.isFavorite || d.favorite))
      .slice(0, 8);
  }, [driveLinks]);

  const handleToggleFavorite = async (e: React.MouseEvent, link: DriveLink) => {
    e.stopPropagation();
    const nextVal = !(link.isFavorite || link.favorite);
    setDriveLinks((prev) =>
      prev.map((d) => (d.id === link.id ? { ...d, isFavorite: nextVal, favorite: nextVal } : d))
    );
    try {
      const updated = await driveService.toggleFavorite(link.id);
      setDriveLinks((prev) => prev.map((d) => (d.id === link.id ? updated : d)));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, link: DriveLink) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Remove Resource',
      message: 'Are you sure you want to remove this resource link?',
      confirmText: 'Remove Resource',
      variant: 'danger',
    });
    if (ok) {
      await driveService.deleteDriveLink(id);
      setDriveLinks((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleSaveDriveLink = async (driveData: Partial<DriveLink>) => {
    if (editingLink) {
      const updated = await driveService.updateDriveLink(editingLink.id, driveData);
      setDriveLinks((prev) => prev.map((d) => (d.id === editingLink.id ? updated : d)));
    } else {
      const created = await driveService.createDriveLink(driveData);
      setDriveLinks((prev) => [created, ...prev]);
    }
    setEditingLink(undefined);
    setPresetCategoryId(undefined);
    loadDriveLinks();
  };

  const handleDeleteCategory = async (sec: { id?: string; name: string }) => {
    if (sec.name === 'General & Uncategorized' || sec.name === 'General') {
      alert('Default General category cannot be deleted.');
      return;
    }
    const ok = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete the "${sec.name}" category?`,
      confirmText: 'Delete Category',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      if (sec.id) await categoryService.deleteCategory(sec.id);
      setCategories((prev) => prev.filter((c) => (sec.id ? c.id !== sec.id : c.name !== sec.name)));
      if (selectedCategory === sec.id) setSelectedCategory('');
      loadDriveLinks();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCat.id || c.name.toLowerCase() === newCat.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newCat];
    });
  };

  // Filtered by Platform Type
  const filteredLinks = useMemo(() => {
    if (platformFilter === 'ALL') return driveLinks;
    return driveLinks.filter((link) => {
      const type = (link.resourceType || detectPlatform(link.url)) as string;
      if (platformFilter === 'GOOGLE_DRIVE') {
        return type.startsWith('GOOGLE');
      }
      if (platformFilter === 'WEB') {
        return type === 'WEB_RESOURCE' || type === 'WEB';
      }
      return type === platformFilter;
    });
  }, [driveLinks, platformFilter]);

  // Grouped by Category for Sections View
  const categorySections = useMemo(() => {
    const sections: { id?: string; name: string; color?: string; items: DriveLink[] }[] = [];

    // Map known categories
    categories.forEach((cat) => {
      const items = filteredLinks.filter((d) => d.categoryId === cat.id || d.categoryName === cat.name);
      if (!selectedCategory || selectedCategory === cat.id) {
        sections.push({
          id: cat.id,
          name: cat.name,
          color: cat.color || '#10B981',
          items,
        });
      }
    });

    // Uncategorized
    const uncategorizedItems = filteredLinks.filter(
      (d) => !d.categoryId && (!d.categoryName || d.categoryName === 'General' || d.categoryName === 'General & Uncategorized')
    );
    if ((!selectedCategory || selectedCategory === 'uncategorized') && uncategorizedItems.length > 0) {
      sections.push({
        id: undefined,
        name: 'General & Uncategorized',
        color: '#10B981',
        items: uncategorizedItems,
      });
    }

    return sections;
  }, [filteredLinks, categories, selectedCategory]);

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm">
              <HardDrive className="w-6 h-6" />
            </div>
            Cloud Drives & Project Resources Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#3D7858] dark:text-[#72B38F] mt-0.5">
            Central repository for Google Drive folders, ChatGPT chats, YouTube tutorials, LinkedIn/FB posts, and Project Cards.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Create New Category Button */}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] text-xs font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
            title="Create a new Category Section"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>+ New Category</span>
          </button>

          {/* Add Resource Button */}
          <button
            onClick={() => {
              setEditingLink(undefined);
              setPresetCategoryId(undefined);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resource Link
          </button>
        </div>
      </div>

      {/* Speed Dock (Pinned & Starred Top 8 Resources) */}
      {speedDockLinks.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#F0FAF4] via-[#E6F8EE] to-[#DCF5E6] dark:from-[#0B1E14] dark:via-[#0F281B] dark:to-[#133322] border border-[#BBEAD0] dark:border-[#1E4933] shadow-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2D1E] dark:text-[#E8FAF0]">
                Speed Dock (Frequently Used & Starred Resources)
              </h2>
            </div>
            <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F]">
              {speedDockLinks.length} Pinned
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {speedDockLinks.map((link) => {
              const platform = link.resourceType || detectPlatform(link.url);
              return (
                <div
                  key={link.id}
                  onClick={() => setPreviewResource(link)}
                  className="p-2.5 rounded-2xl bg-white/90 dark:bg-[#0A1811]/90 border border-[#BBEAD0] dark:border-[#1E4933] hover:border-emerald-500 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
                  title={link.name}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <BrandIcon type={platform} className="w-4 h-4" />
                    <Star className="w-3 h-3 fill-current text-amber-500" />
                  </div>
                  <p className="text-[11px] font-bold text-[#0F2D1E] dark:text-[#E8FAF0] truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {link.name}
                  </p>
                  <span className="text-[9px] text-[#3D7858] dark:text-[#72B38F] truncate block">
                    {link.projectName || link.categoryName || 'Resource'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Pills Filter Bar */}
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
            {driveLinks.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = driveLinks.filter((d) => d.categoryId === cat.id || d.categoryName === cat.name).length;
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
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Search, Platform Filter & View Switcher Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#3D7858] dark:text-[#72B38F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drive folders, ChatGPT chats, tutorials, tags..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-xs text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 outline-none focus:border-[#48C78E]"
          />
        </div>

        {/* Center: Platform Type Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Resources' },
            { id: 'GOOGLE_DRIVE', label: 'Google Drive' },
            { id: 'CHATGPT', label: 'ChatGPT' },
            { id: 'YOUTUBE', label: 'YouTube' },
            { id: 'LINKEDIN', label: 'LinkedIn' },
            { id: 'FACEBOOK', label: 'Facebook' },
            { id: 'GITHUB', label: 'GitHub' },
            { id: 'WEB', label: 'Web/Docs' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatformFilter(p.id as PlatformFilter)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap',
                platformFilter === p.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#F2FBF6] dark:bg-[#132D20] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Right: Starred Filter & View Switcher */}
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
            <span>Starred</span>
          </button>

          {/* View Switchers */}
          <div className="flex items-center p-1 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl gap-1">
            <button
              onClick={() => setViewMode('SECTIONS')}
              className={clsx(
                'p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1',
                viewMode === 'SECTIONS'
                  ? 'bg-white dark:bg-[#08170F] text-[#25935C] dark:text-[#5FBF8F] shadow-sm font-semibold'
                  : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
              title="Category Sections View"
            >
              <Columns className="w-4 h-4" />
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
      {viewMode === 'SECTIONS' ? (
        categorySections.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] text-center space-y-3 shadow-sm">
            <HardDrive className="w-12 h-12 text-[#48C78E] mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
              No categories found
            </h3>
            <p className="text-xs text-[#3D7858] dark:text-[#72B38F] max-w-sm mx-auto">
              Create a category section or add your first Google Drive, ChatGPT, or YouTube resource link.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0]"
              >
                + Create Category
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl text-xs font-bold shadow"
              >
                + Add Resource Link
              </button>
            </div>
          </div>
        ) : (
          /* CATEGORY SECTIONS VIEW */
          <div className="space-y-8">
            {categorySections.map((sec) => {
              const isCollapsed = collapsedCategories[sec.name];
              return (
                <div key={sec.name} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#D5F2E2] dark:border-[#193A29]">
                    <div
                      onClick={() => toggleCategoryCollapse(sec.name)}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <button
                        className="p-1 rounded-lg hover:bg-emerald-500/10 text-[#3D7858] dark:text-[#72B38F] transition-colors"
                        title={isCollapsed ? 'Expand category' : 'Collapse category'}
                      >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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

                    {/* Actions for this category */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingLink(undefined);
                          setPresetCategoryId(sec.id);
                          setModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-xs font-bold text-[#1E7247] dark:text-[#5FBF8F] transition-all flex items-center gap-1.5 shadow-2xs"
                        title={`Add link to ${sec.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link here</span>
                      </button>

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
                            No resources in <span className="font-semibold text-[#0F2D1E] dark:text-[#E8FAF0]">{sec.name}</span> yet.
                          </p>
                          <button
                            onClick={() => {
                              setEditingLink(undefined);
                              setPresetCategoryId(sec.id);
                              setModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add First Resource Link
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                          {sec.items.map((link) => (
                            <ResourceCard
                              key={link.id}
                              link={link}
                              isCopied={copiedId === link.id}
                              onPreview={() => setPreviewResource(link)}
                              onToggleFavorite={(e) => handleToggleFavorite(e, link)}
                              onCopyLink={(e) => handleCopyLink(e, link)}
                              onAiSummary={(e) => {
                                e.stopPropagation();
                                setSummaryResource(link);
                              }}
                              onEdit={(e) => {
                                e.stopPropagation();
                                setEditingLink(link);
                                setModalOpen(true);
                              }}
                              onDelete={(e) => handleDelete(e, link.id)}
                              onLinkTask={(e) => {
                                e.stopPropagation();
                                setLinkTaskResource(link);
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
        )
      ) : filteredLinks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] text-center space-y-3 shadow-sm">
          <HardDrive className="w-12 h-12 text-[#48C78E] mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
            No resource links found
          </h3>
          <p className="text-xs text-[#3D7858] dark:text-[#72B38F] max-w-sm mx-auto">
            {search ? `No links matching "${search}".` : 'Save your first Google Drive, YouTube, ChatGPT, or project link.'}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl text-xs font-bold shadow inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Resource Link
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* FLAT GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredLinks.map((link) => (
            <ResourceCard
              key={link.id}
              link={link}
              isCopied={copiedId === link.id}
              onPreview={() => setPreviewResource(link)}
              onToggleFavorite={(e) => handleToggleFavorite(e, link)}
              onCopyLink={(e) => handleCopyLink(e, link)}
              onAiSummary={(e) => {
                e.stopPropagation();
                setSummaryResource(link);
              }}
              onEdit={(e) => {
                e.stopPropagation();
                setEditingLink(link);
                setModalOpen(true);
              }}
              onDelete={(e) => handleDelete(e, link.id)}
              onLinkTask={(e) => {
                e.stopPropagation();
                setLinkTaskResource(link);
              }}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#BBEAD0] dark:border-[#1E4933] overflow-hidden shadow-sm">
          <div className="divide-y divide-[#D5F2E2] dark:divide-[#193A29]">
            {filteredLinks.map((link) => (
              <ResourceRow
                key={link.id}
                link={link}
                isCopied={copiedId === link.id}
                onPreview={() => setPreviewResource(link)}
                onToggleFavorite={(e) => handleToggleFavorite(e, link)}
                onCopyLink={(e) => handleCopyLink(e, link)}
                onAiSummary={(e) => {
                  e.stopPropagation();
                  setSummaryResource(link);
                }}
                onEdit={(e) => {
                  e.stopPropagation();
                  setEditingLink(link);
                  setModalOpen(true);
                }}
                onDelete={(e) => handleDelete(e, link.id)}
                onLinkTask={(e) => {
                  e.stopPropagation();
                  setLinkTaskResource(link);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      <DriveLinkModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLink(undefined);
          setPresetCategoryId(undefined);
        }}
        onSave={handleSaveDriveLink}
        categories={categories}
        initialLink={editingLink}
        initialCategoryId={presetCategoryId}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* In-App Media / Resource Preview Modal */}
      <ResourcePreviewModal
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        resource={previewResource}
      />

      {/* AI Key Takeaways / Resource Summary Modal */}
      <DriveResourceAiSummaryModal
        isOpen={!!summaryResource}
        onClose={() => setSummaryResource(null)}
        resource={summaryResource}
        onTasksCreated={loadDriveLinks}
      />

      {/* Link to Task Modal */}
      <LinkResourceToTaskModal
        isOpen={!!linkTaskResource}
        onClose={() => setLinkTaskResource(null)}
        resource={linkTaskResource}
        onLinked={loadDriveLinks}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCategoryCreated={(newCat) => handleCategoryCreated(newCat)}
        defaultType="DRIVE_LINK"
      />
    </div>
  );
};

/* ========================================================================= */
/* 🌟 HELPER COMPONENTS: RESOURCE CARD & ROW                                  */
/* ========================================================================= */

interface CardProps {
  link: DriveLink;
  isCopied: boolean;
  onPreview: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onCopyLink: (e: React.MouseEvent) => void;
  onAiSummary: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onLinkTask: (e: React.MouseEvent) => void;
}

const ResourceCard: React.FC<CardProps> = ({
  link,
  isCopied,
  onPreview,
  onToggleFavorite,
  onCopyLink,
  onAiSummary,
  onEdit,
  onDelete,
  onLinkTask,
}) => {
  const isFav = Boolean(link.isFavorite || link.favorite);
  const platform = (link.resourceType || detectPlatform(link.url)) as ResourcePlatform;

  let hostname = '';
  try {
    hostname = new URL(link.url).hostname.replace('www.', '');
  } catch {
    hostname = 'resource';
  }

  return (
    <div
      onClick={onPreview}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] dark:hover:border-[#27AE60] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top row: Platform Badge, Project & Favorite */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="p-2 rounded-xl bg-[#ECF9F1] dark:bg-[#10271C] border border-[#D5F2E2] dark:border-[#193A29]">
              <BrandIcon type={platform} className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ECF9F1] dark:bg-[#10271C] text-[#1E7247] dark:text-[#5FBF8F]">
              {platform.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleFavorite}
              className="p-1.5 rounded-lg text-[#8A9890] hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={clsx('w-4 h-4', isFav && 'fill-current text-amber-500')} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm sm:text-base text-[#0F2D1E] dark:text-[#E8FAF0] line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
          {link.name}
        </h3>

        {/* Hostname & Project Badge */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F] font-mono">
            {hostname}
          </span>
          {link.projectName && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {link.projectName}
            </span>
          )}
        </div>

        {/* Description snippet */}
        {link.description && (
          <p className="text-xs text-[#3D7858] dark:text-[#72B38F] line-clamp-2 mt-2 leading-relaxed">
            {link.description}
          </p>
        )}

        {/* Tags */}
        {link.tags && (
          <div className="flex items-center gap-1 flex-wrap mt-2.5">
            {link.tags.split(',').slice(0, 3).map((t, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2FBF6] dark:bg-[#13261C] text-[#3D7858] dark:text-[#72B38F] font-medium">
                #{t.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-4 mt-3 border-t border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between">
        <button
          onClick={onPreview}
          className="px-3 py-1.5 rounded-xl bg-[#ECF9F1] dark:bg-[#10271C] hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          {platform === 'YOUTUBE' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{platform === 'YOUTUBE' ? 'Watch' : 'Preview'}</span>
        </button>

        <div className="flex items-center gap-1">
          {/* AI Key Takeaways Button */}
          <button
            onClick={onAiSummary}
            className="p-1.5 text-brand-500 hover:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors"
            title="AI Key Takeaways & Summary"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </button>

          <button
            onClick={onLinkTask}
            className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-colors"
            title="Attach to Task"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCopyLink}
            className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-colors"
            title="Copy URL"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onEdit}
            className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-colors"
            title="Edit Resource"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Resource"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ResourceRow: React.FC<CardProps> = ({
  link,
  isCopied,
  onPreview,
  onToggleFavorite,
  onCopyLink,
  onAiSummary,
  onEdit,
  onDelete,
  onLinkTask,
}) => {
  const isFav = Boolean(link.isFavorite || link.favorite);
  const platform = (link.resourceType || detectPlatform(link.url)) as ResourcePlatform;

  return (
    <div
      onClick={onPreview}
      className="p-4 flex items-center justify-between gap-4 hover:bg-[#ECF9F1]/50 dark:hover:bg-[#10271C]/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onToggleFavorite} className="p-1 text-[#8A9890] hover:text-amber-500">
          <Star className={clsx('w-4 h-4', isFav && 'fill-current text-amber-500')} />
        </button>

        <div className="p-2 rounded-xl bg-[#ECF9F1] dark:bg-[#10271C]">
          <BrandIcon type={platform} className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs sm:text-sm text-[#0F2D1E] dark:text-[#E8FAF0] truncate">
              {link.name}
            </h4>
            {link.projectName && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                {link.projectName}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F] truncate block">
            {link.url}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* AI Key Takeaways Button */}
        <button
          onClick={onAiSummary}
          className="p-1.5 text-brand-500 hover:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors"
          title="AI Key Takeaways & Summary"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </button>

        <button
          onClick={onPreview}
          className="px-2.5 py-1 rounded-lg bg-[#ECF9F1] dark:bg-[#10271C] text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1"
        >
          {platform === 'YOUTUBE' ? <Play className="w-3 h-3 fill-current" /> : <Eye className="w-3 h-3" />}
          <span>{platform === 'YOUTUBE' ? 'Watch' : 'Preview'}</span>
        </button>
        <button onClick={onLinkTask} className="p-1.5 text-[#3D7858] hover:text-emerald-600 rounded-lg">
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onCopyLink} className="p-1.5 text-[#3D7858] hover:text-emerald-600 rounded-lg">
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-[#3D7858] hover:text-emerald-600 rounded-lg"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={onEdit} className="p-1.5 text-[#3D7858] hover:text-emerald-600 rounded-lg">
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-[#3D7858] hover:text-rose-500 rounded-lg">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
