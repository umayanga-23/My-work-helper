import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckSquare,
  Clock,
  Calendar,
  Briefcase,
  Edit,
  Trash2,
  CalendarPlus,
  Plus,
  AlertTriangle,
  GitCommit,
  CheckCircle2,
  Circle,
  Sun,
  Globe,
  FileText,
  FolderArchive,
  HardDrive,
  Lightbulb,
  ExternalLink,
  Copy,
  Check,
  Search,
  Link as LinkIcon,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { Task, TaskPriority, TaskResource, ResourceType, Website, Note, DocumentItem, DriveLink, Idea, Project, ActivityLog } from '../../types';
import { taskService } from '../../services/taskService';
import { websiteService } from '../../services/websiteService';
import { noteService } from '../../services/noteService';
import { documentService } from '../../services/documentService';
import { driveService } from '../../services/driveService';
import { ideaService } from '../../services/ideaService';
import { projectService } from '../../services/projectService';
import { clsx } from 'clsx';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: Task | null;
  allTasks?: Task[];
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onExtendDeadline: (task: Task, daysToAdd: number, hoursToAdd?: number) => void;
  onAddSubtask: (parentTaskId: string, title: string) => void;
  onToggleSubtask: (parentTaskId: string, subtask: Task) => void;
  onDelete: (id: string) => void;
  onUpdateTask?: (updatedTask: Task) => void;
  onSelectTask?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  task,
  onClose,
  onEdit,
  onToggleStatus,
  onExtendDeadline,
  onAddSubtask,
  onToggleSubtask,
  onDelete,
  onUpdateTask,
  allTasks,
  onSelectTask,
}) => {
  const navigate = useNavigate();
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [showExtendMenu, setShowExtendMenu] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(task);

  // Dependency Management State
  const [isAddDepOpen, setIsAddDepOpen] = useState(false);
  const [depRelationType, setDepRelationType] = useState<'BLOCKED_BY' | 'BLOCKS'>('BLOCKED_BY');
  const [selectedDepTaskId, setSelectedDepTaskId] = useState('');
  const [depError, setDepError] = useState<string | null>(null);
  const [depSaving, setDepSaving] = useState(false);

  // Resource Hub State
  const [resourceFilter, setResourceFilter] = useState<'ALL' | ResourceType>('ALL');
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachTab, setAttachTab] = useState<'EXISTING' | 'QUICK_ADD'>('EXISTING');
  const [attachType, setAttachType] = useState<ResourceType>('WEBSITE');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Loaded Workspace Available Resources
  const [availableWebsites, setAvailableWebsites] = useState<Website[]>([]);
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);
  const [availableDriveLinks, setAvailableDriveLinks] = useState<DriveLink[]>([]);
  const [availableIdeas, setAvailableIdeas] = useState<Idea[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  // Quick Add Form State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);

  // Progressive disclosure sections
  const [openSections, setOpenSections] = useState({
    description: true,
    dependencies: true,
    resources: true,
    github: true,
    subtasks: true,
    activity: true,
  });

  const toggleSection = (sec: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Activity log state
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  const loadActivity = async (taskId?: string) => {
    const idToFetch = taskId || currentTask?.id;
    if (!idToFetch) return;
    setLoadingActivity(true);
    try {
      const data = await taskService.getTaskActivity(idToFetch);
      setActivities(data || []);
    } catch (err) {
      setActivities([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Fetch workspace resources & activity when modal is opened
  useEffect(() => {
    if (isOpen && currentTask?.id) {
      loadWorkspaceResources();
      loadActivity(currentTask.id);
    }
  }, [isOpen, currentTask?.id]);

  const loadWorkspaceResources = async () => {
    try {
      const [webs, notes, docs, drives, ideas, projs] = await Promise.all([
        websiteService.getWebsites().catch(() => []),
        noteService.getNotes().catch(() => []),
        documentService.getDocuments().catch(() => []),
        driveService.getDriveLinks().catch(() => []),
        ideaService.getIdeas().catch(() => []),
        projectService.getProjects().catch(() => []),
      ]);
      setAvailableWebsites(webs || []);
      setAvailableNotes(notes || []);
      setAvailableDocuments(docs || []);
      setAvailableDriveLinks(drives || []);
      setAvailableIdeas(ideas || []);
      setAvailableProjects(projs || []);
    } catch (err) {
      console.error('Error loading workspace resources:', err);
    }
  };

  if (!isOpen || !currentTask) return null;

  const isCompleted = currentTask.status === 'COMPLETED';
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  const isOverdue =
    !isCompleted &&
    currentTask.dueDate &&
    (currentTask.dueDate < todayStr ||
      (currentTask.dueDate === todayStr &&
        currentTask.dueTime &&
        currentTask.dueTime < `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`));

  const priorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/40';
      case 'LOW':
        return 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border-[#5FBF8F]/40';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/40';
    }
  };

  const handleCreateSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskInput.trim()) return;
    onAddSubtask(currentTask.id, newSubtaskInput.trim());
    setNewSubtaskInput('');
  };

  // Attach an existing resource from workspace
  const handleAttachExisting = async (type: ResourceType, resourceId: string) => {
    try {
      const added = await taskService.addResource(currentTask.id, type, resourceId);
      const updatedResources = [...(currentTask.resources || []), added];
      const updated = { ...currentTask, resources: updatedResources };
      setCurrentTask(updated);
      if (onUpdateTask) onUpdateTask(updated);
    } catch (err) {
      console.error('Failed to link resource:', err);
    }
  };

  // Remove / Unlink a resource
  const handleRemoveResource = async (resourceLinkId: string) => {
    try {
      await taskService.removeResource(currentTask.id, resourceLinkId);
      const updatedResources = (currentTask.resources || []).filter((r) => r.id !== resourceLinkId);
      const updated = { ...currentTask, resources: updatedResources };
      setCurrentTask(updated);
      if (onUpdateTask) onUpdateTask(updated);
    } catch (err) {
      console.error('Failed to unlink resource:', err);
    }
  };

  // Quick Create & Link Resource
  const handleQuickCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setQuickSaving(true);
    try {
      let createdResourceId: string | null = null;
      if (attachType === 'WEBSITE') {
        const fullUrl = quickUrl.trim().startsWith('http') ? quickUrl.trim() : `https://${quickUrl.trim()}`;
        const created = await websiteService.createWebsite({
          name: quickTitle.trim(),
          url: fullUrl || 'https://google.com',
          description: `Linked from Task: ${currentTask.title}`,
        });
        createdResourceId = created.id;
        setAvailableWebsites((prev) => [created, ...prev]);
      } else if (attachType === 'NOTE') {
        const created = await noteService.createNote({
          title: quickTitle.trim(),
          content: quickContent.trim() || `Notes for task: ${currentTask.title}`,
        });
        createdResourceId = created.id;
        setAvailableNotes((prev) => [created, ...prev]);
      } else if (attachType === 'DRIVE_LINK') {
        const fullUrl = quickUrl.trim().startsWith('http') ? quickUrl.trim() : `https://${quickUrl.trim()}`;
        const created = await driveService.createDriveLink({
          name: quickTitle.trim(),
          url: fullUrl || 'https://drive.google.com',
          description: `Linked from Task: ${currentTask.title}`,
        });
        createdResourceId = created.id;
        setAvailableDriveLinks((prev) => [created, ...prev]);
      } else if (attachType === 'IDEA') {
        const created = await ideaService.createIdea({
          title: quickTitle.trim(),
          description: quickContent.trim() || `Brainstorm idea for task: ${currentTask.title}`,
        });
        createdResourceId = created.id;
        setAvailableIdeas((prev) => [created, ...prev]);
      } else if (attachType === 'PROJECT') {
        const created = await projectService.createProject({
          name: quickTitle.trim(),
          description: quickContent.trim() || `Project created for task: ${currentTask.title}`,
        });
        createdResourceId = created.id;
        setAvailableProjects((prev) => [created, ...prev]);
      } else if (attachType === 'GITHUB') {
        const fullUrl = quickUrl.trim().startsWith('http') ? quickUrl.trim() : `https://${quickUrl.trim()}`;
        const created = await websiteService.createWebsite({
          name: quickTitle.trim(),
          url: fullUrl || 'https://github.com',
          description: `GitHub repository linked to task: ${currentTask.title}`,
        });
        createdResourceId = created.id;
        setAvailableWebsites((prev) => [created, ...prev]);
      }

      if (createdResourceId) {
        await handleAttachExisting(attachType, createdResourceId);
        setQuickTitle('');
        setQuickUrl('');
        setQuickContent('');
        setIsAttachModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to quick create and link resource:', err);
    } finally {
      setQuickSaving(false);
    }
  };

  const subtasksList = currentTask.subtasks || [];
  const completedSubtasksCount = subtasksList.filter((s) => s.status === 'COMPLETED').length;
  const taskResources = currentTask.resources || [];

  // Filter linked resources by category
  const filteredTaskResources = taskResources.filter((r) => {
    if (resourceFilter === 'ALL') return true;
    return r.resourceType === resourceFilter;
  });

  const websiteCount = taskResources.filter((r) => r.resourceType === 'WEBSITE').length;
  const notesCount = taskResources.filter((r) => r.resourceType === 'NOTE').length;
  const docsCount = taskResources.filter((r) => r.resourceType === 'DOCUMENT').length;
  const driveCount = taskResources.filter((r) => r.resourceType === 'DRIVE_LINK').length;
  const githubCount = taskResources.filter((r) => r.resourceType === 'GITHUB').length;

  const isResourceMissing = (res: TaskResource): boolean => {
    return !res.title || res.title.includes('[Resource unavailable or removed]');
  };

  const getResourceConfig = (resourceType: ResourceType) => {
    switch (resourceType) {
      case 'WEBSITE':
        return {
          emoji: '🌐',
          label: 'Website',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          borderHover: 'hover:border-emerald-500',
        };
      case 'NOTE':
        return {
          emoji: '📝',
          label: 'Note',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          borderHover: 'hover:border-amber-500',
        };
      case 'DOCUMENT':
        return {
          emoji: '📄',
          label: 'Document',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          borderHover: 'hover:border-blue-500',
        };
      case 'DRIVE_LINK':
        return {
          emoji: '☁️',
          label: 'Drive',
          badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
          borderHover: 'hover:border-cyan-500',
        };
      case 'GITHUB':
        return {
          emoji: '🐙',
          label: 'GitHub',
          badgeClass: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
          borderHover: 'hover:border-gray-500',
        };
      case 'PROJECT':
        return {
          emoji: '💼',
          label: 'Project',
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
          borderHover: 'hover:border-purple-500',
        };
      case 'IDEA':
        return {
          emoji: '💡',
          label: 'Idea',
          badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
          borderHover: 'hover:border-yellow-500',
        };
      default:
        return {
          emoji: '📎',
          label: 'Resource',
          badgeClass: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
          borderHover: 'hover:border-gray-500',
        };
    }
  };

  const handleOpenResource = (res: TaskResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isResourceMissing(res)) return;

    if (res.resourceType === 'PROJECT') {
      onClose();
      navigate(`/projects?id=${res.resourceId}`);
    } else if (res.resourceType === 'NOTE') {
      onClose();
      navigate(`/notes?id=${res.resourceId}`);
    } else if (res.resourceType === 'DOCUMENT') {
      onClose();
      navigate(`/documents?id=${res.resourceId}`);
    } else if (res.url) {
      const safeUrl = res.url.startsWith('http://') || res.url.startsWith('https://')
        ? res.url
        : `https://${res.url}`;
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } else if (res.resourceType === 'GITHUB') {
      window.open('https://github.com', '_blank', 'noopener,noreferrer');
    }
  };

  const isResourceLinked = (type: ResourceType, id: string) => {
    return taskResources.some((r) => r.resourceType === type && r.resourceId === id);
  };

  const formatTaskTimeSlot = (dueTime?: string, estimatedDuration?: number): string | null => {
    if (!dueTime) return null;
    const cleanTime = dueTime.slice(0, 5);
    if (!estimatedDuration || estimatedDuration <= 0) {
      return cleanTime;
    }
    const parts = cleanTime.split(':');
    if (parts.length !== 2) return cleanTime;
    const startH = parseInt(parts[0], 10);
    const startM = parseInt(parts[1], 10);
    if (isNaN(startH) || isNaN(startM)) return cleanTime;

    const totalMinutes = startH * 60 + startM + estimatedDuration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endClean = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    return `${cleanTime} — ${endClean}`;
  };

  // Derived Dependency Status & Collections
  const blockedByList = currentTask.blockedBy || [];
  const blocksList = currentTask.blocks || [];
  const hasPrerequisites = blockedByList.length > 0;
  // A task is blocked if ANY prerequisite in blockedBy is not completed
  const isDerivedBlocked = hasPrerequisites && blockedByList.some((dep) => dep.status !== 'COMPLETED');
  const isDerivedReady = hasPrerequisites && !isDerivedBlocked;

  // Candidates for adding new dependency
  const availableDependencyCandidates = (allTasks || []).filter((t) => {
    if (t.id === currentTask.id) return false;
    if (depRelationType === 'BLOCKED_BY') {
      return !blockedByList.some((b) => b.taskId === t.id);
    } else {
      return !blocksList.some((b) => b.taskId === t.id);
    }
  });

  const handleLinkDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepTaskId) return;
    if (selectedDepTaskId === currentTask.id) {
      setDepError('A task cannot depend on itself.');
      return;
    }
    setDepSaving(true);
    setDepError(null);
    try {
      if (depRelationType === 'BLOCKED_BY') {
        await taskService.addDependency(currentTask.id, selectedDepTaskId);
      } else {
        await taskService.addDependency(selectedDepTaskId, currentTask.id);
      }
      const refreshed = await taskService.getTaskById(currentTask.id);
      setCurrentTask(refreshed);
      if (onUpdateTask) onUpdateTask(refreshed);
      setIsAddDepOpen(false);
      setSelectedDepTaskId('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add dependency';
      setDepError(msg);
    } finally {
      setDepSaving(false);
    }
  };

  const handleRemoveBlockedBy = async (dependsOnId: string) => {
    try {
      await taskService.removeDependency(currentTask.id, dependsOnId);
      const refreshed = await taskService.getTaskById(currentTask.id);
      setCurrentTask(refreshed);
      if (onUpdateTask) onUpdateTask(refreshed);
    } catch (err) {
      console.error('Failed to remove dependency:', err);
    }
  };

  const handleRemoveBlocks = async (blockedTaskId: string) => {
    try {
      await taskService.removeDependency(blockedTaskId, currentTask.id);
      const refreshed = await taskService.getTaskById(currentTask.id);
      setCurrentTask(refreshed);
      if (onUpdateTask) onUpdateTask(refreshed);
    } catch (err) {
      console.error('Failed to remove dependency:', err);
    }
  };

  const handleStartTask = async () => {
    if (!currentTask) return;
    try {
      const updated = await taskService.updateTaskStatus(currentTask.id, 'IN_PROGRESS');
      setCurrentTask(updated);
      if (onUpdateTask) onUpdateTask(updated);
      loadActivity(currentTask.id);
    } catch (err) {
      console.error('Failed to start task:', err);
    }
  };

  const handleRescheduleToday = async () => {
    if (!currentTask) return;
    try {
      const updated = await taskService.rescheduleToToday(currentTask.id);
      setCurrentTask(updated);
      if (onUpdateTask) onUpdateTask(updated);
      loadActivity(currentTask.id);
    } catch (err) {
      console.error('Failed to reschedule to today:', err);
    }
  };

  const handleSubtaskDoToday = async (subId: string) => {
    if (!currentTask) return;
    try {
      await taskService.rescheduleToToday(subId);
      if (currentTask.subtasks) {
        const updatedSubtasks = currentTask.subtasks.map((s) =>
          s.id === subId ? { ...s, dueDate: todayStr } : s
        );
        const updatedTask = { ...currentTask, subtasks: updatedSubtasks };
        setCurrentTask(updatedTask);
        if (onUpdateTask) onUpdateTask(updatedTask);
      }
    } catch (err) {
      console.error('Failed to reschedule subtask to today:', err);
    }
  };

  interface TaskHistoryEvent {
    id: string;
    actionType: 'CREATED' | 'STARTED' | 'PRIORITY_CHANGED' | 'DUE_DATE_CHANGED' | 'DUE_TIME_CHANGED' | 'RESCHEDULED' | 'COMPLETED' | 'REOPENED' | 'OTHER';
    actionLabel: string;
    diffOrDetail?: string;
    timestamp: string;
  }

  const formatHistoryGroupDate = (isoString: string): string => {
    const d = new Date(isoString);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const day = d.getDate();

    if (d.getFullYear() === now.getFullYear()) {
      return `${month} ${day}`;
    }
    return `${month} ${day}, ${d.getFullYear()}`;
  };

  const getFactualActivityEvents = (): TaskHistoryEvent[] => {
    if (!currentTask || !activities || activities.length === 0) return [];

    const events: TaskHistoryEvent[] = [];

    // Strictly parse actual recorded events — never invent fake history
    activities.forEach((log) => {
      let actionType: TaskHistoryEvent['actionType'] = 'OTHER';
      let actionLabel = log.action || 'Activity recorded';
      let diffOrDetail: string | undefined = undefined;

      if (typeof log.metadata === 'string') {
        try {
          const parsed = JSON.parse(log.metadata);
          diffOrDetail = parsed.description || undefined;
        } catch {
          diffOrDetail = log.metadata;
        }
      } else if (log.metadata && typeof log.metadata === 'object') {
        diffOrDetail = (log.metadata as any).description;
      }

      const actionLower = (log.action || '').toLowerCase();

      if (actionLower.includes('created')) {
        actionType = 'CREATED';
        actionLabel = 'Task created';
      } else if (actionLower.includes('start')) {
        actionType = 'STARTED';
        actionLabel = 'Started';
      } else if (actionLower.includes('priority')) {
        actionType = 'PRIORITY_CHANGED';
        actionLabel = 'Priority changed';
      } else if (actionLower.includes('due time') || actionLower.includes('time changed')) {
        actionType = 'DUE_TIME_CHANGED';
        actionLabel = 'Due time changed';
      } else if (actionLower.includes('due date') || actionLower.includes('date changed')) {
        actionType = 'DUE_DATE_CHANGED';
        actionLabel = 'Due date changed';
      } else if (actionLower.includes('reschedule')) {
        actionType = 'RESCHEDULED';
        actionLabel = 'Rescheduled';
      } else if (actionLower.includes('reopen')) {
        actionType = 'REOPENED';
        actionLabel = 'Reopened';
      } else if (actionLower.includes('complete')) {
        actionType = 'COMPLETED';
        actionLabel = 'Completed';
      }

      events.push({
        id: log.id,
        actionType,
        actionLabel,
        diffOrDetail,
        timestamp: log.createdAt,
      });
    });

    // Sort newest first
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const groupedHistory = React.useMemo(() => {
    const evts = getFactualActivityEvents();
    const groups: { dateLabel: string; items: TaskHistoryEvent[] }[] = [];
    const map = new Map<string, TaskHistoryEvent[]>();

    evts.forEach((evt) => {
      const label = formatHistoryGroupDate(evt.timestamp);
      if (!map.has(label)) {
        const list: TaskHistoryEvent[] = [];
        map.set(label, list);
        groups.push({ dateLabel: label, items: list });
      }
      map.get(label)!.push(evt);
    });

    return groups;
  }, [activities, currentTask]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between shrink-0 bg-[#F3FBF7]/60 dark:bg-[#13261C]/40">
          <div className="flex items-center gap-2.5 flex-wrap">
            {currentTask.taskKey && (
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                {currentTask.taskKey}
              </span>
            )}
            <span
              className={clsx(
                'px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider',
                priorityBadgeClass(currentTask.priority)
              )}
            >
              {currentTask.priority} Priority
            </span>
            {currentTask.gitCommits && currentTask.gitCommits.length > 0 && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border border-[#DCE9E1] dark:border-[#20372B] flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-[#5FBF8F]" />
                {currentTask.gitCommits.length} {currentTask.gitCommits.length === 1 ? 'commit' : 'commits'}
              </span>
            )}
            {isOverdue && (
              <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-rose-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE
              </span>
            )}
            {isDerivedBlocked && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Blocked
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onEdit(currentTask);
                onClose();
              }}
              className="p-2 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-white dark:hover:bg-[#0E1C15] rounded-xl border border-transparent hover:border-[#DCE9E1] dark:hover:border-[#20372B] transition-all cursor-pointer"
              title="Edit Task"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDelete(currentTask.id);
                onClose();
              }}
              className="p-2 text-[#8A9890] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-white dark:hover:bg-[#0E1C15] rounded-xl border border-transparent hover:border-[#DCE9E1] dark:hover:border-[#20372B] transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body — Developer Workbench */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto">
          {/* Main Title & Checkbox */}
          <div className="flex items-start gap-3.5">
            <button
              onClick={() => onToggleStatus(currentTask)}
              className={clsx(
                'mt-1 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs',
                isCompleted
                  ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                  : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] bg-white dark:bg-[#0E1C15]'
              )}
              title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
            >
              {isCompleted ? <CheckSquare className="w-4 h-4 fill-current" /> : null}
            </button>
            <div className="flex-1 min-w-0">
              <h2
                className={clsx(
                  'text-lg sm:text-xl font-extrabold leading-snug tracking-tight',
                  isCompleted
                    ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]'
                    : 'text-[#17211B] dark:text-[#EAF7EF]'
                )}
              >
                {currentTask.title}
              </h2>
            </div>
          </div>

          {/* TASK Core Details: Status, Priority, Due, Project */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/50 border border-[#DCE9E1] dark:border-[#20372B]">
            {/* Status */}
            <div>
              <span className="text-[10px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider block mb-1">
                Status
              </span>
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border',
                  currentTask.status === 'COMPLETED'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : currentTask.status === 'IN_PROGRESS'
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                    : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
                )}
              >
                {currentTask.status === 'COMPLETED'
                  ? 'Completed'
                  : currentTask.status === 'IN_PROGRESS'
                  ? 'In Progress'
                  : 'To Do'}
              </span>
            </div>

            {/* Priority */}
            <div>
              <span className="text-[10px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider block mb-1">
                Priority
              </span>
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border uppercase',
                  priorityBadgeClass(currentTask.priority)
                )}
              >
                {currentTask.priority}
              </span>
            </div>

            {/* Due Date & Time */}
            <div>
              <span className="text-[10px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider block mb-1">
                Due
              </span>
              <span
                className={clsx(
                  'text-xs font-semibold flex items-center gap-1 truncate',
                  isOverdue ? 'text-rose-500 font-bold' : 'text-[#17211B] dark:text-[#EAF7EF]'
                )}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {currentTask.dueDate === todayStr ? 'Today' : currentTask.dueDate || 'Flexible'}{' '}
                  {currentTask.dueTime ? `(${currentTask.dueTime.slice(0, 5)})` : ''}
                </span>
              </span>
            </div>

            {/* Project */}
            <div>
              <span className="text-[10px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider block mb-1">
                Project
              </span>
              {currentTask.projectId ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/projects?id=${currentTask.projectId}`);
                  }}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 truncate cursor-pointer text-left group"
                  title="Open Project Workspace"
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                  <span className="truncate">{currentTask.projectName || 'DocuSphere'}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70 group-hover:opacity-100" />
                </button>
              ) : (
                <span className="text-xs text-[#8A9890] dark:text-[#6F8A7A] flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>Standalone</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions Developer Toolbar */}
          <div className="flex items-center gap-2 flex-wrap py-2.5 px-3 rounded-2xl bg-[#F8FCFA] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B]">
            {/* 1. Complete */}
            <button
              type="button"
              onClick={() => onToggleStatus(currentTask)}
              className={clsx(
                'px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer',
                isCompleted
                  ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/30'
                  : 'bg-[#5FBF8F] hover:bg-[#237A57] text-white shadow-[#5FBF8F]/20'
              )}
              title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Undo Complete' : 'Complete'}</span>
            </button>

            {/* 2. Start */}
            {!isCompleted && currentTask.status !== 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={handleStartTask}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Start task (Set to In Progress)"
              >
                <Circle className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>
            )}

            {/* 3. Reschedule Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExtendMenu(!showExtendMenu)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#E8F7EF] border border-[#DCE9E1] dark:border-[#20372B] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Reschedule task deadline"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Reschedule</span>
                <ChevronDown className="w-3 h-3 text-[#8A9890]" />
              </button>

              {showExtendMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExtendMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        handleRescheduleToday();
                        setShowExtendMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Do Today ({todayStr})
                    </button>
                    <div className="h-px bg-[#DCE9E1] dark:bg-[#20372B] my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onExtendDeadline(currentTask, 0, 1);
                        setShowExtendMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      +1 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExtendDeadline(currentTask, 1);
                        setShowExtendMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-blue-500" />
                      +1 Day (Tomorrow)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExtendDeadline(currentTask, 3);
                        setShowExtendMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExtendDeadline(currentTask, 7);
                        setShowExtendMenu(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                      +1 Week
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 4. Edit */}
            <button
              type="button"
              onClick={() => {
                onEdit(currentTask);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] border border-[#DCE9E1] dark:border-[#20372B] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Edit Task Details"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* 5. Add Resource */}
            <button
              type="button"
              onClick={() => setIsAttachModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#E8F7EF] border border-[#DCE9E1] dark:border-[#20372B] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Attach notes, docs, websites, drive, GitHub links"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>

            {/* 6. Open Project */}
            {currentTask.projectId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/projects?id=${currentTask.projectId}`);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-600 hover:text-white border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                title="Open Project Workspace"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Open Project</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 📝 1. DESCRIPTION SECTION (Progressive Disclosure) */}
          {/* ========================================================================= */}
          <div className="space-y-2 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
            <div
              onClick={() => toggleSection('description')}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <h3 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider flex items-center gap-2">
                <span>📝</span>
                <span>Description</span>
              </h3>
              <div className="p-1 text-[#8A9890] group-hover:text-[#17211B] dark:group-hover:text-[#EAF7EF] transition-colors">
                {openSections.description ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {openSections.description && (
              <div className="pt-1 animate-in fade-in duration-150">
                {currentTask.description ? (
                  <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5] leading-relaxed whitespace-pre-line bg-[#F3FBF7]/50 dark:bg-[#13261C]/30 p-3.5 rounded-2xl border border-[#DCE9E1]/70 dark:border-[#20372B]">
                    {currentTask.description}
                  </p>
                ) : (
                  <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic py-1">
                    No additional description provided. Click "Edit" to add context.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 🔗 2. DEPENDENCIES SECTION (Progressive Disclosure) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
            <div
              onClick={() => toggleSection('dependencies')}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔗</span>
                <h3 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider">
                  Dependencies
                </h3>
                {(blockedByList.length > 0 || blocksList.length > 0) && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                    {blockedByList.length + blocksList.length}
                  </span>
                )}
                {isDerivedBlocked ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Blocked
                  </span>
                ) : isDerivedReady ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddDepOpen(!isAddDepOpen);
                    setDepError(null);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {isAddDepOpen ? 'Close' : 'Add'}
                </button>
                <div className="p-1 text-[#8A9890] group-hover:text-[#17211B] dark:group-hover:text-[#EAF7EF] transition-colors">
                  {openSections.dependencies ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {openSections.dependencies && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                {/* Add Dependency Panel */}
                {isAddDepOpen && (
                  <form onSubmit={handleLinkDependency} className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/50 border border-[#DCE9E1] dark:border-[#20372B] space-y-3 animate-in fade-in">
                    <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                      Link Task Dependency
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#66736B] dark:text-[#9BB5A5] mb-1">
                          Relationship Type
                        </label>
                        <select
                          value={depRelationType}
                          onChange={(e) => setDepRelationType(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-xs text-[#17211B] dark:text-[#EAF7EF] outline-none focus:border-[#5FBF8F] cursor-pointer"
                        >
                          <option value="BLOCKED_BY">🔒 Blocked by (This task waits for...)</option>
                          <option value="BLOCKS">🚧 Blocks (This task blocks...)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#66736B] dark:text-[#9BB5A5] mb-1">
                          Target Task
                        </label>
                        <select
                          required
                          value={selectedDepTaskId}
                          onChange={(e) => setSelectedDepTaskId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-xs text-[#17211B] dark:text-[#EAF7EF] outline-none focus:border-[#5FBF8F] cursor-pointer"
                        >
                          <option value="">Select a task...</option>
                          {availableDependencyCandidates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.taskKey ? `[${t.taskKey}] ` : ''}{t.title} ({t.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {depError && (
                      <p className="text-xs text-rose-500 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {depError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddDepOpen(false)}
                        className="px-3 py-1 text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={depSaving || !selectedDepTaskId}
                        className="px-4 py-1.5 text-xs font-bold bg-[#5FBF8F] hover:bg-[#237A57] text-[#17211B] hover:text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {depSaving ? 'Linking...' : 'Save Dependency'}
                      </button>
                    </div>
                  </form>
                )}

                {/* 🔒 BLOCKED BY Subsection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-1">
                      <span>🔒</span>
                      <span>BLOCKED BY</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]">
                        {blockedByList.length}
                      </span>
                    </span>
                  </div>

                  {blockedByList.length === 0 ? (
                    <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic py-0.5">
                      No prerequisite tasks. This task is not blocked.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {blockedByList.map((dep) => {
                        const isDone = dep.status === 'COMPLETED';
                        return (
                          <div
                            key={dep.taskId}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] flex items-center justify-between gap-3 text-xs transition-all shadow-2xs group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#5FBF8F] shrink-0" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              {dep.taskKey && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F3FBF7] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30 shrink-0">
                                  {dep.taskKey}
                                </span>
                              )}
                              <span
                                onClick={() => {
                                  const found = (allTasks || []).find((t) => t.id === dep.taskId);
                                  if (found && onSelectTask) onSelectTask(found);
                                }}
                                className={clsx(
                                  'font-semibold truncate cursor-pointer hover:underline',
                                  isDone ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]' : 'text-[#17211B] dark:text-[#EAF7EF]'
                                )}
                                title="Click to view task details"
                              >
                                {dep.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={clsx(
                                  'px-2 py-0.5 text-[10px] font-bold rounded-md uppercase',
                                  isDone
                                    ? 'bg-[#5FBF8F]/20 text-[#237A57] dark:text-[#6DD6A0]'
                                    : dep.status === 'IN_PROGRESS'
                                    ? 'bg-blue-500/20 text-blue-500'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                )}
                              >
                                {isDone ? 'Completed' : 'Blocking'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBlockedBy(dep.taskId)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#8A9890] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                                title="Remove dependency"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 🚧 BLOCKS Subsection */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-1">
                      <span>🚧</span>
                      <span>BLOCKS</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                        {blocksList.length}
                      </span>
                    </span>
                  </div>

                  {blocksList.length === 0 ? (
                    <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic py-0.5">
                      No other tasks are waiting on this task.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {blocksList.map((dep) => {
                        const isDone = dep.status === 'COMPLETED';
                        return (
                          <div
                            key={dep.taskId}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-500 flex items-center justify-between gap-3 text-xs transition-all shadow-2xs group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-xs shrink-0">🚧</span>
                              {dep.taskKey && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F3FBF7] dark:bg-[#13261C] text-purple-600 dark:text-purple-400 border border-purple-500/30 shrink-0">
                                  {dep.taskKey}
                                </span>
                              )}
                              <span
                                onClick={() => {
                                  const found = (allTasks || []).find((t) => t.id === dep.taskId);
                                  if (found && onSelectTask) onSelectTask(found);
                                }}
                                className={clsx(
                                  'font-semibold truncate cursor-pointer hover:underline',
                                  isDone ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]' : 'text-[#17211B] dark:text-[#EAF7EF]'
                                )}
                                title="Click to view task details"
                              >
                                {dep.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={clsx(
                                  'px-2 py-0.5 text-[10px] font-bold rounded-md uppercase',
                                  isDone
                                    ? 'bg-[#5FBF8F]/20 text-[#237A57] dark:text-[#6DD6A0]'
                                    : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                )}
                              >
                                {isDone ? 'Completed' : 'Waiting'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBlocks(dep.taskId)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#8A9890] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                                title="Remove dependency"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 📚 3. RESOURCES SECTION (Notes, Documents, Websites, Drive, GitHub) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
            <div
              onClick={() => toggleSection('resources')}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📚</span>
                <h3 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider">
                  Resources
                </h3>
                {taskResources.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                    {taskResources.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAttachModalOpen(true);
                    setAttachTab('EXISTING');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#237A57] hover:bg-[#5FBF8F] text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Link
                </button>
                <div className="p-1 text-[#8A9890] group-hover:text-[#17211B] dark:group-hover:text-[#EAF7EF] transition-colors">
                  {openSections.resources ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {openSections.resources && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                {/* Resource Category Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto text-xs pb-1">
                  <button
                    onClick={() => setResourceFilter('ALL')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer text-[11px]',
                      resourceFilter === 'ALL'
                        ? 'bg-[#237A57] text-white shadow-xs'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                    )}
                  >
                    All ({taskResources.length})
                  </button>
                  <button
                    onClick={() => setResourceFilter('NOTE')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer text-[11px] flex items-center gap-1',
                      resourceFilter === 'NOTE'
                        ? 'bg-[#237A57] text-white shadow-xs'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                    )}
                  >
                    <span>📝</span> Notes ({notesCount})
                  </button>
                  <button
                    onClick={() => setResourceFilter('DOCUMENT')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer text-[11px] flex items-center gap-1',
                      resourceFilter === 'DOCUMENT'
                        ? 'bg-[#237A57] text-white shadow-xs'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                    )}
                  >
                    <span>📄</span> Documents ({docsCount})
                  </button>
                  <button
                    onClick={() => setResourceFilter('WEBSITE')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer text-[11px] flex items-center gap-1',
                      resourceFilter === 'WEBSITE'
                        ? 'bg-[#237A57] text-white shadow-xs'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                    )}
                  >
                    <span>🌐</span> Websites ({websiteCount})
                  </button>
                  <button
                    onClick={() => setResourceFilter('DRIVE_LINK')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer text-[11px] flex items-center gap-1',
                      resourceFilter === 'DRIVE_LINK'
                        ? 'bg-[#237A57] text-white shadow-xs'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                    )}
                  >
                    <span>☁️</span> Drive ({driveCount})
                  </button>
                  <button
                    onClick={() => setResourceFilter('GITHUB')}
                    className={clsx(
                      'px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer text-[11px] flex items-center gap-1',
                      resourceFilter === 'GITHUB'
                        ? 'bg-[#237A57] text-white shadow-xs'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                    )}
                  >
                    <span>🐙</span> GitHub ({githubCount})
                  </button>
                </div>

                {filteredTaskResources.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F3FBF7]/50 dark:bg-[#13261C]/20 border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
                    <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic">
                      No linked resources in this category yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredTaskResources.map((res) => {
                      const meta = getResourceConfig(res.resourceType);
                      const missing = isResourceMissing(res);

                      return (
                        <div
                          key={res.id}
                          onClick={(e) => {
                            if (!missing) handleOpenResource(res, e);
                          }}
                          className={clsx(
                            'p-3 rounded-xl bg-white dark:bg-[#0E1C15] border transition-all shadow-2xs flex flex-col justify-between gap-2 group',
                            missing
                              ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/10 cursor-default'
                              : `border-[#DCE9E1] dark:border-[#20372B] ${meta.borderHover} cursor-pointer hover:shadow-xs`
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-base shrink-0">{meta.emoji}</span>
                              <div className="min-w-0 flex-1">
                                <h4
                                  className={clsx(
                                    'text-xs font-bold truncate',
                                    missing ? 'text-[#8A9890] line-through' : 'text-[#17211B] dark:text-[#EAF7EF]'
                                  )}
                                  title={res.title}
                                >
                                  {res.title || 'Untitled Resource'}
                                </h4>
                                <span className={clsx('px-1.5 py-0.2 text-[9px] font-bold rounded border uppercase mt-0.5 inline-block', meta.badgeClass)}>
                                  {meta.label}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveResource(res.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#8A9890] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer shrink-0"
                              title="Unlink resource"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#DCE9E1]/60 dark:border-[#20372B]/60 text-xs">
                            <button
                              type="button"
                              onClick={(e) => handleOpenResource(res, e)}
                              className="text-[11px] font-semibold text-[#237A57] dark:text-[#6DD6A0] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                            {res.url && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (res.url) {
                                    navigator.clipboard.writeText(res.url);
                                    setCopiedLinkId(res.id);
                                    setTimeout(() => setCopiedLinkId(null), 2000);
                                  }
                                }}
                                className="text-[11px] text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] flex items-center gap-1 cursor-pointer"
                                title="Copy link"
                              >
                                {copiedLinkId === res.id ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-[#5FBF8F]" />
                                    <span className="text-[10px] text-[#5FBF8F]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span className="text-[10px]">Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 🐙 4. GITHUB / RELATED COMMITS SECTION */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
            <div
              onClick={() => toggleSection('github')}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🐙</span>
                <h3 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider">
                  Related Commits
                </h3>
                {currentTask.gitCommits && currentTask.gitCommits.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                    {currentTask.gitCommits.length}
                  </span>
                )}
              </div>
              <div className="p-1 text-[#8A9890] group-hover:text-[#17211B] dark:group-hover:text-[#EAF7EF] transition-colors">
                {openSections.github ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {openSections.github && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                {currentTask.gitCommits && currentTask.gitCommits.length > 0 ? (
                  currentTask.gitCommits.map((commit) => (
                    <div
                      key={commit.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-1.5 shadow-2xs hover:border-[#5FBF8F]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-[#237A57] dark:text-[#6DD6A0] bg-[#F3FBF7] dark:bg-[#13261C] px-2 py-0.5 rounded border border-[#5FBF8F]/30 shrink-0">
                            {commit.commitHash?.slice(0, 7) || 'commit'}
                          </span>
                          {commit.authorName && (
                            <span className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] truncate">
                              by {commit.authorName}
                            </span>
                          )}
                        </div>
                        {commit.commitUrl && (
                          <a
                            href={commit.commitUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#5FBF8F] hover:text-[#237A57] dark:hover:text-[#6DD6A0] transition-colors p-1"
                            title="View commit on GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[#17211B] dark:text-[#EAF7EF] font-semibold leading-snug">
                        {commit.message}
                      </p>
                      {commit.timestamp && (
                        <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] block">
                          {new Date(commit.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#F3FBF7]/40 dark:bg-[#13261C]/20 border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center">
                    <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic">
                      No related commits found for this task.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 📋 5. SUBTASKS SECTION (Checklist, Do Today, Add Step) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
            <div
              onClick={() => toggleSection('subtasks')}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📋</span>
                <h3 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider">
                  Subtasks
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                  {completedSubtasksCount}/{subtasksList.length}
                </span>
              </div>
              <div className="p-1 text-[#8A9890] group-hover:text-[#17211B] dark:group-hover:text-[#EAF7EF] transition-colors">
                {openSections.subtasks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {openSections.subtasks && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                {subtasksList.length > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-[#E8F7EF] dark:bg-[#13261C] rounded-full overflow-hidden border border-[#DCE9E1]/60 dark:border-[#20372B]">
                      <div
                        className="h-full bg-[#5FBF8F] dark:bg-[#6DD6A0] rounded-full transition-all duration-300"
                        style={{
                          width: `${subtasksList.length > 0 ? Math.round((completedSubtasksCount / subtasksList.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {subtasksList.length > 0 ? (
                  <div className="space-y-2">
                    {subtasksList.map((sub) => {
                      const subDone = sub.status === 'COMPLETED';
                      const isSubToday = sub.dueDate === todayStr || sub.dueDate?.startsWith(todayStr);
                      return (
                        <div
                          key={sub.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3 shadow-2xs hover:border-[#5FBF8F]/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onToggleSubtask(currentTask.id, sub)}
                              className={clsx(
                                'w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0',
                                subDone
                                  ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                                  : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                              )}
                            >
                              {subDone && <CheckSquare className="w-3 h-3 fill-current" />}
                            </button>
                            <span
                              className={clsx(
                                'text-xs font-medium truncate',
                                subDone
                                  ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]'
                                  : 'text-[#17211B] dark:text-[#EAF7EF]'
                              )}
                            >
                              {sub.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {sub.dueTime && (
                              <span className="text-[10px] text-[#66736B] dark:text-[#9BB5A5] font-mono font-medium">
                                {formatTaskTimeSlot(sub.dueTime, sub.estimatedDuration)}
                              </span>
                            )}
                            {sub.estimatedDuration && !sub.dueTime && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                {sub.estimatedDuration}m
                              </span>
                            )}
                            {isSubToday ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] flex items-center gap-1 border border-[#5FBF8F]/30" title="Already scheduled for today's execution">
                                <Sun className="w-3 h-3 text-amber-500" /> Already planned for today
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSubtaskDoToday(sub.id)}
                                className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#237A57] hover:bg-[#E8F7EF] transition-all flex items-center gap-1 cursor-pointer"
                                title="Add to Today's Execution"
                              >
                                <Sun className="w-3 h-3 text-amber-500" /> Do Today
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic">
                    No subtasks yet. Add smaller steps below:
                  </p>
                )}

                {/* Add Subtask Form */}
                <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    placeholder="Add a step to this task and press Enter..."
                    className="flex-1 px-3.5 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Step
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 📜 6. TASK HISTORY SECTION (Created, Started, Priority/Due changed, Completed, Reopened) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
            <div
              onClick={() => toggleSection('activity')}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📜</span>
                <h3 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider">
                  TASK HISTORY
                </h3>
                {activities.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                    {activities.length}
                  </span>
                )}
              </div>
              <div className="p-1 text-[#8A9890] group-hover:text-[#17211B] dark:group-hover:text-[#EAF7EF] transition-colors">
                {openSections.activity ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {openSections.activity && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                {loadingActivity ? (
                  <div className="p-3 text-center text-xs text-[#8A9890] dark:text-[#6F8A7A]">
                    Loading history...
                  </div>
                ) : groupedHistory.length > 0 ? (
                  <div className="space-y-4">
                    {groupedHistory.map((group, gIdx) => (
                      <div key={group.dateLabel + '-' + gIdx} className="space-y-2">
                        <div className="text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider">
                          {group.dateLabel}
                        </div>
                        <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCE9E1] dark:before:bg-[#20372B]">
                          {group.items.map((evt) => (
                            <div
                              key={evt.id}
                              className="pl-8 relative flex items-start justify-between gap-3 text-xs"
                            >
                              {/* Dot indicator */}
                              <div
                                className={clsx(
                                  'absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-[#0E1C15] flex items-center justify-center shadow-xs shrink-0',
                                  evt.actionType === 'COMPLETED'
                                    ? 'bg-emerald-500 text-white'
                                    : evt.actionType === 'REOPENED'
                                    ? 'bg-amber-500 text-white'
                                    : evt.actionType === 'STARTED'
                                    ? 'bg-sky-500 text-white'
                                    : evt.actionType === 'CREATED'
                                    ? 'bg-[#5FBF8F] text-white'
                                    : evt.actionType === 'PRIORITY_CHANGED' || evt.actionType === 'DUE_TIME_CHANGED' || evt.actionType === 'DUE_DATE_CHANGED'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-[#237A57] text-white'
                                )}
                              >
                                {evt.actionType === 'COMPLETED' ? (
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>

                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={clsx(
                                      'font-bold text-xs',
                                      evt.actionType === 'COMPLETED'
                                        ? 'text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1'
                                        : 'text-[#17211B] dark:text-[#EAF7EF]'
                                    )}
                                  >
                                    {evt.actionType === 'COMPLETED' ? `✓ ${evt.actionLabel}` : evt.actionLabel}
                                  </span>
                                </div>
                                {evt.diffOrDetail && (
                                  <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-mono font-medium">
                                    {evt.diffOrDetail}
                                  </p>
                                )}
                              </div>

                              <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] whitespace-nowrap shrink-0 mt-0.5 font-mono">
                                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F3FBF7]/40 dark:bg-[#13261C]/20 border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center">
                    <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic">
                      No historical activity available.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 ATTACH / LINK RESOURCE POPUP MODAL */}
      {/* ========================================================================= */}
      {isAttachModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAttachModalOpen(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl overflow-hidden z-20 animate-in zoom-in-95 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between shrink-0 bg-[#F3FBF7]/60 dark:bg-[#13261C]/40">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#5FBF8F]" />
                <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Link Workspace Resource
                </h3>
              </div>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="p-1.5 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Tabs: Attach Existing vs Quick Add */}
            <div className="p-3 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center gap-2 bg-[#F3FBF7]/30 dark:bg-[#13261C]/20">
              <button
                onClick={() => setAttachTab('EXISTING')}
                className={clsx(
                  'flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer',
                  attachTab === 'EXISTING'
                    ? 'bg-[#237A57] text-white shadow-xs'
                    : 'text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                )}
              >
                From Saved Workspace
              </button>
              <button
                onClick={() => setAttachTab('QUICK_ADD')}
                className={clsx(
                  'flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer',
                  attachTab === 'QUICK_ADD'
                    ? 'bg-[#237A57] text-white shadow-xs'
                    : 'text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                )}
              >
                + Quick Create & Link
              </button>
            </div>

            {/* Resource Type Switcher */}
            <div className="px-4 pt-3 flex items-center gap-1.5 overflow-x-auto text-xs pb-2 border-b border-[#DCE9E1]/60 dark:border-[#20372B]/60">
              <button
                onClick={() => setAttachType('WEBSITE')}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0',
                  attachType === 'WEBSITE'
                    ? 'bg-[#5FBF8F] text-[#17211B] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]'
                )}
              >
                <Globe className="w-3 h-3" /> Websites
              </button>
              <button
                onClick={() => setAttachType('PROJECT')}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0',
                  attachType === 'PROJECT'
                    ? 'bg-[#5FBF8F] text-[#17211B] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]'
                )}
              >
                <Briefcase className="w-3 h-3" /> Projects
              </button>
              <button
                onClick={() => setAttachType('NOTE')}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0',
                  attachType === 'NOTE'
                    ? 'bg-[#5FBF8F] text-[#17211B] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]'
                )}
              >
                <FileText className="w-3 h-3" /> Notes
              </button>
              <button
                onClick={() => setAttachType('DOCUMENT')}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0',
                  attachType === 'DOCUMENT'
                    ? 'bg-[#5FBF8F] text-[#17211B] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]'
                )}
              >
                <FolderArchive className="w-3 h-3" /> Documents
              </button>
              <button
                onClick={() => setAttachType('DRIVE_LINK')}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0',
                  attachType === 'DRIVE_LINK'
                    ? 'bg-[#5FBF8F] text-[#17211B] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]'
                )}
              >
                <HardDrive className="w-3 h-3" /> Drive Links
              </button>
              <button
                onClick={() => setAttachType('GITHUB')}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0',
                  attachType === 'GITHUB'
                    ? 'bg-[#5FBF8F] text-[#17211B] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]'
                )}
              >
                <span>🐙</span> GitHub
              </button>
              <button
                onClick={() => setAttachType('IDEA')}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0',
                  attachType === 'IDEA'
                    ? 'bg-[#5FBF8F] text-[#17211B] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5]'
                )}
              >
                <Lightbulb className="w-3 h-3" /> Ideas
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {attachTab === 'EXISTING' ? (
                <>
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9890]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search saved ${attachType.toLowerCase()}s...`}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                    />
                  </div>

                  {/* List of items */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {attachType === 'WEBSITE' &&
                      availableWebsites
                        .filter(
                          (w) =>
                            w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            w.url.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((web) => {
                          const linked = isResourceLinked('WEBSITE', web.id);
                          return (
                            <div
                              key={web.id}
                              className="p-3 rounded-xl bg-[#F3FBF7]/60 dark:bg-[#13261C]/40 border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                                  {web.name}
                                </h5>
                                <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate font-mono">
                                  {web.url}
                                </p>
                              </div>
                              {linked ? (
                                <span className="text-[11px] font-bold text-[#5FBF8F] flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" /> Linked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAttachExisting('WEBSITE', web.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-lg transition-all cursor-pointer shrink-0"
                                >
                                  + Link
                                </button>
                              )}
                            </div>
                          );
                        })}

                    {attachType === 'PROJECT' &&
                      availableProjects
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((proj) => {
                          const linked = isResourceLinked('PROJECT', proj.id);
                          return (
                            <div
                              key={proj.id}
                              className="p-3 rounded-xl bg-[#F3FBF7]/60 dark:bg-[#13261C]/40 border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                  {proj.name}
                                </h5>
                                <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">
                                  {proj.description || 'Project Workspace Command Center'}
                                </p>
                              </div>
                              {linked ? (
                                <span className="text-[11px] font-bold text-[#5FBF8F] flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" /> Linked
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAttachExisting('PROJECT', proj.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-lg transition-all cursor-pointer shrink-0"
                                >
                                  + Link
                                </button>
                              )}
                            </div>
                          );
                        })}

                    {attachType === 'NOTE' &&
                      availableNotes
                        .filter(
                          (n) =>
                            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            n.content.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((note) => {
                          const linked = isResourceLinked('NOTE', note.id);
                          return (
                            <div
                              key={note.id}
                              className="p-3 rounded-xl bg-[#F3FBF7]/60 dark:bg-[#13261C]/40 border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                                  {note.title}
                                </h5>
                                <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">
                                  {note.categoryName || 'Note artifact'}
                                </p>
                              </div>
                              {linked ? (
                                <span className="text-[11px] font-bold text-[#5FBF8F] flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" /> Linked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAttachExisting('NOTE', note.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-lg transition-all cursor-pointer shrink-0"
                                >
                                  + Link
                                </button>
                              )}
                            </div>
                          );
                        })}

                    {attachType === 'DOCUMENT' &&
                      availableDocuments
                        .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((doc) => {
                          const linked = isResourceLinked('DOCUMENT', doc.id);
                          return (
                            <div
                              key={doc.id}
                              className="p-3 rounded-xl bg-[#F3FBF7]/60 dark:bg-[#13261C]/40 border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                                  {doc.name}
                                </h5>
                                <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">
                                  {doc.fileType || 'Document file'}
                                </p>
                              </div>
                              {linked ? (
                                <span className="text-[11px] font-bold text-[#5FBF8F] flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" /> Linked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAttachExisting('DOCUMENT', doc.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-lg transition-all cursor-pointer shrink-0"
                                >
                                  + Link
                                </button>
                              )}
                            </div>
                          );
                        })}

                    {attachType === 'DRIVE_LINK' &&
                      availableDriveLinks
                        .filter(
                          (dr) =>
                            dr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            dr.url.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((drive) => {
                          const linked = isResourceLinked('DRIVE_LINK', drive.id);
                          return (
                            <div
                              key={drive.id}
                              className="p-3 rounded-xl bg-[#F3FBF7]/60 dark:bg-[#13261C]/40 border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                                  {drive.name}
                                </h5>
                                <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate font-mono">
                                  {drive.url}
                                </p>
                              </div>
                              {linked ? (
                                <span className="text-[11px] font-bold text-[#5FBF8F] flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" /> Linked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAttachExisting('DRIVE_LINK', drive.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-lg transition-all cursor-pointer shrink-0"
                                >
                                  + Link
                                </button>
                              )}
                            </div>
                          );
                        })}

                    {attachType === 'GITHUB' &&
                      availableProjects
                        .filter(
                          (p) =>
                            (p.githubRepo && p.githubRepo.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            p.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((proj) => {
                          const linked = isResourceLinked('GITHUB', proj.id);
                          return (
                            <div
                              key={proj.id}
                              className="p-3 rounded-xl bg-[#F3FBF7]/60 dark:bg-[#13261C]/40 border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate flex items-center gap-1.5">
                                  <span>🐙</span>
                                  <span>{proj.githubRepo || `${proj.name} Repository`}</span>
                                </h5>
                                <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate font-mono">
                                  {proj.githubRepo ? `https://github.com/${proj.githubRepo}` : `Project Workspace: ${proj.name}`}
                                </p>
                              </div>
                              {linked ? (
                                <span className="text-[11px] font-bold text-[#5FBF8F] flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" /> Linked
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAttachExisting('GITHUB', proj.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-lg transition-all cursor-pointer shrink-0"
                                >
                                  + Link Repo
                                </button>
                              )}
                            </div>
                          );
                        })}

                    {attachType === 'IDEA' &&
                      availableIdeas
                        .filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((idea) => {
                          const linked = isResourceLinked('IDEA', idea.id);
                          return (
                            <div
                              key={idea.id}
                              className="p-3 rounded-xl bg-[#F3FBF7]/60 dark:bg-[#13261C]/40 border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                                  {idea.title}
                                </h5>
                                <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">
                                  Idea Vault Item
                                </p>
                              </div>
                              {linked ? (
                                <span className="text-[11px] font-bold text-[#5FBF8F] flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" /> Linked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAttachExisting('IDEA', idea.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-lg transition-all cursor-pointer shrink-0"
                                >
                                  + Link
                                </button>
                              )}
                            </div>
                          );
                        })}
                  </div>
                </>
              ) : (
                /* Quick Add & Link Form */
                <form onSubmit={handleQuickCreateAndLink} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1">
                      {attachType === 'WEBSITE'
                        ? 'Website / Portal Name'
                        : attachType === 'GITHUB'
                        ? 'GitHub Repository Name / Title'
                        : attachType === 'NOTE'
                        ? 'Note Title'
                        : attachType === 'DRIVE_LINK'
                        ? 'Google Drive Item Name'
                        : 'Idea Title'}{' '}
                      *
                    </label>
                    <input
                      type="text"
                      required
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder={
                        attachType === 'WEBSITE'
                          ? 'e.g. Bus Booking Portal, Jira Ticket'
                          : attachType === 'GITHUB'
                          ? 'e.g. facebook/react, personal-workspace'
                          : attachType === 'NOTE'
                          ? 'e.g. Booking Checklist, Seat Confirmation'
                          : 'e.g. Trip Receipts Drive'
                      }
                      className="w-full px-3.5 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                    />
                  </div>

                  {(attachType === 'WEBSITE' || attachType === 'DRIVE_LINK' || attachType === 'GITHUB') && (
                    <div>
                      <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1">
                        URL Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={quickUrl}
                        onChange={(e) => setQuickUrl(e.target.value)}
                        placeholder={attachType === 'GITHUB' ? 'https://github.com/facebook/react' : 'https://example.com/booking'}
                        className="w-full px-3.5 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F] font-mono"
                      />
                    </div>
                  )}

                  {(attachType === 'NOTE' || attachType === 'IDEA') && (
                    <div>
                      <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1">
                        Content / Description
                      </label>
                      <textarea
                        rows={3}
                        value={quickContent}
                        onChange={(e) => setQuickContent(e.target.value)}
                        placeholder="Write quick details or notes here..."
                        className="w-full px-3.5 py-2 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAttachModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickSaving}
                      className="px-5 py-2 text-xs font-bold bg-[#5FBF8F] hover:bg-[#237A57] text-[#17211B] hover:text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {quickSaving ? 'Saving...' : 'Save & Link to Task'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
