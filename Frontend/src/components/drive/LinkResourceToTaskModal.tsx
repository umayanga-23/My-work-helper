import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Search, Link2, CheckSquare } from 'lucide-react';
import { DriveLink, Task } from '../../types';
import { taskService } from '../../services/taskService';
import { clsx } from 'clsx';

interface LinkResourceToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: DriveLink | null;
  onLinked: () => void;
}

export const LinkResourceToTaskModal: React.FC<LinkResourceToTaskModalProps> = ({
  isOpen,
  onClose,
  resource,
  onLinked,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !resource) return;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const fetched = await taskService.getTasks();
        setTasks(fetched.filter((t) => t.status !== 'COMPLETED'));
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
    setSelectedTaskId('');
    setSuccess(false);
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = async () => {
    if (!selectedTaskId) return;
    setSaving(true);
    try {
      await taskService.addResource(selectedTaskId, 'DRIVE_LINK', resource.id);
      setSuccess(true);
      setTimeout(() => {
        onLinked();
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to link resource to task:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between bg-[#ECF9F1] dark:bg-[#10271C]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F2D1E] dark:text-[#E8FAF0] text-sm">
                Attach Resource Link to Task
              </h3>
              <p className="text-[11px] text-[#3D7858] dark:text-[#72B38F] truncate max-w-[240px]">
                {resource.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] hover:bg-white dark:hover:bg-[#08170F] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3">
          {success ? (
            <div className="p-6 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
                Successfully Linked!
              </h4>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                This resource link is now attached to your task.
              </p>
            </div>
          ) : (
            <>
              {/* Task search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#3D7858] dark:text-[#72B38F] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search active tasks..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-xs text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 outline-none focus:border-[#48C78E]"
                />
              </div>

              {/* Tasks List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {loading ? (
                  <div className="p-6 text-center text-xs text-[#3D7858] dark:text-[#72B38F]">
                    Loading active tasks...
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#3D7858] dark:text-[#72B38F]">
                    No active tasks found.
                  </div>
                ) : (
                  filteredTasks.map((t) => {
                    const isSelected = selectedTaskId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={clsx(
                          'p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5',
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                            : 'bg-[#F9FDFB] dark:bg-[#08170F] border-[#D5F2E2] dark:border-[#193A29] hover:border-[#48C78E]'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckSquare className={clsx('w-4 h-4 flex-shrink-0', isSelected ? 'text-emerald-500' : 'text-[#3D7858] dark:text-[#72B38F]')} />
                          <span className="text-xs font-semibold truncate text-[#0F2D1E] dark:text-[#E8FAF0]">
                            {t.title}
                          </span>
                        </div>
                        {t.priority && (
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/40 text-[#3D7858] dark:text-[#72B38F] flex-shrink-0">
                            {t.priority}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#D5F2E2] dark:border-[#193A29]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-[#BBEAD0] dark:border-[#1E4933] text-xs font-bold text-[#3D7858] dark:text-[#72B38F] hover:bg-[#F2FBF6] dark:hover:bg-[#132D20]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedTaskId || saving}
                  onClick={handleLink}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  {saving ? 'Attaching...' : 'Attach Link to Task'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
