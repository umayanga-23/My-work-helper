import React from 'react';
import { ExternalLink, Lock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskPriority, Project } from '../../types';
import { isTaskFactualOverdue, getLocalDateString } from '../../utils/taskProgress';
import { clsx } from 'clsx';

export interface FocusCandidate {
  task: Task;
  parentTask?: Task;
  isSubtask: boolean;
  projectName?: string;
}

interface FocusNowCardProps {
  tasks: Task[];
  projects?: Project[];
  onOpenTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
}

const priorityWeight: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const FocusNowCard: React.FC<FocusNowCardProps> = ({
  tasks,
  projects = [],
  onOpenTask,
  onStartTask,
}) => {
  const navigate = useNavigate();
  const todayStr = getLocalDateString();

  const isTaskBlocked = (task: Task): boolean => {
    if (!task.blockedBy || task.blockedBy.length === 0) return false;
    return task.blockedBy.some((dep) => dep.status !== 'COMPLETED');
  };

  const isTaskDueToday = (task: Task): boolean => {
    if (!task.dueDate) return false;
    return task.dueDate === todayStr || task.dueDate.startsWith(todayStr);
  };

  const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // 24-hour format (e.g. 20:00, 05:00, 23:59)
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

  const formatDueDisplay = (task: Task) => {
    const timeSlot = formatTaskTimeSlot(task.dueTime, task.estimatedDuration);
    const timeFormatted = timeSlot || (task.dueTime ? formatDisplayTime(task.dueTime) : '');
    if (isTaskFactualOverdue(task, todayStr)) {
      if (task.dueDate === todayStr && timeFormatted) {
        return `Today ${timeFormatted} (Overdue)`;
      }
      return `${task.dueDate || 'Past Due'} ${timeFormatted ? timeFormatted + ' ' : ''}(Overdue)`;
    }
    if (task.dueDate === todayStr) {
      return timeFormatted ? `Today ${timeFormatted}` : 'Today';
    }
    return `${task.dueDate || 'No due date'} ${timeFormatted ? timeFormatted : ''}`.trim();
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
        return 'text-gray-400';
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

  // Deterministic candidate selection for "Focus Now" Daily Execution Engine
  const focusCandidate: FocusCandidate | null = (() => {
    const candidates: FocusCandidate[] = [];

    // 1. Gather all active root tasks
    for (const t of tasks) {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') continue;

      const overdue = isTaskFactualOverdue(t, todayStr);
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
          const subOverdue = isTaskFactualOverdue(sub, todayStr);
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
      const aOverdue = isTaskFactualOverdue(a, todayStr);
      const bOverdue = isTaskFactualOverdue(b, todayStr);
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

      // 4. In progress first
      if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
      if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;

      // 5. Earliest due time
      const timeA = a.dueTime || '23:59';
      const timeB = b.dueTime || '23:59';
      if (timeA !== timeB) return timeA.localeCompare(timeB);

      // 6. Unblocked tasks preferred over blocked tasks
      const aBlocked = isTaskBlocked(a);
      const bBlocked = isTaskBlocked(b);
      if (!aBlocked && bBlocked) return -1;
      if (aBlocked && !bBlocked) return 1;

      return 0;
    });

    return candidates[0];
  })();

  if (!focusCandidate) {
    return (
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
    );
  }

  const { task, parentTask, isSubtask, projectName } = focusCandidate;

  return (
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
          {isSubtask && parentTask && (
            <span className="text-[11px] font-medium text-[#66736B] dark:text-[#9BB5A5] truncate max-w-[200px] sm:max-w-xs">
              Part of: <strong className="text-[#17211B] dark:text-[#EAF7EF]">{parentTask.title}</strong>
            </span>
          )}
        </div>

        {/* Task Title */}
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#17211B] dark:text-[#EAF7EF] tracking-tight">
            {task.title}
          </h2>
          {task.description && (
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Metadata Details */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs py-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Priority:</span>
            <span className={clsx('font-bold', priorityTextClass(task.priority))}>
              {formatPriority(task.priority)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Due:</span>
            <span
              className={clsx(
                'font-semibold',
                isTaskFactualOverdue(task, todayStr)
                  ? 'text-rose-500 dark:text-rose-400 font-bold'
                  : 'text-[#17211B] dark:text-[#EAF7EF]'
              )}
            >
              {formatDueDisplay(task)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Project:</span>
            {task.projectId ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects?id=${task.projectId}`);
                }}
                className="font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="Open Project Workspace"
              >
                <span>{projectName || 'DocuSphere'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="font-semibold text-[#237A57] dark:text-[#6DD6A0]">
                {projectName || 'General'}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => onOpenTask(task)}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] bg-white dark:bg-[#13261C] hover:bg-[#E8F7EF] dark:hover:bg-[#1B3527] transition-all cursor-pointer shadow-xs"
          >
            Open Task
          </button>

          {isTaskBlocked(task) ? (
            <div
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-not-allowed"
              title="Task is blocked by predecessor dependencies"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Blocked</span>
            </div>
          ) : task.status === 'IN_PROGRESS' ? (
            <button
              onClick={() => onOpenTask(task)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#5FBF8F] hover:bg-[#4EAE7E] text-[#0E1C15] transition-all shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continue working</span>
            </button>
          ) : (
            <button
              onClick={() => onStartTask(task)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#5FBF8F] hover:bg-[#4EAE7E] text-[#0E1C15] transition-all shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start task</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
