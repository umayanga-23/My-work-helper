import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  ChevronRight,
  Home,
  GraduationCap,
  Briefcase,
  FolderCode,
  FolderArchive,
  FolderGit2,
  FileText,
  Trash2,
  CornerLeftUp,
  FolderOpen
} from 'lucide-react';
import type { FolderItem } from '../../types';
import { CreateFolderModal } from './CreateFolderModal';
import { folderService } from '../../services/folderService';
import { useConfirm } from '../../contexts/ConfirmDialogContext';

interface FolderExplorerProps {
  type?: 'DOCUMENT' | 'NOTE' | 'DRIVE' | 'GENERAL';
  currentFolder: FolderItem | null;
  breadcrumbs: FolderItem[];
  folders: FolderItem[];
  onSelectFolder: (folder: FolderItem | null) => void;
  onRefresh: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Folder,
  GraduationCap,
  Briefcase,
  FolderCode,
  FolderArchive,
  FolderGit2,
  FileText,
};

export const FolderExplorer: React.FC<FolderExplorerProps> = ({
  type = 'DOCUMENT',
  currentFolder,
  breadcrumbs,
  folders,
  onSelectFolder,
  onRefresh,
}) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteFolder = async (e: React.MouseEvent, folder: FolderItem) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folder.name}" and all sub-folders inside it?`,
      confirmText: 'Delete Folder',
      variant: 'danger',
    });

    if (ok) {
      try {
        await folderService.deleteFolder(folder.id);
        onRefresh();
      } catch (err) {
        console.error('Failed to delete folder:', err);
      }
    }
  };

  const handleGoUp = () => {
    if (breadcrumbs.length > 1) {
      // Pick the second-to-last breadcrumb
      onSelectFolder(breadcrumbs[breadcrumbs.length - 2]);
    } else {
      // Go to root
      onSelectFolder(null);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Breadcrumb Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/70 dark:bg-[#0c1813]/70 backdrop-blur-md border border-emerald-500/15 dark:border-emerald-500/10 rounded-2xl shadow-sm">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm font-medium">
          {/* Root Link */}
          <button
            onClick={() => onSelectFolder(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${
              !currentFolder
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Vault Root</span>
          </button>

          {/* Breadcrumb Chain */}
          {breadcrumbs.map((b, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={b.id}>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 shrink-0" />
                <button
                  onClick={() => onSelectFolder(b)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all truncate max-w-[140px] sm:max-w-[200px] ${
                    isLast
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5'
                  }`}
                  title={b.name}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span className="truncate">{b.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Buttons: Go Up & New Folder */}
        <div className="flex items-center gap-2">
          {currentFolder && (
            <button
              onClick={handleGoUp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title="Go to parent directory"
            >
              <CornerLeftUp className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{currentFolder ? 'New Sub-folder' : 'New Folder'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Folders Grid */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {folders.map((folder) => {
            const IconComponent = ICON_MAP[folder.icon || 'Folder'] || Folder;
            const folderColor = folder.color || '#10B981';

            return (
              <div
                key={folder.id}
                onClick={() => onSelectFolder(folder)}
                className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c1813]/80 border border-gray-200/80 dark:border-emerald-500/15 hover:border-emerald-500/40 dark:hover:border-emerald-500/35 hover:shadow-md hover:shadow-emerald-500/5 transition-all cursor-pointer backdrop-blur-sm"
              >
                {/* Top: Icon + Delete button */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className="p-2.5 rounded-xl shadow-xs transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: `${folderColor}15`,
                      color: folderColor,
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <button
                    onClick={(e) => handleDeleteFolder(e, folder)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Folder Name */}
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1" title={folder.name}>
                    {folder.name}
                  </h4>

                  {/* Metadata Count Badges */}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {folder.subFolderCount && folder.subFolderCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {folder.subFolderCount} folder{folder.subFolderCount > 1 ? 's' : ''}
                      </span>
                    ) : null}
                    <span>
                      {folder.itemCount || 0} item{(folder.itemCount || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parentId={currentFolder?.id}
        parentName={currentFolder?.name}
        type={type}
        onFolderCreated={() => {
          onRefresh();
        }}
      />
    </div>
  );
};
