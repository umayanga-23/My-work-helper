import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  Square,
  RefreshCw,
  Edit3,
  Check,
  Briefcase
} from 'lucide-react';
import { aiService, TodayPlan, PlanOrderItem } from '../../services/aiService';
import { taskService } from '../../services/taskService';
import { Task } from '../../types';
import { clsx } from 'clsx';

interface AiPlanTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelected?: (task: Task) => void;
  onTasksCreated?: () => void;
}

export const AiPlanTodayModal: React.FC<AiPlanTodayModalProps> = ({
  isOpen,
  onClose,
  onTaskSelected,
  onTasksCreated,
}) => {
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [orderedItems, setOrderedItems] = useState<PlanOrderItem[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlan();
    } else {
      setIsModifyMode(false);
      setError(null);
      setApplySuccess(false);
    }
  }, [isOpen]);

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    setIsModifyMode(false);
    setApplySuccess(false);
    try {
      const data = await aiService.planToday();
      setPlan(data);

      // Extract ordered items
      let items: PlanOrderItem[] = [];
      if (data.suggestedOrder && data.suggestedOrder.length > 0) {
        items = [...data.suggestedOrder];
      } else if (data.recommendedTasks && data.recommendedTasks.length > 0) {
        items = data.recommendedTasks.map((t, idx) => ({
          orderNumber: idx + 1,
          taskId: t.id,
          taskKey: t.taskKey,
          taskTitle: t.title,
          reason: 'Prioritized based on task readiness and deadline',
          estimatedDuration: t.estimatedDuration,
          priority: t.priority,
          status: t.status,
          projectName: t.projectName,
          dueDate: t.dueDate,
          dueTime: t.dueTime,
        }));
      }

      setOrderedItems(items);
      setSelectedTaskIds(new Set(items.map((it) => it.taskId)));
    } catch (err: any) {
      console.error('Failed to generate today plan:', err);
      const msg = err.response?.data?.message || err.message || 'AI planning service timed out or encountered an error.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleMoveItem = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const nextList = [...orderedItems];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIndex, 0, moved);

    // Re-assign order numbers
    const renumbered = nextList.map((item, idx) => ({
      ...item,
      orderNumber: idx + 1,
    }));
    setOrderedItems(renumbered);
  };

  const handleResetOrder = () => {
    if (!plan?.suggestedOrder) return;
    setOrderedItems([...plan.suggestedOrder]);
    setSelectedTaskIds(new Set(plan.suggestedOrder.map((it) => it.taskId)));
  };

  // ─── 1. ACCEPT PLAN ──────────────────────────────────────────────────────────
  const handleAcceptPlan = async () => {
    if (!orderedItems.length) {
      onClose();
      return;
    }

    setApplying(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const acceptedTasks = orderedItems.filter((it) => selectedTaskIds.has(it.taskId));

      // Schedule selected tasks for today without deleting or mutating other tasks
      for (const item of acceptedTasks) {
        if (item.dueDate !== todayStr) {
          await taskService.rescheduleToToday(item.taskId).catch(() => null);
        }
      }

      setApplySuccess(true);
      if (onTasksCreated) onTasksCreated();

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to apply today plan:', err);
      onClose();
    } finally {
      setApplying(false);
    }
  };

  // ─── 2. CANCEL ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const hasTasks = orderedItems.length > 0;
  const activeCount = orderedItems.filter((it) => selectedTaskIds.has(it.taskId)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-4 shrink-0 bg-white/50 dark:bg-[#0E1C15]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#237A57] to-[#5FBF8F] flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#17211B] dark:text-[#EAF7EF] truncate">
                  AI Strategic Today's Plan
                </h3>
                {plan && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30 shrink-0">
                    Smart Suggestions
                  </span>
                )}
              </div>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate">
                Optimized execution roadmap based on actual task data & dependencies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {plan && !loading && (
              <button
                onClick={loadPlan}
                disabled={loading}
                title="Regenerate Plan"
                className="p-2 rounded-xl text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] transition-all cursor-pointer"
              >
                <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
              </button>
            )}
            <button
              onClick={handleCancel}
              className="p-2 rounded-xl text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Analyzing Workspace Tasks & Dependencies...
              </h4>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
                Evaluating priorities, blockers, deadlines, and project alignment to compute an optimal daily sequence.
              </p>
            </div>
          )}

          {/* Error / Failure State */}
          {!loading && error && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Unable to Generate Daily Plan</span>
              </div>
              <p className="text-xs">{error}</p>
              <button
                onClick={loadPlan}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Plan Generation
              </button>
            </div>
          )}

          {/* Empty Backlog State */}
          {!loading && !error && !hasTasks && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Your Backlog is Clear!
              </h4>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
                No incomplete or pending tasks found in your workspace. You're all caught up for today!
              </p>
            </div>
          )}

          {/* Plan Content */}
          {!loading && !error && hasTasks && (
            <div className="space-y-4 animate-in fade-in">
              {/* Strategy & Meta Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Workload Card */}
                <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/60 border border-[#DCE9E1] dark:border-[#20372B] space-y-1">
                  <div className="text-[10px] font-bold text-[#66736B] dark:text-[#9BB5A5] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#237A57] dark:text-[#6DD6A0]" />
                    Estimated Workload
                  </div>
                  <div className="text-sm font-extrabold text-[#17211B] dark:text-[#EAF7EF]">
                    {plan?.estimatedWorkload || (plan?.estimatedTotalHours ? `~${plan.estimatedTotalHours} hours` : 'Estimated workload unavailable')}
                  </div>
                  <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5]">
                    {activeCount} of {orderedItems.length} tasks selected
                  </div>
                </div>

                {/* Strategy Snapshot */}
                <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/60 border border-[#DCE9E1] dark:border-[#20372B] space-y-1">
                  <div className="text-[10px] font-bold text-[#66736B] dark:text-[#9BB5A5] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Planning Strategy
                  </div>
                  <p className="text-xs text-[#17211B] dark:text-[#EAF7EF] font-medium line-clamp-2">
                    {plan?.strategyRationale || 'Prioritized by deadline urgency and dependency readiness.'}
                  </p>
                </div>
              </div>

              {/* Reason for Suggested Order */}
              {plan?.reasonForOrder && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-1.5 shadow-2xs">
                  <div className="text-[10px] font-bold text-[#237A57] dark:text-[#6DD6A0] uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Reason for Suggested Order
                  </div>
                  <p className="text-xs text-[#17211B] dark:text-[#EAF7EF] leading-relaxed">
                    {plan.reasonForOrder}
                  </p>
                </div>
              )}

              {/* Potential Conflicts (if any) */}
              {plan?.potentialConflicts && plan.potentialConflicts.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Potential Conflicts Detected
                  </div>
                  <ul className="space-y-1 text-xs">
                    {plan.potentialConflicts.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Order Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 pt-1">
                  <h4 className="text-xs font-black tracking-wider uppercase text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-1.5">
                    <span>SUGGESTED ORDER</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]">
                      {orderedItems.length}
                    </span>
                  </h4>

                  {isModifyMode && (
                    <button
                      type="button"
                      onClick={handleResetOrder}
                      className="text-[11px] font-semibold text-[#237A57] dark:text-[#6DD6A0] hover:underline cursor-pointer"
                    >
                      Reset Order
                    </button>
                  )}
                </div>

                {/* Tasks List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {orderedItems.map((item, index) => {
                    const isSelected = selectedTaskIds.has(item.taskId);
                    return (
                      <div
                        key={item.taskId}
                        className={clsx(
                          'p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 shadow-2xs group',
                          isSelected
                            ? 'bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                            : 'bg-gray-50/70 dark:bg-[#0A140F]/60 border-dashed border-gray-300 dark:border-gray-800 opacity-60'
                        )}
                      >
                        {/* Order & Content */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Modify Mode Checkbox or Order Number */}
                          {isModifyMode ? (
                            <button
                              type="button"
                              onClick={() => handleToggleTaskSelection(item.taskId)}
                              className="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer text-[#237A57] dark:text-[#6DD6A0] border-[#DCE9E1] dark:border-[#20372B]"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#5FBF8F] fill-current" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-[#237A57] text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-xs">
                              {item.orderNumber}
                            </span>
                          )}

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.taskKey && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F3FBF7] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30 shrink-0">
                                  {item.taskKey}
                                </span>
                              )}
                              <span
                                onClick={() => {
                                  if (onTaskSelected && plan?.recommendedTasks) {
                                    const match = plan.recommendedTasks.find((t) => t.id === item.taskId);
                                    if (match) onTaskSelected(match);
                                  }
                                }}
                                className={clsx(
                                  'text-xs sm:text-sm font-bold truncate block cursor-pointer hover:text-[#237A57] dark:hover:text-[#6DD6A0]',
                                  isSelected ? 'text-[#17211B] dark:text-[#EAF7EF]' : 'line-through text-[#8A9890]'
                                )}
                                title={item.taskTitle}
                              >
                                {item.taskTitle}
                              </span>
                            </div>

                            {/* Meta Badges */}
                            <div className="flex items-center gap-2 text-[11px] text-[#66736B] dark:text-[#9BB5A5] flex-wrap">
                              {item.projectName && (
                                <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {item.projectName}
                                </span>
                              )}
                              {item.priority && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase">
                                  {item.priority}
                                </span>
                              )}
                              {item.estimatedDuration && item.estimatedDuration > 0 && (
                                <span className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-medium">
                                  <Clock className="w-3 h-3" />
                                  {item.estimatedDuration}m
                                </span>
                              )}
                              {item.dueTime && (
                                <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                                  Due {item.dueTime.slice(0, 5)}
                                </span>
                              )}
                            </div>

                            {/* Specific position reason */}
                            {item.reason && (
                              <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] italic">
                                ↳ {item.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Reordering Controls in Modify Mode */}
                        {isModifyMode && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveItem(index, 'UP')}
                              className="p-1 rounded-lg hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#66736B] disabled:opacity-20 cursor-pointer"
                              title="Move Earlier"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === orderedItems.length - 1}
                              onClick={() => handleMoveItem(index, 'DOWN')}
                              className="p-1 rounded-lg hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#66736B] disabled:opacity-20 cursor-pointer"
                              title="Move Later"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Confirmation Action Bar */}
        <div className="p-4 sm:p-5 border-t border-[#DCE9E1] dark:border-[#20372B] bg-[#F3FBF7]/70 dark:bg-[#0E1C15]/70 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={applying}
            className="px-4 py-2 text-xs font-bold rounded-xl text-[#66736B] dark:text-[#9BB5A5] hover:bg-gray-100 dark:hover:bg-[#13261C] transition-all cursor-pointer"
          >
            Cancel
          </button>

          {/* Right Action Buttons: Modify & Accept Plan */}
          <div className="flex items-center gap-2.5">
            {hasTasks && (
              <button
                type="button"
                onClick={() => setIsModifyMode(!isModifyMode)}
                disabled={applying}
                className={clsx(
                  'px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs',
                  isModifyMode
                    ? 'bg-[#237A57] text-white border-[#237A57]'
                    : 'bg-white dark:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                )}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isModifyMode ? 'Done Modifying' : 'Modify'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptPlan}
              disabled={applying || !hasTasks || activeCount === 0}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#237A57] hover:bg-[#5FBF8F] text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {applying ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Plan...</span>
                </>
              ) : applySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Plan Accepted!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept Plan {activeCount > 0 ? `(${activeCount})` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
