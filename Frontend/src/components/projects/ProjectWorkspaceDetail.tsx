import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  CheckSquare,
  FileText,
  FolderArchive,
  Globe,
  HardDrive,
  Calendar,
  Zap,
  Target,
  Edit,
  Sparkles,
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';
import { Project, Task, Note, DocumentItem, Website, DriveLink, TaskGitCommit, Category } from '../../types';
import { projectService, ProjectWorkspacePayload } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { noteService } from '../../services/noteService';
import { documentService, formatFileSize } from '../../services/documentService';
import { websiteService } from '../../services/websiteService';
import { driveService } from '../../services/driveService';
import { categoryService } from '../../services/categoryService';
import { TaskModal } from '../tasks/TaskModal';
import { NoteModal } from '../notes/NoteModal';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { WebsiteModal } from '../websites/WebsiteModal';
import { DriveLinkModal } from '../drive/DriveLinkModal';
import { AiProjectPrdModal } from './AiProjectPrdModal';
import { ProjectCommandCenter } from './ProjectCommandCenter';
import { ProjectRelatedResources } from './ProjectRelatedResources';
import { AddProjectResourceModal } from './AddProjectResourceModal';
import { ProjectActivityTimeline } from './ProjectActivityTimeline';
import { ProjectRoadmap } from './ProjectRoadmap';
import { ProjectGitTraceability } from './ProjectGitTraceability';
import { ProjectAnalytics } from './ProjectAnalytics';
import { ProjectIssuesPanel } from './ProjectIssuesPanel';
import { ProjectKnowledgePanel } from './ProjectKnowledgePanel';
import { ProjectAiAssistantPanel } from './ProjectAiAssistantPanel';
import { calculateProjectHealth } from '../../utils/projectHealth';
import { BrandIcon } from '../drive/BrandIcons';
import { clsx } from 'clsx';
import { Link2 } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmDialogContext';

interface ProjectWorkspaceDetailProps {
  projectId: string;
  onBack: () => void;
  onEdit: (project: Project) => void;
}

export const ProjectWorkspaceDetail: React.FC<ProjectWorkspaceDetailProps> = ({
  projectId,
  onBack,
  onEdit,
}) => {
  const confirm = useConfirm();
  const [workspace, setWorkspace] = useState<ProjectWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESOURCES' | 'TASKS' | 'ACTIVITY' | 'GIT' | 'NOTES' | 'DOCS' | 'WEBSITES' | 'DRIVE' | 'ROADMAP' | 'ANALYTICS' | 'ISSUES' | 'KNOWLEDGE'>('OVERVIEW');
  const [gitCommits, setGitCommits] = useState<TaskGitCommit[]>([]);
  const [syncingGit, setSyncingGit] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | undefined>(undefined);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [selectedDriveLink, setSelectedDriveLink] = useState<DriveLink | undefined>(undefined);
  const [prdModalOpen, setPrdModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payload, commits, cats] = await Promise.all([
        projectService.getProjectWorkspace(projectId),
        projectService.getProjectGitActivity(projectId),
        categoryService.getCategories(),
      ]);
      setWorkspace(payload);
      setGitCommits(commits || []);
      setCategories(cats || []);
    } catch (err: any) {
      console.error('Failed to load project workspace:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load project workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [projectId]);

  const handleSyncGitHub = async () => {
    setSyncingGit(true);
    setSyncResult(null);
    try {
      const res = await projectService.syncProjectGitHub(projectId);
      setSyncResult(`Synced ${res.syncedCommits} commits! ${res.tasksUpdated > 0 ? `${res.tasksUpdated} tasks auto-completed!` : ''}`);
      await loadWorkspace();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Sync failed';
      setSyncResult(`Sync Error: ${errMsg}`);
    } finally {
      setSyncingGit(false);
    }
  };

  const handleSaveProjectTask = async (taskData: Partial<Task>, pendingResources?: any[]) => {
    try {
      let savedTask: Task;
      if (taskData.id) {
        savedTask = await taskService.updateTask(taskData.id, taskData);
      } else {
        savedTask = await taskService.createTask({ ...taskData, projectId });
      }

      if (pendingResources && pendingResources.length > 0) {
        for (const res of pendingResources) {
          let resId = res.resourceId;
          if (res.isQuickAdd) {
            if (res.resourceType === 'WEBSITE' && res.url) {
              const newWeb = await websiteService.createWebsite({ name: res.title, url: res.url, projectId });
              resId = newWeb.id;
            } else if (res.resourceType === 'NOTE') {
              const newNote = await noteService.createNote({ title: res.title, content: res.content || '', projectId });
              resId = newNote.id;
            } else if (res.resourceType === 'DRIVE_LINK' && res.url) {
              const newDrive = await driveService.createDriveLink({ name: res.title, url: res.url, projectId });
              resId = newDrive.id;
            } else if (res.resourceType === 'GITHUB') {
              if (res.url) {
                const newWeb = await websiteService.createWebsite({ name: res.title, url: res.url, tags: 'github', projectId });
                resId = newWeb.id;
              } else if (projectId) {
                resId = projectId;
              }
            }
          }
          if (resId) {
            await taskService.addResource(savedTask.id, res.resourceType, resId).catch(() => null);
          }
        }
      }

      setTaskModalOpen(false);
      setSelectedTask(undefined);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to save project task:', err);
    }
  };

  const handleOpenTaskResource = (r: import('../../types').TaskResource) => {
    if (r.resourceType === 'NOTE') {
      const n = (workspace?.notes || []).find((item) => item.id === r.resourceId);
      if (n) {
        setSelectedNote(n);
        setNoteModalOpen(true);
        return;
      }
    } else if (r.resourceType === 'DOCUMENT') {
      const d = (workspace?.documents || []).find((item) => item.id === r.resourceId);
      if (d) {
        handleOpenDocument(d);
        return;
      }
    } else if (r.url) {
      window.open(r.url, '_blank', 'noopener,noreferrer');
      return;
    } else if (r.resourceType === 'GITHUB') {
      if (project.githubRepo) {
        window.open(`https://github.com/${project.githubRepo}`, '_blank', 'noopener,noreferrer');
        return;
      }
    }
  };

  const handleDeleteProjectTask = async (taskId: string) => {
    const ok = await confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete Task',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await taskService.deleteTask(taskId);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleProjectTask = async (task: Task) => {
    try {
      const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await taskService.updateTaskStatus(task.id, nextStatus);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleSaveProjectNote = async (noteData: Partial<Note>) => {
    try {
      if (noteData.id) {
        await noteService.updateNote(noteData.id, noteData);
      } else {
        await noteService.createNote({ ...noteData, projectId });
      }
      setNoteModalOpen(false);
      setSelectedNote(undefined);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to save project note:', err);
    }
  };

  const handleDeleteProjectNote = async (noteId: string) => {
    const ok = await confirm({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      confirmText: 'Delete Note',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await noteService.deleteNote(noteId);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleDocumentUploaded = async () => {
    await loadWorkspace();
  };

  const handleOpenDocument = async (doc: DocumentItem) => {
    try {
      const url = await documentService.getDownloadUrl(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to open document:', err);
    }
  };

  const handleDeleteProjectDocument = async (docId: string) => {
    const ok = await confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document?',
      confirmText: 'Delete Document',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await documentService.deleteDocument(docId);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleSaveProjectWebsite = async (websiteData: Partial<Website>) => {
    try {
      if (websiteData.id) {
        await websiteService.updateWebsite(websiteData.id, websiteData);
      } else {
        await websiteService.createWebsite({ ...websiteData, projectId });
      }
      setWebsiteModalOpen(false);
      setSelectedWebsite(undefined);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to save project website:', err);
    }
  };

  const handleDeleteProjectWebsite = async (websiteId: string) => {
    const ok = await confirm({
      title: 'Delete Bookmark',
      message: 'Are you sure you want to delete this website bookmark?',
      confirmText: 'Delete Bookmark',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await websiteService.deleteWebsite(websiteId);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to delete website:', err);
    }
  };

  const handleSaveProjectDriveLink = async (driveData: Partial<DriveLink>) => {
    try {
      if (driveData.id) {
        await driveService.updateDriveLink(driveData.id, driveData);
      } else {
        await driveService.createDriveLink({ ...driveData, projectId });
      }
      setDriveModalOpen(false);
      setSelectedDriveLink(undefined);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to save project drive link:', err);
    }
  };

  const handleDeleteProjectDriveLink = async (linkId: string) => {
    const ok = await confirm({
      title: 'Delete Resource',
      message: 'Are you sure you want to delete this drive resource?',
      confirmText: 'Delete Resource',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await driveService.deleteDriveLink(linkId);
      await loadWorkspace();
    } catch (err) {
      console.error('Failed to delete drive link:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-[#66736B] dark:text-[#9BB5A5] text-sm space-y-3 animate-in fade-in">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-semibold">Loading unified project workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#0E1C15] border border-rose-500/30 text-center space-y-4 max-w-md mx-auto my-12 shadow-xl animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">Workspace Error</h3>
          <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1">{error || 'Could not load project workspace.'}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects List
        </button>
      </div>
    );
  }

  const { project, tasks, notes, documents, websites, driveLinks, milestones = [], issues = [], activity = [] } = workspace;
  const health = calculateProjectHealth(project, tasks, activity);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] hover:text-white text-xs font-semibold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects List
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrdModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/15 to-[#5FBF8F]/15 hover:from-purple-600/25 hover:to-[#5FBF8F]/25 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI PRD & Roadmap
          </button>

          <button
            onClick={() => onEdit(project)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Project
          </button>
        </div>
      </div>

      {/* Project Overview Hero Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {project.projectKey || 'PROJECT'}
              </span>
              <h2 className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{project.name}</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md border border-[#DCE9E1] dark:border-[#20372B] bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]">
                Status: {project.status}
              </span>
              <span
                className={clsx(
                  "px-2.5 py-0.5 text-[10px] font-bold rounded-md border flex items-center gap-1.5 transition-colors",
                  health.colorBg,
                  health.colorBorder,
                  health.colorText
                )}
              >
                <span>{health.emoji}</span>
                <span>Health: {health.label}</span>
              </span>
            </div>
            {project.description && (
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-2xl">{project.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-[#8A9890] dark:text-[#6F8A7A] pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                {project.startDate || 'Start date not set'} → {project.endDate || 'Ongoing'}
              </span>
              {project.githubRepo && (
                <span className="flex items-center gap-1.5 font-mono text-purple-400">
                  <GitBranch className="w-3.5 h-3.5" />
                  {project.githubRepo}
                </span>
              )}
            </div>
          </div>

          {/* Progress Gauge */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] min-w-[140px] text-center">
            <span className="text-2xl font-extrabold text-purple-400">{project.progress || 0}%</span>
            <span className="text-[10px] uppercase font-bold text-[#8A9890] dark:text-[#6F8A7A]">Progress</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#F3FBF7] dark:bg-[#13261C] rounded-2xl border border-[#DCE9E1] dark:border-[#20372B]">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Zap },
          { id: 'RESOURCES', label: `Related Resources (${notes.length + documents.length + websites.length + driveLinks.length + (project.githubRepo ? 1 : 0)})`, icon: Link2 },
          { id: 'TASKS', label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { id: 'ROADMAP', label: `Roadmap (${milestones.length})`, icon: Target },
          { id: 'ANALYTICS', label: 'Analytics', icon: Sparkles },
          { id: 'ISSUES', label: `Issues (${(workspace?.issues || []).length})`, icon: GitPullRequest },
          { id: 'KNOWLEDGE', label: `Knowledge (${notes.length})`, icon: Briefcase },
          { id: 'ACTIVITY', label: `Activity (${activity.length})`, icon: Clock },
          { id: 'GIT', label: `Git (${gitCommits.length})`, icon: GitBranch },
          { id: 'NOTES', label: `Notes (${notes.length})`, icon: FileText },
          { id: 'DOCS', label: `Documents (${documents.length})`, icon: FolderArchive },
          { id: 'WEBSITES', label: `Websites (${websites.length})`, icon: Globe },
          { id: 'DRIVE', label: `Drive (${driveLinks.length})`, icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C]'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab View Content */}
      <div className="space-y-4">
        {activeTab === 'OVERVIEW' && (
          <ProjectCommandCenter
            project={project}
            tasks={tasks}
            milestones={milestones}
            notes={notes}
            documents={documents}
            websites={websites}
            driveLinks={driveLinks}
            activity={activity}
            onOpenTask={(task) => {
              setSelectedTask(task);
              setTaskModalOpen(true);
            }}
            onAddTask={() => {
              setSelectedTask(undefined);
              setTaskModalOpen(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onOpenNote={(note) => {
              setSelectedNote(note);
              setNoteModalOpen(true);
            }}
            onOpenDocument={handleOpenDocument}
            onAddResource={() => setAddResourceModalOpen(true)}
          />
        )}

        {activeTab === 'RESOURCES' && (
          <ProjectRelatedResources
            project={project}
            notes={notes}
            documents={documents}
            websites={websites}
            driveLinks={driveLinks}
            tasks={tasks}
            onOpenNote={(note) => {
              setSelectedNote(note);
              setNoteModalOpen(true);
            }}
            onOpenDocument={handleOpenDocument}
            onAddResource={() => setAddResourceModalOpen(true)}
            onRefresh={loadWorkspace}
          />
        )}

        {activeTab === 'TASKS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Project Tasks & Epics ({tasks.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedTask(undefined);
                  setTaskModalOpen(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Task to Project
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
                <CheckSquare className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A]">No tasks linked to this project yet.</p>
                <button
                  onClick={() => {
                    setSelectedTask(undefined);
                    setTaskModalOpen(true);
                  }}
                  className="text-xs font-semibold text-purple-400 hover:underline cursor-pointer"
                >
                  Create first task for this project
                </button>
              </div>
            ) : (
              tasks.map((t) => {
                const isCompleted = t.status === 'COMPLETED';
                return (
                  <div
                    key={t.id}
                    className={clsx(
                      "p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all",
                      isCompleted
                        ? "bg-[#E8F7EF]/60 dark:bg-[#13261C]/60 border-purple-500/30 opacity-75"
                        : "bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 shadow-2xs"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleProjectTask(t)}
                        className={clsx(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0",
                          isCompleted
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-500"
                        )}
                      >
                        {isCompleted && <CheckSquare className="w-3 h-3 fill-current" />}
                      </button>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {t.taskKey && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono font-bold text-[11px]">
                              {t.taskKey}
                            </span>
                          )}
                          <span className={clsx("font-semibold truncate", isCompleted ? "line-through text-[#8A9890] dark:text-[#6F8A7A]" : "text-[#17211B] dark:text-[#EAF7EF]")}>
                            {t.title}
                          </span>
                        </div>

                        {/* Task Attached Resources */}
                        {t.resources && t.resources.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {t.resources.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTaskResource(r);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 text-[#17211B] dark:text-[#EAF7EF] transition-all cursor-pointer shadow-2xs"
                                title={`Open ${r.resourceType}: ${r.title || r.url}`}
                              >
                                {r.resourceType === 'WEBSITE' && '🌐'}
                                {r.resourceType === 'NOTE' && '📝'}
                                {r.resourceType === 'DOCUMENT' && '📄'}
                                {r.resourceType === 'DRIVE_LINK' && '☁️'}
                                {r.resourceType === 'GITHUB' && '🐙'}
                                <span className="truncate max-w-[120px]">{r.title || r.url || r.resourceType}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.dueDate && (
                        <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] mr-1">
                          Due {t.dueDate}
                        </span>
                      )}
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded uppercase font-bold text-[10px]",
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-[#E8F7EF] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]"
                        )}
                      >
                        {t.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTask(t);
                          setTaskModalOpen(true);
                        }}
                        className="p-1 rounded-lg hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-all cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProjectTask(t.id)}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'ACTIVITY' && (
          <ProjectActivityTimeline
            projectId={projectId}
            activities={activity}
            isLoading={loading}
            onRefresh={loadWorkspace}
          />
        )}

        {activeTab === 'GIT' && (
          <div className="space-y-4">
            {/* Git Controls Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 rounded-xl bg-[#5FBF8F]/10 text-[#5FBF8F]">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                    GitHub Automation & Activity
                    {project.githubRepo && (
                      <span className="text-xs font-mono text-[#5FBF8F] font-normal">
                        ({project.githubRepo})
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                    Jira-style commit linking & auto-closing when PRs merge or commits include fix keywords
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                  className="px-3 py-1.5 rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] text-xs font-medium transition-all"
                >
                  {showWebhookGuide ? 'Hide Webhook Guide' : 'Webhook Guide'}
                </button>
                <button
                  onClick={handleSyncGitHub}
                  disabled={syncingGit || !project.githubRepo}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5FBF8F] to-[#237A57] text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={clsx("w-3.5 h-3.5", syncingGit && "animate-spin")} />
                  {syncingGit ? 'Syncing...' : 'Sync GitHub Commits'}
                </button>
              </div>
            </div>

            {/* Sync Feedback Alert */}
            {syncResult && (
              <div className={clsx(
                "p-3 rounded-xl border text-xs font-medium flex items-center justify-between",
                syncResult.includes('Error')
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              )}>
                <span>{syncResult}</span>
                <button onClick={() => setSyncResult(null)} className="text-[#66736B] dark:text-[#9BB5A5] hover:text-white">✕</button>
              </div>
            )}

            {/* Webhook Guide Drawer */}
            {showWebhookGuide && (
              <div className="p-4 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#5FBF8F] font-bold">
                  <Sparkles className="w-4 h-4" />
                  How to setup Real-time GitHub Webhook
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[#17211B] dark:text-[#EAF7EF] text-[11px] leading-relaxed">
                  <li>Go to your repository on GitHub ➔ <strong>Settings</strong> ➔ <strong>Webhooks</strong> ➔ <strong>Add webhook</strong>.</li>
                  <li>
                    Set <strong>Payload URL</strong> to: <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0E1C15] text-[#5FBF8F] font-mono">http://localhost:8080/api/webhooks/github</code> (or your public ngrok URL).
                  </li>
                  <li>Set <strong>Content type</strong> to <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0E1C15] font-mono">application/json</code>.</li>
                  <li>Select events: <strong>Pushes</strong> and <strong>Pull requests</strong>.</li>
                  <li>In your git commit messages, include your Task Key: e.g. <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0E1C15] text-[#5FBF8F] font-mono">git commit -m "{project.projectKey || 'AIU'}-1: Fix navbar bug"</code>.</li>
                  <li>To <strong>auto-close</strong> a task on commit or PR merge: write <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0E1C15] text-emerald-400 font-mono">Fixes {project.projectKey || 'AIU'}-1</code> or merge a PR referencing the task key!</li>
                </ol>
              </div>
            )}

            {/* Git Traceability View */}
            {gitCommits.length > 0 && (
              <ProjectGitTraceability
                tasks={tasks}
                commits={gitCommits}
              />
            )}

            {/* Commits & Activity List */}
            <div className="space-y-2">
              {gitCommits.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
                  <GitCommit className="w-8 h-8 text-[#8A9890] dark:text-[#6F8A7A] mx-auto" />
                  <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">No Git Activity Recorded Yet</h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-md mx-auto">
                    {project.githubRepo
                      ? 'Click "Sync GitHub Commits" to import recent commits, or trigger a GitHub push containing a Task Key in the commit message.'
                      : 'Add a GitHub repository name in Edit Project Settings to enable Git sync.'}
                  </p>
                </div>
              ) : (
                gitCommits.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] mt-0.5">
                        {c.eventType === 'PULL_REQUEST_MERGED' ? (
                          <GitPullRequest className="w-4 h-4 text-purple-400" />
                        ) : (
                          <GitCommit className="w-4 h-4 text-[#5FBF8F]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {c.taskKey && (
                            <span className="px-2 py-0.5 rounded bg-[#5FBF8F]/15 text-[#5FBF8F] border border-[#5FBF8F]/30 font-mono font-bold text-[10px]">
                              {c.taskKey}
                            </span>
                          )}
                          <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{c.message}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#66736B] dark:text-[#9BB5A5]">
                          <span>{c.authorName || 'Developer'}</span>
                          <span>•</span>
                          <span className="font-mono">{new Date(c.timestamp).toLocaleString()}</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#E8F7EF] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] uppercase text-[9px] font-bold">
                            {c.eventType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {c.commitUrl && (
                        <a
                          href={c.commitUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] hover:text-white font-mono text-[11px] transition-all"
                        >
                          <span>{c.commitHash}</span>
                          <ExternalLink className="w-3 h-3 text-[#66736B] dark:text-[#9BB5A5]" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'ROADMAP' && (
          <div className="p-1">
            <ProjectRoadmap
              projectId={projectId}
              milestones={milestones}
              tasks={tasks}
              onUpdated={loadWorkspace}
            />
          </div>
        )}

        {activeTab === 'ANALYTICS' && (
          <div className="p-1">
            <ProjectAnalytics
              tasks={tasks}
              projectName={project.name}
            />
          </div>
        )}

        {activeTab === 'ISSUES' && (
          <div className="p-1">
            <ProjectIssuesPanel
              projectId={projectId}
              issues={workspace?.issues || []}
              onUpdated={loadWorkspace}
            />
          </div>
        )}

        {activeTab === 'KNOWLEDGE' && (
          <div className="p-1">
            <ProjectKnowledgePanel
              notes={notes}
              projectId={projectId}
              onOpenNote={(noteId) => {
                const found = notes.find(n => n.id === noteId);
                if (found) { setSelectedNote(found); setNoteModalOpen(true); }
              }}
              onCreateNote={() => { setSelectedNote(undefined); setNoteModalOpen(true); }}
            />
          </div>
        )}

        {activeTab === 'NOTES' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Knowledge Notes ({notes.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedNote(undefined);
                  setNoteModalOpen(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Note to Project
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
                <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">No notes linked to this project yet</h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1">
                    Document system architecture, requirements, or meeting logs directly attached to {project.name}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedNote(undefined);
                    setNoteModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create First Note
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-amber-400/50 transition-all space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] line-clamp-1">
                          {n.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {n.categoryName && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold whitespace-nowrap">
                            {n.categoryName}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedNote(n);
                            setNoteModalOpen(true);
                          }}
                          className="p-1 rounded-lg hover:bg-amber-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-amber-500 transition-all cursor-pointer"
                          title="Edit Note"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProjectNote(n.id)}
                          className="p-1 rounded-lg hover:bg-rose-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] line-clamp-3 leading-relaxed">
                      {n.content}
                    </p>
                    {n.tags && n.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {n.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] text-[10px] font-mono border border-[#DCE9E1] dark:border-[#20372B]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'DOCS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Storage Documents ({documents.length})
                </h3>
              </div>
              <button
                onClick={() => setDocModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Upload Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
                <FolderArchive className="w-8 h-8 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">No storage documents attached yet</h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1">
                    Upload PDFs, diagrams, requirement specs, or code archives directly into Supabase Storage linked to {project.name}.
                  </p>
                </div>
                <button
                  onClick={() => setDocModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload First Document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                        <FolderArchive className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] truncate">
                          {d.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#66736B] dark:text-[#9BB5A5] mt-0.5">
                          <span className="font-mono">{formatFileSize(d.fileSize || 0)}</span>
                          {d.fileType && (
                            <>
                              <span>•</span>
                              <span className="uppercase text-[10px] font-semibold">{d.fileType}</span>
                            </>
                          )}
                          {d.categoryName && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-500 font-medium">{d.categoryName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleOpenDocument(d)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] hover:bg-emerald-500 hover:text-white border border-[#DCE9E1] dark:border-[#20372B] text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] transition-all cursor-pointer"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteProjectDocument(d.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'WEBSITES' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Bookmarked Websites ({websites.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedWebsite(undefined);
                  setWebsiteModalOpen(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Website Bookmark
              </button>
            </div>

            {websites.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
                <Globe className="w-8 h-8 text-sky-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">No websites bookmarked for this project yet</h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1">
                    Keep Figma files, GitHub repos, documentation links, and API references pinned to {project.name}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedWebsite(undefined);
                    setWebsiteModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Bookmark First Website
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {websites.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-sky-500/50 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {w.faviconUrl ? (
                        <img
                          src={w.faviconUrl}
                          alt=""
                          className="w-8 h-8 rounded-xl object-contain bg-[#F3FBF7] dark:bg-[#13261C] p-1 border border-[#DCE9E1] dark:border-[#20372B] flex-shrink-0"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 flex-shrink-0">
                          <Globe className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] truncate">
                          {w.name}
                        </h4>
                        <p className="text-[11px] text-sky-600 dark:text-sky-400 font-mono truncate">
                          {w.url}
                        </p>
                        {w.description && (
                          <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] line-clamp-1 mt-0.5">
                            {w.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] hover:bg-sky-500 hover:text-white border border-[#DCE9E1] dark:border-[#20372B] text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] transition-all"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => {
                          setSelectedWebsite(w);
                          setWebsiteModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl hover:bg-sky-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-sky-400 transition-all cursor-pointer"
                        title="Edit Bookmark"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProjectWebsite(w.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete Bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'DRIVE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-500" />
                <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Google Drive & Cloud Resources ({driveLinks.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedDriveLink(undefined);
                  setDriveModalOpen(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Drive Link
              </button>
            </div>

            {driveLinks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
                <HardDrive className="w-8 h-8 text-teal-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">No Google Drive repositories attached yet</h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1">
                    Connect shared Google Sheets, Docs, Slides, and Drive folders directly to {project.name}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDriveLink(undefined);
                    setDriveModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-semibold hover:bg-teal-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Link First Drive File
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {driveLinks.map((dl) => (
                  <div
                    key={dl.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-teal-500/50 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500 flex-shrink-0">
                        <BrandIcon platform={dl.resourceType || 'GOOGLE_DRIVE'} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] truncate">
                          {dl.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#66736B] dark:text-[#9BB5A5] mt-0.5">
                          <span className="font-mono uppercase text-[10px] font-bold text-teal-600 dark:text-teal-400">
                            {dl.resourceType || 'GOOGLE_DRIVE'}
                          </span>
                          {dl.categoryName && (
                            <>
                              <span>•</span>
                              <span>{dl.categoryName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={dl.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] hover:bg-teal-500 hover:text-white border border-[#DCE9E1] dark:border-[#20372B] text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] transition-all"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => {
                          setSelectedDriveLink(dl);
                          setDriveModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl hover:bg-teal-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-teal-400 transition-all cursor-pointer"
                        title="Edit Drive Link"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProjectDriveLink(dl.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete Drive Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ROADMAP' && (
          <ProjectRoadmap
            projectId={projectId}
            milestones={milestones}
            tasks={tasks}
            onUpdated={loadWorkspace}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <ProjectAnalytics
            tasks={tasks}
            projectName={project.name}
          />
        )}

        {activeTab === 'ISSUES' && (
          <ProjectIssuesPanel
            projectId={projectId}
            issues={issues}
            onUpdated={loadWorkspace}
          />
        )}

        {activeTab === 'KNOWLEDGE' && (
          <ProjectKnowledgePanel
            notes={notes}
            projectId={projectId}
            onOpenNote={(noteId) => {
              const n = notes.find((x) => x.id === noteId);
              if (n) {
                setSelectedNote(n);
                setNoteModalOpen(true);
              }
            }}
            onCreateNote={(tags) => {
              setSelectedNote(
                tags
                  ? ({ title: '', content: '', tags: tags.split(',').map((t) => t.trim()) } as any)
                  : undefined
              );
              setNoteModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setSelectedTask(undefined);
        }}
        onSave={handleSaveProjectTask}
        categories={categories}
        initialTask={selectedTask}
        defaultProjectId={projectId}
        projectTasks={tasks}
      />


      {/* Note Creation / Edit Modal */}
      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setSelectedNote(undefined);
        }}
        onSave={handleSaveProjectNote}
        categories={categories}
        initialNote={selectedNote}
        defaultProjectId={projectId}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        onUploadSuccess={handleDocumentUploaded}
        categories={categories}
        defaultProjectId={projectId}
      />

      {/* Website Bookmark Creation / Edit Modal */}
      <WebsiteModal
        isOpen={websiteModalOpen}
        onClose={() => {
          setWebsiteModalOpen(false);
          setSelectedWebsite(undefined);
        }}
        onSave={handleSaveProjectWebsite}
        categories={categories}
        initialWebsite={selectedWebsite}
        defaultProjectId={projectId}
      />

      {/* Drive Link Creation / Edit Modal */}
      <DriveLinkModal
        isOpen={driveModalOpen}
        onClose={() => {
          setDriveModalOpen(false);
          setSelectedDriveLink(undefined);
        }}
        onSave={handleSaveProjectDriveLink}
        categories={categories}
        initialLink={selectedDriveLink}
        defaultProjectId={projectId}
      />

      {/* Add Project Resource Modal */}
      <AddProjectResourceModal
        isOpen={addResourceModalOpen}
        onClose={() => setAddResourceModalOpen(false)}
        project={project}
        onResourceLinked={loadWorkspace}
      />

      {/* AI Project Assistant — floating, available on all tabs */}
      <ProjectAiAssistantPanel
        projectId={projectId}
        projectName={project.name}
      />

      {/* AI PRD & Roadmap Modal */}
      <AiProjectPrdModal
        isOpen={prdModalOpen}
        onClose={() => setPrdModalOpen(false)}
        project={project}
        onMilestonesApplied={loadWorkspace}
      />
    </div>
  );
};

