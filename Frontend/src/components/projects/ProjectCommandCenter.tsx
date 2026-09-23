import React, { useMemo, useState } from 'react';
import {
  Target,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Plus,
  Milestone,
  Flag,
  Lock,
  ChevronRight,
  ListOrdered,
  Zap,
  FileText,
  HardDrive,
  Activity,
  Link2,
  ExternalLink,
  GitCommit,
  PlusCircle,
  RefreshCw,
  Edit3,
  FileCheck,
  FileX,
  Globe,
  Rocket,
  Settings
} from 'lucide-react';
import { Project, Task, ProjectMilestone, DocumentItem, Note, Website, DriveLink, TaskResource, ActivityLog } from '../../types';
import { calculateProjectHealth } from '../../utils/projectHealth';
import { clsx } from 'clsx';

interface ProjectCommandCenterProps {
  project: Project;
  tasks: Task[];
  milestones?: ProjectMilestone[];
  notes?: Note[];
  documents?: DocumentItem[];
  websites?: Website[];
  driveLinks?: DriveLink[];
  activity?: ActivityLog[];
  onOpenTask: (task: Task) => void;
  onAddTask: () => void;
  onNavigateTab: (tab: 'TASKS' | 'GIT' | 'NOTES' | 'DOCS' | 'WEBSITES' | 'DRIVE' | 'RESOURCES' | 'ACTIVITY') => void;
  onOpenNote?: (note: Note) => void;
  onOpenDocument?: (doc: DocumentItem) => void;
  onAddResource?: () => void;
}

interface TaskAssessment {
  task: Task;
  isCompleted: boolean;
  isBlocked: boolean;
  blockingTask?: Task;
  isOverdue: boolean;
  isDueToday: boolean;
  isApproachingDeadline: boolean;
  daysDiff: number | null;
  score: number;
  reasons: string[];
}

// Calculate days difference (dueDate - today)
const getDaysDiff = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const ProjectCommandCenter: React.FC<ProjectCommandCenterProps> = ({
  project,
  tasks = [],
  milestones = [],
  notes = [],
  documents = [],
  websites = [],
  driveLinks = [],
  activity = [],
  onOpenTask,
  onAddTask,
  onNavigateTab,
  onOpenNote,
  onOpenDocument,
  onAddResource,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Compute unified project resources list
  const projectResourcesList = useMemo(() => {
    const list: Array<{ id: string; type: string; title: string; subtitle: string; url?: string; original?: any }> = [];
    if (project.githubRepo) {
      list.push({
        id: `gh-${project.id}`,
        type: 'GITHUB',
        title: project.githubRepo,
        subtitle: 'GitHub Repository',
        url: `https://github.com/${project.githubRepo}`
      });
    }
    websites.forEach((w) => {
      list.push({ id: w.id, type: 'WEBSITE', title: w.name, subtitle: w.url, url: w.url, original: w });
    });
    notes.forEach((n) => {
      list.push({ id: n.id, type: 'NOTE', title: n.title, subtitle: 'Architecture & Technical Note', original: n });
    });
    documents.forEach((d) => {
      list.push({ id: d.id, type: 'DOCUMENT', title: d.name, subtitle: d.fileType || 'Document Spec', original: d });
    });
    driveLinks.forEach((g) => {
      list.push({ id: g.id, type: 'DRIVE_LINK', title: g.name, subtitle: g.url, url: g.url, original: g });
    });
    return list;
  }, [project.githubRepo, websites, notes, documents, driveLinks]);

  // Handle opening a task resource
  const handleOpenTaskResource = (r: TaskResource) => {
    if (r.resourceType === 'NOTE') {
      const found = notes.find((n) => n.id === r.resourceId);
      if (found && onOpenNote) {
        onOpenNote(found);
        return;
      }
    } else if (r.resourceType === 'DOCUMENT') {
      const found = documents.find((d) => d.id === r.resourceId);
      if (found && onOpenDocument) {
        onOpenDocument(found);
        return;
      }
    } else if (r.resourceType === 'WEBSITE' || r.resourceType === 'DRIVE_LINK') {
      if (r.url) {
        window.open(r.url, '_blank', 'noopener,noreferrer');
        return;
      }
    } else if (r.resourceType === 'GITHUB') {
      const url = r.url || (project.githubRepo ? `https://github.com/${project.githubRepo}` : undefined);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    if (r.url) {
      window.open(r.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle opening a unified project resource
  const handleOpenUnifiedResource = (item: { type: string; url?: string; original?: any }) => {
    if (item.type === 'NOTE' && item.original && onOpenNote) {
      onOpenNote(item.original);
    } else if (item.type === 'DOCUMENT' && item.original && onOpenDocument) {
      onOpenDocument(item.original);
    } else if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Deterministic Project Health Evaluation
  const health = useMemo(
    () => calculateProjectHealth(project, tasks, activity),
    [project, tasks, activity]
  );

  // Deterministic evaluation of all tasks
  const assessment = useMemo(() => {
    const taskMap = new Map<string, Task>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    const evaluated: TaskAssessment[] = tasks.map((task) => {
      const isCompleted = task.status === 'COMPLETED';

      // Check if task is blocked by another task
      let blockingTask: Task | undefined;
      let isBlocked = false;
      if (task.isBlocked) {
        isBlocked = true;
        const blocker = task.blockedBy?.find(b => b.status !== 'COMPLETED');
        if (blocker) {
          blockingTask = taskMap.get(blocker.taskId) || ({ taskKey: blocker.taskKey, title: blocker.title, status: blocker.status } as any);
        }
      } else if (task.dependsOnTaskId) {
        const dep = taskMap.get(task.dependsOnTaskId);
        if (dep && dep.status !== 'COMPLETED') {
          isBlocked = true;
          blockingTask = dep;
        }
      }

      const daysDiff = getDaysDiff(task.dueDate);
      const isOverdue = !isCompleted && daysDiff !== null && daysDiff < 0;
      const isDueToday = !isCompleted && daysDiff === 0;
      const isApproachingDeadline = !isCompleted && daysDiff !== null && daysDiff > 0 && daysDiff <= 3;
      const isInProgress = !isCompleted && task.status === 'IN_PROGRESS';

      // Deterministic Scoring
      let score = 0;
      const reasons: string[] = [];

      if (!isCompleted) {
        // Blocked penalty
        if (isBlocked) {
          score -= 1000;
          reasons.push(`Blocked by ${blockingTask?.taskKey || blockingTask?.title || 'dependency'}`);
        }

        // 1. Overdue (+500)
        if (isOverdue) {
          const days = Math.abs(daysDiff!);
          score += 500 + Math.min(days * 10, 100);
          reasons.push(days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`);
        }

        // 2. Due today (+400)
        if (isDueToday) {
          score += 400;
          reasons.push('Due Today');
        }

        // 3. Active / In Progress (+250)
        if (isInProgress) {
          score += 250;
          reasons.push('In Progress');
        }

        // 4. Priority weight
        if (task.priority === 'URGENT') {
          score += 200;
          reasons.push('Urgent Priority');
        } else if (task.priority === 'HIGH') {
          score += 130;
          reasons.push('High Priority');
        } else if (task.priority === 'MEDIUM') {
          score += 60;
        } else {
          score += 10;
        }

        // 5. Approaching deadline
        if (isApproachingDeadline) {
          score += (4 - daysDiff!) * 30;
          reasons.push(`Due in ${daysDiff} day${daysDiff! > 1 ? 's' : ''}`);
        }

        // Upcoming tie-breaker
        if (daysDiff !== null && daysDiff > 3) {
          score += Math.max(0, 20 - daysDiff);
        }
      }

      return {
        task,
        isCompleted,
        isBlocked,
        blockingTask,
        isOverdue,
        isDueToday,
        isApproachingDeadline,
        daysDiff,
        score,
        reasons,
      };
    });

    const uncompleted = evaluated.filter((e) => !e.isCompleted);
    const sortedCandidates = [...uncompleted].sort((a, b) => {
      // Unblocked strictly before blocked
      if (a.isBlocked !== b.isBlocked) {
        return a.isBlocked ? 1 : -1;
      }
      return b.score - a.score;
    });

    // Needs attention items
    const overdueTasks = uncompleted.filter((e) => e.isOverdue);
    const blockedTasks = uncompleted.filter((e) => e.isBlocked);
    const approachingTasks = uncompleted.filter((e) => e.isApproachingDeadline);

    // Coming next items: uncompleted, unblocked, not overdue, excluding focus candidate
    const activeFocusId = selectedCandidateId || sortedCandidates[0]?.task.id;
    const upcomingTasks = uncompleted
      .filter((e) => e.task.id !== activeFocusId && !e.isBlocked && !e.isOverdue)
      .sort((a, b) => {
        // Earliest due date first, then priority
        if (a.daysDiff !== null && b.daysDiff !== null) {
          if (a.daysDiff !== b.daysDiff) return a.daysDiff - b.daysDiff;
        } else if (a.daysDiff !== null) {
          return -1;
        } else if (b.daysDiff !== null) {
          return 1;
        }
        return b.score - a.score;
      })
      .slice(0, 4);

    return {
      all: evaluated,
      uncompleted,
      candidates: sortedCandidates,
      overdueTasks,
      blockedTasks,
      approachingTasks,
      upcomingTasks,
    };
  }, [tasks, selectedCandidateId]);

  // Project Deadline evaluation
  const projectDeadlineDiff = getDaysDiff(project.endDate);
  const isProjectCompleted = project.status === 'COMPLETED' || (tasks.length > 0 && assessment.uncompleted.length === 0);
  const isProjectOverdue = !isProjectCompleted && projectDeadlineDiff !== null && projectDeadlineDiff < 0;
  const isProjectDeadlineApproaching = !isProjectCompleted && projectDeadlineDiff !== null && projectDeadlineDiff >= 0 && projectDeadlineDiff <= 5;

  // Active Focus Task
  const primaryCandidate = assessment.candidates.find((c) => c.task.id === selectedCandidateId) || assessment.candidates[0];
  const otherCandidates = assessment.candidates.filter((c) => c.task.id !== primaryCandidate?.task.id).slice(0, 3);

  // Milestones progress
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length;
  const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Existing Overview Top Metrics Bar (Preserved) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('TASKS')}
          className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 dark:hover:border-purple-500/50 transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] uppercase">Linked Tasks</span>
            <CheckSquare className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">
            {tasks.length} Tasks
          </h3>
          <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span>{tasks.filter((t) => t.status === 'COMPLETED').length} completed</span>
            <span>•</span>
            <span>{assessment.uncompleted.length} remaining</span>
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('NOTES')}
          className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-amber-400 dark:hover:border-amber-500/50 transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] uppercase">Knowledge Notes</span>
            <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">
            {notes.length} Notes
          </h3>
          <p className="text-xs text-amber-400 font-medium mt-1">Markdown technical docs</p>
        </button>

        <button
          onClick={() => onNavigateTab('DOCS')}
          className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-sky-400 dark:hover:border-sky-500/50 transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] uppercase">Storage & Drive Links</span>
            <HardDrive className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">
            {documents.length + driveLinks.length} Files
          </h3>
          <p className="text-xs text-sky-400 font-medium mt-1">
            {documents.length} Docs • {driveLinks.length} Drive Links
          </p>
        </button>
      </div>

      {/* 2. COMMAND CENTER MAIN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): FOCUS NOW + COMING NEXT */}
        <div className="lg:col-span-8 space-y-6">
          {/* 🎯 FOCUS NOW CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/30 dark:from-[#0E1C15] dark:via-[#0E1C15] dark:to-[#182a20] border-2 border-purple-500/40 shadow-md relative overflow-hidden">
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  <Target className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2 tracking-tight">
                    🎯 FOCUS NOW
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/30">
                      Deterministic Match
                    </span>
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                    Recommended next action based on deadlines, status, and dependency state
                  </p>
                </div>
              </div>

              {primaryCandidate && (
                <div className="flex items-center gap-1.5 text-xs text-[#8A9890] dark:text-[#6F8A7A]">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Score: <strong>{primaryCandidate.score}</strong></span>
                </div>
              )}
            </div>

            {/* Content States */}
            {isProjectCompleted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  🎉 Project Completed!
                </h4>
                <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-md mx-auto">
                  All tasks are finished and the project milestone requirements have been met. Outstanding work!
                </p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                    No Tasks Defined Yet
                  </h4>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-0.5">
                    Start by adding the first development task or sprint milestone to this project.
                  </p>
                </div>
                <button
                  onClick={onAddTask}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Task
                </button>
              </div>
            ) : !primaryCandidate ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  All Tasks Completed!
                </h4>
                <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                  There are currently no open tasks requiring immediate attention.
                </p>
                <button
                  onClick={onAddTask}
                  className="px-3.5 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-500 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Candidate Main Box */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-3.5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {primaryCandidate.task.taskKey && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/30 font-mono font-bold text-xs">
                            {primaryCandidate.task.taskKey}
                          </span>
                        )}
                        <span className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                          {primaryCandidate.task.title}
                        </span>
                      </div>
                      {primaryCandidate.task.description && (
                        <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] line-clamp-2">
                          {primaryCandidate.task.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenTask(primaryCandidate.task)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      Open Task <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Meta Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#DCE9E1]/60 dark:border-[#20372B]/60 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A9890] dark:text-[#6F8A7A]">Priority</span>
                      <div>
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded font-bold text-[11px] uppercase inline-block",
                            primaryCandidate.task.priority === 'URGENT' && "bg-rose-500/10 text-rose-500 border border-rose-500/30",
                            primaryCandidate.task.priority === 'HIGH' && "bg-amber-500/10 text-amber-500 border border-amber-500/30",
                            primaryCandidate.task.priority === 'MEDIUM' && "bg-sky-500/10 text-sky-500 border border-sky-500/30",
                            (!primaryCandidate.task.priority || primaryCandidate.task.priority === 'LOW') && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                          )}
                        >
                          {primaryCandidate.task.priority || 'LOW'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A9890] dark:text-[#6F8A7A]">Status</span>
                      <div>
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] uppercase inline-block bg-[#E8F7EF] dark:bg-[#0E1C15] text-[#17211B] dark:text-[#EAF7EF] border border-[#DCE9E1] dark:border-[#20372B]">
                          {primaryCandidate.task.status || 'TODO'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A9890] dark:text-[#6F8A7A]">Due Date</span>
                      <div className="flex items-center gap-1 font-medium text-[#17211B] dark:text-[#EAF7EF]">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span className={clsx(primaryCandidate.isOverdue && "text-rose-500 font-bold")}>
                          {primaryCandidate.task.dueDate || 'No due date'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A9890] dark:text-[#6F8A7A]">Dependency</span>
                      <div className="flex items-center gap-1 text-[#17211B] dark:text-[#EAF7EF]">
                        {primaryCandidate.isBlocked ? (
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Unblocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Why this task was chosen */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold text-[#8A9890] dark:text-[#6F8A7A]">Drivers:</span>
                    {primaryCandidate.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className={clsx(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold",
                          reason.includes('Overdue')
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                            : reason.includes('Due Today')
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                            : reason.includes('Blocked')
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        )}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Attached Task Resources */}
                  {primaryCandidate.task.resources && primaryCandidate.task.resources.length > 0 && (
                    <div className="pt-2 border-t border-[#DCE9E1]/60 dark:border-[#20372B]/60 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A9890] dark:text-[#6F8A7A]">
                        Attached Task Resources ({primaryCandidate.task.resources.length}):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {primaryCandidate.task.resources.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleOpenTaskResource(r)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F3FBF7] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 text-[#17211B] dark:text-[#EAF7EF] transition-all cursor-pointer shadow-2xs"
                          >
                            {r.resourceType === 'WEBSITE' && '🌐'}
                            {r.resourceType === 'NOTE' && '📝'}
                            {r.resourceType === 'DOCUMENT' && '📄'}
                            {r.resourceType === 'DRIVE_LINK' && '☁️'}
                            {r.resourceType === 'GITHUB' && '🐙'}
                            <span className="truncate max-w-[140px]">{r.title || r.url || r.resourceType}</span>
                            <ExternalLink className="w-3 h-3 text-[#8A9890]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Multiple Candidate Switcher (If other candidate tasks exist) */}
                {otherCandidates.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider">
                      Other Focus Candidates ({otherCandidates.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {otherCandidates.map((c) => (
                        <button
                          key={c.task.id}
                          onClick={() => setSelectedCandidateId(c.task.id)}
                          className={clsx(
                            "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 text-xs",
                            c.task.id === primaryCandidate.task.id
                              ? "bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400"
                              : "bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400/50"
                          )}
                        >
                          <div className="font-semibold truncate text-[#17211B] dark:text-[#EAF7EF]">
                            {c.task.taskKey && <span className="font-mono text-purple-400 mr-1">{c.task.taskKey}</span>}
                            {c.task.title}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                            <span>{c.task.priority || 'NORMAL'}</span>
                            <span className="font-bold text-purple-400">Score: {c.score}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 📌 COMING NEXT CARD */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                    📌 Coming Next
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/30">
                      {assessment.upcomingTasks.length} queued
                    </span>
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                    Upcoming unblocked tasks queued for development
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('TASKS')}
                className="text-xs font-semibold text-purple-500 hover:text-purple-400 flex items-center gap-1 cursor-pointer"
              >
                View all tasks <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {assessment.upcomingTasks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center text-xs text-[#8A9890] dark:text-[#6F8A7A]">
                No other upcoming tasks in queue. All clear!
              </div>
            ) : (
              <div className="space-y-2">
                {assessment.upcomingTasks.map(({ task, daysDiff }) => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="p-3 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400 dark:hover:border-purple-500/50 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {task.taskKey && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono font-bold text-[11px]">
                          {task.taskKey}
                        </span>
                      )}
                      <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF] truncate group-hover:text-purple-400 transition-colors">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.dueDate && (
                        <span className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                          {daysDiff !== null && daysDiff > 0 ? `In ${daysDiff}d` : task.dueDate}
                        </span>
                      )}
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded uppercase font-bold text-[10px]",
                          task.priority === 'URGENT' && "bg-rose-500/10 text-rose-400 border border-rose-500/30",
                          task.priority === 'HIGH' && "bg-amber-500/10 text-amber-400 border border-amber-500/30",
                          (!task.priority || task.priority === 'MEDIUM' || task.priority === 'LOW') && "bg-[#E8F7EF] dark:bg-[#0E1C15] text-[#66736B] dark:text-[#9BB5A5]"
                        )}
                      >
                        {task.priority || 'NORMAL'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8A9890] dark:text-[#6F8A7A] group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🔗 RELATED RESOURCES QUICK SHELF */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                    Related Resources
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      {projectResourcesList.length}
                    </span>
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                    Documentation, tools, repositories, and specifications
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onAddResource && (
                  <button
                    onClick={onAddResource}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Resource
                  </button>
                )}
                <button
                  onClick={() => onNavigateTab('RESOURCES')}
                  className="text-xs font-semibold text-purple-500 hover:text-purple-400 flex items-center gap-1 cursor-pointer"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {projectResourcesList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
                <p className="text-xs text-[#8A9890] dark:text-[#6F8A7A]">
                  No related resources linked to this project yet.
                </p>
                {onAddResource && (
                  <button
                    onClick={onAddResource}
                    className="text-xs font-semibold text-purple-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Link GitHub, Figma, SRS, or Architecture Notes
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {projectResourcesList.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenUnifiedResource(item)}
                    className="p-3 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-400/50 transition-all flex items-center justify-between gap-2.5 text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">
                        {item.type === 'GITHUB' && '🐙'}
                        {item.type === 'WEBSITE' && '🌐'}
                        {item.type === 'NOTE' && '📝'}
                        {item.type === 'DOCUMENT' && '📄'}
                        {item.type === 'DRIVE_LINK' && '☁️'}
                      </span>
                      <div className="min-w-0">
                        <h5 className="font-bold text-[#17211B] dark:text-[#EAF7EF] truncate group-hover:text-purple-400 transition-colors">
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-[#8A9890] group-hover:text-purple-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): PROJECT HEALTH + NEEDS ATTENTION + MILESTONES */}
        <div className="lg:col-span-4 space-y-6">
          {/* 🩺 PROJECT HEALTH CARD (Semantic colors only) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#66736B] dark:text-[#9BB5A5]">
                PROJECT HEALTH
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#8A9890] dark:text-[#6F8A7A]">
                <Activity className="w-3.5 h-3.5" />
                <span className="font-mono font-bold">Vitals {health.score}%</span>
              </div>
            </div>

            {/* Main Health Status Banner */}
            <div className={clsx("p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors", health.colorBg, health.colorBorder)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none select-none">{health.emoji}</span>
                <div>
                  <h4 className={clsx("text-base font-extrabold tracking-tight leading-tight", health.colorText)}>
                    {health.label}
                  </h4>
                  <p className="text-[10px] text-[#66736B] dark:text-[#9BB5A5] mt-0.5 font-medium">
                    {health.status === 'ON_TRACK' && 'Healthy pace • Zero critical blockers'}
                    {health.status === 'NEEDS_ATTENTION' && 'Attention needed • Risks detected'}
                    {health.status === 'AT_RISK' && 'Critical delay • Immediate action required'}
                  </p>
                </div>
              </div>
              <div className={clsx("w-3 h-3 rounded-full animate-pulse shrink-0", health.dotColor)} />
            </div>

            {/* Health Factor Breakdown */}
            <div className="space-y-2 text-xs divide-y divide-[#DCE9E1]/50 dark:divide-[#20372B]/50 pt-1">
              <div className="flex items-center justify-between pt-1">
                <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Progress</span>
                <span className="font-bold font-mono text-[#17211B] dark:text-[#EAF7EF]">
                  {health.factors.progress}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Overdue</span>
                <span className={clsx("font-bold font-mono", health.factors.overdueCount > 0 ? "text-rose-500 font-extrabold" : "text-[#17211B] dark:text-[#EAF7EF]")}>
                  {health.factors.overdueCount}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Blocked</span>
                <span className={clsx("font-bold font-mono", health.factors.blockedCount > 0 ? "text-amber-500 font-extrabold" : "text-[#17211B] dark:text-[#EAF7EF]")}>
                  {health.factors.blockedCount}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[#66736B] dark:text-[#9BB5A5] font-medium">Deadline</span>
                <span className={clsx(
                  "font-bold font-mono",
                  health.factors.deadlineDays !== null && health.factors.deadlineDays < 0
                    ? "text-rose-500"
                    : health.factors.deadlineDays !== null && health.factors.deadlineDays <= 3
                    ? "text-amber-500"
                    : "text-[#17211B] dark:text-[#EAF7EF]"
                )}>
                  {health.factors.deadlineLabel}
                </span>
              </div>
            </div>

            {/* Health Drivers / Explanatory Chips */}
            {health.reasons.length > 0 && (
              <div className="pt-2 border-t border-[#DCE9E1]/50 dark:border-[#20372B]/50 flex flex-wrap gap-1">
                {health.reasons.map((reason, i) => (
                  <span
                    key={i}
                    className={clsx(
                      "px-2 py-0.5 rounded text-[10px] font-semibold",
                      health.status === 'AT_RISK'
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : health.status === 'NEEDS_ATTENTION'
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    )}
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ⚠️ NEEDS ATTENTION CARD */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  ⚠️ Needs Attention
                </h3>
                <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                  Risks, overdue tasks & blocked dependencies
                </p>
              </div>
            </div>

            {/* Project Overdue or Approaching Deadline Warning */}
            {isProjectOverdue && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  Project Deadline Passed!
                </div>
                <p className="text-[11px] text-rose-400">
                  Target completion date was <strong>{project.endDate}</strong> ({Math.abs(projectDeadlineDiff!)} days ago).
                </p>
              </div>
            )}

            {isProjectDeadlineApproaching && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <Clock className="w-4 h-4" />
                  Project Deadline Approaching
                </div>
                <p className="text-[11px] text-amber-400">
                  Target date is <strong>{project.endDate}</strong> (in {projectDeadlineDiff} days).
                </p>
              </div>
            )}

            {/* Needs Attention Lists */}
            {assessment.overdueTasks.length === 0 &&
            assessment.blockedTasks.length === 0 &&
            assessment.approachingTasks.length === 0 &&
            !isProjectOverdue ? (
              <div className="p-5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  All Clear & On Track
                </h4>
                <p className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                  No overdue tasks or blocked dependencies detected.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* 1. Overdue tasks */}
                {assessment.overdueTasks.map(({ task, daysDiff }) => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/30 hover:border-rose-500 transition-all text-xs cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                        {task.taskKey && <span className="font-mono text-rose-500 mr-1">{task.taskKey}</span>}
                        {task.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-extrabold shrink-0">
                        OVERDUE ({Math.abs(daysDiff!)}d)
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                      Due date was {task.dueDate}
                    </div>
                  </div>
                ))}

                {/* 2. Blocked tasks */}
                {assessment.blockedTasks.map(({ task, blockingTask }) => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 hover:border-amber-500 transition-all text-xs cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                        {task.taskKey && <span className="font-mono text-amber-500 mr-1">{task.taskKey}</span>}
                        {task.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" /> BLOCKED
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate">
                      Waiting on: <strong className="text-amber-400">{blockingTask?.taskKey || blockingTask?.title || 'dependency'}</strong>
                    </div>
                  </div>
                ))}

                {/* 3. Approaching deadlines */}
                {assessment.approachingTasks.map(({ task, daysDiff }) => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="p-3 rounded-xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/30 hover:border-sky-500 transition-all text-xs cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                        {task.taskKey && <span className="font-mono text-sky-500 mr-1">{task.taskKey}</span>}
                        {task.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 text-[10px] font-extrabold shrink-0">
                        Due in {daysDiff}d
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                      Due on {task.dueDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🏁 MILESTONES & SPRINT TARGETS */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Milestone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                    Milestones
                  </h3>
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                    {completedMilestones} of {milestones.length} completed
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-purple-400 font-mono">
                {milestoneProgress}%
              </span>
            </div>

            {/* Milestone Progress Bar */}
            <div className="w-full h-2 bg-[#E8F7EF] dark:bg-[#13261C] rounded-full overflow-hidden border border-[#DCE9E1] dark:border-[#20372B]">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-[#5FBF8F] transition-all duration-500"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>

            {/* Milestone List */}
            {milestones.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center text-xs text-[#8A9890] dark:text-[#6F8A7A]">
                No milestones defined for this project.
              </div>
            ) : (
              <div className="space-y-2">
                {milestones.map((m) => {
                  const isDone = m.status === 'COMPLETED';
                  return (
                    <div
                      key={m.id}
                      className={clsx(
                        "p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all",
                        isDone
                          ? "bg-emerald-500/5 border-emerald-500/20 text-[#8A9890] dark:text-[#6F8A7A]"
                          : "bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF]"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2
                          className={clsx(
                            "w-4 h-4 shrink-0",
                            isDone ? "text-emerald-400" : "text-[#8A9890] dark:text-[#6F8A7A]"
                          )}
                        />
                        <span className={clsx("font-medium truncate", isDone && "line-through")}>
                          {m.title}
                        </span>
                      </div>

                      {m.dueDate && (
                        <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] shrink-0">
                          {m.dueDate}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🕒 RECENT ACTIVITY STREAM PREVIEW */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Recent Activity
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Real-time chronological events from this project
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ACTIVITY')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] hover:bg-purple-600 hover:text-white border border-[#DCE9E1] dark:border-[#20372B] text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] transition-all cursor-pointer shadow-xs"
          >
            <span>View Full Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(() => {
          const recentList = [...(activity || [])].sort((a, b) => {
            const tA = new Date(a.createdAt).getTime() || 0;
            const tB = new Date(b.createdAt).getTime() || 0;
            return tB - tA;
          }).slice(0, 5);

          const getDesc = (item: ActivityLog): string => {
            if (item.metadata) {
              if (typeof item.metadata === 'object' && item.metadata.description) {
                return String(item.metadata.description);
              }
              if (typeof item.metadata === 'string') {
                try {
                  let str = item.metadata.trim();
                  if (str.startsWith('"') && str.endsWith('"') && str.length > 2) {
                    str = JSON.parse(str);
                  }
                  const parsed = typeof str === 'string' && str.startsWith('{') ? JSON.parse(str) : str;
                  if (typeof parsed === 'object' && parsed && parsed.description) return String(parsed.description);
                  if (typeof parsed === 'string') return parsed;
                } catch {
                  if (item.metadata.trim().length > 0 && !item.metadata.startsWith('{')) {
                    return item.metadata.replace(/^"|"$/g, '');
                  }
                }
              }
            }
            return item.action || 'Project event logged';
          };

          const getRelTime = (dateStr: string): string => {
            try {
              const diffMs = Date.now() - new Date(dateStr).getTime();
              const mins = Math.floor(diffMs / (1000 * 60));
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              if (mins < 1) return 'just now';
              if (mins < 60) return `${mins}m ago`;
              if (hours < 24) return `${hours}h ago`;
              if (days === 1) return 'yesterday';
              if (days < 7) return `${days}d ago`;
              return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch {
              return '';
            }
          };

          const getConfig = (item: ActivityLog) => {
            const act = (item.action || '').toLowerCase();
            const entity = (item.entityType || '').toUpperCase();

            if (act.includes('task completed') || (entity === 'TASK' && act.includes('complete'))) {
              return {
                icon: CheckCircle2,
                iconColor: 'text-emerald-500',
                bgColor: 'bg-emerald-500/10 border-emerald-500/20',
                badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                label: 'Task Completed',
              };
            }
            if (act.includes('task created') || (entity === 'TASK' && act.includes('create'))) {
              return {
                icon: PlusCircle,
                iconColor: 'text-blue-500',
                bgColor: 'bg-blue-500/10 border-blue-500/20',
                badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                label: 'Task Created',
              };
            }
            if (act.includes('task status') || (entity === 'TASK' && act.includes('status'))) {
              return {
                icon: RefreshCw,
                iconColor: 'text-amber-500',
                bgColor: 'bg-amber-500/10 border-amber-500/20',
                badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                label: 'Task Status Changed',
              };
            }
            if (act.includes('commit') || entity === 'GITHUB_COMMIT') {
              return {
                icon: GitCommit,
                iconColor: 'text-purple-500',
                bgColor: 'bg-purple-500/10 border-purple-500/20',
                badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                label: 'GitHub Commit',
              };
            }
            if (act.includes('milestone') || entity === 'MILESTONE') {
              return {
                icon: Flag,
                iconColor: 'text-teal-500',
                bgColor: 'bg-teal-500/10 border-teal-500/20',
                badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
                label: 'Milestone Completed',
              };
            }
            if (act.includes('note') || entity === 'NOTE') {
              return {
                icon: act.includes('update') ? Edit3 : FileText,
                iconColor: 'text-amber-500',
                bgColor: 'bg-amber-500/10 border-amber-500/20',
                badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                label: act.includes('update') ? 'Note Updated' : 'Note Added',
              };
            }
            if (act.includes('document') || entity === 'DOCUMENT') {
              return {
                icon: act.includes('remove') ? FileX : FileCheck,
                iconColor: act.includes('remove') ? 'text-rose-500' : 'text-cyan-500',
                bgColor: act.includes('remove') ? 'bg-rose-500/10 border-rose-500/20' : 'bg-cyan-500/10 border-cyan-500/20',
                badgeBg: act.includes('remove') ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
                label: act.includes('remove') ? 'Document Removed' : 'Document Added',
              };
            }
            if (act.includes('website') || entity === 'WEBSITE') {
              return {
                icon: Globe,
                iconColor: act.includes('remove') ? 'text-rose-500' : 'text-indigo-500',
                bgColor: act.includes('remove') ? 'bg-rose-500/10 border-rose-500/20' : 'bg-indigo-500/10 border-indigo-500/20',
                badgeBg: act.includes('remove') ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                label: act.includes('remove') ? 'Website Removed' : 'Website Added',
              };
            }
            if (act.includes('drive') || entity === 'DRIVE_LINK') {
              return {
                icon: HardDrive,
                iconColor: act.includes('remove') ? 'text-rose-500' : 'text-sky-500',
                bgColor: act.includes('remove') ? 'bg-rose-500/10 border-rose-500/20' : 'bg-sky-500/10 border-sky-500/20',
                badgeBg: act.includes('remove') ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-sky-500/10 text-sky-600 border-sky-500/20',
                label: act.includes('remove') ? 'Drive Removed' : 'Drive Added',
              };
            }
            if (act.includes('project') || entity === 'PROJECT') {
              return {
                icon: act.includes('creat') ? Rocket : Settings,
                iconColor: 'text-purple-500',
                bgColor: 'bg-purple-500/10 border-purple-500/20',
                badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                label: act.includes('creat') ? 'Project Created' : 'Project Updated',
              };
            }
            return {
              icon: Activity,
              iconColor: 'text-[#8A9890]',
              bgColor: 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B]',
              badgeBg: 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] border-[#DCE9E1] dark:border-[#20372B]',
              label: item.action || 'Project Event',
            };
          };

          if (recentList.length === 0) {
            return (
              <div className="p-6 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1.5">
                <Clock className="w-6 h-6 text-purple-400 mx-auto" />
                <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  No Recent Activity Recorded
                </h4>
                <p className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                  Events will appear here automatically when tasks are completed, resources are linked, or commits are made.
                </p>
              </div>
            );
          }

          return (
            <div className="divide-y divide-[#DCE9E1]/50 dark:divide-[#20372B]/50">
              {recentList.map((item) => {
                const conf = getConfig(item);
                const Icon = conf.icon;
                const desc = getDesc(item);
                const relTime = getRelTime(item.createdAt);

                return (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={clsx('p-2 rounded-xl border shrink-0', conf.bgColor)}>
                        <Icon className={clsx('w-4 h-4', conf.iconColor)} />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx('px-2 py-0.5 text-[10px] font-bold rounded border', conf.badgeBg)}>
                            {conf.label}
                          </span>
                          <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A]">
                            • {relTime}
                          </span>
                        </div>
                        <p className="font-semibold text-[#17211B] dark:text-[#EAF7EF] truncate max-w-xl">
                          {desc}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-[#8A9890] dark:text-[#6F8A7A] shrink-0 pt-1">
                      {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
