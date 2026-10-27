import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Edit,
  Trash2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Sun,
  AlertTriangle,
  Lock,
  CheckSquare,
  Zap,
  ListTodo,
} from 'lucide-react';
import type { Task, Category, Project } from '../types';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { projectService } from '../services/projectService';
import { websiteService } from '../services/websiteService';
import { noteService } from '../services/noteService';
import { driveService } from '../services/driveService';
import { ideaService } from '../services/ideaService';
import { TaskModal, PendingTaskResource } from '../components/tasks/TaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { AiDecomposeModal } from '../components/tasks/AiDecomposeModal';
import { isTaskFactualOverdue, getLocalDateString, isStrategicGoal } from '../utils/taskProgress';
import { useLiveSync } from '../hooks/useLiveSync';
import { clsx } from 'clsx';

export const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'>('ALL');

  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<Record<string, string>>({});
  const [extendMenuTaskId, setExtendMenuTaskId] = useState<string | null>(null);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [decomposeTask, setDecomposeTask] = useState<Task | null>(null);

  const reqSeqRef = useRef(0);
  const todayStr = getLocalDateString();

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = async () => {
    const seq = ++reqSeqRef.current;
    try {
      const [fetchedTasks, fetchedCats, fetchedProjects] = await Promise.all([
        taskService.getTasks({
          search: debouncedSearch || undefined,
          categoryId: selectedCategory || undefined,
        }),
        categoryService.getCategories().catch(() => []),
        projectService.getProjects().catch(() => []),
      ]);

      if (seq === reqSeqRef.current) {
        setTasks(fetchedTasks || []);
        setCategories(fetchedCats || []);
        setProjects(fetchedProjects || []);
      }
    } catch (err) {
      if (seq === reqSeqRef.current) {
        console.error('Failed to load strategic goals data:', err);
      }
    }
  };

  useEffect(() => {
    loadData();

    const handleCreated = () => loadData();
    window.addEventListener('workspace-resource-created', handleCreated);
    window.addEventListener('workspace-category-updated', handleCreated);
    return () => {
      window.removeEventListener('workspace-resource-created', handleCreated);
      window.removeEventListener('workspace-category-updated', handleCreated);
    };
  }, [debouncedSearch, selectedCategory]);

  useLiveSync(() => {
    loadData();
  }, { intervalMs: 12000 });

  const isTaskOverdue = (task: Task) => isTaskFactualOverdue(task, todayStr);

  const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // 24-hour format (e.g. 20:00, 05:00, 23:59)
  };

  const isTaskBlocked = (task: Task): boolean => {
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    if (task.isBlocked) return true;
    if (task.blockedBy && task.blockedBy.length > 0) {
      return task.blockedBy.some((dep) => dep.status !== 'COMPLETED');
    }
    if (task.dependsOnTaskId) {
      const prereq = tasks.find((t) => t.id === task.dependsOnTaskId);
      if (prereq && prereq.status !== 'COMPLETED') return true;
    }
    return false;
  };

  const isTaskReady = (task: Task): boolean => {
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    const hasDependencies = (task.blockedBy && task.blockedBy.length > 0) || !!task.dependsOnTaskId;
    return hasDependencies && !isTaskBlocked(task);
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    const applyStatus = (list: Task[]): Task[] =>
      list.map((t) => {
        if (t.id === task.id) return { ...t, status: nextStatus };
        if (t.subtasks && t.subtasks.some((s) => s.id === task.id)) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === task.id ? { ...s, status: nextStatus } : s)),
          };
        }
        return t;
      });

    setTasks((prev) => applyStatus(prev));
    if (detailTask && detailTask.id === task.id) {
      setDetailTask((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    try {
      const updated = await taskService.updateTaskStatus(task.id, nextStatus);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) return updated;
          if (t.subtasks && t.subtasks.some((s) => s.id === task.id)) {
            return {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === task.id ? updated : s)),
            };
          }
          return t;
        })
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      loadData();
    }
  };

  const handleToggleSubtaskStatus = async (parentTaskId: string, subtask: Task) => {
    const nextStatus = subtask.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === parentTaskId && t.subtasks) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === subtask.id ? { ...s, status: nextStatus } : s)),
          };
        }
        return t;
      })
    );

    try {
      const updated = await taskService.updateTaskStatus(subtask.id, nextStatus);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === parentTaskId && t.subtasks) {
            return {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === subtask.id ? updated : s)),
            };
          }
          return t;
        })
      );
      if (detailTask && detailTask.id === parentTaskId) {
        setDetailTask((prev) =>
          prev && prev.subtasks
            ? {
                ...prev,
                subtasks: prev.subtasks.map((s) => (s.id === subtask.id ? updated : s)),
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Failed to update subtask status:', err);
      loadData();
    }
  };

  const handleAddSubtask = async (parentTaskId: string, customTitle?: string) => {
    const title = customTitle || newSubtaskTitle[parentTaskId]?.trim();
    if (!title) return;

    try {
      const created = await taskService.createSubtask(parentTaskId, { title });
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === parentTaskId) {
            return {
              ...t,
              subtasks: [...(t.subtasks || []), created],
            };
          }
          return t;
        })
      );
      if (detailTask && detailTask.id === parentTaskId) {
        setDetailTask((prev) => ({
          ...prev!,
          subtasks: [...(prev!.subtasks || []), created],
        }));
      }
      if (!customTitle) {
        setNewSubtaskTitle((prev) => ({ ...prev, [parentTaskId]: '' }));
      }
      setExpandedSubtasks((prev) => ({ ...prev, [parentTaskId]: true }));
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleRescheduleToToday = async (id: string) => {
    try {
      await taskService.rescheduleToToday(id);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) return { ...t, dueDate: todayStr };
          if (t.subtasks && t.subtasks.some((s) => s.id === id)) {
            return {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === id ? { ...s, dueDate: todayStr } : s)),
            };
          }
          return t;
        })
      );
      if (detailTask) {
        if (detailTask.id === id) setDetailTask({ ...detailTask, dueDate: todayStr });
        else if (detailTask.subtasks && detailTask.subtasks.some((s) => s.id === id)) {
          setDetailTask({
            ...detailTask,
            subtasks: detailTask.subtasks.map((s) => (s.id === id ? { ...s, dueDate: todayStr } : s)),
          });
        }
      }
    } catch (err) {
      console.error('Failed to reschedule to today:', err);
    }
  };

  const handleExtendDeadline = async (task: Task, daysToAdd: number, hoursToAdd?: number) => {
    let newDueDate = task.dueDate || todayStr;
    let newDueTime = task.dueTime || '18:00';

    if (daysToAdd > 0) {
      const baseDate = !task.dueDate || task.dueDate < todayStr ? new Date() : new Date(task.dueDate + 'T00:00:00');
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      const y = baseDate.getFullYear();
      const m = String(baseDate.getMonth() + 1).padStart(2, '0');
      const d = String(baseDate.getDate()).padStart(2, '0');
      newDueDate = `${y}-${m}-${d}`;
    }

    if (hoursToAdd && hoursToAdd > 0) {
      const now = new Date();
      now.setHours(now.getHours() + hoursToAdd);
      const h = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      newDueTime = `${h}:${min}`;
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      newDueDate = `${y}-${m}-${d}`;
    }

    try {
      await taskService.updateTask(task.id, {
        dueDate: newDueDate,
        dueTime: newDueTime,
      });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) return { ...t, dueDate: newDueDate, dueTime: newDueTime };
          if (t.subtasks && t.subtasks.some((s) => s.id === task.id)) {
            return {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === task.id ? { ...s, dueDate: newDueDate, dueTime: newDueTime } : s)),
            };
          }
          return t;
        })
      );
      if (detailTask && detailTask.id === task.id) {
        setDetailTask((prev) => (prev ? { ...prev, dueDate: newDueDate, dueTime: newDueTime } : null));
      }
    } catch (err) {
      console.error('Failed to extend deadline:', err);
    }
    setExtendMenuTaskId(null);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (detailTask?.id === id) {
        setDetailTask(null);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleSaveTask = async (
    taskData: Partial<Task>,
    pendingResources?: PendingTaskResource[],
    pendingSubtasks?: string[]
  ) => {
    try {
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask.id, taskData);
        if (pendingResources && pendingResources.length > 0) {
          for (const res of pendingResources) {
            let resId = res.resourceId;
            if (res.isQuickAdd) {
              if (res.resourceType === 'WEBSITE' && res.url) {
                const newWeb = await websiteService.createWebsite({ name: res.title, url: res.url });
                resId = newWeb.id;
              } else if (res.resourceType === 'NOTE') {
                const newNote = await noteService.createNote({ title: res.title, content: res.content || '' });
                resId = newNote.id;
              } else if (res.resourceType === 'DRIVE_LINK' && res.url) {
                const newDrive = await driveService.createDriveLink({ name: res.title, url: res.url });
                resId = newDrive.id;
              } else if (res.resourceType === 'IDEA') {
                const newIdea = await ideaService.createIdea({ title: res.title, description: res.content || '' });
                resId = newIdea.id;
              }
            }
            if (resId) {
              await taskService.addResource(editingTask.id, res.resourceType, resId).catch(() => null);
            }
          }
        }
        if (pendingSubtasks && pendingSubtasks.length > 0) {
          for (const subTitle of pendingSubtasks) {
            if (subTitle.trim()) {
              await taskService.createSubtask(editingTask.id, {
                title: subTitle.trim(),
                dueDate: editingTask.dueDate || todayStr,
              }).catch(() => null);
            }
          }
        }
        const refreshed = await taskService.getTaskById(editingTask.id).catch(() => updated);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? (refreshed as Task) : t)));
        if (detailTask && detailTask.id === editingTask.id) {
          setDetailTask(refreshed as Task);
        }
      } else {
        const created = await taskService.createTask({ ...taskData, isGoal: true });
        if (pendingResources && pendingResources.length > 0) {
          for (const res of pendingResources) {
            let resId = res.resourceId;
            if (res.isQuickAdd) {
              if (res.resourceType === 'WEBSITE' && res.url) {
                const newWeb = await websiteService.createWebsite({ name: res.title, url: res.url });
                resId = newWeb.id;
              } else if (res.resourceType === 'NOTE') {
                const newNote = await noteService.createNote({ title: res.title, content: res.content || '' });
                resId = newNote.id;
              } else if (res.resourceType === 'DRIVE_LINK' && res.url) {
                const newDrive = await driveService.createDriveLink({ name: res.title, url: res.url });
                resId = newDrive.id;
              } else if (res.resourceType === 'IDEA') {
                const newIdea = await ideaService.createIdea({ title: res.title, description: res.content || '' });
                resId = newIdea.id;
              }
            }
            if (resId) {
              await taskService.addResource(created.id, res.resourceType, resId).catch(() => null);
            }
          }
        }
        if (pendingSubtasks && pendingSubtasks.length > 0) {
          for (const subTitle of pendingSubtasks) {
            if (subTitle.trim()) {
              await taskService.createSubtask(created.id, {
                title: subTitle.trim(),
                dueDate: created.dueDate || todayStr,
              }).catch(() => null);
            }
          }
        }
        const refreshed = await taskService.getTaskById(created.id).catch(() => created);
        setTasks((prev) => [refreshed, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save strategic goal:', err);
    }
    setEditingTask(undefined);
    setTaskModalOpen(false);
  };

  const toggleSubtasksExpand = (taskId: string) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Filter only strategic goals (exclude daily tasks and nested child subtasks)
  const rootGoals = tasks.filter((t: Task) => isStrategicGoal(t));

  const filteredGoals = rootGoals.filter((task) => {
    if (selectedCategory && task.categoryId !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchSub = task.subtasks?.some((s) => s.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSub) return false;
    }
    if (activeTab === 'OVERDUE') {
      return isTaskOverdue(task);
    }
    if (activeTab === 'IN_PROGRESS') {
      return task.status === 'IN_PROGRESS' || task.status === 'TODO';
    }
    if (activeTab === 'COMPLETED') {
      return task.status === 'COMPLETED';
    }
    return true;
  });

  // Calculate high-level progress analytics
  const totalGoalsCount = rootGoals.length;
  const completedGoalsCount = rootGoals.filter((g) => g.status === 'COMPLETED').length;
  const inProgressGoalsCount = rootGoals.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'TODO').length;
  const overallCompletionPercentage = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🎯 Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#17211B] dark:text-[#EAF7EF] tracking-tight flex items-center gap-2">
                Strategic Goals & Epics
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  {filteredGoals.length} Goals
                </span>
              </h1>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-0.5">
                Long-term milestones, architectural roadmaps, and structured step-by-step breakdowns.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setEditingTask(undefined);
              setTaskModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Strategic Goal</span>
          </button>
        </div>
      </div>

      {/* 📊 Strategic Progress Intelligence Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 dark:hover:border-purple-500/40 shadow-sm transition-all space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base flex items-center gap-2">
                <span>Milestone Completion Analytics</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider">
                  Roadmap
                </span>
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] font-medium mt-0.5">
                {completedGoalsCount} of {totalGoalsCount} Strategic Goals fully delivered
              </p>
            </div>
          </div>

          <div className="flex items-baseline sm:flex-col sm:items-end gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                {overallCompletionPercentage}%
              </span>
              <span className="text-xs font-semibold text-[#8A9890] dark:text-[#6F8A7A]">delivered</span>
            </div>
            <span className="text-[11px] font-semibold text-[#66736B] dark:text-[#9BB5A5]">
              {inProgressGoalsCount} in active progress
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#E8F7EF] dark:bg-[#13261C] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-[#5FBF8F] transition-all duration-500"
            style={{ width: `${overallCompletionPercentage}%` }}
          />
        </div>
      </div>

      {/* 🔍 Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
              )}
            >
              {tab === 'ALL' && 'All Goals'}
              {tab === 'IN_PROGRESS' && 'In Progress'}
              {tab === 'COMPLETED' && 'Completed'}
              {tab === 'OVERDUE' && 'Overdue'}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#8A9890] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search goals or subtasks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🎯 Strategic Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#0E1C15] border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
            <Target className="w-10 h-10 text-purple-400 mx-auto" />
            <h4 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
              No strategic goals found
            </h4>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
              Create a strategic goal to plan long-term project epics and break them down into daily execution steps.
            </p>
            <button
              onClick={() => {
                setEditingTask(undefined);
                setTaskModalOpen(true);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Strategic Goal</span>
            </button>
          </div>
        ) : (
          filteredGoals.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue = isTaskOverdue(task);
            const isExpanded = expandedSubtasks[task.id];
            const subtaskCount = task.subtasks?.length || 0;
            const completedSubtasks = task.subtasks?.filter((s) => s.status === 'COMPLETED').length || 0;
            const progress = subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : isCompleted ? 100 : 0;

            return (
              <div
                key={task.id}
                onClick={() => setDetailTask(task)}
                className={clsx(
                  'rounded-3xl border transition-all duration-200 overflow-hidden cursor-pointer shadow-xs',
                  isCompleted
                    ? 'bg-purple-50/30 dark:bg-[#13261C]/30 border-purple-300/40 dark:border-purple-900/40 opacity-80'
                    : isOverdue
                    ? 'bg-white dark:bg-[#0E1C15] border-rose-500/50 hover:border-rose-500'
                    : 'bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 dark:hover:border-purple-500'
                )}
              >
                {/* Main Card Header */}
                <div className="p-5 flex items-start gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(task);
                    }}
                    className={clsx(
                      'mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
                      isCompleted
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : isOverdue
                        ? 'border-rose-500/60 hover:border-rose-500 bg-white dark:bg-[#0E1C15] text-transparent'
                        : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-500 bg-white dark:bg-[#0E1C15] text-transparent'
                    )}
                  >
                    <CheckSquare className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h3
                          className={clsx(
                            'text-base font-bold transition-all truncate',
                            isCompleted
                              ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]'
                              : isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                              : 'text-[#17211B] dark:text-[#EAF7EF]'
                          )}
                        >
                          {task.title}
                        </h3>

                        {isOverdue && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> OVERDUE
                          </span>
                        )}

                        {isTaskBlocked(task) && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-xs">
                            <Lock className="w-2.5 h-2.5" /> Blocked
                          </span>
                        )}

                        {isTaskReady(task) && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                          </span>
                        )}
                      </div>

                      {/* Top Action Controls */}
                      <div className="flex items-center gap-1">
                        {/* Extend Deadline Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExtendMenuTaskId(extendMenuTaskId === task.id ? null : task.id);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#F3FBF7] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1 cursor-pointer border border-[#DCE9E1] dark:border-[#20372B]"
                          >
                            <Calendar className="w-3.5 h-3.5 text-purple-500" />
                            <span>Extend</span>
                          </button>

                          {extendMenuTaskId === task.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExtendMenuTaskId(null);
                                }}
                              />
                              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl z-50 p-1.5 space-y-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExtendDeadline(task, 1);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-purple-50 dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                                >
                                  <Sun className="w-3.5 h-3.5 text-[#5FBF8F]" />
                                  <span>+1 Day</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExtendDeadline(task, 3);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-purple-50 dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                  <span>+3 Days</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExtendDeadline(task, 7);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-left text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer font-semibold"
                                >
                                  <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                                  <span>+1 Week (Extend Milestone)</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDecomposeTask(task);
                          }}
                          className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors cursor-pointer"
                          title="AI Decompose & Break Down Goal"
                        >
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setTaskModalOpen(true);
                          }}
                          className="p-1.5 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-colors cursor-pointer"
                          title="Edit Goal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="p-1.5 text-[#8A9890] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata Details & Subtask Accordion Trigger */}
                    <div className="flex items-center justify-between gap-4 text-[11px] flex-wrap pt-1 border-t border-[#DCE9E1]/60 dark:border-[#20372B]/60">
                      <div className="flex items-center gap-3 text-[#8A9890] dark:text-[#6F8A7A] flex-wrap">
                        {task.dueDate && (
                          <span
                            className={clsx(
                              'flex items-center gap-1 font-medium',
                              isOverdue ? 'text-rose-500 font-bold' : ''
                            )}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Target: {task.dueDate} {task.dueTime ? `at ${formatDisplayTime(task.dueTime)}` : ''}
                          </span>
                        )}

                        {task.categoryName && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${task.categoryColor || '#5FBF8F'}20`,
                              color: task.categoryColor || '#237A57',
                            }}
                          >
                            {task.categoryName}
                          </span>
                        )}

                        {task.projectName && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Project: {task.projectName}
                          </span>
                        )}
                      </div>

                      {/* Subtasks Progress & Expand Trigger */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20"
                          title={`Milestone Progress: ${completedSubtasks} of ${subtaskCount} steps completed`}
                        >
                          <div className="w-16 h-1.5 bg-purple-200 dark:bg-purple-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 dark:bg-purple-400 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                            {progress}%
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubtasksExpand(task.id);
                          }}
                          className={clsx(
                            'px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs select-none active:scale-95',
                            isExpanded
                              ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/25 shadow-xs'
                              : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/25 hover:border-purple-500/40 text-purple-700 dark:text-purple-300'
                          )}
                        >
                          <ListTodo className="w-3.5 h-3.5" />
                          <span>{subtaskCount} Steps</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtasks Expanded Panel */}
                {isExpanded && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="px-6 pb-5 pt-3 bg-purple-50/20 dark:bg-purple-950/10 border-t border-[#DCE9E1] dark:border-[#20372B] space-y-3"
                  >
                    {task.subtasks && task.subtasks.length > 0 ? (
                      <div className="space-y-2">
                        {task.subtasks.map((sub) => {
                          const subDone = sub.status === 'COMPLETED';
                          const isSubToday = sub.dueDate === todayStr || sub.dueDate?.startsWith(todayStr);

                          return (
                            <div
                              key={sub.id}
                              className="p-3 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3 shadow-2xs"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                  onClick={() => handleToggleSubtaskStatus(task.id, sub)}
                                  className={clsx(
                                    'w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0',
                                    subDone
                                      ? 'bg-purple-600 border-purple-600 text-white'
                                      : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-500'
                                  )}
                                >
                                  {subDone && <CheckSquare className="w-3.5 h-3.5 fill-current" />}
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
                                  <span className="text-[10px] text-[#66736B] dark:text-[#9BB5A5] font-mono">
                                    {sub.dueTime.slice(0, 5)}
                                  </span>
                                )}
                                {isSubToday ? (
                                  <span
                                    className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] flex items-center gap-1 border border-[#5FBF8F]/30"
                                    title="Already scheduled for today's execution"
                                  >
                                    <Sun className="w-3 h-3 text-amber-500" /> Planned for Today
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleRescheduleToToday(sub.id)}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#237A57] hover:bg-[#E8F7EF] transition-all flex items-center gap-1 cursor-pointer border border-[#DCE9E1] dark:border-[#20372B]"
                                    title="Schedule for Today's Execution"
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
                        No subtasks yet. Break this goal down into steps below:
                      </p>
                    )}

                    {/* Quick Add Subtask Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newSubtaskTitle[task.id] || ''}
                        onChange={(e) =>
                          setNewSubtaskTitle((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask(task.id);
                          }
                        }}
                        placeholder="Add a milestone step and press Enter..."
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleAddSubtask(task.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs"
                      >
                        Add Step
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 📝 Task / Goal Create & Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(undefined);
        }}
        onSave={handleSaveTask}
        categories={categories}
        initialTask={editingTask}
        defaultType="EPIC"
      />

      {/* 🔍 In-depth Task Card Detail Modal */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          isOpen={true}
          onClose={() => setDetailTask(null)}
          onToggleStatus={handleToggleStatus}
          onToggleSubtask={handleToggleSubtaskStatus}
          onAddSubtask={(parentId, title) => handleAddSubtask(parentId, title)}
          onExtendDeadline={handleExtendDeadline}
          onDelete={handleDeleteTask}
          onUpdateTask={async (updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setDetailTask(updated);
          }}
          onEdit={(t: Task) => {
            setDetailTask(null);
            setEditingTask(t);
            setTaskModalOpen(true);
          }}
          allTasks={tasks}
          onSelectTask={(t) => setDetailTask(t)}
        />
      )}

      {/* 🪄 AI Epic / Strategic Task Decompose Modal */}
      <AiDecomposeModal
        task={decomposeTask}
        isOpen={!!decomposeTask}
        onClose={() => setDecomposeTask(null)}
        onSubtasksCreated={() => loadData()}
      />
    </div>
  );
};
