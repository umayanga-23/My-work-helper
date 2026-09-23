import React, { useState, useEffect } from 'react';
import {
  X,
  Link2,
  Globe,
  FileText,
  FolderArchive,
  HardDrive,
  Plus,
  Search,
  Check
} from 'lucide-react';
import { BrandIcon } from '../drive/BrandIcons';
import { ResourceType, Note, DocumentItem, Website, DriveLink, Project } from '../../types';
import { noteService } from '../../services/noteService';
import { documentService } from '../../services/documentService';
import { websiteService } from '../../services/websiteService';
import { driveService } from '../../services/driveService';
import { projectService } from '../../services/projectService';
import { clsx } from 'clsx';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <BrandIcon type="GITHUB" className={className} />
);

interface AddProjectResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onResourceLinked: () => void;
}

export const AddProjectResourceModal: React.FC<AddProjectResourceModalProps> = ({
  isOpen,
  onClose,
  project,
  onResourceLinked,
}) => {
  const [activeTab, setActiveTab] = useState<'LINK_EXISTING' | 'CREATE_NEW' | 'GITHUB'>('LINK_EXISTING');
  const [selectedType, setSelectedType] = useState<ResourceType>('WEBSITE');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workspace items for linking
  const [workspaceNotes, setWorkspaceNotes] = useState<Note[]>([]);
  const [workspaceDocs, setWorkspaceDocs] = useState<DocumentItem[]>([]);
  const [workspaceWebsites, setWorkspaceWebsites] = useState<Website[]>([]);
  const [workspaceDrives, setWorkspaceDrives] = useState<DriveLink[]>([]);

  // Form fields for Quick Create
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newContent, setNewContent] = useState('');
  const [githubRepoInput, setGithubRepoInput] = useState(project.githubRepo || '');

  useEffect(() => {
    if (isOpen) {
      loadWorkspaceLibrary();
      setGithubRepoInput(project.githubRepo || '');
      setError(null);
    }
  }, [isOpen, project.id]);

  const loadWorkspaceLibrary = async () => {
    setLoading(true);
    try {
      const [notes, docs, webs, drives] = await Promise.all([
        noteService.getNotes().catch(() => []),
        documentService.getDocuments().catch(() => []),
        websiteService.getWebsites().catch(() => []),
        driveService.getDriveLinks().catch(() => []),
      ]);
      setWorkspaceNotes(notes);
      setWorkspaceDocs(docs);
      setWorkspaceWebsites(webs);
      setWorkspaceDrives(drives);
    } catch (err) {
      console.error('Failed to load workspace resources:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Link existing resource to project
  const handleLinkExisting = async (resourceId: string, type: ResourceType) => {
    setSubmitting(true);
    setError(null);
    try {
      await projectService.linkResourceToProject(project.id, type, resourceId);
      onResourceLinked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to link resource.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create new resource directly associated with this project
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Title/Name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let formattedUrl = newUrl.trim();
      if (formattedUrl && !formattedUrl.startsWith('http')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      if (selectedType === 'WEBSITE') {
        if (!formattedUrl) {
          setError('Valid URL is required for Website bookmark.');
          setSubmitting(false);
          return;
        }
        await websiteService.createWebsite({
          name: newTitle.trim(),
          url: formattedUrl,
          projectId: project.id,
        });
      } else if (selectedType === 'NOTE') {
        await noteService.createNote({
          title: newTitle.trim(),
          content: newContent.trim(),
          projectId: project.id,
        });
      } else if (selectedType === 'DRIVE_LINK') {
        if (!formattedUrl) {
          setError('Google Drive URL is required.');
          setSubmitting(false);
          return;
        }
        await driveService.createDriveLink({
          name: newTitle.trim(),
          url: formattedUrl,
          projectId: project.id,
        });
      } else if (selectedType === 'GITHUB') {
        // Save as GitHub repository on project or as website
        if (formattedUrl) {
          await websiteService.createWebsite({
            name: newTitle.trim(),
            url: formattedUrl,
            tags: 'github',
            projectId: project.id,
          });
        }
      }

      // Reset
      setNewTitle('');
      setNewUrl('');
      setNewContent('');
      onResourceLinked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create resource.');
    } finally {
      setSubmitting(false);
    }
  };

  // Save GitHub Repository
  const handleSaveGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let repo = githubRepoInput.trim();
      if (repo.startsWith('https://github.com/')) {
        repo = repo.replace('https://github.com/', '');
      }
      await projectService.updateProject(project.id, { githubRepo: repo });
      onResourceLinked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to connect GitHub repository.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items for linking (exclude items already linked to this project)
  const getFilterableItems = () => {
    const q = searchQuery.toLowerCase();
    switch (selectedType) {
      case 'WEBSITE':
        return workspaceWebsites
          .filter((w) => w.projectId !== project.id)
          .filter((w) => w.name.toLowerCase().includes(q) || w.url.toLowerCase().includes(q))
          .map((w) => ({ id: w.id, title: w.name, subtitle: w.url, type: 'WEBSITE' as ResourceType }));
      case 'NOTE':
        return workspaceNotes
          .filter((n) => n.projectId !== project.id)
          .filter((n) => n.title.toLowerCase().includes(q))
          .map((n) => ({ id: n.id, title: n.title, subtitle: 'Technical Markdown Note', type: 'NOTE' as ResourceType }));
      case 'DOCUMENT':
        return workspaceDocs
          .filter((d) => d.projectId !== project.id)
          .filter((d) => d.name.toLowerCase().includes(q))
          .map((d) => ({ id: d.id, title: d.name, subtitle: d.fileType || 'Document file', type: 'DOCUMENT' as ResourceType }));
      case 'DRIVE_LINK':
        return workspaceDrives
          .filter((d) => d.projectId !== project.id)
          .filter((d) => d.name.toLowerCase().includes(q) || d.url.toLowerCase().includes(q))
          .map((d) => ({ id: d.id, title: d.name, subtitle: d.url, type: 'DRIVE_LINK' as ResourceType }));
      default:
        return [];
    }
  };

  const filterableItems = getFilterableItems();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Add Project Related Resource
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Link technical references, documents, and tools to <strong className="text-purple-400">{project.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-[#F3FBF7] dark:bg-[#13261C] border-b border-[#DCE9E1] dark:border-[#20372B]">
          <button
            onClick={() => setActiveTab('LINK_EXISTING')}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'LINK_EXISTING'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#66736B] dark:text-[#9BB5A5] hover:bg-white/50 dark:hover:bg-white/5'
            )}
          >
            Link Existing Workspace Item
          </button>
          <button
            onClick={() => setActiveTab('CREATE_NEW')}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'CREATE_NEW'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#66736B] dark:text-[#9BB5A5] hover:bg-white/50 dark:hover:bg-white/5'
            )}
          >
            + Create New Resource
          </button>
          <button
            onClick={() => setActiveTab('GITHUB')}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'GITHUB'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#66736B] dark:text-[#9BB5A5] hover:bg-white/50 dark:hover:bg-white/5'
            )}
          >
            🐙 Connect GitHub
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
            {error}
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: LINK EXISTING WORKSPACE ITEM */}
          {activeTab === 'LINK_EXISTING' && (
            <div className="space-y-4">
              {/* Resource Type Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { type: 'WEBSITE' as ResourceType, label: 'Websites', icon: Globe },
                  { type: 'NOTE' as ResourceType, label: 'Notes', icon: FileText },
                  { type: 'DOCUMENT' as ResourceType, label: 'Documents', icon: FolderArchive },
                  { type: 'DRIVE_LINK' as ResourceType, label: 'Drive Links', icon: HardDrive },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = selectedType === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => setSelectedType(item.type)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0',
                        isSel
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                          : 'bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5]'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9890]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search available workspace ${selectedType.toLowerCase()}s...`}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-purple-400"
                />
              </div>

              {/* Results List */}
              {loading ? (
                <div className="py-8 text-center text-xs text-[#8A9890]">
                  Loading workspace items...
                </div>
              ) : filterableItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8A9890] space-y-2">
                  <p>No available {selectedType.toLowerCase()}s found to link.</p>
                  <button
                    onClick={() => setActiveTab('CREATE_NEW')}
                    className="text-purple-400 hover:underline font-semibold text-xs"
                  >
                    + Create a new one directly for this project
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filterableItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 flex items-center justify-between gap-3 text-xs transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">{item.title}</h5>
                        {item.subtitle && (
                          <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate font-mono mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleLinkExisting(item.id, item.type)}
                        disabled={submitting}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW RESOURCE */}
          {activeTab === 'CREATE_NEW' && (
            <form onSubmit={handleCreateNew} className="space-y-4">
              {/* Type selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">Resource Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'WEBSITE' as ResourceType, label: 'Website / Tool', icon: Globe },
                    { type: 'NOTE' as ResourceType, label: 'Note / Doc', icon: FileText },
                    { type: 'DRIVE_LINK' as ResourceType, label: 'Drive Link', icon: HardDrive },
                    { type: 'GITHUB' as ResourceType, label: 'GitHub Link', icon: GithubIcon },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSel = selectedType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSelectedType(item.type)}
                        className={clsx(
                          'p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer',
                          isSel
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40 shadow-2xs'
                            : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5]'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resource Name / Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Resource Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    selectedType === 'WEBSITE'
                      ? 'e.g. Figma UI Kit, Swagger API, Supabase Docs'
                      : selectedType === 'NOTE'
                      ? 'e.g. Architecture Overview, Auth Strategy'
                      : selectedType === 'DRIVE_LINK'
                      ? 'e.g. Client Asset Folder, Wireframe PSDs'
                      : 'e.g. Repo Link, Pull Request #42'
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-purple-400"
                />
              </div>

              {/* URL input for website/drive/github */}
              {selectedType !== 'NOTE' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                    URL / Web Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    required
                    className="w-full px-3 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] font-mono outline-none focus:border-purple-400"
                  />
                </div>
              )}

              {/* Content textarea for Note */}
              {selectedType === 'NOTE' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                    Note Content (Markdown)
                  </label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write initial technical specifications, architecture decisions, or notes..."
                    className="w-full px-3 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-purple-400"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {submitting ? 'Creating...' : 'Create & Link Resource'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CONNECT GITHUB REPOSITORY */}
          {activeTab === 'GITHUB' && (
            <form onSubmit={handleSaveGithub} className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  <GithubIcon className="w-4 h-4 text-purple-400" />
                  GitHub Repository Integration
                </div>
                <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] leading-relaxed">
                  Connecting a GitHub repository allows instant repository navigation, Jira-style task commit syncing, and automatic PR closing from the project command center.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Repository Path or URL
                </label>
                <input
                  type="text"
                  value={githubRepoInput}
                  onChange={(e) => setGithubRepoInput(e.target.value)}
                  placeholder="e.g. facebook/react or https://github.com/myorg/myrepo"
                  className="w-full px-3 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] font-mono outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {submitting ? 'Connecting...' : 'Save GitHub Repository'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
