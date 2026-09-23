import React, { useState } from 'react';
import { Lock, Unlock, X, Plus, ChevronRight, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Task, TaskDependencyRef } from '../../types';
import { taskService } from '../../services/taskService';

interface TaskDependencyPanelProps {
  task: Task;
  /** All tasks in the same project (for the picker) */
  projectTasks: Task[];
  onUpdated: () => void;
}

const statusColors: Record<string, string> = {
  COMPLETED: 'text-emerald-400',
  IN_PROGRESS: 'text-blue-400',
  TODO: 'text-slate-400',
  CANCELLED: 'text-rose-400',
};

const statusLabels: Record<string, string> = {
  COMPLETED: 'Done',
  IN_PROGRESS: 'In Progress',
  TODO: 'To Do',
  CANCELLED: 'Cancelled',
};

function DepRef({ ref: dep, onRemove }: { ref: TaskDependencyRef; onRemove?: () => void }) {
  const isCompleted = dep.status === 'COMPLETED';
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 group hover:border-slate-600 transition-all">
      {isCompleted
        ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
        : <Lock size={14} className="text-amber-400 shrink-0" />}
      <span className="text-xs font-mono text-slate-400 shrink-0">{dep.taskKey || ''}</span>
      <span className="text-sm text-slate-200 flex-1 truncate">{dep.title}</span>
      <span className={`text-xs font-medium ${statusColors[dep.status] || 'text-slate-400'}`}>
        {statusLabels[dep.status] || dep.status}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-all"
          title="Remove dependency"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export const TaskDependencyPanel: React.FC<TaskDependencyPanelProps> = ({
  task,
  projectTasks,
  onUpdated,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blockedBy: TaskDependencyRef[] = task.blockedBy || [];
  const blocks: TaskDependencyRef[] = task.blocks || [];

  // Filter project tasks for picker — exclude self, already linked, and cancelled
  const existingDepIds = new Set(blockedBy.map(b => b.taskId));
  const pickerTasks = projectTasks.filter(t =>
    t.id !== task.id &&
    !existingDepIds.has(t.id) &&
    t.status !== 'CANCELLED' &&
    (search === '' || t.title.toLowerCase().includes(search.toLowerCase()) || (t.taskKey || '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (dependsOnId: string) => {
    setAdding(true);
    setError(null);
    try {
      await taskService.addDependency(task.id, dependsOnId);
      setShowPicker(false);
      setSearch('');
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to add dependency.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (dependsOnId: string) => {
    setRemoving(dependsOnId);
    setError(null);
    try {
      await taskService.removeDependency(task.id, dependsOnId);
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to remove dependency.');
    } finally {
      setRemoving(null);
    }
  };

  const isBlocked = task.isBlocked;

  return (
    <div className="space-y-4">

      {/* Blocked status banner */}
      {(blockedBy.length > 0) && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          isBlocked
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          {isBlocked
            ? <Lock size={14} className="shrink-0" />
            : <Unlock size={14} className="shrink-0" />}
          <span className="text-sm font-medium">
            {isBlocked
              ? `Blocked — waiting for ${blockedBy.filter(b => b.status !== 'COMPLETED').length} task(s)`
              : 'Ready — all dependencies completed'}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Blocked-by list (this task depends on) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            🔒 Depends On (Blocked By)
          </h4>
          <button
            onClick={() => { setShowPicker(v => !v); setSearch(''); setError(null); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-indigo-400 hover:bg-indigo-400/10 transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        {blockedBy.length === 0 && !showPicker && (
          <p className="text-xs text-slate-500 italic px-1">No dependencies — this task is independent.</p>
        )}

        <div className="space-y-1.5">
          {blockedBy.map(dep => (
            <DepRef
              key={dep.taskId}
              ref={dep}
              onRemove={removing === dep.taskId ? undefined : () => handleRemove(dep.taskId)}
            />
          ))}
        </div>

        {/* Dependency picker */}
        {showPicker && (
          <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/60">
              <Search size={14} className="text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks to block on..."
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {pickerTasks.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">No available tasks</div>
              )}
              {pickerTasks.map(t => (
                <button
                  key={t.id}
                  disabled={adding}
                  onClick={() => handleAdd(t.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-800 transition-colors text-left group"
                >
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                  <span className="text-xs font-mono text-slate-400 shrink-0">{t.taskKey || ''}</span>
                  <span className="text-sm text-slate-200 flex-1 truncate">{t.title}</span>
                  <span className={`text-xs ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Blocks list (tasks that depend on this one) */}
      {blocks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            ⛔ Blocks (Other Tasks Waiting)
          </h4>
          <div className="space-y-1.5">
            {blocks.map(dep => (
              <DepRef key={dep.taskId} ref={dep} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
