import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  Tag,
  Briefcase,
  Plus,
  Sun,
  Target,
  Globe,
  FileText,
  FolderArchive,
  HardDrive,
  Lightbulb,
  Link as LinkIcon,
  Search,
  Check
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Category, Project, ResourceType, Website, Note, DocumentItem, DriveLink, Idea } from '../../types';
import { projectService } from '../../services/projectService';
import { websiteService } from '../../services/websiteService';
import { noteService } from '../../services/noteService';
import { documentService } from '../../services/documentService';
import { driveService } from '../../services/driveService';
import { ideaService } from '../../services/ideaService';
import { TaskDependencyPanel } from './TaskDependencyPanel';
import { clsx } from 'clsx';

export interface PendingTaskResource {
  resourceType: ResourceType;
  resourceId?: string;
  title: string;
  url?: string;
  content?: string;
  isQuickAdd?: boolean;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>, pendingResources?: PendingTaskResource[]) => void;
  categories: Category[];
  initialTask?: Task;
  defaultProjectId?: string;
  defaultType?: 'TODAY' | 'EPIC';
  defaultDueDate?: string;
  /** Pass all tasks in the same project for the dependency picker */
  projectTasks?: Task[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialTask,
  defaultProjectId,
  defaultType = 'TODAY',
  defaultDueDate,
  projectTasks = [],
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  const [taskType, setTaskType] = useState<'TODAY' | 'EPIC'>('TODAY');
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'TODO');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || todayStr);
  const [dueTime, setDueTime] = useState(initialTask?.dueTime || '18:00');
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>(initialTask?.estimatedDuration);
  const [categoryId, setCategoryId] = useState(initialTask?.categoryId || '');
  const [projectId, setProjectId] = useState(initialTask?.projectId || defaultProjectId || '');
  const [projects, setProjects] = useState<Project[]>([]);

  // Attached Resources State
  const [pendingResources, setPendingResources] = useState<PendingTaskResource[]>([]);
  const [activePickerType, setActivePickerType] = useState<ResourceType | null>(null);
  const [pickerTab, setPickerTab] = useState<'EXISTING' | 'QUICK'>('EXISTING');
  const [pickerSearch, setPickerSearch] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickContent, setQuickContent] = useState('');

  // Available Workspace Resources
  const [availableWebsites, setAvailableWebsites] = useState<Website[]>([]);
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);
  const [availableDrives, setAvailableDrives] = useState<DriveLink[]>([]);
  const [availableIdeas, setAvailableIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    if (isOpen) {
      const initialType = initialTask
        ? (initialTask.dueDate === todayStr ? 'TODAY' : 'EPIC')
        : (defaultType || 'TODAY');

      setTaskType(initialType);
      setTitle(initialTask?.title || '');
      setDescription(initialTask?.description || '');
      setPriority(initialTask?.priority || 'MEDIUM');
      setStatus(initialTask?.status || 'TODO');
      
      if (initialTask?.dueDate) {
        setDueDate(initialTask.dueDate);
      } else if (defaultDueDate) {
        setDueDate(defaultDueDate);
        setTaskType(defaultDueDate === todayStr ? 'TODAY' : 'EPIC');
      } else if (initialType === 'TODAY') {
        setDueDate(todayStr);
      } else {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const y = nextWeek.getFullYear();
        const m = String(nextWeek.getMonth() + 1).padStart(2, '0');
        const d = String(nextWeek.getDate()).padStart(2, '0');
        setDueDate(`${y}-${m}-${d}`);
      }

      setDueTime(initialTask?.dueTime || '18:00');
      setEstimatedDuration(initialTask?.estimatedDuration);
      setCategoryId(initialTask?.categoryId || '');
      setProjectId(initialTask?.projectId || defaultProjectId || '');
      if (initialTask?.resources && initialTask.resources.length > 0) {
        setPendingResources(
          initialTask.resources.map((r) => ({
            resourceType: r.resourceType,
            resourceId: r.resourceId,
            title: r.title || `${r.resourceType.toLowerCase()} link`,
            url: r.url,
            isQuickAdd: false,
          }))
        );
      } else {
        setPendingResources([]);
      }
      setActivePickerType(null);
      setPickerSearch('');
      setQuickTitle('');
      setQuickUrl('');
      setQuickContent('');

      // Load all available workspace resources
      Promise.all([
        projectService.getProjects().catch(() => []),
        websiteService.getWebsites().catch(() => []),
        noteService.getNotes().catch(() => []),
        documentService.getDocuments().catch(() => []),
        driveService.getDriveLinks().catch(() => []),
        ideaService.getIdeas().catch(() => []),
      ]).then(([projs, webs, notes, docs, drives, ideas]) => {
        setProjects(projs || []);
        setAvailableWebsites(webs || []);
        setAvailableNotes(notes || []);
        setAvailableDocs(docs || []);
        setAvailableDrives(drives || []);
        setAvailableIdeas(ideas || []);
      });
    }
  }, [isOpen, initialTask, defaultProjectId, defaultType]);

  if (!isOpen) return null;

  const setQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${y}-${m}-${day}`);
  };

  const handleTypeChange = (type: 'TODAY' | 'EPIC') => {
    setTaskType(type);
    if (type === 'TODAY') {
      setDueDate(todayStr);
    } else {
      if (dueDate === todayStr) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const y = nextWeek.getFullYear();
        const m = String(nextWeek.getMonth() + 1).padStart(2, '0');
        const d = String(nextWeek.getDate()).padStart(2, '0');
        setDueDate(`${y}-${m}-${d}`);
      }
    }
  };

  const handleAddExistingResource = (type: ResourceType, id: string, name: string, url?: string) => {
    if (pendingResources.some((r) => r.resourceType === type && r.resourceId === id)) return;
    setPendingResources((prev) => [
      ...prev,
      { resourceType: type, resourceId: id, title: name, url, isQuickAdd: false },
    ]);
  };

  const handleAddQuickResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePickerType || !quickTitle.trim()) return;

    let fullUrl = quickUrl.trim();
    if (fullUrl && !fullUrl.startsWith('http')) {
      fullUrl = `https://${fullUrl}`;
    }

    setPendingResources((prev) => [
      ...prev,
      {
        resourceType: activePickerType,
        title: quickTitle.trim(),
        url: fullUrl || undefined,
        content: quickContent.trim() || undefined,
        isQuickAdd: true,
      },
    ]);

    setQuickTitle('');
    setQuickUrl('');
    setQuickContent('');
    setActivePickerType(null);
  };

  const handleRemovePendingResource = (index: number) => {
    setPendingResources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        id: initialTask?.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
        categoryId: categoryId || undefined,
        projectId: projectId || undefined,
      },
      pendingResources
    );
    onClose();
  };

  const priorityOptions: { label: string; value: TaskPriority; color: string }[] = [
    { label: 'Low', value: 'LOW', color: 'border-[#DCE9E1] dark:border-[#20372B] bg-[#E8F7EF] dark:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF]' },
    { label: 'Medium', value: 'MEDIUM', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
    { label: 'High', value: 'HIGH', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
    { label: 'Urgent', value: 'URGENT', color: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between shrink-0 bg-[#F3FBF7]/60 dark:bg-[#13261C]/40">
          <div className="flex items-center gap-2.5">
            <div className={clsx(
              'p-2 rounded-xl',
              taskType === 'TODAY'
                ? 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]'
                : 'bg-purple-500/10 text-purple-400'
            )}>
              {taskType === 'TODAY' ? <Sun className="w-5 h-5 text-amber-500" /> : <Target className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base">
                {initialTask ? 'Edit Task' : (taskType === 'TODAY' ? "Create Today's Execution Task" : 'Create Strategic Goal & Epic')}
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                {taskType === 'TODAY' ? 'Schedule for immediate focus today' : 'Long-term milestone with resource linking'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Target Section Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider mb-1.5">
              Task Classification
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3FBF7] dark:bg-[#13261C] rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">
              <button
                type="button"
                onClick={() => handleTypeChange('TODAY')}
                className={clsx(
                  'py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer',
                  taskType === 'TODAY'
                    ? 'bg-white dark:bg-[#0E1C15] text-[#237A57] dark:text-[#6DD6A0] shadow-sm border border-[#5FBF8F]/40 font-bold'
                    : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                )}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Today's Task
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('EPIC')}
                className={clsx(
                  'py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer',
                  taskType === 'EPIC'
                    ? 'bg-white dark:bg-[#0E1C15] text-purple-500 dark:text-purple-400 shadow-sm border border-purple-500/40 font-bold'
                    : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                )}
              >
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Strategic Goal & Epic
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={taskType === 'TODAY' ? "e.g. Book Bus Ticket to Kandy" : "e.g. Build Core Microservices Architecture"}
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key details, instructions, or subtasks..."
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          {/* Project & Category Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Linked Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F] cursor-pointer"
              >
                <option value="">No Project (Standalone Task)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name} {p.projectKey ? `(${p.projectKey})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#5FBF8F]" />
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F] cursor-pointer"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#5FBF8F]" />
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={clsx(
                    'px-2.5 py-1.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer',
                    opt.color,
                    priority === opt.value
                      ? 'ring-2 ring-[#5FBF8F] shadow-sm font-bold opacity-100'
                      : 'opacity-60 hover:opacity-100'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Row with Quick Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5FBF8F]" />
                Due Date & Time
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all cursor-pointer"
                >
                  +1 Week
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
                />
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
                />
              </div>
            </div>

            {/* Estimated Duration */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#5FBF8F]" />
                  Estimated Duration
                </span>
                {estimatedDuration ? (
                  <span className="text-[#237A57] dark:text-[#6DD6A0] font-bold text-xs">{estimatedDuration} min ({Math.floor(estimatedDuration / 60)}h {estimatedDuration % 60}m)</span>
                ) : (
                  <span className="text-xs text-[#8A9890]">Not estimated</span>
                )}
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[15, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedDuration(estimatedDuration === mins ? undefined : mins)}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
                      estimatedDuration === mins
                        ? 'bg-[#5FBF8F] text-white border-[#5FBF8F] shadow-xs'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                    )}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
                <input
                  type="number"
                  min="5"
                  step="5"
                  placeholder="Custom min"
                  value={estimatedDuration || ''}
                  onChange={(e) => setEstimatedDuration(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-24 px-2 py-1 text-xs bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-lg text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:border-[#5FBF8F]"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🔗 ATTACH WORKSPACE RESOURCES (WEBSITES, NOTES, DOCS, DRIVE, IDEAS, PROJECTS) */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-1.5 uppercase tracking-wider">
                <LinkIcon className="w-3.5 h-3.5 text-[#5FBF8F]" />
                Attach Workspace Resources
                {pendingResources.length > 0 && (
                  <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                    {pendingResources.length}
                  </span>
                )}
              </label>
              <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">Optional</span>
            </div>

            {/* Attached Resources Chips */}
            {pendingResources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C]/50 border border-[#DCE9E1] dark:border-[#20372B]">
                {pendingResources.map((res, idx) => {
                  let icon = <Globe className="w-3 h-3 text-[#5FBF8F]" />;
                  let chipStyle = 'bg-white dark:bg-[#0E1C15] text-[#237A57] dark:text-[#6DD6A0] border-[#5FBF8F]/40';

                  if (res.resourceType === 'NOTE') {
                    icon = <FileText className="w-3 h-3 text-amber-500" />;
                    chipStyle = 'bg-white dark:bg-[#0E1C15] text-amber-600 dark:text-amber-400 border-amber-500/40';
                  } else if (res.resourceType === 'DOCUMENT') {
                    icon = <FolderArchive className="w-3 h-3 text-purple-500" />;
                    chipStyle = 'bg-white dark:bg-[#0E1C15] text-purple-600 dark:text-purple-400 border-purple-500/40';
                  } else if (res.resourceType === 'DRIVE_LINK') {
                    icon = <HardDrive className="w-3 h-3 text-cyan-500" />;
                    chipStyle = 'bg-white dark:bg-[#0E1C15] text-cyan-600 dark:text-cyan-400 border-cyan-500/40';
                  } else if (res.resourceType === 'IDEA') {
                    icon = <Lightbulb className="w-3 h-3 text-yellow-500" />;
                    chipStyle = 'bg-white dark:bg-[#0E1C15] text-yellow-600 dark:text-yellow-400 border-yellow-500/40';
                  } else if (res.resourceType === 'PROJECT') {
                    icon = <Briefcase className="w-3 h-3 text-purple-500" />;
                    chipStyle = 'bg-white dark:bg-[#0E1C15] text-purple-600 dark:text-purple-400 border-purple-500/40';
                  }

                  return (
                    <div
                      key={idx}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shadow-2xs',
                        chipStyle
                      )}
                    >
                      {icon}
                      <span className="truncate max-w-[140px]">{res.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingResource(idx)}
                        className="p-0.5 text-[#8A9890] hover:text-rose-500 rounded transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Type Selection Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActivePickerType(activePickerType === 'WEBSITE' ? null : 'WEBSITE')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer',
                  activePickerType === 'WEBSITE'
                    ? 'bg-[#5FBF8F] text-[#17211B] border-[#5FBF8F] font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-[#237A57] dark:text-[#6DD6A0] hover:border-[#5FBF8F]'
                )}
              >
                <Plus className="w-3 h-3" /> Website
              </button>

              <button
                type="button"
                onClick={() => setActivePickerType(activePickerType === 'NOTE' ? null : 'NOTE')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer',
                  activePickerType === 'NOTE'
                    ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-amber-600 dark:text-amber-400 hover:border-amber-500'
                )}
              >
                <Plus className="w-3 h-3" /> Note
              </button>

              <button
                type="button"
                onClick={() => setActivePickerType(activePickerType === 'DOCUMENT' ? null : 'DOCUMENT')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer',
                  activePickerType === 'DOCUMENT'
                    ? 'bg-purple-500 text-white border-purple-500 font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-purple-600 dark:text-purple-400 hover:border-purple-500'
                )}
              >
                <Plus className="w-3 h-3" /> Document
              </button>

              <button
                type="button"
                onClick={() => setActivePickerType(activePickerType === 'DRIVE_LINK' ? null : 'DRIVE_LINK')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer',
                  activePickerType === 'DRIVE_LINK'
                    ? 'bg-cyan-500 text-white border-cyan-500 font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-cyan-600 dark:text-cyan-400 hover:border-cyan-500'
                )}
              >
                <Plus className="w-3 h-3" /> Drive Link
              </button>

              <button
                type="button"
                onClick={() => setActivePickerType(activePickerType === 'IDEA' ? null : 'IDEA')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer',
                  activePickerType === 'IDEA'
                    ? 'bg-yellow-500 text-white border-yellow-500 font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-yellow-600 dark:text-yellow-400 hover:border-yellow-500'
                )}
              >
                <Plus className="w-3 h-3" /> Idea
              </button>

              <button
                type="button"
                onClick={() => setActivePickerType(activePickerType === 'PROJECT' ? null : 'PROJECT')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer',
                  activePickerType === 'PROJECT'
                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-purple-600 dark:text-purple-400 hover:border-purple-500'
                )}
              >
                <Plus className="w-3 h-3" /> Project
              </button>

              <button
                type="button"
                onClick={() => setActivePickerType(activePickerType === 'GITHUB' ? null : 'GITHUB')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer',
                  activePickerType === 'GITHUB'
                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-purple-600 dark:text-purple-400 hover:border-purple-500'
                )}
              >
                <Plus className="w-3 h-3" /> GitHub
              </button>
            </div>

            {/* Expandable Resource Picker / Quick Creator */}
            {activePickerType && (
              <div className="p-3.5 rounded-2xl bg-[#F3FBF7]/90 dark:bg-[#13261C]/80 border border-[#5FBF8F]/40 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#DCE9E1] dark:border-[#20372B] pb-2">
                  <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-[#0E1C15] rounded-lg border border-[#DCE9E1] dark:border-[#20372B]">
                    <button
                      type="button"
                      onClick={() => setPickerTab('EXISTING')}
                      className={clsx(
                        'px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer',
                        pickerTab === 'EXISTING'
                          ? 'bg-[#237A57] text-white shadow-xs'
                          : 'text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                      )}
                    >
                      Saved {activePickerType}s
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab('QUICK')}
                      className={clsx(
                        'px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer',
                        pickerTab === 'QUICK'
                          ? 'bg-[#237A57] text-white shadow-xs'
                          : 'text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF]'
                      )}
                    >
                      + Quick Add / URL
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePickerType(null)}
                    className="p-1 text-[#8A9890] hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {pickerTab === 'EXISTING' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A9890]" />
                      <input
                        type="text"
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder={`Search saved ${activePickerType.toLowerCase()}s...`}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-lg text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {activePickerType === 'WEBSITE' &&
                        availableWebsites
                          .filter((w) => w.name.toLowerCase().includes(pickerSearch.toLowerCase()) || w.url.toLowerCase().includes(pickerSearch.toLowerCase()))
                          .map((w) => {
                            const isAdded = pendingResources.some((r) => r.resourceType === 'WEBSITE' && r.resourceId === w.id);
                            return (
                              <div
                                key={w.id}
                                className="p-2 rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">{w.name}</p>
                                  <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate font-mono">{w.url}</p>
                                </div>
                                {isAdded ? (
                                  <span className="text-[10px] font-bold text-[#5FBF8F] flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Attached
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddExistingResource('WEBSITE', w.id, w.name, w.url)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-md transition-all cursor-pointer"
                                  >
                                    Attach
                                  </button>
                                )}
                              </div>
                            );
                          })}

                      {activePickerType === 'NOTE' &&
                        availableNotes
                          .filter((n) => n.title.toLowerCase().includes(pickerSearch.toLowerCase()))
                          .map((n) => {
                            const isAdded = pendingResources.some((r) => r.resourceType === 'NOTE' && r.resourceId === n.id);
                            return (
                              <div
                                key={n.id}
                                className="p-2 rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">{n.title}</p>
                                  <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">{n.categoryName || 'Note'}</p>
                                </div>
                                {isAdded ? (
                                  <span className="text-[10px] font-bold text-[#5FBF8F] flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Attached
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddExistingResource('NOTE', n.id, n.title)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-md transition-all cursor-pointer"
                                  >
                                    Attach
                                  </button>
                                )}
                              </div>
                            );
                          })}

                      {activePickerType === 'DOCUMENT' &&
                        availableDocs
                          .filter((d) => d.name.toLowerCase().includes(pickerSearch.toLowerCase()))
                          .map((d) => {
                            const isAdded = pendingResources.some((r) => r.resourceType === 'DOCUMENT' && r.resourceId === d.id);
                            return (
                              <div
                                key={d.id}
                                className="p-2 rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">{d.name}</p>
                                  <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">{d.fileType || 'Document'}</p>
                                </div>
                                {isAdded ? (
                                  <span className="text-[10px] font-bold text-[#5FBF8F] flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Attached
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddExistingResource('DOCUMENT', d.id, d.name, d.filePath)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-md transition-all cursor-pointer"
                                  >
                                    Attach
                                  </button>
                                )}
                              </div>
                            );
                          })}

                      {activePickerType === 'DRIVE_LINK' &&
                        availableDrives
                          .filter((dr) => dr.name.toLowerCase().includes(pickerSearch.toLowerCase()) || dr.url.toLowerCase().includes(pickerSearch.toLowerCase()))
                          .map((dr) => {
                            const isAdded = pendingResources.some((r) => r.resourceType === 'DRIVE_LINK' && r.resourceId === dr.id);
                            return (
                              <div
                                key={dr.id}
                                className="p-2 rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">{dr.name}</p>
                                  <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate font-mono">{dr.url}</p>
                                </div>
                                {isAdded ? (
                                  <span className="text-[10px] font-bold text-[#5FBF8F] flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Attached
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddExistingResource('DRIVE_LINK', dr.id, dr.name, dr.url)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-md transition-all cursor-pointer"
                                  >
                                    Attach
                                  </button>
                                )}
                              </div>
                            );
                          })}

                      {activePickerType === 'IDEA' &&
                        availableIdeas
                          .filter((i) => i.title.toLowerCase().includes(pickerSearch.toLowerCase()))
                          .map((i) => {
                            const isAdded = pendingResources.some((r) => r.resourceType === 'IDEA' && r.resourceId === i.id);
                            return (
                              <div
                                key={i.id}
                                className="p-2 rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">{i.title}</p>
                                </div>
                                {isAdded ? (
                                  <span className="text-[10px] font-bold text-[#5FBF8F] flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Attached
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddExistingResource('IDEA', i.id, i.title)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-md transition-all cursor-pointer"
                                  >
                                    Attach
                                  </button>
                                )}
                              </div>
                            );
                          })}

                      {activePickerType === 'PROJECT' &&
                        projects
                          .filter((p) => p.name.toLowerCase().includes(pickerSearch.toLowerCase()))
                          .map((p) => {
                            const isAdded = pendingResources.some((r) => r.resourceType === 'PROJECT' && r.resourceId === p.id);
                            return (
                              <div
                                key={p.id}
                                className="p-2 rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">{p.name}</p>
                                  <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">{p.description || 'Project'}</p>
                                </div>
                                {isAdded ? (
                                  <span className="text-[10px] font-bold text-[#5FBF8F] flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Attached
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddExistingResource('PROJECT', p.id, p.name)}
                                    className="px-2 py-0.5 text-[11px] font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-md transition-all cursor-pointer"
                                  >
                                    Attach
                                  </button>
                                )}
                              </div>
                            );
                          })}
                    </div>
                  </div>
                ) : (
                  /* Quick Add Form */
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder={
                        activePickerType === 'WEBSITE'
                          ? 'e.g. Bus Booking Portal, Jira Ticket'
                          : activePickerType === 'NOTE'
                          ? 'e.g. Departure Checklist'
                          : 'e.g. Travel Receipts Folder'
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-lg text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                    />

                    {(activePickerType === 'WEBSITE' || activePickerType === 'DRIVE_LINK') && (
                      <input
                        type="text"
                        value={quickUrl}
                        onChange={(e) => setQuickUrl(e.target.value)}
                        placeholder="https://example.com/portal"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-lg text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F] font-mono"
                      />
                    )}

                    {(activePickerType === 'NOTE' || activePickerType === 'IDEA') && (
                      <textarea
                        rows={2}
                        value={quickContent}
                        onChange={(e) => setQuickContent(e.target.value)}
                        placeholder="Quick notes or description..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-lg text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                      />
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAddQuickResource}
                        className="px-3 py-1 text-xs font-bold bg-[#5FBF8F] hover:bg-[#237A57] text-[#17211B] hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" /> Add to Task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Task Dependencies (edit mode only) */}
          {initialTask && initialTask.id && (
            <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B]">
              <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-3 flex items-center gap-2">
                🔗 Dependencies
              </h4>
              <TaskDependencyPanel
                task={initialTask}
                projectTasks={projectTasks}
                onUpdated={onClose}
              />
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#237A57] to-[#5FBF8F] hover:from-[#5FBF8F] hover:to-[#237A57] rounded-xl shadow-md shadow-[#5FBF8F]/25 transition-all cursor-pointer"
            >
              {initialTask ? 'Save Changes' : (taskType === 'TODAY' ? "Create Today's Task" : 'Create Strategic Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
