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
  Copy,
  Check,
  Link2,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  RefreshCw,
  HardDrive,
  FolderOpen,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  MoreVertical,
  Bot,
  Sparkles,
  ExternalLink,
  ChevronDown,
  CheckSquare
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
import { useConfirm } from '../contexts/ConfirmDialogContext';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_DOCUMENTS, MOCK_FOLDERS, MOCK_CATEGORIES } from '../data/mockDemoData';
import { clsx } from 'clsx';

type ExplorerViewMode = 'DETAILS' | 'GRID';
type SortField = 'NAME' | 'DATE' | 'TYPE' | 'SIZE';
type SortOrder = 'ASC' | 'DESC';

// Format date into Windows File Explorer format: M/d/yyyy h:mm a
function formatWindowsDate(dateStr?: string): string {
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

// Convert mime types & extensions to human-friendly Windows Type labels
function getWindowsFileType(fileType?: string, fileName?: string): string {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || (fileType && fileType.includes('pdf'))) return 'Chrome PDF Document';
  if (['docx', 'doc'].includes(ext) || (fileType && fileType.includes('word'))) return 'Microsoft Word Document';
  if (['xlsx', 'xls', 'csv'].includes(ext) || (fileType && fileType.includes('sheet'))) return 'Microsoft Excel Worksheet';
  if (['pptx', 'ppt'].includes(ext) || (fileType && fileType.includes('presentation'))) return 'Microsoft PowerPoint Presentation';
  if (ext === 'png') return 'PNG File';
  if (['jpg', 'jpeg'].includes(ext)) return 'JPG File';
  if (ext === 'webp') return 'Microsoft Edge HTML Document';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Compressed Archive';
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return 'TypeScript / JS Source';
  if (['java', 'py', 'cpp', 'c', 'cs', 'go'].includes(ext)) return 'Source Code File';
  if (ext === 'txt') return 'Text Document';
  return 'File';
}

// Return authentic Windows style icon for file
function getWindowsFileIcon(fileType?: string, fileName?: string, className = 'w-4 h-4') {
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
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [linkModalDoc, setLinkModalDoc] = useState<DocumentItem | null>(null);
  const [chattingDoc, setChattingDoc] = useState<DocumentItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Navigate into a folder
  const navigateToFolder = (targetFolder: FolderItem | null) => {
    setCurrentFolder(targetFolder);
    setSelectedItemId(null);
    // Push to navigation history
    const nextHistory = folderHistory.slice(0, historyIndex + 1);
    nextHistory.push(targetFolder);
    setFolderHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  // Back button
  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = folderHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentFolder(prev);
      setSelectedItemId(null);
    }
  };

  // Up button (Go to parent folder)
  const handleUp = () => {
    if (breadcrumbs.length > 1) {
      navigateToFolder(breadcrumbs[breadcrumbs.length - 2]);
    } else if (breadcrumbs.length === 1) {
      navigateToFolder(null);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (e: React.MouseEvent, folder: FolderItem) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete folder "${folder.name}" and all sub-items inside it?`,
      confirmText: 'Delete Folder',
      variant: 'danger',
    });
    if (ok) {
      try {
        await folderService.deleteFolder(folder.id);
        loadContent();
      } catch (err) {
        console.error('Failed to delete folder:', err);
      }
    }
  };

  // Delete document
  const handleDeleteDocument = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${doc.name}"?`,
      confirmText: 'Delete Document',
      variant: 'danger',
    });
    if (ok) {
      try {
        await documentService.deleteDocument(doc.id);
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      } catch (err) {
        console.error('Failed to delete document:', err);
      }
    }
  };

  // Download handler
  const handleDownload = async (doc: DocumentItem) => {
    const downloadUrl = await documentService.getDownloadUrl(doc.id);
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy link handler
  const handleCopyLink = (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const url = doc.downloadUrl || `${window.location.origin}/documents/${doc.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Star toggle
  const handleToggleFavorite = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const nextVal = !(doc.isFavorite || doc.favorite);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, isFavorite: nextVal, favorite: nextVal } : d))
    );
    try {
      await documentService.toggleFavorite(doc.id);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Sort toggle
  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  // Sorted Folders & Documents (Folders ALWAYS FIRST, exactly like Windows!)
  const sortedFolders = useMemo(() => {
    const list = [...folders];
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
  }, [folders, sortField, sortOrder]);

  const sortedDocuments = useMemo(() => {
    const list = [...documents];
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
        const ta = getWindowsFileType(a.fileType, a.originalFileName);
        const tb = getWindowsFileType(b.fileType, b.originalFileName);
        return sortOrder === 'ASC' ? ta.localeCompare(tb) : tb.localeCompare(ta);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [documents, sortField, sortOrder]);

  const totalItemsCount = sortedFolders.length + sortedDocuments.length;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-full -mx-4 sm:-mx-6 -my-4 sm:-my-6 bg-[#1F1F1F] text-gray-200 select-none overflow-hidden font-sans">
      {/* ======================================================== */}
      {/* 1. TOP WINDOWS 11 EXPLORER COMMAND BAR                  */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#202020] border-b border-[#2D2D2D] text-xs">
        {/* Left: + New Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* New Folder Button */}
          <button
            onClick={() => setCreateFolderModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#2C2C2C] active:bg-[#333] text-gray-200 hover:text-white transition-colors"
            title="Create a new folder (Ctrl+Shift+N)"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span className="font-medium">New folder</span>
          </button>

          {/* Upload File Button */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 transition-all font-semibold shadow-xs"
            title="Upload file into current directory"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload file</span>
          </button>

          {/* Vertical Divider */}
          <div className="h-4 w-[1px] bg-gray-700 mx-1" />

          {/* Sort Dropdown Selector */}
          <div className="relative group">
            <button
              onClick={() => handleHeaderSort(sortField === 'NAME' ? 'DATE' : 'NAME')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#2C2C2C] text-gray-300 hover:text-white transition-colors"
              title="Change Sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span>Sort: {sortField} ({sortOrder})</span>
            </button>
          </div>

          {/* View Mode Toggle: Details vs Grid */}
          <div className="flex items-center bg-[#181818] rounded-md p-0.5 border border-[#333]">
            <button
              onClick={() => setViewMode('DETAILS')}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors',
                viewMode === 'DETAILS' ? 'bg-[#2E2E2E] text-white shadow-xs font-semibold' : 'text-gray-400 hover:text-gray-200'
              )}
              title="Details View (Windows Explorer Table)"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors',
                viewMode === 'GRID' ? 'bg-[#2E2E2E] text-white shadow-xs font-semibold' : 'text-gray-400 hover:text-gray-200'
              )}
              title="Large Icons View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Icons</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Search Box */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${currentFolder ? currentFolder.name : '00-(UNIVERISTY OF MORATUWA)'}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-[#181818] border border-[#333] hover:border-[#444] focus:border-sky-500 rounded-md text-xs text-gray-200 placeholder-gray-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BREADCRUMB ADDRESS BAR & NAVIGATION CONTROLS          */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#191919] border-b border-[#282828] text-xs">
        {/* Navigation Buttons: Back, Forward, Up, Refresh */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="p-1 rounded hover:bg-[#2C2C2C] disabled:opacity-30 disabled:hover:bg-transparent text-gray-300"
            title="Back (Alt + Left Arrow)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleUp}
            disabled={!currentFolder}
            className="p-1 rounded hover:bg-[#2C2C2C] disabled:opacity-30 disabled:hover:bg-transparent text-gray-300"
            title="Up to parent folder (Alt + Up Arrow)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={loadContent}
            className="p-1 rounded hover:bg-[#2C2C2C] text-gray-300"
            title="Refresh (F5)"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin text-sky-400')} />
          </button>
        </div>

        {/* Address Path Bar (Windows Breadcrumbs) */}
        <div className="flex-1 flex items-center gap-1 px-3 py-1.5 bg-[#252525] border border-[#383838] hover:border-[#4D4D4D] rounded-md overflow-x-auto no-scrollbar font-sans text-xs">
          {/* Root Documents Vault */}
          <button
            onClick={() => navigateToFolder(null)}
            className={clsx(
              'flex items-center gap-1.5 px-2 py-0.5 rounded shrink-0 transition-colors',
              !currentFolder ? 'bg-[#333] text-white font-semibold' : 'text-gray-300 hover:text-white hover:bg-[#333]'
            )}
          >
            <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>Documents Vault</span>
          </button>

          {/* Sub-folder Breadcrumbs */}
          {breadcrumbs.map((crumb, idx) => {
            const isCurrent = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />
                <button
                  onClick={() => navigateToFolder(crumb)}
                  className={clsx(
                    'px-1.5 py-0.5 rounded shrink-0 transition-colors truncate max-w-[200px]',
                    isCurrent ? 'bg-[#333] text-white font-semibold' : 'text-gray-300 hover:text-white hover:bg-[#333]'
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

      {/* ======================================================== */}
      {/* 3. EXPLORER BODY: DETAILS TABLE OR GRID                  */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {totalItemsCount === 0 && !loading ? (
          /* Empty Folder State (Windows style) */
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <div className="p-4 rounded-full bg-[#2A2A2A] text-gray-400 mb-3">
              <FolderOpen className="w-10 h-10 stroke-1" />
            </div>
            <h4 className="text-sm font-medium text-gray-300">This folder is empty.</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Upload files or create sub-folders inside this directory.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setCreateFolderModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2C2C2C] hover:bg-[#383838] text-xs font-semibold text-gray-200 border border-gray-700 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                New folder
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload file
              </button>
            </div>
          </div>
        ) : viewMode === 'DETAILS' ? (
          /* ======================================================== */
          /* DETAILS VIEW (Exact Windows File Explorer Table)        */
          /* ======================================================== */
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#2F2F2F] text-gray-400 font-medium">
                <th
                  onClick={() => handleHeaderSort('NAME')}
                  className="py-2 px-2 hover:bg-[#2A2A2A] cursor-pointer rounded-tl transition-colors w-[42%]"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    {sortField === 'NAME' && (
                      <span className="text-sky-400 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('DATE')}
                  className="py-2 px-2 hover:bg-[#2A2A2A] cursor-pointer transition-colors w-[22%]"
                >
                  <div className="flex items-center gap-1">
                    <span>Date modified</span>
                    {sortField === 'DATE' && (
                      <span className="text-sky-400 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('TYPE')}
                  className="py-2 px-2 hover:bg-[#2A2A2A] cursor-pointer transition-colors w-[22%]"
                >
                  <div className="flex items-center gap-1">
                    <span>Type</span>
                    {sortField === 'TYPE' && (
                      <span className="text-sky-400 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('SIZE')}
                  className="py-2 px-2 hover:bg-[#2A2A2A] cursor-pointer transition-colors text-right w-[8%]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Size</span>
                    {sortField === 'SIZE' && (
                      <span className="text-sky-400 font-bold">{sortOrder === 'ASC' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th className="py-2 px-2 text-right w-[6%]"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#262626]">
              {/* 1. FOLDERS LIST (ALWAYS FIRST!) */}
              {sortedFolders.map((folder) => {
                const isSelected = selectedItemId === folder.id;
                return (
                  <tr
                    key={folder.id}
                    onClick={() => setSelectedItemId(folder.id)}
                    onDoubleClick={() => navigateToFolder(folder)}
                    className={clsx(
                      'group transition-colors cursor-pointer select-none',
                      isSelected ? 'bg-[#004C87]/40 text-white' : 'hover:bg-[#282828] text-gray-200'
                    )}
                  >
                    {/* Folder Name & Icon */}
                    <td className="py-1.5 px-2 flex items-center gap-2.5 truncate">
                      {/* Windows Yellow Folder Icon */}
                      <Folder
                        className="w-4 h-4 fill-[#F5BA31] text-[#F5BA31] shrink-0"
                        style={folder.color ? { fill: folder.color, color: folder.color } : {}}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToFolder(folder);
                        }}
                        className="truncate text-left font-medium hover:underline focus:outline-none"
                      >
                        {folder.name}
                      </button>
                    </td>

                    {/* Date Modified */}
                    <td className="py-1.5 px-2 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {formatWindowsDate(folder.updatedAt || folder.createdAt)}
                    </td>

                    {/* Type */}
                    <td className="py-1.5 px-2 text-gray-400 truncate">
                      File folder
                    </td>

                    {/* Size / Item Count */}
                    <td className="py-1.5 px-2 text-gray-500 font-mono text-[11px] text-right whitespace-nowrap">
                      {folder.itemCount ? `${folder.itemCount} items` : ''}
                    </td>

                    {/* Row Quick Action: Delete Folder */}
                    <td className="py-1.5 px-2 text-right">
                      <button
                        onClick={(e) => handleDeleteFolder(e, folder)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 rounded hover:bg-[#333] transition-all"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* 2. FILES LIST (AFTER FOLDERS) */}
              {sortedDocuments.map((doc) => {
                const isSelected = selectedItemId === doc.id;
                const fileTypeLabel = getWindowsFileType(doc.fileType, doc.originalFileName);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedItemId(doc.id)}
                    onDoubleClick={() => setPreviewDoc(doc)}
                    className={clsx(
                      'group transition-colors cursor-pointer select-none',
                      isSelected ? 'bg-[#004C87]/40 text-white' : 'hover:bg-[#282828] text-gray-200'
                    )}
                  >
                    {/* File Name & Icon */}
                    <td className="py-1.5 px-2 flex items-center gap-2.5 truncate">
                      {getWindowsFileIcon(doc.fileType, doc.originalFileName, 'w-4 h-4 shrink-0')}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc(doc);
                        }}
                        className="truncate text-left hover:underline focus:outline-none"
                        title={`${doc.name} (${doc.originalFileName})`}
                      >
                        {doc.originalFileName || doc.name}
                      </button>
                    </td>

                    {/* Date Modified */}
                    <td className="py-1.5 px-2 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {formatWindowsDate(doc.updatedAt || doc.createdAt)}
                    </td>

                    {/* Type */}
                    <td className="py-1.5 px-2 text-gray-400 truncate">
                      {fileTypeLabel}
                    </td>

                    {/* Size */}
                    <td className="py-1.5 px-2 text-gray-300 font-mono text-[11px] text-right whitespace-nowrap">
                      {formatFileSize(doc.fileSize)}
                    </td>

                    {/* Action Buttons Toolbar */}
                    <td className="py-1.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Preview */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc(doc);
                          }}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#333]"
                          title="Open / Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          className="p-1 text-gray-400 hover:text-emerald-400 rounded hover:bg-[#333]"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Star */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, doc)}
                          className="p-1 text-gray-400 hover:text-amber-400 rounded hover:bg-[#333]"
                          title="Star"
                        >
                          <Star className={clsx('w-3.5 h-3.5', (doc.isFavorite || doc.favorite) && 'fill-amber-400 text-amber-400')} />
                        </button>

                        {/* AI Chat */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChattingDoc(doc);
                          }}
                          className="p-1 text-gray-400 hover:text-teal-400 rounded hover:bg-[#333]"
                          title="Ask AI about this document"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDeleteDocument(e, doc)}
                          className="p-1 text-gray-400 hover:text-rose-400 rounded hover:bg-[#333]"
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
        ) : (
          /* ======================================================== */
          /* GRID VIEW (Large Icons Mode)                            */
          /* ======================================================== */
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pt-2">
            {/* Folders in Grid */}
            {sortedFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedItemId(folder.id)}
                onDoubleClick={() => navigateToFolder(folder)}
                className={clsx(
                  'group flex flex-col items-center p-3 rounded-lg border border-transparent hover:border-[#383838] hover:bg-[#252525] transition-all cursor-pointer text-center relative',
                  selectedItemId === folder.id && 'bg-[#004C87]/40 border-sky-500/50'
                )}
              >
                <Folder
                  className="w-12 h-12 fill-[#F5BA31] text-[#F5BA31] mb-2 group-hover:scale-105 transition-transform"
                  style={folder.color ? { fill: folder.color, color: folder.color } : {}}
                />
                <span className="text-xs font-medium text-gray-200 line-clamp-2 w-full break-words">
                  {folder.name}
                </span>
                <span className="text-[10px] text-gray-500 mt-1">
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
                  'group flex flex-col items-center p-3 rounded-lg border border-transparent hover:border-[#383838] hover:bg-[#252525] transition-all cursor-pointer text-center relative',
                  selectedItemId === doc.id && 'bg-[#004C87]/40 border-sky-500/50'
                )}
              >
                <div className="w-12 h-12 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  {getWindowsFileIcon(doc.fileType, doc.originalFileName, 'w-10 h-10')}
                </div>
                <span className="text-xs text-gray-200 line-clamp-2 w-full break-words">
                  {doc.originalFileName || doc.name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono mt-1">
                  {formatFileSize(doc.fileSize)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM STATUS BAR (Windows Explorer Style)            */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#1A1A1A] border-t border-[#292929] text-[11px] text-gray-400">
        <div>
          <span>
            {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} ({sortedFolders.length} folder{sortedFolders.length !== 1 ? 's' : ''}, {sortedDocuments.length} file{sortedDocuments.length !== 1 ? 's' : ''})
          </span>
          {selectedItemId && <span className="ml-3 text-sky-400">| 1 item selected</span>}
        </div>

        <div className="flex items-center gap-2">
          <span>Storage: PostgreSQL & Supabase Resilient Vault</span>
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
        type="DOCUMENT"
        onFolderCreated={() => loadContent()}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => loadContent()}
        categories={categories}
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
