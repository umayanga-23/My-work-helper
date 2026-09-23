import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckSquare,
  Plus,
  Repeat,
  Briefcase,
  Edit,
  Trash2
} from 'lucide-react';
import type { Task } from '../../types';
import { clsx } from 'clsx';

interface TaskCalendarViewProps {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onOpenTaskDetail: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTaskForDate: (dateStr: string) => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onToggleStatus,
  onOpenTaskDetail,
  onEditTask,
  onDeleteTask,
  onAddTaskForDate,
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Map tasks by dueDate string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.dueDate) {
        const dateKey = t.dueDate.slice(0, 10);
        const list = map.get(dateKey) || [];
        list.push(t);
        map.set(dateKey, list);
      }
    });
    return map;
  }, [tasks]);

  // Calendar Grid Days computation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday-based index: 0 = Mon, ..., 6 = Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      tasks: Task[];
    }> = [];

    // Preceding days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayFormatted = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayFormatted}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        tasks: tasksByDate.get(dateStr) || [],
      });
    }

    // Days of current month
    for (let dayNum = 1; dayNum <= lastDayOfMonth.getDate(); dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const m = String(currentMonth + 1).padStart(2, '0');
      const dayFormatted = String(dayNum).padStart(2, '0');
      const dateStr = `${currentYear}-${m}-${dayFormatted}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        tasks: tasksByDate.get(dateStr) || [],
      });
    }

    // Trailing days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayFormatted = String(i).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayFormatted}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        tasks: tasksByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDateStr, todayStr, tasksByDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(todayStr);
  };

  // Selected date's tasks
  const selectedDateTasks = useMemo(() => {
    return tasksByDate.get(selectedDateStr) || [];
  }, [selectedDateStr, tasksByDate]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateStr) return '';
    const parts = selectedDateStr.split('-');
    if (parts.length !== 3) return selectedDateStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDateStr]);

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
      {/* Calendar Card Container */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm space-y-4">
        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE9E1] dark:border-[#20372B] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0]">
              <CalendarIcon className="w-5 h-5 text-[#5FBF8F]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">
                {monthName}
              </h2>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Scheduled upcoming tasks & milestone deadlines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] hover:bg-[#5FBF8F] hover:text-white transition-all cursor-pointer border border-[#5FBF8F]/30 shadow-xs"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] p-0.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#0E1C15] text-[#17211B] dark:text-[#EAF7EF] transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#0E1C15] text-[#17211B] dark:text-[#EAF7EF] transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-[#8A9890] dark:text-[#6F8A7A] pb-1">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Month Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((day, idx) => {
            const hasTasks = day.tasks.length > 0;
            const completedCount = day.tasks.filter((t) => t.status === 'COMPLETED').length;
            const isAllDone = hasTasks && completedCount === day.tasks.length;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={clsx(
                  'min-h-[70px] sm:min-h-[85px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group select-none',
                  day.isSelected
                    ? 'border-[#5FBF8F] bg-[#E8F7EF]/50 dark:bg-[#13261C] shadow-md ring-2 ring-[#5FBF8F]/50 scale-[1.01]'
                    : day.isToday
                    ? 'border-[#5FBF8F]/50 bg-white dark:bg-[#0E1C15]'
                    : day.isCurrentMonth
                    ? 'border-[#DCE9E1]/70 dark:border-[#20372B]/70 bg-white dark:bg-[#0E1C15] hover:border-[#5FBF8F]/60'
                    : 'border-transparent bg-[#F3FBF7]/30 dark:bg-[#13261C]/20 opacity-40 hover:opacity-75'
                )}
              >
                {/* Date Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all',
                      day.isToday
                        ? 'bg-[#5FBF8F] text-white shadow-xs'
                        : day.isSelected
                        ? 'text-[#237A57] dark:text-[#6DD6A0]'
                        : 'text-[#17211B] dark:text-[#EAF7EF]'
                    )}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Task Count Badge */}
                  {hasTasks && (
                    <span
                      className={clsx(
                        'px-1.5 py-0.2 rounded-md text-[9px] font-extrabold shadow-2xs',
                        isAllDone
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#5FBF8F]/15 text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30'
                      )}
                    >
                      {completedCount}/{day.tasks.length}
                    </span>
                  )}
                </div>

                {/* Task Preview Chips (Desktop only) */}
                <div className="space-y-0.5 mt-1 hidden sm:block">
                  {day.tasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className={clsx(
                        'text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium flex items-center gap-1',
                        t.status === 'COMPLETED'
                          ? 'line-through bg-emerald-500/10 text-emerald-500'
                          : 'bg-[#F3FBF7] dark:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] border border-[#DCE9E1]/50 dark:border-[#20372B]/50'
                      )}
                      title={t.title}
                    >
                      {t.recurringTaskId && <Repeat className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {day.tasks.length > 2 && (
                    <div className="text-[9px] text-[#8A9890] font-semibold pl-1">
                      +{day.tasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Task Stream */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE9E1] dark:border-[#20372B] pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#17211B] dark:text-[#EAF7EF]">
                {selectedDateFormatted}
              </h3>
              {selectedDateStr === todayStr && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#5FBF8F]/30">
                  ☀️ Today
                </span>
              )}
            </div>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-0.5">
              {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'} scheduled for this day
            </p>
          </div>

          <button
            onClick={() => onAddTaskForDate(selectedDateStr)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#237A57] to-[#5FBF8F] hover:brightness-105 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            + Schedule Task for {selectedDateStr}
          </button>
        </div>

        {/* Task Cards List */}
        <div className="space-y-2.5">
          {selectedDateTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C]/40 border border-dashed border-[#DCE9E1] dark:border-[#20372B] text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-[#5FBF8F]/60 mx-auto" />
              <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                No tasks scheduled for this day
              </h4>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
                Click "+ Schedule Task" above to plan a task for {selectedDateStr}. When that day arrives, it will automatically appear in your Today's Tasks!
              </p>
            </div>
          ) : (
            selectedDateTasks.map((task) => {
              const isDone = task.status === 'COMPLETED';
              return (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskDetail(task)}
                  className={clsx(
                    'p-4 rounded-2xl border transition-all shadow-xs flex items-center justify-between gap-3.5 cursor-pointer group',
                    isDone
                      ? 'bg-[#E8F7EF]/50 dark:bg-[#13261C]/50 border-[#5FBF8F]/30 opacity-75'
                      : 'bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F]'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(task);
                      }}
                      className={clsx(
                        'mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
                        isDone
                          ? 'bg-[#5FBF8F] border-[#5FBF8F] text-white'
                          : 'border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] bg-white dark:bg-[#0E1C15]'
                      )}
                    >
                      {isDone && <CheckSquare className="w-3.5 h-3.5 fill-current" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.taskKey && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-purple-500/10 text-purple-400">
                            {task.taskKey}
                          </span>
                        )}
                        <h4
                          className={clsx(
                            'text-sm font-semibold truncate',
                            isDone
                              ? 'line-through text-[#8A9890] dark:text-[#6F8A7A]'
                              : 'text-[#17211B] dark:text-[#EAF7EF]'
                          )}
                        >
                          {task.title}
                        </h4>

                        {task.recurringTaskId && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 flex items-center gap-1 border border-amber-500/20">
                            <Repeat className="w-3 h-3" /> Recurring
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#8A9890] dark:text-[#6F8A7A] mt-1 flex-wrap">
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
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-all cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[#8A9890] hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete Task"
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
    </div>
  );
};
