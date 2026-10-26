import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  FolderPlus,
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
  Link2,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  RefreshCw,
  FolderOpen,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Bot,
  Sparkles,
  Tag,
  Plus,
  X
} from 'lucide-react';
import type { DocumentItem, Category, FolderItem } from '../types';
import { documentService, formatFileSize } from '../services/documentService';
import { categoryService } from '../services/categoryService';
import { folderService } from '../services/folderService';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { LinkDocumentToTaskModal } from '../components/documents/LinkDocumentToTaskModal';
import { AiDocumentChatModal } from '../components/documents/AiDocumentChatModal';
import { CreateFolderModal } from '../components/folders/CreateFolderModal';
import { CategoryModal } from '../components/categories/CategoryModal';
import { useConfirm } from '../contexts/ConfirmDialogContext';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_DOCUMENTS, MOCK_FOLDERS, MOCK_CATEGORIES } from '../data/mockDemoData';
import { clsx } from 'clsx';

type ExplorerViewMode = 'DETAILS' | 'GRID';
type SortField = 'NAME' | 'DATE' | 'TYPE' | 'SIZE';
type SortOrder = 'ASC' | 'DESC';

// Format date into human-friendly date
function formatExplorerDate(dateStr?: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

// Convert mime types & extensions to human-friendly type labels
function getExplorerFileType(fileType?: string, fileName?: string): string {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || (fileType && fileType.includes('pdf'))) return 'PDF Document';
  if (['docx', 'doc'].includes(ext) || (fileType && fileType.includes('word'))) return 'Word Document';
  if (['xlsx', 'xls', 'csv'].includes(ext) || (fileType && fileType.includes('sheet'))) return 'Excel Worksheet';
  if (['pptx', 'ppt'].includes(ext) || (fileType && fileType.includes('presentation'))) return 'PowerPoint Presentation';
  if (ext === 'png') return 'PNG Image';
  if (['jpg', 'jpeg'].includes(ext)) return 'JPEG Image';
  if (ext === 'webp') return 'WebP Image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Compressed Archive';
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return 'JavaScript / TypeScript';
  if (['java', 'py', 'cpp', 'c', 'cs', 'go'].includes(ext)) return 'Source Code File';
  if (ext === 'txt') return 'Text Document';
  return 'File';
}

// Return modern themed icon for file
function getExplorerFileIcon(fileType?: string, fileName?: string, className = 'w-4 h-4') {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || (fileType && fileType.includes('pdf'))) {
    return <FileText className={clsx(className, 'text-rose-500')} />;
  }
  if (['docx', 'doc'].includes(ext)) {
    return <File className={clsx(className, 'text-blue-500')} />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className={clsx(className, 'text-emerald-500')} />;
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
    return <FileImage className={clsx(className, 'text-sky-500')} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className={clsx(className, 'text-amber-500')} />;
  }
  if (['ts', 'tsx', 'js', 'jsx', 'java', 'py', 'sql', 'json'].includes(ext)) {
    return <FileCode className={clsx(className, 'text-teal-500')} />;
  }
  return <File className={clsx(className, 'text-gray-400')} />;
}

export const DocumentsPage: React.FC = () => {
  const confirm = useConfirm();
  const { isDemoMode } = useAuth();

  // Primary Data State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Category Filtering State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Folder Navigation State
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderItem[]>([]);
  const [folderHistory, setFolderHistory] = useState<(FolderItem | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Explorer Controls
  const [viewMode, setViewMode] = useState<ExplorerViewMode>('DETAILS');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('NAME');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [linkModalDoc, setLinkModalDoc] = useState<DocumentItem | null>(null);
  const [chattingDoc, setChattingDoc] = useState<DocumentItem | null>(null);

  // Fetch data
  const loadContent = async () => {
    setLoading(true);

    if (isDemoMode) {
      const filteredFlds = MOCK_FOLDERS.filter((f) =>
        currentFolder ? f.parentId === currentFolder.id : !f.parentId
      );
      const filteredDocs = MOCK_DOCUMENTS.filter((d) =>
        currentFolder ? d.folderId === currentFolder.id : !d.folderId
      );
      setDocuments(filteredDocs);
      setCategories(MOCK_CATEGORIES);
      setFolders(filteredFlds);

      if (currentFolder) {
        const crumbs: FolderItem[] = [];
        let curr: FolderItem | undefined = currentFolder;
        while (curr) {
          crumbs.unshift(curr);
          curr = MOCK_FOLDERS.find((f) => f.id === curr?.parentId);
        }
        setBreadcrumbs(crumbs);
      } else {
        setBreadcrumbs([]);
      }
      setLoading(false);
      return;
    }

    try {
      const [fetchedDocs, fetchedCats, fetchedFolders] = await Promise.all([
        documentService.getDocuments({
          search: search || undefined,
          folderId: currentFolder?.id || undefined,
        }),
        categoryService.getCategories(),
        folderService.getFolders('DOCUMENT', currentFolder?.id || undefined),
      ]);
      setDocuments(fetchedDocs);
      setCategories(fetchedCats);
      setFolders(fetchedFolders);

      if (currentFolder?.id) {
        const crumbs = await folderService.getBreadcrumbs(currentFolder.id);
        setBreadcrumbs(crumbs);
      } else {
        setBreadcrumbs([]);
      }
    } catch (err) {
      console.error('Failed to load explorer content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [search, currentFolder]);

  // Navigate deeper into a sub-folder
  const navigateToFolder = (targetFolder: FolderItem | null) => {
    const newHistory = folderHistory.slice(0, historyIndex + 1);
    newHistory.push(targetFolder);
    setFolderHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolder(targetFolder);
    setSelectedItemId(null);
  };

  // Back button
  const handleBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentFolder(folderHistory[newIdx]);
      setSelectedItemId(null);
    }
  };

  // Up button (navigate to parent folder)
  const handleUp = () => {
    if (!currentFolder) return;
    if (breadcrumbs.length > 1) {
      const parent = breadcrumbs[breadcrumbs.length - 2];
      navigateToFolder(parent);
    } else {
      navigateToFolder(null);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (e: React.MouseEvent, folder: FolderItem) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folder.name}" and all sub-folders / files inside it?`,
      confirmText: 'Delete Folder',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await folderService.deleteFolder(folder.id);
      loadContent();
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  // Delete document
  const handleDeleteDocument = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete File',
      message: `Are you sure you want to delete "${doc.originalFileName || doc.name}"?`,
      confirmText: 'Delete File',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await documentService.deleteDocument(doc.id);
      loadContent();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Toggle favorite / star
  const handleToggleFavorite = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const nextVal = !(doc.isFavorite || (doc as any).favorite);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, isFavorite: nextVal, favorite: nextVal } as any : d))
    );
    try {
      await documentService.toggleFavorite(doc.id);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      loadContent();
    }
  };

  // Download document
  const handleDownload = async (doc: DocumentItem) => {
    try {
      const url = await documentService.getDownloadUrl(doc.id);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalFileName || doc.name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Table header sort click handler
  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  // Filter items by selected Category
  const filteredFolders = useMemo(() => {
    if (!selectedCategoryId) return folders;
    return folders.filter((f) => f.categoryId === selectedCategoryId);
  }, [folders, selectedCategoryId]);

  const filteredDocuments = useMemo(() => {
    if (!selectedCategoryId) return documents;
    return documents.filter((d) => d.categoryId === selectedCategoryId);
  }, [documents, selectedCategoryId]);

  // Sorted Folders & Documents (Folders ALWAYS FIRST!)
  const sortedFolders = useMemo(() => {
    const list = [...filteredFolders];
    list.sort((a, b) => {
      if (sortField === 'NAME') {
        return sortOrder === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortField === 'DATE') {
        const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sortOrder === 'ASC' ? da - db : db - da;
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [filteredFolders, sortField, sortOrder]);

  const sortedDocuments = useMemo(() => {
    const list = [...filteredDocuments];
    list.sort((a, b) => {
      if (sortField === 'NAME') {
        return sortOrder === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortField === 'DATE') {
        const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sortOrder === 'ASC' ? da - db : db - da;
      }
      if (sortField === 'SIZE') {
        return sortOrder === 'ASC' ? a.fileSize - b.fileSize : b.fileSize - a.fileSize;
      }
      if (sortField === 'TYPE') {
        const ta = getExplorerFileType(a.fileType, a.originalFileName);
        const tb = getExplorerFileType(b.fileType, b.originalFileName);
        return sortOrder === 'ASC' ? ta.localeCompare(tb) : tb.localeCompare(ta);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [filteredDocuments, sortField, sortOrder]);

  const totalItemsCount = sortedFolders.length + sortedDocuments.length;

  return (
    <div className="space-y-6 animate-in fade-in pb-12 font-sans">
      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR (AIU Workspace Design System)          */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-500 dark:bg-amber-400/15 dark:text-amber-400 shadow-sm">
              <Folder className="w-6 h-6 fill-amber-500/20" />
            </div>
            Documents & Knowledge Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#3D7858] dark:text-[#72B38F] mt-0.5">
            Organize university coursework, lecture slides, assignments, and documents with smart categories and folder hierarchies.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* New Category Button */}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] text-xs font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
            title="Create a new Category tag"
          >
            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>+ New Category</span>
          </button>

          {/* New Folder Button */}
          <button
            onClick={() => setCreateFolderModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-amber-400 text-xs font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
            title="Create a new Folder (Ctrl+Shift+N)"
          >
            <FolderPlus className="w-4 h-4 text-amber-500" />
            <span>+ New Folder</span>
          </button>

          {/* Upload Document Button */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
            title="Upload Document"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CATEGORY FILTER PILLS BAR                             */}
      {/* ======================================================== */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategoryId('')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border shadow-2xs',
              !selectedCategoryId
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                : 'bg-white dark:bg-[#0D2218] border-[#BBEAD0] dark:border-[#1E4933] text-gray-700 dark:text-gray-300 hover:border-emerald-500'
            )}
          >
            <span>All Items</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
              {folders.length + documents.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const catItemCount =
              folders.filter((f) => f.categoryId === cat.id).length +
              documents.filter((d) => d.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(isSelected ? '' : cat.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border shadow-2xs',
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                    : 'bg-white dark:bg-[#0D2218] border-[#BBEAD0] dark:border-[#1E4933] text-gray-700 dark:text-gray-300 hover:border-emerald-500'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || '#10B981' }}
                />
                <span>{cat.name}</span>
                {catItemCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
                    {catItemCount}
                  </span>
                )}
              </button>
            );
          })}

          {selectedCategoryId && (
            <button
              onClick={() => setSelectedCategoryId('')}
              className="px-2 py-1 text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 shrink-0 font-medium ml-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. THE FILE MANAGER CARD CONTAINER                       */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-md overflow-hidden flex flex-col min-h-[550px]">
        {/* Command & Breadcrumbs Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 bg-emerald-50/50 dark:bg-[#0F281B]/40 border-b border-[#BBEAD0] dark:border-[#1E4933] text-xs">
          {/* Left: Navigation Buttons & Breadcrumbs */}
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            {/* Nav Arrows */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleBack}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 dark:text-gray-300 transition-colors"
                title="Back (Alt + Left Arrow)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleUp}
                disabled={!currentFolder}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 dark:text-gray-300 transition-colors"
                title="Up to parent folder"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={loadContent}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-600 dark:text-gray-300 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin text-emerald-500')} />
              </button>
            </div>

            {/* Breadcrumb Path Bar */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0A1A12] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl overflow-x-auto no-scrollbar font-medium text-xs flex-1">
              <button
                onClick={() => navigateToFolder(null)}
                className={clsx(
                  'flex items-center gap-1.5 px-2 py-0.5 rounded-lg shrink-0 transition-colors',
                  !currentFolder
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300'
                )}
              >
                <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                <span>Documents Vault</span>
              </button>

              {breadcrumbs.map((crumb, idx) => {
                const isCurrent = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <button
                      onClick={() => navigateToFolder(crumb)}
                      className={clsx(
                        'px-2 py-0.5 rounded-lg shrink-0 transition-colors truncate max-w-[160px]',
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300'
                      )}
                      title={crumb.name}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Sort & View Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative w-40 sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents & folders..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#0A1A12] border border-[#BBEAD0] dark:border-[#1E4933] focus:border-emerald-500 rounded-xl text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-colors"
              />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => handleHeaderSort(sortField === 'NAME' ? 'DATE' : 'NAME')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0A1A12] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-emerald-500 text-gray-700 dark:text-gray-300 transition-colors"
              title="Change sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline font-medium">{sortField} ({sortOrder})</span>
            </button>

            {/* View Mode Toggle: Details vs Grid */}
            <div className="flex items-center bg-white dark:bg-[#0A1A12] rounded-xl p-0.5 border border-[#BBEAD0] dark:border-[#1E4933]">
              <button
                onClick={() => setViewMode('DETAILS')}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors',
                  viewMode === 'DETAILS'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                )}
                title="Details Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Details</span>
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors',
                  viewMode === 'GRID'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                )}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Explorer Content Body                                    */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {totalItemsCount === 0 && !loading ? (
            /* Modern Themed Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 shadow-inner">
                <FolderOpen className="w-12 h-12 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                This folder is empty
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Create sub-folders to structure your coursework, or upload lecture slides, past papers, and documents.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => setCreateFolderModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#0D2218] hover:bg-gray-50 dark:hover:bg-[#133322] text-xs font-semibold text-gray-700 dark:text-gray-200 border border-[#BBEAD0] dark:border-[#1E4933] shadow-xs transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>+ New Folder</span>
                </button>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm shadow-emerald-500/30 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'DETAILS' ? (
            /* ======================================================== */
            /* DETAILS VIEW (Modern Themed Table)                       */
            /* ======================================================== */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-emerald-500/15 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th
                      onClick={() => handleHeaderSort('NAME')}
                      className="py-2.5 px-3 hover:bg-emerald-500/5 cursor-pointer rounded-l-lg transition-colors w-[38%]"
                    >
                      <div className="flex items-center gap-1">
                        <span>Name</span>
                        {sortField === 'NAME' && (
                          <span className="text-emerald-500 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-2.5 px-3 w-[16%]">Category</th>
                    <th
                      onClick={() => handleHeaderSort('DATE')}
                      className="py-2.5 px-3 hover:bg-emerald-500/5 cursor-pointer transition-colors w-[18%]"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date modified</span>
                        {sortField === 'DATE' && (
                          <span className="text-emerald-500 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSort('TYPE')}
                      className="py-2.5 px-3 hover:bg-emerald-500/5 cursor-pointer transition-colors w-[14%]"
                    >
                      <div className="flex items-center gap-1">
                        <span>Type</span>
                        {sortField === 'TYPE' && (
                          <span className="text-emerald-500 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSort('SIZE')}
                      className="py-2.5 px-3 hover:bg-emerald-500/5 cursor-pointer transition-colors text-right w-[8%]"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Size</span>
                        {sortField === 'SIZE' && (
                          <span className="text-emerald-500 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right w-[6%] rounded-r-lg"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-emerald-500/10">
                  {/* 1. Folders List (Always First) */}
                  {sortedFolders.map((folder) => {
                    const isSelected = selectedItemId === folder.id;
                    return (
                      <tr
                        key={folder.id}
                        onClick={() => setSelectedItemId(folder.id)}
                        onDoubleClick={() => navigateToFolder(folder)}
                        className={clsx(
                          'group transition-colors cursor-pointer select-none rounded-xl',
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                            : 'hover:bg-emerald-500/5 text-gray-800 dark:text-gray-200'
                        )}
                      >
                        {/* Name & Folder Icon */}
                        <td className="py-2.5 px-3 flex items-center gap-2.5 truncate font-medium">
                          <Folder
                            className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0"
                            style={folder.color ? { fill: folder.color, color: folder.color } : {}}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToFolder(folder);
                            }}
                            className="truncate text-left hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none"
                          >
                            {folder.name}
                          </button>
                        </td>

                        {/* Category Badge */}
                        <td className="py-2.5 px-3">
                          {folder.categoryName ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                              style={{
                                backgroundColor: `${folder.categoryColor || '#10B981'}15`,
                                color: folder.categoryColor || '#10B981',
                                borderColor: `${folder.categoryColor || '#10B981'}30`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: folder.categoryColor || '#10B981' }}
                              />
                              {folder.categoryName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">--</span>
                          )}
                        </td>

                        {/* Date Modified */}
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                          {formatExplorerDate(folder.updatedAt || folder.createdAt)}
                        </td>

                        {/* Type */}
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 truncate">
                          File folder
                        </td>

                        {/* Size / Item Count */}
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 font-mono text-[11px] text-right whitespace-nowrap">
                          {folder.itemCount ? `${folder.itemCount} items` : ''}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => handleDeleteFolder(e, folder)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* 2. Documents List */}
                  {sortedDocuments.map((doc) => {
                    const isSelected = selectedItemId === doc.id;
                    const fileTypeLabel = getExplorerFileType(doc.fileType, doc.originalFileName);

                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedItemId(doc.id)}
                        onDoubleClick={() => setPreviewDoc(doc)}
                        className={clsx(
                          'group transition-colors cursor-pointer select-none rounded-xl',
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                            : 'hover:bg-emerald-500/5 text-gray-800 dark:text-gray-200'
                        )}
                      >
                        {/* Name & File Icon */}
                        <td className="py-2.5 px-3 flex items-center gap-2.5 truncate font-medium">
                          {getExplorerFileIcon(doc.fileType, doc.originalFileName, 'w-4 h-4 shrink-0')}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(doc);
                            }}
                            className="truncate text-left hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none"
                            title={`${doc.name} (${doc.originalFileName})`}
                          >
                            {doc.originalFileName || doc.name}
                          </button>
                        </td>

                        {/* Category Badge */}
                        <td className="py-2.5 px-3">
                          {doc.categoryName ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                              style={{
                                backgroundColor: `${doc.categoryColor || '#10B981'}15`,
                                color: doc.categoryColor || '#10B981',
                                borderColor: `${doc.categoryColor || '#10B981'}30`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: doc.categoryColor || '#10B981' }}
                              />
                              {doc.categoryName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">--</span>
                          )}
                        </td>

                        {/* Date Modified */}
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                          {formatExplorerDate(doc.updatedAt || doc.createdAt)}
                        </td>

                        {/* Type */}
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 truncate">
                          {fileTypeLabel}
                        </td>

                        {/* Size */}
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono text-[11px] text-right whitespace-nowrap">
                          {formatFileSize(doc.fileSize)}
                        </td>

                        {/* Actions Toolbar */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Preview */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewDoc(doc);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Download */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(doc);
                              }}
                              className="p-1 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Star / Favorite */}
                            <button
                              onClick={(e) => handleToggleFavorite(e, doc)}
                              className="p-1 text-gray-400 hover:text-amber-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Star"
                            >
                              <Star className={clsx('w-3.5 h-3.5', (doc.isFavorite || (doc as any).favorite) && 'fill-amber-400 text-amber-400')} />
                            </button>

                            {/* AI Chat */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChattingDoc(doc);
                              }}
                              className="p-1 text-gray-400 hover:text-teal-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Ask AI Copilot"
                            >
                              <Bot className="w-3.5 h-3.5" />
                            </button>

                            {/* Link to Task */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLinkModalDoc(doc);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Attach to Task"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={(e) => handleDeleteDocument(e, doc)}
                              className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ======================================================== */
            /* GRID VIEW (Modern Cards Mode)                            */
            /* ======================================================== */
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pt-2">
              {/* Folders in Grid */}
              {sortedFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedItemId(folder.id)}
                  onDoubleClick={() => navigateToFolder(folder)}
                  className={clsx(
                    'group flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer text-center relative bg-white dark:bg-[#0c1c14] shadow-xs',
                    selectedItemId === folder.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-[#BBEAD0] dark:border-[#1E4933] hover:border-emerald-500 hover:shadow-md'
                  )}
                >
                  <Folder
                    className="w-12 h-12 fill-amber-500 text-amber-500 mb-2 group-hover:scale-105 transition-transform"
                    style={folder.color ? { fill: folder.color, color: folder.color } : {}}
                  />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 w-full break-words">
                    {folder.name}
                  </span>
                  {folder.categoryName && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 truncate max-w-full"
                      style={{
                        backgroundColor: `${folder.categoryColor || '#10B981'}20`,
                        color: folder.categoryColor || '#10B981',
                      }}
                    >
                      {folder.categoryName}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 mt-1 font-mono">
                    {folder.itemCount ? `${folder.itemCount} items` : 'Folder'}
                  </span>
                </div>
              ))}

              {/* Documents in Grid */}
              {sortedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedItemId(doc.id)}
                  onDoubleClick={() => setPreviewDoc(doc)}
                  className={clsx(
                    'group flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer text-center relative bg-white dark:bg-[#0c1c14] shadow-xs',
                    selectedItemId === doc.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-[#BBEAD0] dark:border-[#1E4933] hover:border-emerald-500 hover:shadow-md'
                  )}
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    {getExplorerFileIcon(doc.fileType, doc.originalFileName, 'w-10 h-10')}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 w-full break-words">
                    {doc.originalFileName || doc.name}
                  </span>
                  {doc.categoryName && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 truncate max-w-full"
                      style={{
                        backgroundColor: `${doc.categoryColor || '#10B981'}20`,
                        color: doc.categoryColor || '#10B981',
                      }}
                    >
                      {doc.categoryName}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 font-mono mt-1">
                    {formatFileSize(doc.fileSize)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* Bottom Status Bar                                        */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-4 py-2 bg-emerald-50/50 dark:bg-[#0F281B]/40 border-t border-[#BBEAD0] dark:border-[#1E4933] text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <div>
            <span>
              {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} ({sortedFolders.length} folder{sortedFolders.length !== 1 ? 's' : ''}, {sortedDocuments.length} file{sortedDocuments.length !== 1 ? 's' : ''})
            </span>
            {selectedItemId && <span className="ml-3 text-emerald-600 dark:text-emerald-400 font-semibold">| 1 item selected</span>}
          </div>

          <div className="flex items-center gap-2">
            <span>Storage: PostgreSQL & Supabase Resilient Vault</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}
      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        parentId={currentFolder?.id}
        parentName={currentFolder?.name}
        categories={categories}
        initialCategoryId={selectedCategoryId}
        type="DOCUMENT"
        onFolderCreated={() => loadContent()}
      />

      {/* Create Category Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        defaultType="DOCUMENT"
        onCategoryCreated={(newCat) => {
          setCategories((prev) => [...prev, newCat]);
          loadContent();
        }}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => loadContent()}
        categories={categories}
        initialCategoryId={selectedCategoryId}
        initialFolderId={currentFolder?.id}
        initialFolderName={currentFolder?.name}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onDownload={handleDownload}
      />

      {/* AI Chat Modal */}
      <AiDocumentChatModal
        isOpen={!!chattingDoc}
        onClose={() => setChattingDoc(null)}
        document={chattingDoc}
      />

      {/* Link to Task Modal */}
      <LinkDocumentToTaskModal
        isOpen={!!linkModalDoc}
        onClose={() => setLinkModalDoc(null)}
        document={linkModalDoc}
        onLinked={loadContent}
      />
    </div>
  );
};
