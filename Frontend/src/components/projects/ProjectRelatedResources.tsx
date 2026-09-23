import React, { useState, useMemo } from 'react';
import {
  Globe,
  FileText,
  FolderArchive,
  HardDrive,
  Plus,
  Search,
  ExternalLink,
  Unlink,
  Link2
} from 'lucide-react';
import { BrandIcon } from '../drive/BrandIcons';
import { Project, Note, DocumentItem, Website, DriveLink, Task, ResourceType } from '../../types';
import { projectService } from '../../services/projectService';
import { formatFileSize } from '../../services/documentService';
import { useConfirm } from '../../contexts/ConfirmDialogContext';
import { clsx } from 'clsx';

export interface UnifiedResourceItem {
  id: string;
  type: 'GITHUB' | 'NOTE' | 'DOCUMENT' | 'WEBSITE' | 'DRIVE_LINK';
  title: string;
  subtitle?: string;
  url?: string;
  meta?: string;
  tasksLinkedCount: number;
  original?: any;
}

interface ProjectRelatedResourcesProps {
  project: Project;
  notes: Note[];
  documents: DocumentItem[];
  websites: Website[];
  driveLinks: DriveLink[];
  tasks?: Task[];
  onOpenNote: (note: Note) => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onAddResource: () => void;
  onRefresh: () => void;
}

export const ProjectRelatedResources: React.FC<ProjectRelatedResourcesProps> = ({
  project,
  notes = [],
  documents = [],
  websites = [],
  driveLinks = [],
  tasks = [],
  onOpenNote,
  onOpenDocument,
  onAddResource,
  onRefresh,
}) => {
  const confirm = useConfirm();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // Compute Task Resource References Map
  const resourceTaskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.resources) {
        t.resources.forEach((r) => {
          if (r.resourceId) {
            map.set(r.resourceId, (map.get(r.resourceId) || 0) + 1);
          }
        });
      }
    });
    return map;
  }, [tasks]);

  // Aggregate all project related resources into a unified list
  const unifiedResources: UnifiedResourceItem[] = useMemo(() => {
    const list: UnifiedResourceItem[] = [];

    // 1. GitHub Repository
    if (project.githubRepo) {
      list.push({
        id: `gh-${project.id}`,
        type: 'GITHUB',
        title: project.githubRepo,
        subtitle: 'Primary GitHub Repository',
        url: `https://github.com/${project.githubRepo}`,
        meta: 'Repository',
        tasksLinkedCount: 0,
      });
    }

    // 2. Websites / External Links
    websites.forEach((w) => {
      list.push({
        id: w.id,
        type: 'WEBSITE',
        title: w.name,
        subtitle: w.url,
        url: w.url,
        meta: 'Website / Tool',
        tasksLinkedCount: resourceTaskCountMap.get(w.id) || 0,
        original: w,
      });
    });

    // 3. Technical Notes
    notes.forEach((n) => {
      list.push({
        id: n.id,
        type: 'NOTE',
        title: n.title,
        subtitle: n.content ? `${n.content.slice(0, 90)}...` : 'Technical Markdown Note',
        meta: 'Markdown Note',
        tasksLinkedCount: resourceTaskCountMap.get(n.id) || 0,
        original: n,
      });
    });

    // 4. Documents & Specifications
    documents.forEach((d) => {
      list.push({
        id: d.id,
        type: 'DOCUMENT',
        title: d.name,
        subtitle: d.fileType ? `${d.fileType} • ${formatFileSize(d.fileSize)}` : formatFileSize(d.fileSize),
        meta: 'Specification Document',
        tasksLinkedCount: resourceTaskCountMap.get(d.id) || 0,
        original: d,
      });
    });

    // 5. Google Drive Links
    driveLinks.forEach((g) => {
      list.push({
        id: g.id,
        type: 'DRIVE_LINK',
        title: g.name,
        subtitle: g.url,
        url: g.url,
        meta: g.resourceType || 'Google Drive',
        tasksLinkedCount: resourceTaskCountMap.get(g.id) || 0,
        original: g,
      });
    });

    return list;
  }, [project, websites, notes, documents, driveLinks, resourceTaskCountMap]);

  // Filtered List
  const filteredResources = useMemo(() => {
    return unifiedResources.filter((item) => {
      const matchesFilter = filterType === 'ALL' || item.type === filterType;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.meta && item.meta.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [unifiedResources, filterType, searchQuery]);

  // Open resource handler
  const handleOpenResource = (item: UnifiedResourceItem) => {
    if (item.type === 'NOTE' && item.original) {
      onOpenNote(item.original);
    } else if (item.type === 'DOCUMENT' && item.original) {
      onOpenDocument(item.original);
    } else if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Unlink resource handler
  const handleUnlinkResource = async (item: UnifiedResourceItem) => {
    if (item.type === 'GITHUB') {
      const ok = await confirm({
        title: 'Disconnect GitHub',
        message: 'Disconnect GitHub repository from this project?',
        confirmText: 'Disconnect',
        variant: 'danger',
      });
      if (ok) {
        await projectService.updateProject(project.id, { githubRepo: undefined });
        onRefresh();
      }
      return;
    }

    const ok = await confirm({
      title: 'Unlink Resource',
      message: `Unlink "${item.title}" from this project?`,
      description: 'The original item will remain safely stored in your workspace library.',
      confirmText: 'Unlink',
      variant: 'warning',
    });
    if (!ok) return;

    setUnlinkingId(item.id);
    try {
      await projectService.unlinkResourceFromProject(project.id, item.type as ResourceType, item.id);
      onRefresh();
    } catch (err) {
      console.error('Failed to unlink resource:', err);
    } finally {
      setUnlinkingId(null);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'GITHUB':
        return <BrandIcon type="GITHUB" className="w-4 h-4 text-purple-400" />;
      case 'WEBSITE':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'NOTE':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'DOCUMENT':
        return <FolderArchive className="w-4 h-4 text-emerald-400" />;
      case 'DRIVE_LINK':
        return <HardDrive className="w-4 h-4 text-cyan-400" />;
      default:
        return <Link2 className="w-4 h-4 text-[#8A9890]" />;
    }
  };

  const getResourceTypeBadge = (type: string) => {
    switch (type) {
      case 'GITHUB':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">🐙 GitHub</span>;
      case 'WEBSITE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">🌐 Website</span>;
      case 'NOTE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">📝 Note</span>;
      case 'DOCUMENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">📄 Document</span>;
      case 'DRIVE_LINK':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">☁️ Google Drive</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Filtering Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
              Related Resources
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {unifiedResources.length}
              </span>
            </h3>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
              Everything required to complete tasks without leaving project context
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9890]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search related resources..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-purple-400"
            />
          </div>

          <button
            onClick={onAddResource}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Resource
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: `All (${unifiedResources.length})` },
          { id: 'WEBSITE', label: `🌐 Websites (${websites.length})` },
          { id: 'NOTE', label: `📝 Notes (${notes.length})` },
          { id: 'DOCUMENT', label: `📄 Documents (${documents.length})` },
          { id: 'DRIVE_LINK', label: `☁️ Google Drive (${driveLinks.length})` },
          { id: 'GITHUB', label: `🐙 GitHub (${project.githubRepo ? 1 : 0})` },
        ].map((chip) => {
          const isSel = filterType === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setFilterType(chip.id)}
              className={clsx(
                'px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0',
                isSel
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5] hover:border-purple-400'
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Resources Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
              No Related Resources Found
            </h4>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto mt-0.5">
              {searchQuery
                ? 'No resources match your search criteria.'
                : 'Link existing documentation, Swagger APIs, Figma boards, or Google Drive folders to this project.'}
            </p>
          </div>
          <button
            onClick={onAddResource}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Link First Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredResources.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400/60 dark:hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B]">
                      {getResourceIcon(item.type)}
                    </div>
                    {getResourceTypeBadge(item.type)}
                  </div>

                  {item.tasksLinkedCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Linked to {item.tasksLinkedCount} task{item.tasksLinkedCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF] group-hover:text-purple-400 transition-colors">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] line-clamp-2 mt-0.5 font-normal">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DCE9E1]/60 dark:border-[#20372B]/60 text-xs">
                <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                  {item.meta}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenResource(item)}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-600 dark:text-purple-400 hover:text-white font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Open Resource <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleUnlinkResource(item)}
                    disabled={unlinkingId === item.id}
                    className="p-1.5 rounded-xl hover:bg-rose-500/10 text-[#8A9890] hover:text-rose-500 transition-colors cursor-pointer"
                    title="Unlink resource from project"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
