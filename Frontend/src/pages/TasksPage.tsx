import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  Trash2,
  Edit,
  CheckCircle2,
  Zap,
  AlertTriangle,
  RotateCw,
  Sun,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Briefcase,
  Calendar,
  CalendarPlus,
  CalendarDays,
  ExternalLink,
  Sparkles,
  Repeat,
  Target,
  Play,
  Lock
} from 'lucide-react';
import type { Task, Category, TaskStatus, TaskPriority, RecurringTask, RecurringTaskRequest, Project } from '../types';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { websiteService } from '../services/websiteService';
import { noteService } from '../services/noteService';
import { driveService } from '../services/driveService';
import { ideaService } from '../services/ideaService';
import { recurringTaskService } from '../services/recurringTaskService';
import { projectService } from '../services/projectService';
import { TaskModal, PendingTaskResource } from '../components/tasks/TaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { AiPlanTodayModal } from '../components/tasks/AiPlanTodayModal';
import { AiDecomposeModal } from '../components/tasks/AiDecomposeModal';
import { TaskCalendarView } from '../components/tasks/TaskCalendarView';
import { RecurringTasksPanel } from '../components/tasks/RecurringTasksPanel';
import { RecurringTaskModal } from '../components/tasks/RecurringTaskModal';
import { calculateTaskProgress, generateCompactTrendBar } from '../utils/taskProgress';
import { clsx } from 'clsx';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [completedFilter, setCompletedFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK'>('ALL');
  const [viewMode, setViewMode] = useState<'TODAY' | 'CALENDAR' | 'RECURRING' | 'GOALS'>('TODAY');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<'TODAY' | 'EPIC'>('TODAY');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurringTask, setEditingRecurringTask] = useState<RecurringTask | undefined>(undefined);
  const [isGeneratingToday, setIsGeneratingToday] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<Record<string, string>>({});
  const [showOverdueBanner, setShowOverdueBanner] = useState(true);
  const [extendMenuTaskId, setExtendMenuTaskId] = useState<string | null>(null);
  const [aiPlanTodayOpen, setAiPlanTodayOpen] = useState(false);
  const [decomposeTask, setDecomposeTask] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User-configurable daily workload capacity (in minutes, default 360 = 6 hours)
  const [dailyCapacityMinutes, setDailyCapacityMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('aiu_daily_capacity_minutes');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 360;
  });

  const handleCapacityChange = (newCapacity: number) => {
    setDailyCapacityMinutes(newCapacity);
    localStorage.setItem('aiu_daily_capacity_minutes', String(newCapacity));
  };

  const reqSeqRef = useRef(0);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTasks();
    } catch (err) {
      console.error('Failed to refresh tasks:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateTodayTask = () => {
    setSelectedCalendarDate(null);
    setModalDefaultType('TODAY');
    setEditingTask(undefined);
    setTaskModalOpen(true);
  };

  const openCreateEpic = () => {
    setSelectedCalendarDate(null);
    setModalDefaultType('EPIC');
    setEditingTask(undefined);
    setTaskModalOpen(true);
  };

  // Debounce search input to prevent duplicate requests and network thrashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Load workspace metadata (categories, recurring tasks, projects) separately
  const loadMetadata = async () => {
    try {
      const [fetchedCats, fetchedRecurring, fetchedProjects] = await Promise.all([
        categoryService.getCategories().catch(() => []),
        recurringTaskService.getRecurringTasks().catch(() => []),
        projectService.getProjects().catch(() => []),
      ]);
      setCategories(fetchedCats);
      setRecurringTasks(fetchedRecurring);
      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Failed to load tasks metadata:', err);
    }
  };

  // Fetch tasks with request sequence tracking to prevent stale state from race conditions
  const fetchTasks = async (searchTerm?: string, catId?: string) => {
    const seq = ++reqSeqRef.current;
    try {
      const fetched = await taskService.getTasks({
        search: searchTerm || undefined,
        categoryId: catId || undefined,
      });
      if (seq === reqSeqRef.current) {
        setTasks(fetched);
      }
    } catch (err) {
      if (seq === reqSeqRef.current) {
        console.error('Failed to fetch tasks:', err);
      }
    }
  };

  const loadTasks = async () => {
    await Promise.all([
      loadMetadata(),
      fetchTasks(debouncedSearch, selectedCategory),
    ]);
  };

  useEffect(() => {
    loadMetadata();
    const handleCreated = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.type === 'task') {
        fetchTasks(debouncedSearch, selectedCategory);
      } else {
        loadMetadata();
      }
    };
    const handleCategoryUpdate = () => loadMetadata();

    window.addEventListener('workspace-resource-created', handleCreated);
    window.addEventListener('workspace-category-updated', handleCategoryUpdate);
    return () => {
      window.removeEventListener('workspace-resource-created', handleCreated);
      window.removeEventListener('workspace-category-updated', handleCategoryUpdate);
    };
  }, []);

  useEffect(() => {
    fetchTasks(debouncedSearch, selectedCategory);
  }, [debouncedSearch, selectedCategory]);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const prevTasks = tasks;
    const prevDetail = detailTask;

    const applyStatus = (list: Task[], statusToSet: TaskStatus): Task[] =>
      list.map((t) => {
        if (t.id === task.id) return { ...t, status: statusToSet };
        if (t.subtasks && t.subtasks.some((s) => s.id === task.id)) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === task.id ? { ...s, status: statusToSet } : s)),
          };
        }
        return t;
      });

    setTasks((prev) => applyStatus(prev, nextStatus));
    setDetailTask((prev) => {
      if (!prev) return null;
      if (prev.id === task.id) return { ...prev, status: nextStatus };
      if (prev.subtasks && prev.subtasks.some((s) => s.id === task.id)) {
        return {
          ...prev,
          subtasks: prev.subtasks.map((s) => (s.id === task.id ? { ...s, status: nextStatus } : s)),
        };
      }
      return prev;
    });

    try {
      const updated = await taskService.updateTaskStatus(task.id, nextStatus);
      const applyResolved = (list: Task[]): Task[] =>
        list.map((t) => {
          if (t.id === task.id) return updated;
          if (t.subtasks && t.subtasks.some((s) => s.id === task.id)) {
            return {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === task.id ? updated : s)),
            };
          }
          return t;
        });

      setTasks((prev) => applyResolved(prev));
      setDetailTask((prev) => {
        if (!prev) return null;
        if (prev.id === task.id) return updated;
        if (prev.subtasks && prev.subtasks.some((s) => s.id === task.id)) {
          return {
            ...prev,
            subtasks: prev.subtasks.map((s) => (s.id === task.id ? updated : s)),
          };
        }
        return prev;
      });

      // Synchronize full task list so all dependent tasks re-derive blocked/ready states immediately
      const refreshedList = await taskService.getTasks().catch(() => null);
      if (refreshedList) {
        setTasks(refreshedList);
        if (detailTask) {
          const matched = refreshedList.find((t) => t.id === detailTask.id);
          if (matched) setDetailTask(matched);
        }
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setTasks(prevTasks);
      setDetailTask(prevDetail);
    }
  };

  const handleToggleSubtaskStatus = async (parentTaskId: string, subtask: Task) => {
    const nextStatus: TaskStatus = subtask.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const prevTasks = tasks;
    const prevDetail = detailTask;

    const applyStatus = (list: Task[], statusToSet: TaskStatus): Task[] =>
      list.map((t) => {
        if (t.id === parentTaskId && t.subtasks) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === subtask.id ? { ...s, status: statusToSet } : s)),
          };
        }
        if (t.id === subtask.id) {
          return { ...t, status: statusToSet };
        }
        return t;
      });

    setTasks((prev) => applyStatus(prev, nextStatus));
    setDetailTask((prev) => {
      if (!prev) return null;
      if (prev.id === parentTaskId && prev.subtasks) {
        return {
          ...prev,
          subtasks: prev.subtasks.map((s) => (s.id === subtask.id ? { ...s, status: nextStatus } : s)),
        };
      }
      if (prev.id === subtask.id) {
        return { ...prev, status: nextStatus };
      }
      return prev;
    });

    try {
      const updated = await taskService.updateTaskStatus(subtask.id, nextStatus);
      const applyResolved = (list: Task[]): Task[] =>
        list.map((t) => {
          if (t.id === parentTaskId && t.subtasks) {
            return {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === subtask.id ? updated : s)),
            };
          }
          if (t.id === subtask.id) {
            return updated;
          }
          return t;
        });

      setTasks((prev) => applyResolved(prev));
      setDetailTask((prev) => {
        if (!prev) return null;
        if (prev.id === parentTaskId && prev.subtasks) {
          return {
            ...prev,
            subtasks: prev.subtasks.map((s) => (s.id === subtask.id ? updated : s)),
          };
        }
        if (prev.id === subtask.id) {
          return updated;
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to toggle subtask status:', err);
      setTasks(prevTasks);
      setDetailTask(prevDetail);
    }
  };

  const handleStartTask = async (task: Task) => {
    try {
      await taskService.updateTaskStatus(task.id, 'IN_PROGRESS');
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) return { ...t, status: 'IN_PROGRESS' };
          if (t.subtasks && t.subtasks.some((s) => s.id === task.id)) {
            return {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === task.id ? { ...s, status: 'IN_PROGRESS' } : s)),
            };
          }
          return t;
        })
      );
      setDetailTask((prev) => {
        if (!prev) return null;
        if (prev.id === task.id) return { ...prev, status: 'IN_PROGRESS' };
        if (prev.subtasks && prev.subtasks.some((s) => s.id === task.id)) {
          return {
            ...prev,
            subtasks: prev.subtasks.map((s) => (s.id === task.id ? { ...s, status: 'IN_PROGRESS' } : s)),
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to start task:', err);
    }
  };

  const handleAddSubtask = async (parentTaskId: string, customTitle?: string) => {
    const title = customTitle || newSubtaskTitle[parentTaskId]?.trim();
    if (!title) return;

    try {
      const created = await taskService.createSubtask(parentTaskId, { title, dueDate: todayStr });
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
      setDetailTask((prev) => {
        if (prev && prev.id === parentTaskId) {
          return {
            ...prev,
            subtasks: [...(prev.subtasks || []), created],
          };
        }
        return prev;
      });
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
      setDetailTask((prev) => {
        if (!prev) return prev;
        if (prev.id === id) return { ...prev, dueDate: todayStr };
        if (prev.subtasks && prev.subtasks.some((s) => s.id === id)) {
          return {
            ...prev,
            subtasks: prev.subtasks.map((s) => (s.id === id ? { ...s, dueDate: todayStr } : s)),
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to reschedule to today:', err);
    }
  };

  const handleExtendDeadline = async (task: Task, daysToAdd: number, hoursToAdd?: number) => {
    let newDueDate = task.dueDate || todayStr;
    let newDueTime = task.dueTime || '18:00';

    if (daysToAdd > 0) {
      const baseDate = (!task.dueDate || task.dueDate < todayStr) ? new Date() : new Date(task.dueDate + 'T00:00:00');
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
      setDetailTask((prev) => {
        if (!prev) return prev;
        if (prev.id === task.id) return { ...prev, dueDate: newDueDate, dueTime: newDueTime };
        if (prev.subtasks && prev.subtasks.some((s) => s.id === task.id)) {
          return {
            ...prev,
            subtasks: prev.subtasks.map((s) => (s.id === task.id ? { ...s, dueDate: newDueDate, dueTime: newDueTime } : s)),
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to extend deadline:', err);
    }
    setExtendMenuTaskId(null);
  };

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Optimistic immediate UI update to prevent any render lag or ghost cards
    setTasks((prev) =>
      prev
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          subtasks: t.subtasks?.filter((s) => s.id !== id),
        }))
    );
    setDetailTask((prev) => (prev && prev.id === id ? null : prev));
    setEditingTask((prev) => (prev && prev.id === id ? undefined : prev));
    setDecomposeTask((prev) => (prev && prev.id === id ? null : prev));

    try {
      await taskService.deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
      // Re-sync with backend if delete fails
      fetchTasks(debouncedSearch, selectedCategory);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>, pendingResources?: PendingTaskResource[]) => {
    try {
      if (editingTask) {
        // Edit mode
        const updated = await taskService.updateTask(editingTask.id, taskData);
        if (editingTask.resources && editingTask.resources.length > 0) {
          const pendingKeys = (pendingResources || []).map((r) => `${r.resourceType}_${r.resourceId}`);
          for (const oldRes of editingTask.resources) {
            if (!pendingKeys.includes(`${oldRes.resourceType}_${oldRes.resourceId}`)) {
              await taskService.removeResource(editingTask.id, oldRes.id).catch(() => null);
            }
          }
        }
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
        const refreshed = await taskService.getTaskById(editingTask.id).catch(() => updated);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? (refreshed as Task) : t))
        );
        setDetailTask((prev) => (prev && prev.id === editingTask.id ? (refreshed as Task) : prev));
      } else {
        // Create mode
        const created = await taskService.createTask(taskData);
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
        const refreshed = await taskService.getTaskById(created.id).catch(() => created);
        setTasks((prev) => [refreshed, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save task with resources:', err);
    }
    setEditingTask(undefined);
  };

  const handleSaveRecurringTask = async (data: RecurringTaskRequest, editingId?: string) => {
    try {
      if (editingId || editingRecurringTask) {
        const idToUpdate = editingId || editingRecurringTask!.id;
        const updated = await recurringTaskService.updateRecurringTask(idToUpdate, data);
        setRecurringTasks((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await recurringTaskService.createRecurringTask(data);
        setRecurringTasks((prev) => [created, ...prev]);
      }
      setEditingRecurringTask(undefined);
      setRecurringModalOpen(false);
      // Reload tasks because creating a daily or matching recurring task might immediately generate today's instance
      await loadTasks();
    } catch (err) {
      console.error('Failed to save recurring task:', err);
    }
  };

  const handleDeleteRecurringTask = async (id: string) => {
    try {
      await recurringTaskService.deleteRecurringTask(id);
      setRecurringTasks((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete recurring task:', err);
    }
  };

  const handleTogglePauseResumeRecurring = async (task: RecurringTask) => {
    try {
      const updated =
        task.status === 'ACTIVE'
          ? await recurringTaskService.pauseRecurringTask(task.id)
          : await recurringTaskService.resumeRecurringTask(task.id);
      setRecurringTasks((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (task.status !== 'ACTIVE') {
        // If resuming, today's task might be generated immediately
        await loadTasks();
      }
    } catch (err) {
      console.error('Failed to toggle recurring task status:', err);
    }
  };

  const handleTriggerGenerateToday = async (): Promise<void> => {
    setIsGeneratingToday(true);
    try {
      await recurringTaskService.triggerGenerateToday();
      await loadTasks();
    } catch (err) {
      console.error('Failed to generate today tasks:', err);
    } finally {
      setIsGeneratingToday(false);
    }
  };

  const handleScheduleForDate = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    setModalDefaultType('TODAY');
    setEditingTask(undefined);
    setTaskModalOpen(true);
  };

  const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getLocalTodayStr();

  const isTaskOverdue = (task: Task) => {
    if (task.status === 'COMPLETED' || !task.dueDate) return false;
    if (task.dueDate < todayStr) return true;
    if (task.dueDate === todayStr && task.dueTime) {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      return task.dueTime < currentTimeStr;
    }
    return false;
  };

  const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const clean = timeStr.slice(0, 5);
    const parts = clean.split(':');
    if (parts.length !== 2) return clean;
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return clean;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${h12}:${minutes} ${period}`;
  };

  const priorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-600/15 text-red-500 border-red-500/40 font-bold';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'LOW':
        return 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border-[#5FBF8F]/30';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  const priorityTextClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-500 font-bold';
      case 'HIGH':
        return 'text-rose-500 font-semibold';
      case 'MEDIUM':
        return 'text-amber-500 font-medium';
      case 'LOW':
        return 'text-[#237A57] dark:text-[#6DD6A0] font-medium';
      default:
        return 'text-gray-500';
    }
  };

  const formatPriority = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgent';
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Medium';
      case 'LOW':
        return 'Low';
      default:
        return priority;
    }
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

  const formatWorkloadDuration = (totalMinutes: number): string => {
    if (totalMinutes <= 0) return '0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  const formatDueDisplay = (task: Task) => {
    const timeSlot = formatTaskTimeSlot(task.dueTime, task.estimatedDuration);
    const timeFormatted = timeSlot || (task.dueTime ? formatDisplayTime(task.dueTime) : '');
    if (isTaskOverdue(task)) {
      if (task.dueDate === todayStr && timeFormatted) {
        return `Today ${timeFormatted} (Overdue)`;
      }
      return `${task.dueDate || 'Past'}${timeFormatted ? ' ' + timeFormatted : ''} (Overdue)`;
    }
    if (task.dueDate === todayStr || task.dueDate?.startsWith(todayStr)) {
      return timeFormatted ? `Today ${timeFormatted}` : 'Today';
    }
    if (task.dueDate) {
      return `${task.dueDate}${timeFormatted ? ' ' + timeFormatted : ''}`;
    }
    return 'No due date';
  };

  interface FocusCandidate {
    task: Task;
    parentTask?: Task;
    isSubtask: boolean;
    projectName?: string;
  }

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

  const isTaskDueToday = (task: Task): boolean => {
    if (!task.dueDate) return false;
    return task.dueDate === todayStr || task.dueDate.startsWith(todayStr);
  };

  const priorityWeight: Record<TaskPriority, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  // Deterministic candidate selection for "Focus Now" Daily Execution Engine
  // Selection criteria order:
  // 1. Overdue
  // 2. Due today
  // 3. High priority
  // 4. In progress
  // 5. Earliest due time
  // 6. Unblocked tasks
  const focusCandidate: FocusCandidate | null = (() => {
    const candidates: FocusCandidate[] = [];

    // 1. Gather all active root tasks
    for (const t of tasks) {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') continue;

      const overdue = isTaskOverdue(t);
      const dueToday = isTaskDueToday(t);
      const inProgress = t.status === 'IN_PROGRESS';

      if (overdue || dueToday || inProgress) {
        candidates.push({
          task: t,
          isSubtask: false,
          projectName: t.projectName || projects.find((p) => p.id === t.projectId)?.name,
        });
      }

      // 2. Also inspect subtasks
      if (t.subtasks && t.subtasks.length > 0) {
        for (const sub of t.subtasks) {
          if (sub.status === 'COMPLETED' || sub.status === 'CANCELLED') continue;
          const subOverdue = isTaskOverdue(sub);
          const subDueToday = isTaskDueToday(sub);
          const subInProgress = sub.status === 'IN_PROGRESS';

          if (subOverdue || subDueToday || subInProgress) {
            candidates.push({
              task: sub,
              parentTask: t,
              isSubtask: true,
              projectName:
                sub.projectName ||
                t.projectName ||
                projects.find((p) => p.id === (sub.projectId || t.projectId))?.name,
            });
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // Strict deterministic comparator
    candidates.sort((cA, cB) => {
      const a = cA.task;
      const b = cB.task;

      // 1. Overdue
      const aOverdue = isTaskOverdue(a);
      const bOverdue = isTaskOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // 2. Due today
      const aToday = isTaskDueToday(a);
      const bToday = isTaskDueToday(b);
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;

      // 3. High priority
      const pA = priorityWeight[a.priority] || 1;
      const pB = priorityWeight[b.priority] || 1;
      if (pA !== pB) return pB - pA;

      // 4. In progress
      const aProg = a.status === 'IN_PROGRESS';
      const bProg = b.status === 'IN_PROGRESS';
      if (aProg && !bProg) return -1;
      if (!aProg && bProg) return 1;

      // 5. Earliest due time
      const aTime = a.dueTime ? a.dueTime.slice(0, 5) : '';
      const bTime = b.dueTime ? b.dueTime.slice(0, 5) : '';
      if (aTime && bTime && aTime !== bTime) {
        return aTime.localeCompare(bTime);
      }
      if (aTime && !bTime) return -1;
      if (!aTime && bTime) return 1;

      // 6. Unblocked tasks
      const aBlocked = isTaskBlocked(a);
      const bBlocked = isTaskBlocked(b);
      if (!aBlocked && bBlocked) return -1;
      if (aBlocked && !bBlocked) return 1;

      // Deterministic tie-breaker
      return (a.id || '').localeCompare(b.id || '');
    });

    return candidates[0];
  })();

  // Documented Workload Thresholds for indicator calculation (easily modifiable)
  // 🟢 Manageable: <= 80% of configured daily capacity
  // 🟠 Heavy: 81% - 100% of configured daily capacity
  // 🔴 Overloaded: > 100% of configured daily capacity
  const WORKLOAD_THRESHOLDS = {
    manageableMaxPercent: 80,
    heavyMaxPercent: 100,
  };

  type WorkloadIndicator = 'MANAGEABLE' | 'HEAVY' | 'OVERLOADED';

  const getWorkloadIndicator = (
    estimatedMinutes: number,
    capacityMinutes: number,
    thresholds = WORKLOAD_THRESHOLDS
  ): WorkloadIndicator => {
    if (capacityMinutes <= 0) return 'OVERLOADED';
    const percent = (estimatedMinutes / capacityMinutes) * 100;
    if (percent <= thresholds.manageableMaxPercent) return 'MANAGEABLE';
    if (percent <= thresholds.heavyMaxPercent) return 'HEAVY';
    return 'OVERLOADED';
  };

  // Compute Today's Workload metrics from actual task estimates
  const workloadMetrics = (() => {
    let estimated = 0;
    let completed = 0;
    let countWithEstimates = 0;

    for (const t of tasks) {
      if (t.parentTaskId) continue; // Prevent double counting subtasks

      const hasSubtasksForToday = t.subtasks && t.subtasks.some(
        (s) => s.dueDate === todayStr || s.dueDate?.startsWith(todayStr)
      );

      if (hasSubtasksForToday && t.subtasks) {
        for (const s of t.subtasks) {
          if (s.dueDate === todayStr || s.dueDate?.startsWith(todayStr)) {
            if (s.estimatedDuration && s.estimatedDuration > 0) {
              estimated += s.estimatedDuration;
              countWithEstimates++;
              if (s.status === 'COMPLETED') {
                completed += s.estimatedDuration;
              }
            }
          }
        }
      } else if (t.dueDate === todayStr || t.dueDate?.startsWith(todayStr)) {
        if (t.estimatedDuration && t.estimatedDuration > 0) {
          estimated += t.estimatedDuration;
          countWithEstimates++;
          if (t.status === 'COMPLETED') {
            completed += t.estimatedDuration;
          }
        }
      }
    }

    const remaining = Math.max(0, estimated - completed);
    return {
      estimated,
      completed,
      remaining,
      hasEstimates: countWithEstimates > 0,
      countWithEstimates,
    };
  })();

  const workloadIndicator = workloadMetrics.hasEstimates
    ? getWorkloadIndicator(workloadMetrics.estimated, dailyCapacityMinutes)
    : null;

  const toggleSubtasksExpand = (taskId: string) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const isTaskCompletedToday = (task: Task) => {
    if (task.status !== 'COMPLETED') return false;
    if (!task.completedAt) return false;
    const d = new Date(task.completedAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const isTaskCompletedThisWeek = (task: Task) => {
    if (task.status !== 'COMPLETED') return false;
    if (!task.completedAt) return false;
    const d = new Date(task.completedAt);
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return d >= monday && d <= sunday;
  };

  // Filter calculations
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || t.dueDate?.startsWith(todayStr));
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const completedTodayTasks = tasks.filter((t) => isTaskCompletedToday(t));
  const completedThisWeekTasks = tasks.filter((t) => isTaskCompletedThisWeek(t));

  const filteredTasks = tasks.filter((task) => {
    if (selectedCategory && task.categoryId !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchSub = task.subtasks?.some((s) => s.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSub) return false;
    }
    if (activeTab === 'TODAY') {
      return task.dueDate === todayStr || task.dueDate?.startsWith(todayStr);
    }
    if (activeTab === 'OVERDUE') {
      return isTaskOverdue(task);
    }
    if (activeTab === 'IN_PROGRESS') {
      return task.status === 'IN_PROGRESS' || task.status === 'TODO';
    }
    if (activeTab === 'COMPLETED') {
      if (task.status !== 'COMPLETED') return false;
      if (completedFilter === 'TODAY') {
        return isTaskCompletedToday(task);
      }
      if (completedFilter === 'THIS_WEEK') {
        return isTaskCompletedThisWeek(task);
      }
      return true;
    }
    return true;
  });

  // Split tasks into Today's Tasks vs Strategic Goals / Long-term Tasks
  // Exclude child subtasks from root card rendering so subtasks stay properly nested inside parent cards
  const rootTasks = filteredTasks.filter((t: Task) => !t.parentTaskId);

  const isForToday = (t: Task) =>
    t.dueDate === todayStr ||
    t.dueDate?.startsWith(todayStr);

  const todayTasksList = rootTasks.filter((t: Task) => isForToday(t));
  const mainTasksList = rootTasks.filter((t: Task) => !isForToday(t) || (t.subtasks && t.subtasks.length > 0));

  // Extract all subtasks scheduled for today with their parent strategic goal context
  const todaySubtasks = React.useMemo(() => {
    const list: { subtask: Task; parentTask: Task }[] = [];
    tasks.forEach((parent) => {
      if (!parent.parentTaskId && parent.subtasks && parent.subtasks.length > 0) {
        parent.subtasks.forEach((sub) => {
          if (sub.dueDate === todayStr || sub.dueDate?.startsWith(todayStr)) {
            if (selectedCategory && parent.categoryId !== selectedCategory && sub.categoryId !== selectedCategory) {
              return;
            }
            if (search.trim()) {
              const q = search.toLowerCase();
              const matchSub = sub.title.toLowerCase().includes(q) || sub.description?.toLowerCase().includes(q);
              const matchParent = parent.title.toLowerCase().includes(q);
              if (!matchSub && !matchParent) return;
            }
            if (activeTab === 'COMPLETED') {
              if (sub.status !== 'COMPLETED') return;
              if (completedFilter === 'TODAY' && !isTaskCompletedToday(sub)) return;
              if (completedFilter === 'THIS_WEEK' && !isTaskCompletedThisWeek(sub)) return;
            }
            if (activeTab === 'IN_PROGRESS' && sub.status === 'COMPLETED') return;
            list.push({ subtask: sub, parentTask: parent });
          }
        });
      }
    });
    return list;
  }, [tasks, todayStr, selectedCategory, search, activeTab, completedFilter]);

  const todayTotalItemsCount = todayTasksList.length + todaySubtasks.length;

  // Single Documented Source of Truth for Progress & Analytics
  const progressMetrics = React.useMemo(() => {
    return calculateTaskProgress(tasks);
  }, [tasks]);

  let displayTitle = 'Overall Tasks Progress';
  if (activeTab === 'TODAY') {
    displayTitle = "Today's Focus Tasks";
  } else if (activeTab === 'OVERDUE') {
    displayTitle = 'Overdue Tasks Status';
  } else if (activeTab === 'IN_PROGRESS') {
    displayTitle = 'Active / In Progress Tasks';
  } else if (activeTab === 'COMPLETED') {
    displayTitle = 'Completed Tasks Archive';
  }

  const renderTaskCard = (task: Task, isMainSection: boolean = false) => {
    const isOverdue = isTaskOverdue(task);
    const isExpanded = !!expandedSubtasks[task.id];
    const subtaskCount = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter((s) => s.status === 'COMPLETED').length || 0;

    return (
      <div
        key={task.id}
        onClick={() => setDetailTask(task)}
        className={clsx(
          'rounded-2xl border transition-all duration-200 shadow-xs relative cursor-pointer group',
          extendMenuTaskId === task.id ? 'z-30' : 'z-10',
          isOverdue
            ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/40 dark:border-rose-900/40 hover:border-rose-500 hover:shadow-md'
            : task.status === 'COMPLETED'
            ? 'bg-[#E8F7EF]/60 dark:bg-[#13261C]/60 border-[#5FBF8F]/30 dark:border-[#20372B] opacity-75 hover:opacity-100 hover:border-[#5FBF8F]'
            : 'bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] dark:hover:border-[#6DD6A0] hover:shadow-lg hover:scale-[1.003]'
        )}
      >
        {/* Main Task Item Header */}
        <div className="p-4 flex items-start gap-3.5">
          {/* Checkbox Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(task);
            }}
            className={clsx(
              'mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
              task.status === 'COMPLETED'
                ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                : isOverdue
                ? 'border-rose-500/60 hover:border-rose-500 bg-white dark:bg-[#0E1C15] text-transparent'
                : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] bg-white dark:bg-[#0E1C15] text-transparent'
            )}
          >
            <CheckSquare className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Body Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h4
                  className={clsx(
                    'text-sm font-semibold transition-all group-hover:text-[#237A57] dark:group-hover:text-[#6DD6A0] truncate',
                    task.status === 'COMPLETED'
                      ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]'
                      : isOverdue
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-[#17211B] dark:text-[#EAF7EF]'
                  )}
                >
                  {task.title}
                </h4>

                {/* Overdue Alert Badge */}
                {isOverdue && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> OVERDUE
                  </span>
                )}

                {/* Derived Blocked / Ready Badge */}
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

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isMainSection && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRescheduleToToday(task.id);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    title="Move to Today's Tasks"
                  >
                    <Sun className="w-3 h-3 text-amber-500" />
                    Do Today
                  </button>
                )}

                {/* Extend Deadline Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExtendMenuTaskId(extendMenuTaskId === task.id ? null : task.id);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#F3FBF7] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all flex items-center gap-1 cursor-pointer border border-[#DCE9E1] dark:border-[#20372B]"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-500" />
                    Extend
                  </button>

                  {extendMenuTaskId === task.id && (
                    <>
                      {/* Outside click overlay */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExtendMenuTaskId(null);
                        }}
                      />

                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider border-b border-[#DCE9E1]/60 dark:border-[#20372B]/60 flex items-center justify-between">
                          <span>Extend Deadline</span>
                          <span className="text-[9px] text-[#5FBF8F]">Quick Extend</span>
                        </div>
                        <button
                          onClick={() => handleExtendDeadline(task, 0, 1)}
                          className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>+1 Hour</span>
                        </button>
                        <button
                          onClick={() => handleExtendDeadline(task, 1)}
                          className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Sun className="w-3.5 h-3.5 text-[#5FBF8F]" />
                          <span>+1 Day (Tomorrow)</span>
                        </button>
                        <button
                          onClick={() => handleExtendDeadline(task, 3)}
                          className="w-full px-2.5 py-1.5 text-left text-xs text-[#17211B] dark:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>+3 Days</span>
                        </button>
                        <button
                          onClick={() => handleExtendDeadline(task, 7)}
                          className="w-full px-2.5 py-1.5 text-left text-xs text-purple-600 dark:text-purple-400 hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer font-semibold"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                          <span>+1 Week (Extend Milestone)</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setTaskModalOpen(true);
                            setExtendMenuTaskId(null);
                          }}
                          className="w-full px-2.5 py-1.5 text-left text-xs text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg flex items-center gap-2 cursor-pointer border-t border-[#DCE9E1]/60 dark:border-[#20372B]/60"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Custom Date & Time...</span>
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
                  title="AI Decompose & Break Down Task"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTask(task);
                    setTaskModalOpen(true);
                  }}
                  className="p-1.5 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-colors cursor-pointer"
                  title="Edit task"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id, e);
                  }}
                  className="p-1.5 text-[#8A9890] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Footer Metadata */}
            <div className="flex items-center justify-between gap-4 text-[11px] flex-wrap pt-1">
              <div className="flex items-center gap-3.5 text-[#8A9890] dark:text-[#6F8A7A] flex-wrap">
                {/* Date / Time Display */}
                {!isMainSection ? (
                  /* Today's Tasks: show time slot where available (e.g. 09:00 — 09:45) */
                  <span
                    className={clsx(
                      'flex items-center gap-1 font-medium',
                      isOverdue ? 'text-rose-500 font-bold' : 'text-[#66736B] dark:text-[#9BB5A5]'
                    )}
                  >
                    <Clock className={clsx('w-3.5 h-3.5', isOverdue ? 'text-rose-500' : 'text-amber-500 dark:text-amber-400')} />
                    {isOverdue ? (
                      <span>
                        Overdue {task.dueTime ? `(${formatTaskTimeSlot(task.dueTime, task.estimatedDuration) || formatDisplayTime(task.dueTime)})` : ''}
                      </span>
                    ) : task.dueTime ? (
                      <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                        {formatTaskTimeSlot(task.dueTime, task.estimatedDuration)}
                      </span>
                    ) : (
                      <span>Today</span>
                    )}
                  </span>
                ) : (
                  /* Strategic Goals & Epics: show full due date and time slot */
                  task.dueDate && (
                    <span
                      className={clsx(
                        'flex items-center gap-1 font-medium',
                        isOverdue ? 'text-rose-500 font-bold' : ''
                      )}
                    >
                      <Clock className={clsx('w-3.5 h-3.5', isOverdue ? 'text-rose-500' : 'text-[#8A9890]')} />
                      Due {task.dueDate} {task.dueTime ? `at ${formatTaskTimeSlot(task.dueTime, task.estimatedDuration) || formatDisplayTime(task.dueTime)}` : ''}
                    </span>
                  )
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
                {task.recurringTaskId && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Repeat className="w-3 h-3 text-emerald-500" />
                    Recurring
                  </span>
                )}
                {task.estimatedDuration && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-500" />
                    {task.estimatedDuration}m
                  </span>
                )}
                {task.projectName && (
                  task.projectId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects?id=${task.projectId}`);
                      }}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      title="Open Project Workspace"
                    >
                      <Briefcase className="w-3 h-3" /> Project: {task.projectName}
                    </button>
                  ) : (
                    <span className="text-purple-500 dark:text-purple-400 font-medium flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Project: {task.projectName}
                    </span>
                  )
                )}
              </div>

              {/* Subtasks Accordion Button & Progress Bar (Only for Strategic Goals & Epics) */}
              {isMainSection && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  {subtaskCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20" title={`Goal Progress: ${completedSubtasks} of ${subtaskCount} steps completed`}>
                      <div className="w-14 h-1.5 bg-purple-200 dark:bg-purple-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 dark:bg-purple-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((completedSubtasks / subtaskCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 font-mono">
                        {Math.round((completedSubtasks / subtaskCount) * 100)}%
                      </span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtasksExpand(task.id);
                    }}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ListTodo className="w-3.5 h-3.5" />
                    {subtaskCount > 0 ? `${completedSubtasks}/${subtaskCount} Steps` : '+ Steps'}
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDecomposeTask(task);
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1 cursor-pointer border border-purple-500/20"
                    title="AI Auto-Break Down into Subtasks"
                  >
                    <Sparkles className="w-3 h-3 text-purple-500" /> AI Breakdown
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtasks Expanded Panel (Only for Strategic Goals & Epics) */}
        {isMainSection && isExpanded && (
          <div className="px-5 pb-4 pt-2 bg-[#F3FBF7]/50 dark:bg-[#13261C]/30 border-t border-[#DCE9E1] dark:border-[#20372B] space-y-3">
            {task.subtasks && task.subtasks.length > 0 ? (
              <div className="space-y-2">
                {task.subtasks.map((sub) => {
                  const subDone = sub.status === 'COMPLETED';
                  const isSubToday = sub.dueDate === todayStr || sub.dueDate?.startsWith(todayStr);
                  return (
                    <div
                      key={sub.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleSubtaskStatus(task.id, sub)}
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
                            onClick={() => handleRescheduleToToday(sub.id)}
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
              <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A] italic">No subtasks yet. Add smaller steps below:</p>
            )}

            {/* Inline Add Subtask Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle[task.id] || ''}
                onChange={(e) =>
                  setNewSubtaskTitle((prev) => ({ ...prev, [task.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask(task.id);
                }}
                placeholder="Add a new subtask (e.g. Write integration test) and press Enter..."
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
              />
              <button
                onClick={() => handleAddSubtask(task.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-[#237A57] hover:bg-[#5FBF8F] text-white rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-7 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#5FBF8F]" />
            Task Management System
          </h1>
          <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5]">
            Structured daily execution & long-term project epics with subtasks hierarchy.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setAiPlanTodayOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-[var(--color-primary-deep)] via-[var(--color-primary-hover)] to-[var(--color-primary)] hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[var(--color-primary)]/40"
          >
            <Sparkles className="w-4 h-4 text-white/90 animate-pulse" />
            AI Plan Today
          </button>
          <button
            onClick={openCreateTodayTask}
            className="px-3.5 py-2.5 bg-gradient-to-r from-[var(--color-primary-hover)] to-[var(--color-primary)] hover:brightness-105 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Sun className="w-4 h-4 text-amber-300" />
            Add Today's Task
          </button>
          <button
            onClick={() => {
              setEditingRecurringTask(undefined);
              setRecurringModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-[#5FBF8F] hover:text-white text-[#237A57] dark:text-[#6DD6A0] font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-[#5FBF8F]/30"
          >
            <Repeat className="w-4 h-4 text-emerald-500" />
            Add Recurring
          </button>
          <button
            onClick={openCreateEpic}
            className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer border border-purple-400/30"
          >
            <Briefcase className="w-4 h-4 text-purple-200" />
            Add Strategic Goal
          </button>
        </div>
      </div>

      {/* View Mode Navigation Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setViewMode('TODAY')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
            viewMode === 'TODAY'
              ? 'bg-[#5FBF8F] text-white shadow-md'
              : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#F3FBF7] dark:hover:bg-[#13261C]'
          )}
        >
          <Sun className="w-4 h-4 text-amber-300" />
          <span>☀️ Today's Execution</span>
          <span
            className={clsx(
              'px-1.5 py-0.5 text-[10px] rounded-full font-extrabold',
              viewMode === 'TODAY'
                ? 'bg-white/20 text-white'
                : 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]'
            )}
          >
            {todayTotalItemsCount}
          </span>
        </button>

        <button
          onClick={() => setViewMode('CALENDAR')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
            viewMode === 'CALENDAR'
              ? 'bg-[#5FBF8F] text-white shadow-md'
              : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#F3FBF7] dark:hover:bg-[#13261C]'
          )}
        >
          <CalendarDays className="w-4 h-4 text-blue-400" />
          <span>📅 Calendar & Upcoming</span>
        </button>

        <button
          onClick={() => setViewMode('RECURRING')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
            viewMode === 'RECURRING'
              ? 'bg-[#5FBF8F] text-white shadow-md'
              : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#F3FBF7] dark:hover:bg-[#13261C]'
          )}
        >
          <Repeat className="w-4 h-4 text-emerald-400" />
          <span>🔁 Recurring Routines</span>
          <span
            className={clsx(
              'px-1.5 py-0.5 text-[10px] rounded-full font-extrabold',
              viewMode === 'RECURRING'
                ? 'bg-white/20 text-white'
                : 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]'
            )}
          >
            {recurringTasks.length}
          </span>
        </button>

        <button
          onClick={() => setViewMode('GOALS')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
            viewMode === 'GOALS'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-purple-50 dark:hover:bg-purple-950/20'
          )}
        >
          <Target className="w-4 h-4 text-purple-300" />
          <span>🎯 Strategic Goals & Epics</span>
          <span
            className={clsx(
              'px-1.5 py-0.5 text-[10px] rounded-full font-extrabold',
              viewMode === 'GOALS'
                ? 'bg-white/20 text-white'
                : 'bg-purple-100 dark:bg-purple-950/40 text-purple-500'
            )}
          >
            {mainTasksList.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📅 CALENDAR VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'CALENDAR' && (
        <TaskCalendarView
          tasks={tasks}
          onToggleStatus={handleToggleStatus}
          onOpenTaskDetail={(task: Task) => setDetailTask(task)}
          onEditTask={(task: Task) => {
            setEditingTask(task);
            setTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onAddTaskForDate={handleScheduleForDate}
        />
      )}

      {/* ========================================================================= */}
      {/* 🔁 RECURRING TASKS ROUTINES PANEL */}
      {/* ========================================================================= */}
      {viewMode === 'RECURRING' && (
        <RecurringTasksPanel
          recurringTasks={recurringTasks}
          onTogglePauseResume={handleTogglePauseResumeRecurring}
          onEdit={(task) => {
            setEditingRecurringTask(task);
            setRecurringModalOpen(true);
          }}
          onDelete={handleDeleteRecurringTask}
          onOpenCreate={() => {
            setEditingRecurringTask(undefined);
            setRecurringModalOpen(true);
          }}
          onTriggerGenerateToday={handleTriggerGenerateToday}
          isGenerating={isGeneratingToday}
        />
      )}

      {/* ========================================================================= */}
      {/* ☀️ TODAY & 🎯 GOALS VIEWS */}
      {/* ========================================================================= */}
      {(viewMode === 'TODAY' || viewMode === 'GOALS') && (
        <>
          {/* Overdue / Missed Tasks Review Section (Only shown in Today view) */}
          {viewMode === 'TODAY' && overdueTasks.length > 0 && showOverdueBanner && (
            <div className="p-5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/30 space-y-3.5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                      Missed & Overdue Tasks Review
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500 text-white">
                        {overdueTasks.length} Overdue
                      </span>
                    </h3>
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                      These tasks exceeded their scheduled date or time. Reschedule them to today with 1 click or clear them.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOverdueBanner(false)}
                  className="text-xs text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              {/* Overdue Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {overdueTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-white dark:bg-[#0E1C15] border border-rose-500/30 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {t.taskKey && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-rose-500/10 text-rose-500">
                            {t.taskKey}
                          </span>
                        )}
                        <h4 className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] truncate">{t.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Was due: {t.dueDate} {t.dueTime ? `at ${t.dueTime}` : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.dueDate && t.dueDate !== todayStr ? (
                        // For Strategic Goals & Epics: Extend by 1 week so it stays in Strategic Goals & Epics!
                        <button
                          onClick={() => handleExtendDeadline(t, 7)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-500/15 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1 cursor-pointer border border-purple-500/30"
                          title="Extend Milestone by 1 Week (Keeps task in Strategic Goals & Epics)"
                        >
                          <CalendarPlus className="w-3 h-3 text-purple-500" />
                          Extend (+1 Wk)
                        </button>
                      ) : (
                        // For Today's Tasks: Postpone by 1 day
                        <button
                          onClick={() => handleExtendDeadline(t, 1)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                          title="Postpone to tomorrow (+1 Day)"
                        >
                          <RotateCw className="w-3 h-3" />
                          +1 Day
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingTask(t);
                          setTaskModalOpen(true);
                        }}
                        className="p-1.5 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-lg transition-colors cursor-pointer"
                        title="Edit / Extend custom date"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1.5 text-[#8A9890] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Stats Card — Tasks Analytics and Progress Intelligence */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] dark:hover:border-[#6DD6A0] shadow-sm space-y-4 transition-all">
            {/* Header with Title & Overall % */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] flex items-center justify-center font-bold shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base flex items-center gap-2">
                    <span>{viewMode === 'GOALS' ? 'Strategic Goals Progress' : displayTitle}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30 uppercase tracking-wider">
                      Factual Analytics
                    </span>
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] font-medium mt-0.5">
                    {progressMetrics.completed} of {progressMetrics.total} Active Tasks Completed
                  </p>
                </div>
              </div>

              <div className="flex items-baseline sm:flex-col sm:items-end gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-[#237A57] dark:text-[#6DD6A0]">
                    {progressMetrics.overallPercentage}%
                  </span>
                  <span className="text-xs font-semibold text-[#8A9890] dark:text-[#6F8A7A]">overall</span>
                </div>
                {progressMetrics.estimatedWorkloadMinutes > 0 && (
                  <span className="text-[11px] font-semibold text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#237A57] dark:text-[#6DD6A0]" />
                    Workload: ~{progressMetrics.estimatedWorkloadFormatted}
                  </span>
                )}
              </div>
            </div>

            {/* Main Overall Progress Bar */}
            <div className="w-full h-3 bg-[#E8F7EF] dark:bg-[#13261C] rounded-full overflow-hidden p-0.5 border border-[#DCE9E1]/60 dark:border-[#20372B]/60">
              <div
                className="h-full bg-gradient-to-r from-[#5FBF8F] to-[#237A57] dark:from-[#48A375] dark:to-[#6DD6A0] rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressMetrics.overallPercentage}%` }}
              />
            </div>

            {/* Core 5 Metrics Grid: Total, Completed, Remaining, Overdue, In Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
              {/* Total */}
              <div className="p-3 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/50 border border-[#E1EBE4]/60 dark:border-[#20372B]/50">
                <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] uppercase font-bold tracking-wider block">
                  Total
                </span>
                <span className="text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] block mt-0.5">
                  {progressMetrics.total}
                </span>
                <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] block truncate">
                  Active tasks
                </span>
              </div>

              {/* Completed */}
              <div className="p-3 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] border border-[#5FBF8F]/30 dark:border-[#6DD6A0]/20">
                <span className="text-[10px] text-[#237A57] dark:text-[#6DD6A0] uppercase font-bold tracking-wider block">
                  Completed
                </span>
                <span className="text-lg font-bold text-[#237A57] dark:text-[#6DD6A0] block mt-0.5">
                  {progressMetrics.completed}
                </span>
                <span className="text-[10px] text-[#237A57]/80 dark:text-[#6DD6A0]/80 block truncate">
                  {progressMetrics.overallPercentage}% finished
                </span>
              </div>

              {/* Remaining */}
              <div className="p-3 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/50 border border-[#E1EBE4]/60 dark:border-[#20372B]/50">
                <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] uppercase font-bold tracking-wider block">
                  Remaining
                </span>
                <span className="text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] block mt-0.5">
                  {progressMetrics.remaining}
                </span>
                <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] block truncate">
                  To be done
                </span>
              </div>

              {/* Overdue */}
              <div
                className={clsx(
                  'p-3 rounded-2xl border transition-colors',
                  progressMetrics.overdue > 0
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C]/50 border-[#E1EBE4]/60 dark:border-[#20372B]/50'
                )}
              >
                <span
                  className={clsx(
                    'text-[10px] uppercase font-bold tracking-wider block',
                    progressMetrics.overdue > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[#8A9890] dark:text-[#6F8A7A]'
                  )}
                >
                  Overdue
                </span>
                <span
                  className={clsx(
                    'text-lg font-bold block mt-0.5',
                    progressMetrics.overdue > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[#17211B] dark:text-[#EAF7EF]'
                  )}
                >
                  {progressMetrics.overdue}
                </span>
                <span
                  className={clsx(
                    'text-[10px] block truncate',
                    progressMetrics.overdue > 0
                      ? 'text-rose-600/80 dark:text-rose-400/80'
                      : 'text-[#8A9890] dark:text-[#6F8A7A]'
                  )}
                >
                  {progressMetrics.overdue > 0 ? 'Past deadline' : 'None overdue'}
                </span>
              </div>

              {/* In Progress */}
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider block">
                  In Progress
                </span>
                <span className="text-lg font-bold text-amber-800 dark:text-amber-300 block mt-0.5">
                  {progressMetrics.inProgress}
                </span>
                <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block truncate">
                  Actively running
                </span>
              </div>
            </div>

            {/* Compact Trends Section (Today & Weekly Completion) */}
            <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Today's Trend */}
              <div className="p-3 rounded-2xl bg-[#F8FCFA] dark:bg-[#111F18] border border-[#E1EBE4] dark:border-[#1E3326] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                      Today
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#237A57] dark:text-[#6DD6A0]">
                      {progressMetrics.todayPercentage}%
                    </span>
                    <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                      ({progressMetrics.todayCompleted}/{progressMetrics.todayTotal})
                    </span>
                  </div>
                </div>

                {/* Compact Bar Chart / Blocks */}
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-[#E1EBE4] dark:bg-[#1A2E22] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${progressMetrics.todayPercentage}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#66736B] dark:text-[#9BB5A5] shrink-0">
                    {generateCompactTrendBar(progressMetrics.todayPercentage, 8)}
                  </span>
                </div>

                {progressMetrics.todayWorkloadMinutes > 0 && (
                  <div className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                    Estimated workload remaining today: ~{progressMetrics.todayWorkloadFormatted}
                  </div>
                )}
              </div>

              {/* Weekly Trend */}
              <div className="p-3 rounded-2xl bg-[#F8FCFA] dark:bg-[#111F18] border border-[#E1EBE4] dark:border-[#1E3326] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                      This Week
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#237A57] dark:text-[#6DD6A0]">
                      {progressMetrics.weeklyPercentage}%
                    </span>
                    <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                      ({progressMetrics.weeklyCompleted}/{progressMetrics.weeklyTotal})
                    </span>
                  </div>
                </div>

                {/* Compact Bar Chart / Blocks */}
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-[#E1EBE4] dark:bg-[#1A2E22] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
                      style={{ width: `${progressMetrics.weeklyPercentage}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#66736B] dark:text-[#9BB5A5] shrink-0">
                    {generateCompactTrendBar(progressMetrics.weeklyPercentage, 8)}
                  </span>
                </div>

                {progressMetrics.archivedCount > 0 && (
                  <div className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                    {progressMetrics.archivedCount} archived/cancelled task{progressMetrics.archivedCount > 1 ? 's' : ''} excluded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm">
            {/* Navigation Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#F3FBF7] dark:bg-[#13261C] rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">
              {(['ALL', 'TODAY', 'OVERDUE', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
                    activeTab === tab
                      ? 'bg-[#5FBF8F] text-white shadow-md'
                      : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#1a3324]'
                  )}
                >
                  {tab === 'ALL' && `All Sections (${tasks.length})`}
                  {tab === 'TODAY' && `Today's Focus (${todayTasks.length})`}
                  {tab === 'OVERDUE' && (
                    <>
                      Overdue
                      {overdueTasks.length > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-bold">
                          {overdueTasks.length}
                        </span>
                      )}
                    </>
                  )}
                  {tab === 'IN_PROGRESS' && `In Progress (${inProgressTasks.length})`}
                  {tab === 'COMPLETED' && `Completed (${completedTasks.length})`}
                </button>
              ))}
            </div>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A9890] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks or subtasks..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-xs text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-xs text-[#17211B] dark:text-[#EAF7EF] outline-none focus:border-[#5FBF8F] cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Completed Review Bar (Lightweight review filter for Completed tasks) */}
          {activeTab === 'COMPLETED' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#E8F7EF]/60 dark:bg-[#13261C]/60 border border-[#5FBF8F]/40 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏆</span>
                <div>
                  <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider">
                    Completed Tasks Review
                  </h4>
                  <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5]">
                    Review finished tasks using actual completion timestamps.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-[#0E1C15]/80 rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">
                <button
                  type="button"
                  onClick={() => setCompletedFilter('ALL')}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    completedFilter === 'ALL'
                      ? 'bg-[#5FBF8F] text-white shadow-xs'
                      : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                  )}
                >
                  All Completed ({completedTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedFilter('TODAY')}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    completedFilter === 'TODAY'
                      ? 'bg-[#5FBF8F] text-white shadow-xs'
                      : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                  )}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Completed Today ({completedTodayTasks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedFilter('THIS_WEEK')}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    completedFilter === 'THIS_WEEK'
                      ? 'bg-[#5FBF8F] text-white shadow-xs'
                      : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                  )}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Completed This Week ({completedThisWeekTasks.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* ☀️ SECTION 1: FOCUS NOW & TODAY'S EXECUTION (Shown in Today view) */}
          {viewMode === 'TODAY' && (
            <>
              {/* 🎯 FOCUS NOW ENGINE HERO SECTION */}
              {focusCandidate ? (
                <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-[#F3FBF7] to-[#E8F7EF]/60 dark:from-[#0E1C15] dark:via-[#13261C] dark:to-[#173024] border-2 border-[#5FBF8F]/40 dark:border-[#5FBF8F]/30 shadow-md transition-all">
                  {/* Subtle ambient decorative glow */}
                  <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#5FBF8F]/10 dark:bg-[#5FBF8F]/15 blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    {/* Top Header Tag */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span className="text-xs font-black tracking-widest uppercase text-[#237A57] dark:text-[#6DD6A0]">
                          FOCUS NOW
                        </span>
                      </div>
                      {focusCandidate.isSubtask && focusCandidate.parentTask && (
                        <span className="text-[11px] font-medium text-[#66736B] dark:text-[#9BB5A5] truncate max-w-[200px] sm:max-w-xs">
                          Part of: <strong className="text-[#17211B] dark:text-[#EAF7EF]">{focusCandidate.parentTask.title}</strong>
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#17211B] dark:text-[#EAF7EF] tracking-tight">
                        {focusCandidate.task.title}
                      </h2>
                      {focusCandidate.task.description && (
                        <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1 line-clamp-2">
                          {focusCandidate.task.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata Details */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs py-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Priority:</span>
                        <span className={clsx('font-bold', priorityTextClass(focusCandidate.task.priority))}>
                          {formatPriority(focusCandidate.task.priority)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Due:</span>
                        <span className={clsx('font-semibold', isTaskOverdue(focusCandidate.task) ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-[#17211B] dark:text-[#EAF7EF]')}>
                          {formatDueDisplay(focusCandidate.task)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Project:</span>
                        {focusCandidate.task.projectId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects?id=${focusCandidate.task.projectId}`);
                            }}
                            className="font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            title="Open Project Workspace"
                          >
                            <span>{focusCandidate.projectName || 'DocuSphere'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="font-semibold text-[#237A57] dark:text-[#6DD6A0]">
                            {focusCandidate.projectName || 'General'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => setDetailTask(focusCandidate.task)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] bg-white dark:bg-[#13261C] hover:bg-[#E8F7EF] dark:hover:bg-[#1B3527] transition-all cursor-pointer shadow-xs"
                      >
                        Open Task
                      </button>

                      {isTaskBlocked(focusCandidate.task) ? (
                        <div
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-not-allowed"
                          title="Task is blocked by predecessor dependencies"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Blocked</span>
                        </div>
                      ) : focusCandidate.task.status === 'IN_PROGRESS' ? (
                        <button
                          onClick={() => setDetailTask(focusCandidate.task)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#5FBF8F] hover:bg-[#4EAE7E] text-[#0E1C15] transition-all shadow-sm cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Continue working</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartTask(focusCandidate.task)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#5FBF8F] hover:bg-[#4EAE7E] text-[#0E1C15] transition-all shadow-sm cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start task</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-[#F3FBF7] to-[#E8F7EF]/30 dark:from-[#0E1C15] dark:via-[#13261C] dark:to-[#173024]/40 border border-[#DCE9E1] dark:border-[#20372B] shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] flex items-center justify-center text-xl shrink-0 border border-[#5FBF8F]/20">
                      🎉
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-1.5">
                        Nothing urgent
                      </h3>
                      <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-0.5">
                        You have no immediate task requiring attention.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ⏱️ TODAY'S WORKLOAD ENGINE */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#DCE9E1] dark:border-[#20372B]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]">
                      <Clock className="w-5 h-5 text-[#237A57] dark:text-[#6DD6A0]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wide">
                          TODAY'S WORKLOAD
                        </h2>
                        {workloadMetrics.hasEstimates && workloadIndicator && (
                          <span
                            className={clsx(
                              'px-2.5 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1.5',
                              workloadIndicator === 'MANAGEABLE'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : workloadIndicator === 'HEAVY'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            )}
                          >
                            {workloadIndicator === 'MANAGEABLE' && '🟢 Manageable'}
                            {workloadIndicator === 'HEAVY' && '🟠 Heavy'}
                            {workloadIndicator === 'OVERLOADED' && '🔴 Overloaded'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                        {workloadMetrics.hasEstimates
                          ? `Planned daily execution against ${Math.round(dailyCapacityMinutes / 60)}h configured capacity.`
                          : 'Estimated workload unavailable — add duration estimates to your tasks to track workload.'}
                      </p>
                    </div>
                  </div>

                  {/* Configurable Daily Capacity Selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Daily Capacity:</span>
                    <select
                      value={dailyCapacityMinutes}
                      onChange={(e) => handleCapacityChange(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] outline-none focus:border-[#5FBF8F] cursor-pointer"
                      title="Adjust your planned working capacity for today"
                    >
                      <option value={240}>4h (Part-time)</option>
                      <option value={360}>6h (Focus Day)</option>
                      <option value={480}>8h (Full Day)</option>
                      <option value={600}>10h (Extended)</option>
                    </select>
                  </div>
                </div>

                {workloadMetrics.hasEstimates ? (
                  <div className="space-y-4">
                    {/* 3 Workload Metrics: Estimated, Completed, Remaining */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/50 border border-[#DCE9E1] dark:border-[#20372B]">
                        <span className="text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider block">
                          Estimated
                        </span>
                        <span className="text-lg sm:text-xl font-black text-[#17211B] dark:text-[#EAF7EF] mt-0.5 block">
                          {formatWorkloadDuration(workloadMetrics.estimated)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] border border-[#5FBF8F]/20">
                        <span className="text-[11px] font-bold text-[#237A57] dark:text-[#6DD6A0] uppercase tracking-wider block">
                          Completed
                        </span>
                        <span className="text-lg sm:text-xl font-black text-[#237A57] dark:text-[#6DD6A0] mt-0.5 block">
                          {formatWorkloadDuration(workloadMetrics.completed)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/50 border border-[#DCE9E1] dark:border-[#20372B]">
                        <span className="text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider block">
                          Remaining
                        </span>
                        <span className="text-lg sm:text-xl font-black text-[#17211B] dark:text-[#EAF7EF] mt-0.5 block">
                          {formatWorkloadDuration(workloadMetrics.remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Workload Progress Bar vs Capacity */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">
                        <span>
                          {Math.round((workloadMetrics.completed / Math.max(workloadMetrics.estimated, 1)) * 100)}% Completed of Estimated
                        </span>
                        <span>
                          {Math.round((workloadMetrics.estimated / dailyCapacityMinutes) * 100)}% of {Math.round(dailyCapacityMinutes / 60)}h Capacity
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#E8F7EF] dark:bg-[#13261C] rounded-full overflow-hidden flex border border-[#DCE9E1]/60 dark:border-[#20372B]">
                        <div
                          className="h-full bg-[#5FBF8F] dark:bg-[#6DD6A0] transition-all duration-500"
                          style={{ width: `${Math.min(100, (workloadMetrics.completed / dailyCapacityMinutes) * 100)}%` }}
                          title={`Completed: ${formatWorkloadDuration(workloadMetrics.completed)}`}
                        />
                        <div
                          className="h-full bg-amber-400/70 dark:bg-amber-500/60 transition-all duration-500"
                          style={{ width: `${Math.min(Math.max(0, 100 - (workloadMetrics.completed / dailyCapacityMinutes) * 100), (workloadMetrics.remaining / dailyCapacityMinutes) * 100)}%` }}
                          title={`Remaining: ${formatWorkloadDuration(workloadMetrics.remaining)}`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/30 border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center">
                    <p className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5]">
                      Estimated workload unavailable
                    </p>
                    <p className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A] mt-0.5">
                      Add duration estimates to your today tasks to track planned daily workload and indicators.
                    </p>
                  </div>
                )}
              </div>

              {/* Today's Execution Tasks Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCE9E1] dark:border-[#20372B] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]">
                      <Sun className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                        Today's Execution Tasks
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                          {todayTotalItemsCount} Planned
                        </span>
                      </h2>
                      <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                        {activeTab === 'COMPLETED'
                          ? `Completed daily priority tasks & goal execution steps for today (${todayStr}).`
                          : activeTab === 'IN_PROGRESS'
                          ? `In-progress daily priority tasks & goal execution steps for today (${todayStr}).`
                          : activeTab === 'OVERDUE'
                          ? `Overdue daily tasks scheduled for today (${todayStr}).`
                          : `Daily priority checklist & strategic goal execution steps scheduled for today (${todayStr}).`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={openCreateTodayTask}
                    className="text-xs font-semibold text-[#237A57] dark:text-[#6DD6A0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Today
                  </button>
                </div>

                <div className="space-y-4">
                  {todayTotalItemsCount === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/40 border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
                      <Sun className="w-8 h-8 text-amber-400 mx-auto" />
                      <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                        {activeTab === 'COMPLETED'
                          ? completedFilter === 'TODAY'
                            ? 'No tasks completed today'
                            : completedFilter === 'THIS_WEEK'
                            ? 'No tasks completed this week'
                            : 'No completed tasks'
                          : activeTab === 'IN_PROGRESS'
                          ? "No in-progress tasks for today — you're all caught up! 🎉"
                          : activeTab === 'OVERDUE'
                          ? 'No overdue tasks for today! Great job 👏'
                          : 'No tasks scheduled for today yet 🎉'}
                      </h4>
                      <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-md mx-auto">
                        {activeTab === 'ALL' || activeTab === 'TODAY'
                          ? 'Pick subtasks from your Strategic Goals & Epics section below using "Do Today" or click "+ Add to Today" to schedule your focus work.'
                          : 'Switch tabs or add a task to organize your day.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Top-Level Tasks Scheduled for Today */}
                      {todayTasksList.length > 0 && (
                        <div className="space-y-3">
                          {todayTasksList.map((task) => renderTaskCard(task, false))}
                        </div>
                      )}

                      {/* Strategic Goal Execution Steps Scheduled for Today */}
                      {todaySubtasks.length > 0 && (
                        <div className="pt-2 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider flex items-center gap-2">
                              <span className="text-sm">🎯</span>
                              <span>Strategic Goal Execution Steps for Today</span>
                              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                {todaySubtasks.length} {todaySubtasks.length === 1 ? 'Step' : 'Steps'}
                              </span>
                            </h3>
                            <span className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                              Synchronized with Strategic Goals
                            </span>
                          </div>

                          <div className="space-y-2">
                            {todaySubtasks.map(({ subtask, parentTask }) => {
                              const isSubDone = subtask.status === 'COMPLETED';
                              return (
                                <div
                                  key={subtask.id}
                                  onClick={() => setDetailTask(subtask)}
                                  className={clsx(
                                    'p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group shadow-2xs',
                                    isSubDone
                                      ? 'bg-[#E8F7EF]/50 dark:bg-[#13261C]/50 border-[#5FBF8F]/30 opacity-80'
                                      : 'bg-[#F8FCFA] dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] dark:hover:border-[#6DD6A0] hover:shadow-xs'
                                  )}
                                >
                                  {/* Left: Checkbox + Title + Goal & Project Context */}
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSubtaskStatus(parentTask.id, subtask);
                                      }}
                                      className={clsx(
                                        'w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer',
                                        isSubDone
                                          ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                                          : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] bg-white dark:bg-[#0E1C15]'
                                      )}
                                      title={isSubDone ? 'Mark as Incomplete' : 'Mark as Completed'}
                                    >
                                      {isSubDone && <CheckSquare className="w-3.5 h-3.5 fill-current" />}
                                    </button>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={clsx(
                                            'text-xs font-semibold truncate',
                                            isSubDone
                                              ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]'
                                              : 'text-[#17211B] dark:text-[#EAF7EF]'
                                          )}
                                        >
                                          {subtask.title}
                                        </span>
                                        {subtask.priority && (
                                          <span className={clsx('text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase', priorityBadgeClass(subtask.priority))}>
                                            {subtask.priority}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 text-[11px] text-[#66736B] dark:text-[#9BB5A5] mt-1 flex-wrap">
                                        {/* Parent Strategic Goal Context */}
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDetailTask(parentTask);
                                          }}
                                          className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                                          title={`View Strategic Goal: ${parentTask.title}`}
                                        >
                                          <Target className="w-3 h-3 text-purple-500" />
                                          <span className="truncate max-w-[220px]">Goal: {parentTask.title}</span>
                                        </span>

                                        {/* Project Context */}
                                        {(parentTask.projectName || subtask.projectName) && (
                                          <span className="flex items-center gap-1 text-[#66736B] dark:text-[#9BB5A5]">
                                            <Briefcase className="w-3 h-3 text-[#237A57]" />
                                            <span>{parentTask.projectName || subtask.projectName}</span>
                                          </span>
                                        )}

                                        {/* Duration / Time */}
                                        {subtask.dueTime && (
                                          <span className="flex items-center gap-1 font-mono text-[#8A9890]">
                                            <Clock className="w-3 h-3" />
                                            {formatTaskTimeSlot(subtask.dueTime, subtask.estimatedDuration)}
                                          </span>
                                        )}
                                        {subtask.estimatedDuration && !subtask.dueTime && (
                                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                            {subtask.estimatedDuration}m
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Badge */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] flex items-center gap-1 border border-[#5FBF8F]/20">
                                      <Sun className="w-3 h-3 text-amber-500" /> Planned for Today
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 🎯 SECTION 2: STRATEGIC GOALS & EPICS */}
          {(viewMode === 'GOALS' || (viewMode === 'TODAY' && activeTab !== 'TODAY')) && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE9E1] dark:border-[#20372B] pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                      Strategic Goals & Epics
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        {mainTasksList.length} Goals & Epics
                      </span>
                    </h2>
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                      {activeTab === 'COMPLETED'
                        ? 'Completed strategic goals and architectural epics archive.'
                        : activeTab === 'IN_PROGRESS'
                        ? 'Active strategic goals and long-term project epics in progress.'
                        : activeTab === 'OVERDUE'
                        ? 'Overdue strategic goals and long-term project milestones.'
                        : 'Long-term project milestones, architectural epics, and structured step-by-step breakdowns.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={openCreateEpic}
                  className="text-xs font-semibold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Strategic Goal
                </button>
              </div>

              <div className="space-y-3">
                {mainTasksList.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/40 border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#5FBF8F] mx-auto" />
                    <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                      {activeTab === 'COMPLETED'
                        ? 'No completed strategic goals found'
                        : activeTab === 'IN_PROGRESS'
                        ? 'No in-progress strategic goals found'
                        : activeTab === 'OVERDUE'
                        ? 'No overdue strategic goals found'
                        : 'No other strategic goals or epics found'}
                    </h4>
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-md mx-auto">
                      {activeTab === 'ALL'
                        ? 'All goals and tasks are either completed or scheduled for today.'
                        : 'Switch tabs or create a new strategic goal.'}
                    </p>
                  </div>
                ) : (
                  mainTasksList.map((task) => renderTaskCard(task, true))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Creation / Edit Modal Dialog */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(undefined);
          setSelectedCalendarDate(null);
        }}
        onSave={handleSaveTask}
        categories={categories}
        initialTask={editingTask}
        defaultType={modalDefaultType}
        defaultDueDate={selectedCalendarDate || undefined}
      />

      {/* Recurring Task Create/Edit Modal */}
      <RecurringTaskModal
        isOpen={recurringModalOpen}
        onClose={() => {
          setRecurringModalOpen(false);
          setEditingRecurringTask(undefined);
        }}
        onSave={handleSaveRecurringTask}
        categories={categories}
        projects={projects}
        initialTask={editingRecurringTask}
      />

      {/* In-depth Task Card Detail Workspace */}
      <TaskDetailModal
        task={detailTask}
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        onToggleStatus={handleToggleStatus}
        onToggleSubtask={handleToggleSubtaskStatus}
        onAddSubtask={(parentId, title) => handleAddSubtask(parentId, title)}
        onExtendDeadline={handleExtendDeadline}
        onDelete={handleDeleteTask}
        onUpdateTask={async (updated) => {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setDetailTask(updated);
          const full = await taskService.getTasks().catch(() => null);
          if (full) setTasks(full);
        }}
        onEdit={(t: Task) => {
          setDetailTask(null);
          setEditingTask(t);
          setTaskModalOpen(true);
        }}
        allTasks={tasks}
        onSelectTask={(t) => setDetailTask(t)}
      />

      {/* AI Daily Planner Modal */}
      <AiPlanTodayModal
        isOpen={aiPlanTodayOpen}
        onClose={() => setAiPlanTodayOpen(false)}
        onTasksCreated={() => loadTasks()}
        onTaskSelected={(t) => setDetailTask(t)}
      />

      {/* AI Epic / Strategic Task Decompose Modal */}
      <AiDecomposeModal
        task={decomposeTask}
        isOpen={!!decomposeTask}
        onClose={() => setDecomposeTask(null)}
        onSubtasksCreated={() => loadTasks()}
      />
    </div>
  );
};

