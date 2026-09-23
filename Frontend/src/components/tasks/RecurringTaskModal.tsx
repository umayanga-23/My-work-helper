import React, { useState, useEffect } from 'react';
import {
  X,
  Repeat,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  Tag
} from 'lucide-react';
import type { RecurringTask, RecurringTaskRequest, RecurrenceType, TaskPriority, Project, Category } from '../../types';
import { clsx } from 'clsx';

interface RecurringTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecurringTaskRequest, editingId?: string) => Promise<void>;
  initialTask?: RecurringTask;
  projects?: Project[];
  categories?: Category[];
}

const WEEKDAYS = [
  { key: 'MONDAY', label: 'M', full: 'Mon' },
  { key: 'TUESDAY', label: 'T', full: 'Tue' },
  { key: 'WEDNESDAY', label: 'W', full: 'Wed' },
  { key: 'THURSDAY', label: 'T', full: 'Thu' },
  { key: 'FRIDAY', label: 'F', full: 'Fri' },
  { key: 'SATURDAY', label: 'S', full: 'Sat' },
  { key: 'SUNDAY', label: 'S', full: 'Sun' },
];

export const RecurringTaskModal: React.FC<RecurringTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  projects = [],
  categories = [],
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('DAILY');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [startDate, setStartDate] = useState(todayStr);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [dueTime, setDueTime] = useState('19:00');
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>(60);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setRecurrenceType(initialTask.recurrenceType);
        setStartDate(initialTask.startDate);
        setHasEndDate(!!initialTask.endDate);
        setEndDate(initialTask.endDate || '');
        setDueTime(initialTask.dueTime ? initialTask.dueTime.slice(0, 5) : '19:00');
        setEstimatedDuration(initialTask.estimatedDuration || 60);
        setPriority(initialTask.priority || 'MEDIUM');
        setProjectId(initialTask.projectId || '');
        setCategoryId(initialTask.categoryId || '');

        if (initialTask.recurrenceType === 'WEEKLY' && initialTask.recurrenceConfig) {
          const cleaned = initialTask.recurrenceConfig.replace(/[[\]"']/g, '');
          setSelectedDays(cleaned.split(',').map((s) => s.trim()).filter(Boolean));
        } else {
          setSelectedDays(['MONDAY']);
        }

        if (initialTask.recurrenceType === 'MONTHLY' && initialTask.recurrenceConfig) {
          setDayOfMonth(parseInt(initialTask.recurrenceConfig, 10) || 1);
        } else {
          setDayOfMonth(1);
        }
      } else {
        setTitle('');
        setDescription('');
        setRecurrenceType('DAILY');
        setSelectedDays(['MONDAY']);
        setDayOfMonth(1);
        setStartDate(todayStr);
        setHasEndDate(false);
        setEndDate('');
        setDueTime('19:00');
        setEstimatedDuration(60);
        setPriority('MEDIUM');
        setProjectId('');
        setCategoryId('');
      }
    }
  }, [isOpen, initialTask, todayStr]);

  if (!isOpen) return null;

  const toggleDay = (dayKey: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayKey)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((d) => d !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let config: string | undefined;
    if (recurrenceType === 'WEEKLY') {
      config = selectedDays.join(',');
    } else if (recurrenceType === 'MONTHLY') {
      config = String(dayOfMonth);
    }

    const payload: RecurringTaskRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      recurrenceType,
      recurrenceConfig: config,
      startDate,
      endDate: hasEndDate && endDate ? endDate : undefined,
      dueTime: dueTime ? `${dueTime}:00` : undefined,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
      priority,
      projectId: projectId || undefined,
      categoryId: categoryId || undefined,
    };

    setSaving(true);
    try {
      await onSave(payload, initialTask?.id);
      onClose();
    } catch (err) {
      console.error('Failed to save recurring task:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE9E1] dark:border-[#20372B] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#17211B] dark:text-[#EAF7EF]">
                {initialTask ? 'Edit Recurring Task' : 'Create Recurring Task Template'}
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Auto-generates daily task instances at 4:00 AM into Today's Tasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study Automata & Formal Languages"
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline instructions, goals, or references..."
              className="w-full px-3.5 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-[#5FBF8F] resize-none"
            />
          </div>

          {/* Recurrence Pattern Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-[#5FBF8F]" />
              Repeat Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as RecurrenceType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRecurrenceType(type)}
                  className={clsx(
                    'py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center',
                    recurrenceType === type
                      ? 'bg-[#5FBF8F] text-white border-[#5FBF8F] shadow-sm'
                      : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                  )}
                >
                  {type === 'DAILY' ? 'Every Day' : type === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>

            {/* Weekly Days of Week Picker */}
            {recurrenceType === 'WEEKLY' && (
              <div className="mt-3 p-3 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-2 animate-in fade-in">
                <span className="text-[11px] font-semibold text-[#8A9890] dark:text-[#6F8A7A] block">
                  Select Days of Week:
                </span>
                <div className="flex items-center gap-1.5 justify-between">
                  {WEEKDAYS.map((w) => {
                    const isSelected = selectedDays.includes(w.key);
                    return (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => toggleDay(w.key)}
                        className={clsx(
                          'w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border',
                          isSelected
                            ? 'bg-[#5FBF8F] text-white border-[#5FBF8F] shadow-xs'
                            : 'bg-white dark:bg-[#0E1C15] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                        )}
                        title={w.full}
                      >
                        <span>{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly Day Picker */}
            {recurrenceType === 'MONTHLY' && (
              <div className="mt-3 p-3 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-3 animate-in fade-in">
                <span className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                  Day of Month:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8A9890]">Day</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))}
                    className="w-16 px-2.5 py-1 text-xs text-center font-bold bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:border-[#5FBF8F]"
                  />
                  <span className="text-xs text-[#8A9890]">of every month</span>
                </div>
              </div>
            )}
          </div>

          {/* Time & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5FBF8F]" />
                Scheduled Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
                Duration (min)
              </label>
              <div className="flex items-center gap-1.5">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedDuration(mins)}
                    className={clsx(
                      'px-2 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex-1 text-center',
                      estimatedDuration === mins
                        ? 'bg-[#5FBF8F] text-white border-[#5FBF8F]'
                        : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B]'
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5FBF8F]" />
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider">
                  End Date
                </label>
                <label className="text-[11px] text-[#8A9890] flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hasEndDate}
                    onChange={(e) => {
                      setHasEndDate(!e.target.checked);
                      if (e.target.checked) setEndDate('');
                    }}
                    className="rounded text-[#5FBF8F] focus:ring-0 cursor-pointer"
                  />
                  <span>No end date</span>
                </label>
              </div>
              <input
                type="date"
                disabled={!hasEndDate}
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F] disabled:opacity-40"
              />
            </div>
          </div>

          {/* Project & Category Link */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-[#5FBF8F] cursor-pointer"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#5FBF8F]" />
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-[#5FBF8F] cursor-pointer"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#5FBF8F]" />
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={clsx(
                    'py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center',
                    priority === p
                      ? 'border-[#5FBF8F] bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] font-bold shadow-xs'
                      : 'border-[#DCE9E1] dark:border-[#20372B] bg-[#F3FBF7] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] opacity-70 hover:opacity-100'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit / Cancel Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DCE9E1] dark:border-[#20372B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#F3FBF7] dark:hover:bg-[#13261C] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#237A57] to-[#5FBF8F] text-white shadow-md hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialTask ? 'Save Changes' : 'Create Recurring Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
