import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Briefcase,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import type { RecurringTask } from '../../types';
import { clsx } from 'clsx';

interface RecurringTasksPanelProps {
  recurringTasks: RecurringTask[];
  onOpenCreate: () => void;
  onEdit: (task: RecurringTask) => void;
  onDelete: (id: string) => Promise<void>;
  onTogglePauseResume: (task: RecurringTask) => Promise<void>;
  onTriggerGenerateToday: () => Promise<void>;
  isGenerating?: boolean;
}

export const RecurringTasksPanel: React.FC<RecurringTasksPanelProps> = ({
  recurringTasks,
  onOpenCreate,
  onEdit,
  onDelete,
  onTogglePauseResume,
  onTriggerGenerateToday,
  isGenerating = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

  const filtered = recurringTasks.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const formatRecurrencePattern = (task: RecurringTask) => {
    if (task.recurrenceType === 'DAILY') {
      return 'Every Day';
    }
    if (task.recurrenceType === 'WEEKLY') {
      if (!task.recurrenceConfig) return 'Every Week';
      const days = task.recurrenceConfig.split(',').map((d) => {
        const clean = d.trim().toLowerCase();
        return clean.charAt(0).toUpperCase() + clean.slice(1, 3);
      });
      return `Weekly on ${days.join(', ')}`;
    }
    if (task.recurrenceType === 'MONTHLY') {
      return `Monthly on day ${task.recurrenceConfig || '1'}`;
    }
    return task.recurrenceType;
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

  return (
    <div className="space-y-6">
      {/* Informational Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE9E1] dark:border-[#20372B] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                Recurring Task Templates
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  {recurringTasks.length} Templates
                </span>
              </h2>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Automated recurring routines evaluated every morning at 04:00 AM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onTriggerGenerateToday}
              disabled={isGenerating}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all cursor-pointer border border-[#5FBF8F]/30 flex items-center gap-1.5 disabled:opacity-50"
              title="Manually trigger 4:00 AM generator for today"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isGenerating && 'animate-spin')} />
              {isGenerating ? 'Generating...' : 'Sync Today Instances'}
            </button>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#237A57] to-[#5FBF8F] hover:brightness-105 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + New Recurring Task
            </button>
          </div>
        </div>

        {/* Info Banner: How it works */}
        <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] flex items-start gap-3 text-xs text-[#66736B] dark:text-[#9BB5A5]">
          <HelpCircle className="w-4 h-4 text-[#5FBF8F] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">
              How AIU Recurring Tasks Work
            </p>
            <p className="text-[11px] leading-relaxed">
              Every day at <strong>4:00 AM (Asia/Colombo)</strong>, the system processes all active templates, verifies recurrence rules, and automatically creates today's individual task instance into your <strong>Today's Tasks</strong> checklist. Pausing a template stops future generation without deleting any completed historical tasks.
            </p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 pt-1">
          {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={clsx(
                'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer',
                filterStatus === status
                  ? 'bg-[#5FBF8F] text-white border-[#5FBF8F] shadow-xs'
                  : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
              )}
            >
              {status === 'ALL' && `All (${recurringTasks.length})`}
              {status === 'ACTIVE' && `Active (${recurringTasks.filter((r) => r.status === 'ACTIVE').length})`}
              {status === 'PAUSED' && `Paused (${recurringTasks.filter((r) => r.status === 'PAUSED').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white dark:bg-[#0E1C15] border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2.5">
            <Repeat className="w-9 h-9 text-amber-500/60 mx-auto" />
            <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
              No recurring tasks found
            </h4>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
              Create recurring tasks for habits, study sessions, weekly meetings, or daily revision routines to auto-populate your Today's Tasks checklist.
            </p>
            <button
              onClick={onOpenCreate}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#237A57] to-[#5FBF8F] text-white inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:brightness-105 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Template
            </button>
          </div>
        ) : (
          filtered.map((task) => {
            const isActive = task.status === 'ACTIVE';
            return (
              <div
                key={task.id}
                className={clsx(
                  'p-4 sm:p-5 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group',
                  isActive
                    ? 'bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                    : 'bg-[#F3FBF7]/50 dark:bg-[#13261C]/50 border-[#DCE9E1] dark:border-[#20372B] opacity-75'
                )}
              >
                {/* Info Column */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                      {task.title}
                    </h3>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      )}
                    >
                      {task.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30 flex items-center gap-1">
                      <Repeat className="w-2.5 h-2.5" />
                      {formatRecurrencePattern(task)}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3.5 text-[11px] text-[#8A9890] dark:text-[#6F8A7A] flex-wrap">
                    {task.dueTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {formatDisplayTime(task.dueTime)}
                      </span>
                    )}
                    {task.estimatedDuration && (
                      <span className="text-[#237A57] dark:text-[#6DD6A0] font-medium">
                        ⏱️ {task.estimatedDuration} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#5FBF8F]" />
                      From {task.startDate} {task.endDate ? `to ${task.endDate}` : '(No end date)'}
                    </span>
                    {task.projectName && (
                      <span className="flex items-center gap-1 text-purple-500 font-medium">
                        <Briefcase className="w-3 h-3" />
                        {task.projectName}
                      </span>
                    )}
                    <span
                      className={clsx(
                        'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase',
                        task.priority === 'HIGH' || task.priority === 'URGENT'
                          ? 'bg-rose-500/10 text-rose-500'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-slate-500/10 text-slate-400'
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => onTogglePauseResume(task)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs',
                      isActive
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-white'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                    )}
                    title={isActive ? 'Pause recurring generation' : 'Resume recurring generation'}
                  >
                    {isActive ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Resume
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onEdit(task)}
                    className="p-1.5 rounded-xl border border-[#DCE9E1] dark:border-[#20372B] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-all cursor-pointer"
                    title="Edit Recurring Task"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 rounded-xl border border-[#DCE9E1] dark:border-[#20372B] hover:bg-rose-500/10 text-[#8A9890] hover:text-rose-400 transition-all cursor-pointer"
                    title="Delete Recurring Template (Historical tasks remain intact)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
