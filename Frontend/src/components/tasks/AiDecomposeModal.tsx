import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Zap,
  Plus,
  Clock,
  Link2,
  Edit3,
  Trash2,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  RotateCw,
  Layers
} from 'lucide-react';
import { aiService, DecomposeResult, AiActionItem } from '../../services/aiService';
import { Task } from '../../types';

interface EditableSubtask extends AiActionItem {
  tempId: string;
  selected: boolean;
  isEditing: boolean;
}

interface AiDecomposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSubtasksCreated?: () => void;
}

export const AiDecomposeModal: React.FC<AiDecomposeModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubtasksCreated
}) => {
  const [subtasks, setSubtasks] = useState<EditableSubtask[]>([]);
  const [strategyOverview, setStrategyOverview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && task) {
      loadDecomposition();
    } else {
      setSubtasks([]);
      setStrategyOverview('');
      setCreatedCount(null);
      setError(null);
    }
  }, [isOpen, task?.id]);

  const loadDecomposition = async () => {
    if (!task) return;
    setLoading(true);
    setError(null);
    setCreatedCount(null);
    try {
      const data: DecomposeResult = await aiService.decomposeTask(task.id);
      setStrategyOverview(data.strategyOverview || '');
      const mapped: EditableSubtask[] = (data.generatedSubtasks || []).map((s, idx) => ({
        ...s,
        tempId: `sub-${idx}-${Date.now()}`,
        selected: true,
        isEditing: false,
        orderNumber: s.orderNumber || idx + 1,
        priority: s.priority || 'MEDIUM',
        estimatedDuration: s.estimatedDuration || 45,
        dependencySuggestion: s.dependencySuggestion || (idx === 0 ? 'Initial step' : `Prerequisite: step ${idx}`)
      }));
      setSubtasks(mapped);
    } catch (err: any) {
      console.error('Failed to decompose task:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to decompose task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (tempId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, selected: !s.selected } : s))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = subtasks.length > 0 && subtasks.every((s) => s.selected);
    setSubtasks((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
  };

  const toggleEdit = (tempId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, isEditing: !s.isEditing } : s))
    );
  };

  const updateSubtaskField = (
    tempId: string,
    field: keyof EditableSubtask,
    value: any
  ) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
  };

  const removeSubtask = (tempId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const addNewSubtask = () => {
    const newIdx = subtasks.length + 1;
    const newItem: EditableSubtask = {
      type: 'CREATE_TASK',
      title: `Subtask ${newIdx} for ${task?.title || 'task'}`,
      description: 'Describe what needs to be accomplished',
      priority: 'MEDIUM',
      estimatedDuration: 45,
      dependencySuggestion: newIdx === 1 ? 'Initial step' : `Depends on step ${newIdx - 1}`,
      tempId: `sub-new-${Date.now()}`,
      selected: true,
      isEditing: true,
      orderNumber: newIdx
    };
    setSubtasks((prev) => [...prev, newItem]);
  };

  const handleCreateSelected = async () => {
    const selectedItems = subtasks.filter((s) => s.selected && s.title.trim().length > 0);
    if (!selectedItems.length || !task) return;

    setExecuting(true);
    setError(null);
    try {
      const actionsWithParent: AiActionItem[] = selectedItems.map((s, idx) => ({
        type: 'CREATE_TASK',
        title: s.title.trim(),
        description: s.description?.trim() || undefined,
        priority: s.priority || 'MEDIUM',
        parentTaskId: s.parentTaskId || task.id,
        projectId: s.projectId || task.projectId,
        estimatedDuration: s.estimatedDuration && s.estimatedDuration > 0 ? s.estimatedDuration : undefined,
        dependencySuggestion: s.dependencySuggestion?.trim() || undefined,
        orderNumber: idx + 1
      }));

      await aiService.executeActions(actionsWithParent);
      setCreatedCount(selectedItems.length);
      if (onSubtasksCreated) onSubtasksCreated();

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Failed to create subtasks:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to persist subtasks.');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen || !task) return null;

  const selectedCount = subtasks.filter((s) => s.selected).length;
  const totalDuration = subtasks
    .filter((s) => s.selected)
    .reduce((acc, curr) => acc + (curr.estimatedDuration || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E2B22] border border-[#E1EBE4] dark:border-[#2C3E33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E1EBE4] dark:border-[#2C3E33] flex items-center justify-between shrink-0 bg-white/50 dark:bg-[#1E2B22]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  AI Task Decomposition
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Preview Mode
                </span>
              </div>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate max-w-md mt-0.5">
                Target: <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{task.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F5EE] dark:hover:bg-[#233529] transition-colors"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-9 h-9 mx-auto text-emerald-500 animate-spin" />
              <p className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Decomposing task with AI...
              </p>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
                Analyzing requirements, structuring sequential steps, and estimating durations for practical execution.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Decomposition Notice</span>
              </div>
              <p className="text-xs">{error}</p>
              <button
                onClick={loadDecomposition}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-red-500 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Retry Decomposition
              </button>
            </div>
          ) : createdCount !== null ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Successfully Created {createdCount} Subtasks!
              </h4>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Subtasks are now linked directly under "{task.title}".
              </p>
            </div>
          ) : (
            <>
              {/* Strategy & Meta Banner */}
              {strategyOverview && (
                <div className="p-3.5 rounded-2xl bg-[#E8F5EE] dark:bg-[#233529] border border-[#5FBF8F]/30 text-xs text-brand-800 dark:text-brand-300 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Strategy Plan</span>
                    <span className="opacity-90">{strategyOverview}</span>
                  </div>
                </div>
              )}

              {/* Subtask Controls Header */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] hover:text-emerald-600 transition-colors"
                  >
                    {subtasks.length > 0 && subtasks.every((s) => s.selected) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-[#66736B] dark:text-[#9BB5A5]" />
                    )}
                    <span>
                      {subtasks.length > 0 && subtasks.every((s) => s.selected)
                        ? 'Deselect All'
                        : 'Select All'}
                    </span>
                  </button>
                  <span className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                    ({selectedCount} of {subtasks.length} selected)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {totalDuration > 0 && (
                    <span className="text-[11px] font-semibold text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-1 bg-[#F0F5F2] dark:bg-[#16221A] px-2.5 py-1 rounded-lg border border-[#E1EBE4] dark:border-[#2C3E33]">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      Total: ~{Math.floor(totalDuration / 60) > 0 ? `${Math.floor(totalDuration / 60)}h ` : ''}
                      {totalDuration % 60 > 0 ? `${totalDuration % 60}m` : totalDuration === 0 ? '0m' : ''}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={addNewSubtask}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subtask</span>
                  </button>
                </div>
              </div>

              {/* Subtask Cards List */}
              <div className="space-y-3">
                {subtasks.map((sub, idx) => (
                  <div
                    key={sub.tempId}
                    className={`rounded-2xl border transition-all duration-200 p-3.5 ${
                      sub.selected
                        ? 'bg-[#F7FAF8] dark:bg-[#141C16] border-[#5FBF8F]/40 dark:border-[#5FBF8F]/30 shadow-sm'
                        : 'bg-white/40 dark:bg-[#1A261E]/40 border-[#E1EBE4] dark:border-[#2C3E33] opacity-60'
                    }`}
                  >
                    {sub.isEditing ? (
                      /* Inline Editing View */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Editing Subtask #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleEdit(sub.tempId)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Done
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-[#66736B] dark:text-[#9BB5A5] block mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={sub.title}
                            onChange={(e) => updateSubtaskField(sub.tempId, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E1EBE4] dark:border-[#2C3E33] bg-white dark:bg-[#1C281F] text-xs text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Subtask title"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-[#66736B] dark:text-[#9BB5A5] block mb-1">
                            Description (Optional)
                          </label>
                          <textarea
                            rows={2}
                            value={sub.description || ''}
                            onChange={(e) => updateSubtaskField(sub.tempId, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E1EBE4] dark:border-[#2C3E33] bg-white dark:bg-[#1C281F] text-xs text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Brief details or scope"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#66736B] dark:text-[#9BB5A5] block mb-1">
                              Duration (mins)
                            </label>
                            <input
                              type="number"
                              min="5"
                              step="5"
                              value={sub.estimatedDuration || ''}
                              onChange={(e) =>
                                updateSubtaskField(
                                  sub.tempId,
                                  'estimatedDuration',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-[#E1EBE4] dark:border-[#2C3E33] bg-white dark:bg-[#1C281F] text-xs text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#66736B] dark:text-[#9BB5A5] block mb-1">
                              Priority
                            </label>
                            <select
                              value={sub.priority || 'MEDIUM'}
                              onChange={(e) => updateSubtaskField(sub.tempId, 'priority', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-[#E1EBE4] dark:border-[#2C3E33] bg-white dark:bg-[#1C281F] text-xs text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="URGENT">Urgent</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#66736B] dark:text-[#9BB5A5] block mb-1">
                              Dependency Note
                            </label>
                            <input
                              type="text"
                              value={sub.dependencySuggestion || ''}
                              onChange={(e) =>
                                updateSubtaskField(sub.tempId, 'dependencySuggestion', e.target.value)
                              }
                              className="w-full px-3 py-1.5 rounded-xl border border-[#E1EBE4] dark:border-[#2C3E33] bg-white dark:bg-[#1C281F] text-xs text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="e.g. Depends on step 1"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Preview Card View */
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleSelect(sub.tempId)}
                            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform"
                            title={sub.selected ? 'Deselect subtask' : 'Select subtask'}
                          >
                            {sub.selected ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-[#66736B] dark:text-[#9BB5A5]" />
                            )}
                          </button>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                #{idx + 1}
                              </span>
                              <span
                                className={`text-xs sm:text-sm font-bold text-[#17211B] dark:text-[#EAF7EF] ${
                                  !sub.selected ? 'line-through opacity-70' : ''
                                }`}
                              >
                                {sub.title}
                              </span>
                              {sub.priority && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                    sub.priority === 'URGENT'
                                      ? 'bg-red-100 dark:bg-red-950/40 text-red-600'
                                      : sub.priority === 'HIGH'
                                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700'
                                      : 'bg-[#E8F5EE] dark:bg-[#233529] text-emerald-700 dark:text-emerald-300'
                                  }`}
                                >
                                  {sub.priority}
                                </span>
                              )}
                            </div>

                            {sub.description && (
                              <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] line-clamp-2">
                                {sub.description}
                              </p>
                            )}

                            {/* Badges: Duration & Dependency suggestion */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {sub.estimatedDuration && sub.estimatedDuration > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#1E2B22] border border-[#E1EBE4] dark:border-[#2C3E33] text-[10px] font-semibold text-[#66736B] dark:text-[#9BB5A5]">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  {sub.estimatedDuration}m
                                </span>
                              )}
                              {sub.dependencySuggestion && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                  <Link2 className="w-3 h-3" />
                                  {sub.dependencySuggestion}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Edit & Remove */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleEdit(sub.tempId)}
                            className="p-1.5 rounded-lg text-[#66736B] dark:text-[#9BB5A5] hover:bg-white dark:hover:bg-[#233529] hover:text-emerald-600 transition-colors"
                            title="Edit subtask"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSubtask(sub.tempId)}
                            className="p-1.5 rounded-lg text-[#66736B] dark:text-[#9BB5A5] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors"
                            title="Remove subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {subtasks.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-[#E1EBE4] dark:border-[#2C3E33] rounded-2xl">
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mb-2">
                      No subtasks in list.
                    </p>
                    <button
                      type="button"
                      onClick={addNewSubtask}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Subtask
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E1EBE4] dark:border-[#2C3E33] bg-[#FAFDFB] dark:bg-[#16221A] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={executing}
            className="px-4 py-2 text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreateSelected}
            disabled={executing || selectedCount === 0 || loading || createdCount !== null}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {executing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Creating Subtasks...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Create Selected Subtasks ({selectedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
