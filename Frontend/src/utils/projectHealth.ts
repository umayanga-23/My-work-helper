import { Project, Task } from '../types';

export type ProjectHealthStatus = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'AT_RISK';

export interface ProjectHealthDetails {
  status: ProjectHealthStatus;
  label: string; // 'On Track' | 'Needs Attention' | 'At Risk'
  emoji: string; // '🟢' | '🟠' | '🔴'
  colorText: string;
  colorBg: string;
  colorBorder: string;
  dotColor: string;
  score: number; // 0 to 100
  factors: {
    progress: number;
    overdueCount: number;
    blockedCount: number;
    deadlineDays: number | null;
    deadlineLabel: string;
    totalTasks: number;
    completedTasks: number;
  };
  reasons: string[];
}

/**
 * Helper to calculate calendar days difference: (targetDate - today)
 */
export const getDaysDiff = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * ============================================================================
 * DETERMINISTIC PROJECT HEALTH CALCULATION RULES
 * ============================================================================
 * 
 * Project Health evaluates the operational vitality of a project independently
 * from its lifecycle status (Active / Planning / On Hold / Completed).
 * 
 * RULES IN EVALUATION ORDER:
 * 
 * 1. COMPLETED PROJECTS:
 *    - If project.status === 'COMPLETED' or (tasks.length > 0 and all tasks are completed):
 *      -> Health is always 'ON_TRACK' (🟢 On Track, Score: 100).
 *      -> Reason: "All project deliverables completed successfully."
 * 
 * 2. OVERDUE PROJECT DEADLINE:
 *    - If project has endDate and deadlineDays < 0 (and project is not completed):
 *      -> Automatically 'AT_RISK' (🔴 At Risk, Base Score: <= 30).
 *      -> Reason: "Project target deadline has passed with unfinished tasks."
 * 
 * 3. MULTIPLE OVERDUE TASKS (>= 2):
 *    - If 2 or more active tasks are overdue:
 *      -> Automatically 'AT_RISK' (🔴 At Risk, Score: <= 40).
 *      -> Reason: "Multiple overdue tasks indicate delivery delay."
 * 
 * 4. CRITICAL IMMINENT DEADLINE DEFICIT:
 *    - If project deadline is <= 3 days away and progress < 75%:
 *      -> 'AT_RISK' (🔴 At Risk).
 *      -> Reason: "Deadline is in <= 3 days with significant pending work."
 * 
 * 5. SINGLE OVERDUE TASK:
 *    - If exactly 1 task is overdue:
 *      -> 'NEEDS_ATTENTION' (🟠 Needs Attention, Score: ~60).
 *      -> Reason: "1 overdue task requires immediate resolution."
 * 
 * 6. BLOCKED TASKS:
 *    - If blockedTasks >= 2:
 *      -> 'AT_RISK' (🔴 At Risk, Score: ~45).
 *      -> Reason: "Multiple blocked tasks stalling workflow."
 *    - If blockedTasks === 1:
 *      -> 'NEEDS_ATTENTION' (🟠 Needs Attention, Score: ~65).
 *      -> Reason: "1 task blocked by unfinished dependency."
 * 
 * 7. MODERATE IMMINENT DEADLINE DEFICIT:
 *    - If project deadline is <= 7 days away and progress < 50%:
 *      -> 'NEEDS_ATTENTION' (🟠 Needs Attention, Score: ~60).
 *      -> Reason: "Deadline in <= 7 days with less than 50% completion."
 * 
 * 8. EMPTY PROJECT / PLANNING STAGE:
 *    - If tasks.length === 0:
 *      - If deadline has passed: 'AT_RISK' (🔴 At Risk).
 *      - Otherwise: 'ON_TRACK' (🟢 On Track, Score: 90).
 *      -> Reason: "Project setup in progress; no task blockers."
 * 
 * 9. DEFAULT HEALTHY STATE:
 *    - No overdue tasks, no blocked tasks, healthy deadline buffer:
 *      -> 'ON_TRACK' (🟢 On Track, Score: 90-100).
 *      -> Reason: "All tasks and deadlines on schedule."
 * ============================================================================
 */
export function calculateProjectHealth(
  project: Project,
  tasks: Task[] = [],
  activity: any[] = []
): ProjectHealthDetails {
  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const remainingTasks = totalTasks - completedTasks;

  // Calculate dynamic progress percentage
  const progress = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : (project.progress || 0);

  // Evaluate overdue and blocked tasks
  let overdueCount = 0;
  let blockedCount = 0;

  tasks.forEach((task) => {
    if (task.status === 'COMPLETED') return;

    // Overdue check
    const diff = getDaysDiff(task.dueDate);
    if (diff !== null && diff < 0) {
      overdueCount++;
    }

    // Blocked check
    if (task.dependsOnTaskId) {
      const parentDep = taskMap.get(task.dependsOnTaskId);
      if (parentDep && parentDep.status !== 'COMPLETED') {
        blockedCount++;
      }
    }
  });

  // Project Deadline evaluation
  const deadlineDays = getDaysDiff(project.endDate);
  let deadlineLabel = 'Ongoing';
  if (deadlineDays !== null) {
    if (deadlineDays < 0) {
      deadlineLabel = `Overdue by ${Math.abs(deadlineDays)}d`;
    } else if (deadlineDays === 0) {
      deadlineLabel = 'Due Today';
    } else {
      deadlineLabel = `${deadlineDays} days`;
    }
  }

  const isCompleted = project.status === 'COMPLETED' || (totalTasks > 0 && remainingTasks === 0);
  const reasons: string[] = [];

  let status: ProjectHealthStatus = 'ON_TRACK';
  let score = 100;

  // 1. Completed Project
  if (isCompleted) {
    status = 'ON_TRACK';
    score = 100;
    reasons.push('All deliverables completed successfully');
  }
  // 2. Empty project
  else if (totalTasks === 0) {
    if (deadlineDays !== null && deadlineDays < 0) {
      status = 'AT_RISK';
      score = 30;
      reasons.push('Project deadline has passed with no tasks created');
    } else {
      status = 'ON_TRACK';
      score = 90;
      reasons.push('Planning stage; no task blockers');
    }
  }
  // 3. Active tasks evaluation
  else {
    let penalty = 0;

    // A. Project Deadline Overdue
    if (deadlineDays !== null && deadlineDays < 0) {
      penalty += 50;
      reasons.push(`Project deadline passed (${Math.abs(deadlineDays)} days ago)`);
    }

    // B. Overdue tasks
    if (overdueCount >= 2) {
      penalty += 45;
      reasons.push(`${overdueCount} tasks are overdue`);
    } else if (overdueCount === 1) {
      penalty += 25;
      reasons.push('1 task is overdue');
    }

    // C. Blocked tasks
    if (blockedCount >= 2) {
      penalty += 35;
      reasons.push(`${blockedCount} tasks are blocked by dependencies`);
    } else if (blockedCount === 1) {
      penalty += 20;
      reasons.push('1 task is blocked by a dependency');
    }

    // D. Imminent deadline risk
    if (deadlineDays !== null && deadlineDays >= 0) {
      if (deadlineDays <= 3 && progress < 75) {
        penalty += 40;
        reasons.push(`Deadline in ${deadlineDays} days with only ${progress}% progress`);
      } else if (deadlineDays <= 7 && progress < 50) {
        penalty += 25;
        reasons.push(`Deadline in ${deadlineDays} days with less than 50% progress`);
      }
    }

    // Final score calculation (clamped between 10 and 100)
    score = Math.max(10, 100 - penalty);

    // Determine status from score and critical triggers
    if (deadlineDays !== null && deadlineDays < 0) {
      status = 'AT_RISK';
    } else if (overdueCount >= 2 || (deadlineDays !== null && deadlineDays <= 3 && progress < 75)) {
      status = 'AT_RISK';
    } else if (blockedCount >= 2 && remainingTasks <= 3) {
      status = 'AT_RISK';
    } else if (score < 55) {
      status = 'AT_RISK';
    } else if (overdueCount > 0 || blockedCount > 0 || score < 80) {
      status = 'NEEDS_ATTENTION';
    } else {
      status = 'ON_TRACK';
      reasons.push('All tasks and deadlines on schedule');
    }
  }

  // Pure SEMANTIC color styling (Strictly decoupled from application theme)
  let label = 'On Track';
  let emoji = '🟢';
  let colorText = 'text-emerald-500';
  let colorBg = 'bg-emerald-500/10';
  let colorBorder = 'border-emerald-500/30';
  let dotColor = 'bg-emerald-500';

  if (status === 'NEEDS_ATTENTION') {
    label = 'Needs Attention';
    emoji = '🟠';
    colorText = 'text-amber-500';
    colorBg = 'bg-amber-500/10';
    colorBorder = 'border-amber-500/30';
    dotColor = 'bg-amber-500';
  } else if (status === 'AT_RISK') {
    label = 'At Risk';
    emoji = '🔴';
    colorText = 'text-rose-500';
    colorBg = 'bg-rose-500/10';
    colorBorder = 'border-rose-500/30';
    dotColor = 'bg-rose-500';
  }

  return {
    status,
    label,
    emoji,
    colorText,
    colorBg,
    colorBorder,
    dotColor,
    score,
    factors: {
      progress,
      overdueCount,
      blockedCount,
      deadlineDays,
      deadlineLabel,
      totalTasks,
      completedTasks,
    },
    reasons,
  };
}
