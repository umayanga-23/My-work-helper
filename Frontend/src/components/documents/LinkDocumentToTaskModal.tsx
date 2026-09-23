import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Search, Link2, CheckSquare } from 'lucide-react';
import { DocumentItem, Task } from '../../types';
import { taskService } from '../../services/taskService';
import { clsx } from 'clsx';

interface LinkDocumentToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onLinked: () => void;
}

export const LinkDocumentToTaskModal: React.FC<LinkDocumentToTaskModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onLinked,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !doc) return;
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
  }, [isOpen, doc]);

  if (!isOpen || !doc) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = async () => {
    if (!selectedTaskId) return;
    setSaving(true);
    try {
      await taskService.addResource(selectedTaskId, 'DOCUMENT', doc.id);
      setSuccess(true);
      setTimeout(() => {
        onLinked();
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to link document to task:', err);
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
                Attach Document to Task
              </h3>
              <p className="text-[11px] text-[#3D7858] dark:text-[#72B38F] truncate max-w-[240px]">
                {doc.name}
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
                This document is now attached directly to your selected task.
              </p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#3D7858] dark:text-[#72B38F] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search active tasks..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-xs text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 outline-none focus:border-[#48C78E]"
                />
              </div>

              {/* Task list */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {loading ? (
                  <p className="text-xs text-center py-6 text-[#3D7858] dark:text-[#72B38F]">Loading tasks...</p>
                ) : filteredTasks.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[#3D7858] dark:text-[#72B38F]">No active tasks found</p>
                ) : (
                  filteredTasks.map((t) => {
                    const isSelected = selectedTaskId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={clsx(
                          'flex items-center gap-2.5 p-2.5 rounded-2xl border text-xs cursor-pointer transition-all',
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-[#0F2D1E] dark:text-[#E8FAF0] shadow-sm'
                            : 'bg-[#F2FBF6] dark:bg-[#132D20]/50 border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
                        )}
                      >
                        <CheckSquare
                          className={clsx(
                            'w-4 h-4 flex-shrink-0',
                            isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#3D7858]/60'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                            {t.categoryName && (
                              <span className="text-[#3D7858] dark:text-[#72B38F]">
                                {t.categoryName}
                              </span>
                            )}
                            {t.priority && (
                              <span
                                className={clsx(
                                  'font-bold',
                                  t.priority === 'HIGH' || t.priority === 'URGENT'
                                    ? 'text-rose-500'
                                    : 'text-amber-500'
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
          <div className="p-3.5 sm:px-5 border-t border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-end gap-2 bg-[#ECF9F1] dark:bg-[#10271C]">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] rounded-xl hover:bg-white dark:hover:bg-[#08170F]"
            >
              Cancel
            </button>
            <button
              disabled={!selectedTaskId || saving}
              onClick={handleLink}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              {saving ? 'Linking...' : 'Attach to Task'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
