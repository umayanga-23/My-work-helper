import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckSquare,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ListTree,
  CornerDownRight,
  Plane,
  Code2,
  Terminal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Task, TaskStatus, Category, Project } from '../types';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { projectService } from '../services/projectService';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { FocusNowCard } from '../components/tasks/FocusNowCard';
import { AiPlanTodayModal } from '../components/tasks/AiPlanTodayModal';
import { useLiveSync } from '../hooks/useLiveSync';
import { getLocalDateString } from '../utils/taskProgress';
import { clsx } from 'clsx';

interface AmbitionSlide {
  image: string;
  category: 'aviation' | 'it';
  badge: string;
  title: string;
  quote: string;
  sub: string;
}

const ALL_AMBITION_SLIDES: AmbitionSlide[] = [
  {
    image: '/ambition-1.jpg',
    category: 'aviation',
    badge: 'Aviation Ambition • Flight Goal',
    title: 'Aim High, Fly Higher',
    quote: 'Every great flight begins with relentless focus, discipline, and daily execution.',
    sub: 'Boeing 777 Sunset Cruising • Infinite Horizon',
  },
  {
    image: '/it-1.jpg',
    category: 'it',
    badge: 'Software Engineering • Clean Code',
    title: 'Architecting Scalable Systems',
    quote: 'Code is craft. Build resilient solutions that power the future with precision.',
    sub: 'Full-Stack Architecture & Cloud Systems',
  },
  {
    image: '/ambition-2.jpg',
    category: 'aviation',
    badge: 'Flight Deck Mastery • Captain Mindset',
    title: 'Master The Cockpit',
    quote: 'Command your journey with calm precision. Navigate through turbulence into clear skies.',
    sub: 'Avionics, Systems & Technical Excellence',
  },
  {
    image: '/it-2.jpg',
    category: 'it',
    badge: 'Developer Focus • Deep Work',
    title: 'Engineering The Future',
    quote: 'Discipline in programming turns complex challenges into robust digital reality.',
    sub: 'High-Impact Software Development & Algorithms',
  },
  {
    image: '/ambition-3.jpg',
    category: 'aviation',
    badge: 'Peak Ascent • Limitless Altitude',
    title: 'Soar Above The Clouds',
    quote: 'The sky is not your limit; it is the starting point of what you are destined to achieve.',
    sub: 'Alpine Range Climb • Elevation & Vision',
  },
  {
    image: '/it-3.jpg',
    category: 'it',
    badge: 'Cloud & Infrastructure • DevOps',
    title: 'Global High-Tech Infrastructure',
    quote: 'Design resilient networks and distributed cloud architectures that never fail.',
    sub: 'Data Center Engineering & DevOps Mastery',
  },
  {
    image: '/ambition-4.jpg',
    category: 'aviation',
    badge: 'Runway Acceleration • Momentum',
    title: 'Full Throttle Takeoff',
    quote: 'Momentum is created when passion meets preparation. Commit full power to your goals.',
    sub: 'Twilight Runway Takeoff • Unstoppable Power',
  },
  {
    image: '/it-4.jpg',
    category: 'it',
    badge: 'Tech Innovation • Command Center',
    title: 'Code, Create, Elevate',
    quote: 'Transform ideas into working products through relentless focus and technical mastery.',
    sub: 'Creative Engineering & Systems Thinking',
  },
  {
    image: '/ambition-5.jpg',
    category: 'aviation',
    badge: 'Captain of Destiny • Daily Focus',
    title: 'Captain Your Future',
    quote: 'Great captains and engineers are forged in daily consistency, calm nerves, and clear forward vision.',
    sub: 'Golden Horizon • High-Altitude Clarity',
  },
];

export const HomeDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [aiPlanTodayOpen, setAiPlanTodayOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const filteredSlides = ALL_AMBITION_SLIDES;

  // Auto rotation timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, filteredSlides.length]);

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedCats, fetchedProjects] = await Promise.all([
        taskService.getTasks(),
        categoryService.getCategories(),
        projectService.getProjects().catch(() => []),
      ]);
      setTasks(fetchedTasks || []);
      setCategories(fetchedCats || []);
      setProjects(fetchedProjects || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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
  }, []);

  // Automatic live sync across devices
  useLiveSync(() => {
    loadData();
  }, { intervalMs: 12000 });

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTaskExpand = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: prev[taskId] !== undefined ? !prev[taskId] : false,
    }));
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const updated: Task = { ...task, status: nextStatus };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (detailTask && detailTask.id === task.id) {
      setDetailTask(updated);
    }
    try {
      const serverUpdated = await taskService.updateTaskStatus(task.id, nextStatus);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? serverUpdated : t)));
    } catch (err) {
      console.error('Failed to toggle task status:', err);
      loadData();
    }
  };

  const handleToggleSubtaskStatus = async (parentTaskId: string, subtask: Task) => {
    const nextStatus: TaskStatus = subtask.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const updatedSub: Task = { ...subtask, status: nextStatus };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === parentTaskId && t.subtasks) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === subtask.id ? updatedSub : s)),
          };
        }
        if (t.id === subtask.id) {
          return updatedSub;
        }
        return t;
      })
    );

    if (detailTask) {
      if (detailTask.id === parentTaskId && detailTask.subtasks) {
        setDetailTask({
          ...detailTask,
          subtasks: detailTask.subtasks.map((s) => (s.id === subtask.id ? updatedSub : s)),
        });
      } else if (detailTask.id === subtask.id) {
        setDetailTask(updatedSub);
      }
    }

    try {
      await taskService.updateTaskStatus(subtask.id, nextStatus);
    } catch (err) {
      console.error('Failed to toggle subtask status:', err);
      loadData();
    }
  };

  const handleStartTask = async (task: Task) => {
    try {
      const updated = await taskService.updateTaskStatus(task.id, 'IN_PROGRESS');
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (detailTask && detailTask.id === task.id) {
        setDetailTask(updated);
      }
    } catch (err) {
      console.error('Failed to start task:', err);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      const updated = await taskService.updateTask(editingTask.id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (detailTask && detailTask.id === updated.id) {
        setDetailTask(updated);
      }
      setEditingTask(null);
    } else {
      const created = await taskService.createTask(taskData);
      setTasks((prev) => [created, ...prev]);
    }
  };

  const handleExtendDeadline = async (task: Task, daysToAdd: number, hoursToAdd?: number) => {
    const todayStr = getLocalDateString();
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
      const updated = await taskService.updateTask(task.id, {
        dueDate: newDueDate,
        dueTime: newDueTime,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (detailTask && detailTask.id === task.id) {
        setDetailTask(updated);
      }
    } catch (err) {
      console.error('Failed to extend deadline:', err);
    }
  };

  const handleAddSubtask = async (parentTaskId: string, title: string) => {
    try {
      await taskService.createSubtask(parentTaskId, { title });
      loadData();
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + filteredSlides.length) % filteredSlides.length);
  };

  const activeAmbition = filteredSlides[currentSlide] || filteredSlides[0];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Expanded Ambition Vision Hero Banner (Aviation & IT) */}
      <div
        className="relative w-full h-[300px] sm:h-[340px] rounded-3xl overflow-hidden border border-[#DCE9E1] dark:border-[#20372B] shadow-lg group select-none transition-all z-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Rotating Images with Cross-Fade */}
        {filteredSlides.map((slide, idx) => (
          <div
            key={slide.image}
            className={clsx(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              idx === currentSlide ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
            )}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000 ease-linear"
            />
          </div>
        ))}

        {/* Ambient Gradient Overlays for perfect readability & contrast */}
        <div className="absolute inset-0 z-2 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
        <div className="absolute inset-0 z-2 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

        {/* Content Container */}
        <div className="absolute inset-0 z-10 p-6 sm:p-8 flex flex-col justify-between">
          {/* Top Bar on Hero: Ambition Badge & Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[#86EFAC] text-xs font-semibold shadow-xs">
                {activeAmbition.category === 'aviation' ? (
                  <Plane className="w-3.5 h-3.5 text-[#5FBF8F] animate-pulse" />
                ) : (
                  <Code2 className="w-3.5 h-3.5 text-[#5FBF8F] animate-pulse" />
                )}
                <span>{activeAmbition.badge}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setAiPlanTodayOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-[var(--color-primary)]/50 hover:border-[var(--color-primary)] text-[var(--color-accent)] hover:text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Open AI Day Planner"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] animate-pulse" />
                <span>AI Day Planner</span>
              </button>

              <button
                onClick={() => setTaskModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Main Hero Ambition Message */}
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-widest text-[var(--color-accent)] flex items-center gap-1.5 drop-shadow-sm">
              {activeAmbition.category === 'it' ? <Terminal className="w-3.5 h-3.5 text-[var(--color-primary)]" /> : <Plane className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
              {activeAmbition.sub}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
              {activeAmbition.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed drop-shadow-md max-w-xl">
              "{activeAmbition.quote}"
            </p>
          </div>

          {/* Bottom Bar: Carousel Indicators & Prev/Next Arrows */}
          <div className="flex items-center justify-between pt-2">
            {/* Slide Navigation Dots */}
            <div className="flex items-center gap-1.5">
              {filteredSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={clsx(
                    'h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer',
                    idx === currentSlide
                      ? 'w-6 sm:w-8 bg-[var(--color-primary)] shadow-xs'
                      : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                  )}
                  title={`View ambition slide ${idx + 1}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
              <span className="text-[10px] text-white/80 font-medium ml-2 font-mono drop-shadow-xs">
                {currentSlide + 1} / {filteredSlides.length}
              </span>
            </div>

            {/* Prev / Next controls */}
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={prevSlide}
                className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                title="Previous ambition"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                title="Next ambition"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* 🎯 Focus Now Daily Execution Section */}
      <FocusNowCard
        tasks={tasks}
        projects={projects}
        onOpenTask={(task) => setDetailTask(task)}
        onStartTask={handleStartTask}
      />

      {/* Today's Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
            Today's Tasks
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTaskModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-[#237A57] dark:text-[#6DD6A0] hover:underline flex items-center gap-1"
            >
              View All Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {(() => {
            const rootTasks = tasks.filter((t: Task) => !t.parentTaskId);
            const rootTaskIds = new Set(rootTasks.map((t) => t.id));
            const orphanedSubtasks = tasks.filter((t: Task) => t.parentTaskId && !rootTaskIds.has(t.parentTaskId));
            const displayTasks = [...rootTasks, ...orphanedSubtasks];

            if (displayTasks.length === 0) {
              return (
                <div className="p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[#5FBF8F] mx-auto" />
                  <h4 className="font-semibold text-[#17211B] dark:text-[#EAF7EF] text-sm">No tasks for today 🎉</h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">Enjoy your focus time or create a new task.</p>
                </div>
              );
            }

            return displayTasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              const subtasks = task.subtasks || [];
              const subtaskCount = subtasks.length;
              const completedSubtasks = subtasks.filter((s) => s.status === 'COMPLETED').length;
              const progressPercent = subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : 0;
              const isExpanded = expandedTasks[task.id] !== undefined ? expandedTasks[task.id] : true;
              const isOrphan = !!task.parentTaskId && !rootTaskIds.has(task.parentTaskId);

              return (
                <div
                  key={task.id}
                  onClick={() => setDetailTask(task)}
                  className={clsx(
                    'p-4 rounded-2xl border transition-all duration-200 shadow-xs cursor-pointer group',
                    isCompleted
                      ? 'bg-[#E8F7EF]/50 dark:bg-[#13261C]/50 border-[#5FBF8F]/40 opacity-85'
                      : 'bg-[#FFFFFF] dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] dark:hover:border-[#6DD6A0]'
                  )}
                >
                  {/* Main Task Header Row */}
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox with Primary Green */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskStatus(task);
                      }}
                      className={clsx(
                        'mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
                        isCompleted
                          ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                          : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] bg-white dark:bg-[#0E1C15] text-transparent'
                      )}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      <CheckSquare className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Task Title & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <h4
                            className={clsx(
                              'text-sm font-semibold transition-all truncate',
                              isCompleted
                                ? 'line-through text-[#66736B] dark:text-[#9BB5A5]'
                                : 'text-[#17211B] dark:text-[#EAF7EF]'
                            )}
                          >
                            {task.title}
                          </h4>

                          {isOrphan && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                              <CornerDownRight className="w-3 h-3" />
                              Subtask of: {task.parentTaskTitle || 'Main Task'}
                            </span>
                          )}
                        </div>

                        {/* Subtasks Badge with Expand / Collapse Toggle */}
                        {subtaskCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => toggleTaskExpand(task.id, e)}
                            className={clsx(
                              'px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs',
                              completedSubtasks === subtaskCount && subtaskCount > 0
                                ? 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border-[#5FBF8F]/40'
                                : 'bg-[#F3FBF7] dark:bg-[#13261C]/60 text-[#237A57] dark:text-[#6DD6A0] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                            )}
                            title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                          >
                            <ListTree className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            <span>{completedSubtasks}/{subtaskCount} Subtasks</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#8A9890] transition-transform" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#8A9890] transition-transform" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Mini Progress Bar if Subtasks Exist */}
                      {subtaskCount > 0 && (
                        <div className="w-full bg-[#DCE9E1]/60 dark:bg-[#20372B]/60 h-1.5 rounded-full overflow-hidden my-1.5">
                          <div
                            className="h-full bg-gradient-to-r from-[#5FBF8F] to-[#237A57] dark:from-[#48A375] dark:to-[#6DD6A0] rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}

                      {/* Metadata Row */}
                      <div className="flex items-center gap-3 text-[11px] text-[#66736B] dark:text-[#9BB5A5] flex-wrap mt-1">
                        <span className="flex items-center gap-1 font-medium text-amber-500 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          {task.dueTime ? `Due ${task.dueTime.slice(0, 5)}` : 'Today'}
                        </span>
                        {task.categoryName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#DCE9E1] dark:border-[#20372B]">
                            {task.categoryName}
                          </span>
                        )}
                        {task.projectName && (
                          <span className="text-[#237A57] dark:text-[#6DD6A0] font-medium">📁 {task.projectName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🌳 Nested Hierarchical Subtasks Section */}
                  {isExpanded && subtaskCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#DCE9E1]/50 dark:border-[#20372B]/50 ml-2 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-[#5FBF8F]/40 dark:border-[#5FBF8F]/30 space-y-2">
                      <div className="text-[10px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CornerDownRight className="w-3 h-3 text-[#5FBF8F]" />
                          Subtasks ({completedSubtasks}/{subtaskCount} Done)
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-[#237A57] dark:text-[#6DD6A0]">
                          {progressPercent}%
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {subtasks.map((sub) => {
                          const isSubDone = sub.status === 'COMPLETED';
                          return (
                            <div
                              key={sub.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailTask(sub);
                              }}
                              className={clsx(
                                'p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 group/sub cursor-pointer',
                                isSubDone
                                  ? 'bg-[#E8F7EF]/30 dark:bg-[#13261C]/30 border-[#5FBF8F]/20 opacity-75'
                                  : 'bg-white/80 dark:bg-[#0E1C15]/80 border-[#DCE9E1]/60 dark:border-[#20372B]/60 hover:border-[#5FBF8F] dark:hover:border-[#6DD6A0] hover:shadow-2xs'
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSubtaskStatus(task.id, sub);
                                  }}
                                  className={clsx(
                                    'w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer',
                                    isSubDone
                                      ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                                      : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] bg-white dark:bg-[#0E1C15]'
                                  )}
                                  title={isSubDone ? 'Mark as incomplete' : 'Mark as complete'}
                                >
                                  {isSubDone && <CheckSquare className="w-3 h-3 fill-current" />}
                                </button>
                                <span
                                  className={clsx(
                                    'text-xs font-medium truncate',
                                    isSubDone
                                      ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]'
                                      : 'text-[#17211B] dark:text-[#EAF7EF]'
                                  )}
                                >
                                  {sub.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {sub.dueTime && (
                                  <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-amber-500/80" />
                                    {sub.dueTime.slice(0, 5)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Task Modal Container */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        categories={categories}
        initialTask={editingTask || undefined}
      />

      {/* AI Plan Today Modal */}
      <AiPlanTodayModal
        isOpen={aiPlanTodayOpen}
        onClose={() => setAiPlanTodayOpen(false)}
        onTasksCreated={() => loadData()}
      />

      {/* Task Detail Modal */}
      {detailTask && (
        <TaskDetailModal
          isOpen={true}
          task={detailTask}
          allTasks={tasks}
          onClose={() => setDetailTask(null)}
          onEdit={(t) => {
            setDetailTask(null);
            setEditingTask(t);
            setTaskModalOpen(true);
          }}
          onToggleStatus={handleToggleTaskStatus}
          onExtendDeadline={handleExtendDeadline}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtaskStatus}
          onDelete={handleDeleteTask}
          onUpdateTask={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setDetailTask(updated);
          }}
          onSelectTask={(t) => setDetailTask(t)}
        />
      )}
    </div>
  );
};
