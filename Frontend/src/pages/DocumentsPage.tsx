import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderArchive,
  Upload,
  Search,
  Download,
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Trash2,
  Star,
  Eye,
  Copy,
  Check,
  Link2,
  Plus,
  FolderPlus,
  LayoutGrid,
  List as ListIcon,
  FolderKanban,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckSquare
} from 'lucide-react';
import type { DocumentItem, Category } from '../types';
import { documentService, formatFileSize } from '../services/documentService';
import { categoryService } from '../services/categoryService';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { LinkDocumentToTaskModal } from '../components/documents/LinkDocumentToTaskModal';
import { AiDocumentChatModal } from '../components/documents/AiDocumentChatModal';
import { CategoryModal } from '../components/categories/CategoryModal';
import { useConfirm } from '../contexts/ConfirmDialogContext';
import { clsx } from 'clsx';

type ViewMode = 'SECTIONS' | 'GRID' | 'LIST';
type FileTypeFilter = 'ALL' | 'PDF' | 'IMAGE' | 'CODE' | 'ARCHIVE' | 'OFFICE';

export const DocumentsPage: React.FC = () => {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('SECTIONS');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [presetCategoryId, setPresetCategoryId] = useState<string | undefined>(undefined);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [linkModalDoc, setLinkModalDoc] = useState<DocumentItem | null>(null);
  const [chattingDoc, setChattingDoc] = useState<DocumentItem | null>(null);

  // Copied link feedback map
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const loadDocuments = async () => {
    try {
      const [fetchedDocs, fetchedCats] = await Promise.all([
        documentService.getDocuments({
          search: search || undefined,
          categoryId: selectedCategory || undefined,
          isFavorite: onlyFavorites || undefined,
        }),
        categoryService.getCategories(),
      ]);
      setDocuments(fetchedDocs);
      setCategories(fetchedCats);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
    const handleCategoryUpdate = () => loadDocuments();
    window.addEventListener('workspace-category-updated', handleCategoryUpdate);
    return () => window.removeEventListener('workspace-category-updated', handleCategoryUpdate);
  }, [search, selectedCategory, onlyFavorites]);

  // Top Pinned / Starred Documents Dock
  const speedDockDocs = useMemo(() => {
    const list = [...documents];
    return list
      .filter((d) => Boolean(d.isFavorite || d.favorite))
      .slice(0, 8);
  }, [documents]);

  const handleToggleFavorite = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const nextVal = !(doc.isFavorite || doc.favorite);
    // Instant optimistic UI update
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, isFavorite: nextVal, favorite: nextVal } : d))
    );
    try {
      const updated = await documentService.toggleFavorite(doc.id);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, ...updated } : d))
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    const downloadUrl = await documentService.getDownloadUrl(doc.id);
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const url = doc.downloadUrl || `${window.location.origin}/documents/${doc.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Remove Document',
      message: 'Are you sure you want to remove this document from the vault?',
      confirmText: 'Remove Document',
      variant: 'danger',
    });
    if (ok) {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleUploadSuccess = async (doc: DocumentItem | Partial<DocumentItem>) => {
    if ((doc as DocumentItem).id) {
      setDocuments((prev) => [doc as DocumentItem, ...prev.filter((d) => d.id !== (doc as DocumentItem).id)]);
    } else {
      const created = await documentService.uploadDocumentMetadata(doc);
      setDocuments((prev) => [created, ...prev]);
    }
    setPresetCategoryId(undefined);
    loadDocuments();
  };

  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCat.id || c.name.toLowerCase() === newCat.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newCat];
    });
  };

  const handleDeleteCategory = async (sec: { id?: string; name: string; items: DocumentItem[] }) => {
    if (sec.name === 'General & Uncategorized' || sec.name === 'General') {
      alert('Default General category cannot be deleted.');
      return;
    }

    const ok = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${sec.name}" category?`,
      description:
        sec.items.length > 0
          ? `The ${sec.items.length} document(s) inside will remain safely stored as Uncategorized.`
          : undefined,
      confirmText: 'Delete Category',
      variant: 'danger',
    });

    if (!ok) return;

    try {
      if (sec.id) {
        await categoryService.deleteCategory(sec.id);
      }
      setCategories((prev) => prev.filter((c) => (sec.id ? c.id !== sec.id : c.name !== sec.name)));
      setDocuments((prev) =>
        prev.map((d) =>
          d.categoryId === sec.id || d.categoryName === sec.name
            ? { ...d, categoryId: undefined, categoryName: undefined }
            : d
        )
      );
      if (selectedCategory === sec.id) setSelectedCategory('');
    } catch (err) {
      console.error('Failed to delete category:', err);
      setCategories((prev) => prev.filter((c) => (sec.id ? c.id !== sec.id : c.name !== sec.name)));
    }
  };

  const handleOpenUploadForCategory = (catId?: string) => {
    setPresetCategoryId(catId);
    setUploadModalOpen(true);
  };

  // Filtered documents by file type
  const filteredDocuments = useMemo(() => {
    if (fileTypeFilter === 'ALL') return documents;
    return documents.filter((doc) => {
      const type = (doc.fileType || '').toLowerCase();
      const ext = (doc.originalFileName || '').split('.').pop()?.toLowerCase() || '';
      if (fileTypeFilter === 'PDF') return type.includes('pdf') || ext === 'pdf';
      if (fileTypeFilter === 'IMAGE') return type.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
      if (fileTypeFilter === 'CODE') return type.includes('code') || type.includes('text') || ['json', 'sql', 'js', 'ts', 'java', 'py', 'md', 'html', 'css'].includes(ext);
      if (fileTypeFilter === 'ARCHIVE') return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
      if (fileTypeFilter === 'OFFICE') return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);
      return true;
    });
  }, [documents, fileTypeFilter]);

  // Grouped documents by category for Sections View
  const categorySections = useMemo(() => {
    const sections: { id?: string; name: string; color?: string; items: DocumentItem[] }[] = [];

    // Map known categories
    categories.forEach((cat) => {
      const items = filteredDocuments.filter((d) => d.categoryId === cat.id || d.categoryName === cat.name);
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
    const uncategorizedItems = filteredDocuments.filter(
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

    // Other categories not in table
    const otherDocs = filteredDocuments.filter(
      (d) =>
        d.categoryName &&
        !categories.some((c) => c.id === d.categoryId || c.name === d.categoryName) &&
        d.categoryName !== 'General' &&
        d.categoryName !== 'General & Uncategorized'
    );
    const otherGroups: Record<string, DocumentItem[]> = {};
    otherDocs.forEach((d) => {
      const name = d.categoryName || 'Other';
      if (!otherGroups[name]) otherGroups[name] = [];
      otherGroups[name].push(d);
    });

    Object.entries(otherGroups).forEach(([name, items]) => {
      if (!selectedCategory) {
        sections.push({
          id: undefined,
          name,
          color: '#10B981',
          items,
        });
      }
    });

    return sections;
  }, [filteredDocuments, categories, selectedCategory]);

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm">
              <FolderArchive className="w-6 h-6" />
            </div>
            Document Storage Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#3D7858] dark:text-[#72B38F] mt-0.5">
            Encrypted cloud storage, in-app live previews, category sections, and direct task linkage.
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

          {/* Upload Document Button */}
          <button
            onClick={() => handleOpenUploadForCategory()}
            className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Speed Dock / Pinned Starred Documents */}
      {speedDockDocs.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#F0FAF4] via-[#E6F8EE] to-[#DCF5E6] dark:from-[#0B1E14] dark:via-[#0F281B] dark:to-[#133322] border border-[#BBEAD0] dark:border-[#1E4933] shadow-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2D1E] dark:text-[#E8FAF0]">
                Starred & Pinned Documents
              </h2>
            </div>
            <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F]">
              Quick In-App Access
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {speedDockDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="p-2.5 rounded-2xl bg-white/90 dark:bg-[#08170F]/90 border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] hover:shadow-md transition-all group flex flex-col items-center text-center relative"
                title={`${doc.name} (${doc.originalFileName})`}
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 absolute top-1.5 right-1.5" />
                <div className="w-8 h-8 rounded-xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  {getDocumentFormatIcon(doc.fileType, doc.originalFileName, 'w-4 h-4')}
                </div>
                <span className="text-[11px] font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate w-full">
                  {doc.name}
                </span>
                <span className="text-[9px] text-[#3D7858] dark:text-[#72B38F] font-mono mt-0.5">
                  {formatFileSize(doc.fileSize)}
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
            {documents.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = documents.filter((d) => d.categoryId === cat.id || d.categoryName === cat.name).length;
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

      {/* Search, File Type Filter & View Switcher Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#3D7858] dark:text-[#72B38F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents, file names, tags..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-xs text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 outline-none focus:border-[#48C78E]"
          />
        </div>

        {/* Center: File Type Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'PDF', 'IMAGE', 'CODE', 'ARCHIVE', 'OFFICE'] as FileTypeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFileTypeFilter(f)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap',
                fileTypeFilter === f
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#F2FBF6] dark:bg-[#132D20] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
            >
              {f === 'ALL' ? 'All Types' : f}
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

          {/* View Switcher: Sections, Grid, List */}
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
      {viewMode === 'SECTIONS' ? (
        categorySections.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] text-center space-y-3 shadow-sm">
            <FolderArchive className="w-12 h-12 text-[#48C78E] mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
              No categories found
            </h3>
            <p className="text-xs text-[#3D7858] dark:text-[#72B38F] max-w-sm mx-auto">
              Create your first category section or upload documents to organize your files.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0]"
              >
                + Create Category
              </button>
              <button
                onClick={() => handleOpenUploadForCategory()}
                className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl text-xs font-bold shadow"
              >
                + Upload Document
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
                  {/* Clean Category Header with Accent Dot, Title, Count & Actions */}
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
                        {sec.items.length} {sec.items.length === 1 ? 'file' : 'files'}
                      </span>
                    </div>

                    {/* Actions for this category */}
                    <div className="flex items-center gap-1.5">
                      {/* Upload button for this category */}
                      <button
                        onClick={() => handleOpenUploadForCategory(sec.id)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-xs font-bold text-[#1E7247] dark:text-[#5FBF8F] transition-all flex items-center gap-1.5 shadow-2xs"
                        title={`Upload file to ${sec.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload here</span>
                      </button>

                      {/* Delete Category Button */}
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
                            No documents in <span className="font-semibold text-[#0F2D1E] dark:text-[#E8FAF0]">{sec.name}</span> yet.
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenUploadForCategory(sec.id)}
                              className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Upload First Document
                            </button>
                            {sec.name !== 'General & Uncategorized' && sec.name !== 'General' && (
                              <button
                                onClick={() => handleDeleteCategory(sec)}
                                className="px-3 py-1.5 border border-rose-300 dark:border-rose-900/60 hover:border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Category
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                          {sec.items.map((doc) => (
                            <DocumentCard
                              key={doc.id}
                              doc={doc}
                              isCopied={copiedId === doc.id}
                              onPreview={() => setPreviewDoc(doc)}
                              onToggleFavorite={(e) => handleToggleFavorite(e, doc)}
                              onCopyLink={(e) => handleCopyLink(e, doc)}
                              onDownload={() => handleDownload(doc)}
                              onDelete={(e) => handleDelete(e, doc.id)}
                              onChatAi={(e) => {
                                e.stopPropagation();
                                setChattingDoc(doc);
                              }}
                              onLinkTask={(e) => {
                                e.stopPropagation();
                                setLinkModalDoc(doc);
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
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] text-center space-y-3 shadow-sm">
          <FolderArchive className="w-12 h-12 text-[#48C78E] mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
            No documents found
          </h3>
          <p className="text-xs text-[#3D7858] dark:text-[#72B38F] max-w-sm mx-auto">
            {search
              ? `No files matching "${search}". Try clearing search filter.`
              : 'Upload your first project specification, SRS diagram, or assignment document.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0]"
            >
              + Create Category
            </button>
            <button
              onClick={() => handleOpenUploadForCategory()}
              className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl text-xs font-bold shadow"
            >
              + Upload Document
            </button>
          </div>
        </div>
      ) : viewMode === 'GRID' ? (
        /* FLAT GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              isCopied={copiedId === doc.id}
              onPreview={() => setPreviewDoc(doc)}
              onToggleFavorite={(e) => handleToggleFavorite(e, doc)}
              onCopyLink={(e) => handleCopyLink(e, doc)}
              onDownload={() => handleDownload(doc)}
              onDelete={(e) => handleDelete(e, doc.id)}
              onChatAi={(e) => {
                e.stopPropagation();
                setChattingDoc(doc);
              }}
              onLinkTask={(e) => {
                e.stopPropagation();
                setLinkModalDoc(doc);
              }}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#BBEAD0] dark:border-[#1E4933] overflow-hidden shadow-sm">
          <div className="divide-y divide-[#D5F2E2] dark:divide-[#193A29]">
            {filteredDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                isCopied={copiedId === doc.id}
                onPreview={() => setPreviewDoc(doc)}
                onToggleFavorite={(e) => handleToggleFavorite(e, doc)}
                onCopyLink={(e) => handleCopyLink(e, doc)}
                onDownload={() => handleDownload(doc)}
                onDelete={(e) => handleDelete(e, doc.id)}
                onChatAi={(e) => {
                  e.stopPropagation();
                  setChattingDoc(doc);
                }}
                onLinkTask={(e) => {
                  e.stopPropagation();
                  setLinkModalDoc(doc);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setPresetCategoryId(undefined);
        }}
        onUploadSuccess={handleUploadSuccess}
        categories={categories}
        initialCategoryId={presetCategoryId}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Live In-App Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onDownload={handleDownload}
      />

      {/* AI Document Q&A / Chat Modal */}
      <AiDocumentChatModal
        isOpen={!!chattingDoc}
        onClose={() => setChattingDoc(null)}
        document={chattingDoc}
      />

      {/* Link Document to Task Modal */}
      <LinkDocumentToTaskModal
        isOpen={!!linkModalDoc}
        onClose={() => setLinkModalDoc(null)}
        document={linkModalDoc}
        onLinked={loadDocuments}
      />

      {/* Create New Category Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
        defaultType="DOCUMENT"
      />
    </div>
  );
};

/* --- Visual Squarish Leaf-Green Document Card Component --- */
interface DocumentCardProps {
  doc: DocumentItem;
  isCopied: boolean;
  onPreview: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onCopyLink: (e: React.MouseEvent) => void;
  onDownload: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onLinkTask: (e: React.MouseEvent) => void;
  onChatAi: (e: React.MouseEvent) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  isCopied,
  onPreview,
  onToggleFavorite,
  onCopyLink,
  onDownload,
  onDelete,
  onLinkTask,
  onChatAi,
}) => {
  const ext = (doc.originalFileName || '').split('.').pop()?.toLowerCase() || '';
  const isFav = Boolean(doc.isFavorite || doc.favorite);

  return (
    <div
      onClick={onPreview}
      className="p-4 rounded-3xl bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-emerald-500/80 hover:shadow-lg transition-all duration-200 shadow-sm flex flex-col justify-between cursor-pointer group relative"
    >
      {/* Top Row: Format pill & Star */}
      <div className="flex items-center justify-between gap-1 w-full mb-3">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F7EF] dark:bg-[#13261C] text-[#1E7247] dark:text-[#5FBF8F] border border-[#BBEAD0] dark:border-[#20372B] uppercase">
          .{ext || 'FILE'}
        </span>

        <div className="flex items-center gap-1">
          {/* Linked task count */}
          {(doc.linkedTaskCount || 0) > 0 && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              title={`${doc.linkedTaskCount} linked tasks`}
            >
              <CheckSquare className="w-2.5 h-2.5" />
              {doc.linkedTaskCount}
            </span>
          )}

          <button
            onClick={onToggleFavorite}
            className="p-1 rounded-lg hover:bg-amber-400/10 text-[#3D7858]/60 dark:text-[#72B38F]/60 hover:text-amber-400 transition-colors flex-shrink-0"
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

      {/* Center: File Icon & Title */}
      <div className="flex flex-col items-center text-center my-auto py-2">
        <div className="w-14 h-14 rounded-2xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-xs flex items-center justify-center p-3 group-hover:scale-105 transition-transform mb-2.5">
          {getDocumentFormatIcon(doc.fileType, doc.originalFileName, 'w-7 h-7')}
        </div>

        <h4 className="font-bold text-xs sm:text-sm text-[#0F2D1E] dark:text-[#E8FAF0] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate w-full">
          {doc.name}
        </h4>

        <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F] font-mono truncate w-full block mt-0.5">
          {doc.originalFileName}
        </span>

        <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-[#1E7247] dark:text-[#5FBF8F]">
          <span>{formatFileSize(doc.fileSize)}</span>
          <span>•</span>
          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Bottom Action Dock */}
      <div className="mt-3 pt-2.5 border-t border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-around text-xs">
        {/* AI Chat Button */}
        <button
          onClick={onChatAi}
          className="p-1.5 text-brand-500 hover:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors"
          title="Chat & Ask AI about this document"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </button>

        {/* Live Preview Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 dark:group-hover:text-emerald-400 rounded-lg transition-colors"
          title="Live In-App Preview"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Copy Share Link */}
        <button
          onClick={onCopyLink}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-[#1E7247] dark:hover:text-[#5FBF8F] rounded-lg transition-colors relative"
          title="Copy file link"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {isCopied && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-white bg-emerald-600 text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-in fade-in font-bold">
              Copied!
            </span>
          )}
        </button>

        {/* Attach to Task */}
        <button
          onClick={onLinkTask}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-indigo-500 dark:hover:text-indigo-300 rounded-lg transition-colors"
          title="Attach to task"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        {/* Direct Download */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 rounded-lg transition-colors"
          title="Download file"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-rose-500 rounded-lg transition-colors"
          title="Delete document"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* --- Compact Row Component for List View --- */
const DocumentRow: React.FC<DocumentCardProps> = ({
  doc,
  isCopied,
  onPreview,
  onToggleFavorite,
  onCopyLink,
  onDownload,
  onDelete,
  onLinkTask,
  onChatAi,
}) => {
  const isFav = Boolean(doc.isFavorite || doc.favorite);

  return (
    <div
      onClick={onPreview}
      className="p-3 sm:px-4 flex items-center justify-between gap-4 hover:bg-[#F3FBF7] dark:hover:bg-[#13261C]/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] border border-[#BBEAD0] dark:border-[#20372B] flex items-center justify-center flex-shrink-0">
          {getDocumentFormatIcon(doc.fileType, doc.originalFileName, 'w-4 h-4')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-xs sm:text-sm text-[#0F2D1E] dark:text-[#E8FAF0] group-hover:text-emerald-600 transition-colors truncate">
              {doc.name}
            </h4>
            {isFav && <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />}
          </div>
          <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F] truncate block font-mono">
            {doc.originalFileName}
          </span>
        </div>
      </div>

      {/* Center: Category & Size */}
      <div className="hidden md:flex items-center gap-4">
        {doc.categoryName && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F7EF] dark:bg-[#13261C] text-[#1E7247] dark:text-[#5FBF8F] border border-[#BBEAD0] dark:border-[#20372B]">
            {doc.categoryName}
          </span>
        )}

        <span className="text-[11px] font-mono font-semibold text-[#0F2D1E] dark:text-[#E8FAF0]">
          {formatFileSize(doc.fileSize)}
        </span>

        <span className="text-[11px] text-[#3D7858] dark:text-[#72B38F]">
          {new Date(doc.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onChatAi}
          className="p-1.5 text-brand-500 hover:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors"
          title="Chat & Ask AI"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </button>

        <button
          onClick={onToggleFavorite}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-amber-400 transition-colors"
          title={isFav ? 'Unstar favorite' : 'Star as favorite'}
        >
          <Star className={clsx('w-3.5 h-3.5 transition-all', isFav && 'fill-amber-400 text-amber-400 scale-110')} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 rounded-lg transition-colors"
          title="Live Preview"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onCopyLink}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-[#1E7247] rounded-lg transition-colors relative"
          title="Copy Link"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onLinkTask}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-indigo-400 rounded-lg transition-colors"
          title="Attach to task"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-emerald-600 rounded-lg transition-colors"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDelete}
          className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-rose-500 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* --- File Type Icon Selector --- */
function getDocumentFormatIcon(fileType: string, fileName: string, sizeClass = 'w-6 h-6') {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  if (fileType.includes('pdf') || ext === 'pdf') {
    return <FileText className={clsx(sizeClass, 'text-rose-500')} />;
  }
  if (fileType.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
    return <FileImage className={clsx(sizeClass, 'text-sky-500')} />;
  }
  if (fileType.includes('code') || ['json', 'sql', 'js', 'ts', 'java', 'py'].includes(ext)) {
    return <FileCode className={clsx(sizeClass, 'text-emerald-500')} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className={clsx(sizeClass, 'text-amber-500')} />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className={clsx(sizeClass, 'text-teal-500')} />;
  }
  return <File className={clsx(sizeClass, 'text-indigo-500')} />;
}
