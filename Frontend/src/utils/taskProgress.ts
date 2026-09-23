/**
 * AIU Workspace — Single Documented Source of Truth for Task Analytics & Progress
 *
 * PROGRESS CALCULATION RULES:
 * 1. Scope: Only active tasks are considered. Archived/cancelled tasks (`status === 'CANCELLED'`)
 *    are strictly excluded from progress metrics unless explicitly specified.
 * 2. Total: Count of active tasks (`status !== 'CANCELLED'`).
 * 3. Completed: Count of active tasks with `status === 'COMPLETED'`.
 * 4. In Progress: Count of active tasks with `status === 'IN_PROGRESS'`.
 * 5. Remaining: `total - completed` (i.e. pending tasks: TODO + IN_PROGRESS).
 * 6. Overdue: Active, uncompleted tasks with `dueDate < today` (or today with past `dueTime`).
 * 7. Percentage formula: `total > 0 ? Math.round((completed / total) * 100) : 0`.
 * 8. Workload: Sum of `estimatedDuration` (minutes) for all active uncompleted tasks.
 * 9. Factual integrity: Zero psychological interpretations or fake productivity scores.
 */

import { Task } from '../types';

export interface ProgressMetrics {
  // Core metrics required by prompt
  total: number;
  completed: number;
  remaining: number;
  overdue: number;
  inProgress: number;
  overallPercentage: number;

  // Time-window metrics
  todayTotal: number;
  todayCompleted: number;
  todayRemaining: number;
  todayPercentage: number;

  weeklyTotal: number;
  weeklyCompleted: number;
  weeklyRemaining: number;
  weeklyPercentage: number;

  // Workload calculations
  estimatedWorkloadMinutes: number;
  estimatedWorkloadFormatted: string;
  todayWorkloadMinutes: number;
  todayWorkloadFormatted: string;

  // Metadata
  activeCount: number;
  archivedCount: number;
}

/**
 * Returns YYYY-MM-DD for the given date (default: today) in local timezone.
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the Monday (start) and Sunday (end) dates of the week containing the given date.
 */
export const getCalendarWeekRange = (refDate: Date = new Date()): { startStr: string; endStr: string } => {
  const current = new Date(refDate);
  const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startStr: getLocalDateString(monday),
    endStr: getLocalDateString(sunday)
  };
};

/**
 * Factual check if a task is overdue.
 * Strictly ignores COMPLETED and CANCELLED tasks.
 */
export const isTaskFactualOverdue = (task: Task, todayStr: string = getLocalDateString()): boolean => {
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED' || !task.dueDate) {
    return false;
  }
  if (task.dueDate < todayStr) {
    return true;
  }
  if (task.dueDate === todayStr && task.dueTime) {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;
    return task.dueTime < currentTimeStr;
  }
  return false;
};

/**
 * Formats minutes into human-readable duration (e.g. "2h 45m" or "45m" or "0m").
 */
export const formatMinutesToDuration = (totalMinutes: number): string => {
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

/**
 * Generates an ASCII/Unicode compact progress trend bar.
 * Example: "████████░░ 80%"
 */
export const generateCompactTrendBar = (percentage: number, totalBlocks: number = 10): string => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const filledBlocks = Math.round((clamped / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  return `${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)} ${clamped}%`;
};

/**
 * Primary calculation function for task progress and intelligence.
 * Single source of truth across all components.
 */
export const calculateTaskProgress = (
  tasks: Task[],
  options: {
    includeSubtasks?: boolean;
    referenceDate?: Date;
  } = {}
): ProgressMetrics => {
  const { includeSubtasks = true, referenceDate = new Date() } = options;
  const todayStr = getLocalDateString(referenceDate);
  const { startStr: weekStartStr, endStr: weekEndStr } = getCalendarWeekRange(referenceDate);

  // 1. Separate active vs archived/cancelled
  let candidateTasks: Task[] = [];
  let archivedCount = 0;

  for (const t of tasks) {
    if (t.status === 'CANCELLED') {
      archivedCount++;
      continue;
    }
    // If not including child subtasks separately, skip items with parentTaskId
    if (!includeSubtasks && t.parentTaskId) {
      continue;
    }
    candidateTasks.push(t);
  }

  // 2. Compute Core Metrics
  const total = candidateTasks.length;
  const completed = candidateTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgress = candidateTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const remaining = Math.max(0, total - completed);
  const overdue = candidateTasks.filter((t) => isTaskFactualOverdue(t, todayStr)).length;
  const overallPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 3. Compute Today's Completion
  const todayTasks = candidateTasks.filter(
    (t) => t.dueDate === todayStr || t.dueDate?.startsWith(todayStr)
  );
  const todayTotal = todayTasks.length;
  const todayCompleted = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const todayRemaining = Math.max(0, todayTotal - todayCompleted);
  const todayPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // 4. Compute Weekly Completion (tasks scheduled between Monday and Sunday)
  const weeklyTasks = candidateTasks.filter(
    (t) => t.dueDate && t.dueDate >= weekStartStr && t.dueDate <= weekEndStr
  );
  const weeklyTotal = weeklyTasks.length;
  const weeklyCompleted = weeklyTasks.filter((t) => t.status === 'COMPLETED').length;
  const weeklyRemaining = Math.max(0, weeklyTotal - weeklyCompleted);
  const weeklyPercentage = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

  // 5. Compute Estimated Workload for active uncompleted tasks
  let estimatedWorkloadMinutes = 0;
  let todayWorkloadMinutes = 0;

  for (const t of candidateTasks) {
    if (t.status === 'COMPLETED') continue;

    const dur = t.estimatedDuration && t.estimatedDuration > 0 ? t.estimatedDuration : 0;
    estimatedWorkloadMinutes += dur;

    if (t.dueDate === todayStr || t.dueDate?.startsWith(todayStr)) {
      todayWorkloadMinutes += dur;
    }
  }

  return {
    total,
    completed,
    remaining,
    overdue,
    inProgress,
    overallPercentage,

    todayTotal,
    todayCompleted,
    todayRemaining,
    todayPercentage,

    weeklyTotal,
    weeklyCompleted,
    weeklyRemaining,
    weeklyPercentage,

    estimatedWorkloadMinutes,
    estimatedWorkloadFormatted: formatMinutesToDuration(estimatedWorkloadMinutes),
    todayWorkloadMinutes,
    todayWorkloadFormatted: formatMinutesToDuration(todayWorkloadMinutes),

    activeCount: total,
    archivedCount
  };
};
