import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Search, Link2, CheckSquare } from 'lucide-react';
import { Website, Task } from '../../types';
import { taskService } from '../../services/taskService';
import { clsx } from 'clsx';

interface LinkToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: Website | null;
  onLinked: () => void;
}

export const LinkToTaskModal: React.FC<LinkToTaskModalProps> = ({
  isOpen,
  onClose,
  website,
  onLinked,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !website) return;
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
  }, [isOpen, website]);

  if (!isOpen || !website) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = async () => {
    if (!selectedTaskId) return;
    setSaving(true);
    try {
      await taskService.addResource(selectedTaskId, 'WEBSITE', website.id);
      setSuccess(true);
      setTimeout(() => {
        onLinked();
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to link bookmark to task:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-sm">
                Attach Bookmark to Task
              </h3>
              <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] truncate max-w-[240px]">
                {website.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {success ? (
            <div className="p-6 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Successfully Linked!
              </h4>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                This bookmark is now attached to your selected task.
              </p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8A9890] dark:text-[#6F8A7A] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search active tasks..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-xs text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
                />
              </div>

              {/* Task list */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {loading ? (
                  <p className="text-xs text-center py-6 text-[#8A9890] dark:text-[#6F8A7A]">Loading tasks...</p>
                ) : filteredTasks.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[#8A9890] dark:text-[#6F8A7A]">No active tasks found</p>
                ) : (
                  filteredTasks.map((t) => {
                    const isSelected = selectedTaskId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={clsx(
                          'flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all',
                          isSelected
                            ? 'bg-[#5FBF8F]/10 border-[#5FBF8F] text-[#17211B] dark:text-[#EAF7EF]'
                            : 'bg-[#F3FBF7] dark:bg-[#13261C]/50 border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                        )}
                      >
                        <CheckSquare
                          className={clsx(
                            'w-4 h-4 flex-shrink-0',
                            isSelected ? 'text-[#5FBF8F]' : 'text-[#8A9890] dark:text-[#6F8A7A]'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                            {t.categoryName && (
                              <span className="text-[#8A9890] dark:text-[#6F8A7A]">
                                {t.categoryName}
                              </span>
                            )}
                            {t.priority && (
                              <span
                                className={clsx(
                                  'font-bold',
                                  t.priority === 'HIGH' || t.priority === 'URGENT'
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                )}
                              >
                                {t.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end gap-2 bg-white dark:bg-[#0E1C15]">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-xl"
            >
              Cancel
            </button>
            <button
              disabled={!selectedTaskId || saving}
              onClick={handleLink}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-brand-500/20"
            >
              {saving ? 'Linking...' : 'Attach to Task'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
