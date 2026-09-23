import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  GitCommit,
  GitBranch,
  FileText,
  Edit3,
  FileCheck,
  FileX,
  Globe,
  HardDrive,
  Rocket,
  Settings,
  Flag,
  Clock,
  Search,
  ArrowDownUp,
  Activity,
  Calendar
} from 'lucide-react';
import { ActivityLog } from '../../types';
import { clsx } from 'clsx';

interface ProjectActivityTimelineProps {
  projectId: string;
  activities: ActivityLog[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

type FilterCategory = 'ALL' | 'TASKS' | 'GIT' | 'CONTENT' | 'RESOURCES' | 'PROJECT';

export const ProjectActivityTimeline: React.FC<ProjectActivityTimelineProps> = ({
  projectId,
  activities = [],
  isLoading = false,
  onRefresh,
}) => {
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  // Helper to extract description safely from metadata or action
  const getActivityDescription = (activity: ActivityLog): string => {
    if (activity.metadata) {
      if (typeof activity.metadata === 'object' && activity.metadata.description) {
        return String(activity.metadata.description);
      }
      if (typeof activity.metadata === 'string') {
        try {
          let str = activity.metadata.trim();
          if (str.startsWith('"') && str.endsWith('"') && str.length > 2) {
            str = JSON.parse(str);
          }
          const parsed = typeof str === 'string' && str.startsWith('{') ? JSON.parse(str) : str;
          if (typeof parsed === 'object' && parsed && parsed.description) return String(parsed.description);
          if (typeof parsed === 'string') return parsed;
        } catch {
          if (activity.metadata.trim().length > 0 && !activity.metadata.startsWith('{')) {
            return activity.metadata.replace(/^"|"$/g, '');
          }
        }
      }
    }
    return activity.action || 'Project activity logged';
  };

  // Format relative timestamp
  const getRelativeTime = (dateStr: string): string => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Format exact time
  const getExactTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format date header group key
  const getDateGroupKey = (dateStr: string): { key: string; label: string } => {
    try {
      const target = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      if (isSameDay(target, today)) {
        return { key: 'TODAY', label: 'Today' };
      }
      if (isSameDay(target, yesterday)) {
        return { key: 'YESTERDAY', label: 'Yesterday' };
      }
      return {
        key: target.toISOString().split('T')[0],
        label: target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      };
    } catch {
      return { key: 'UNKNOWN', label: 'Past Activity' };
    }
  };

  // Event config for visual styling & icon representation
  const getEventConfig = (activity: ActivityLog) => {
    const act = (activity.action || '').toLowerCase();
    const entity = (activity.entityType || '').toUpperCase();

    // 1. Task Completed
    if (act.includes('task completed') || (entity === 'TASK' && act.includes('complete'))) {
      return {
        icon: CheckCircle2,
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        label: 'Task Completed',
        category: 'TASKS' as FilterCategory,
        dotColor: 'bg-emerald-500',
      };
    }

    // 2. Task Created
    if (act.includes('task created') || (entity === 'TASK' && act.includes('create'))) {
      return {
        icon: PlusCircle,
        iconColor: 'text-blue-500 dark:text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        label: 'Task Created',
        category: 'TASKS' as FilterCategory,
        dotColor: 'bg-blue-500',
      };
    }

    // 3. Task Status Changed
    if (act.includes('task status') || (entity === 'TASK' && act.includes('status'))) {
      return {
        icon: RefreshCw,
        iconColor: 'text-amber-500 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        label: 'Task Status Changed',
        category: 'TASKS' as FilterCategory,
        dotColor: 'bg-amber-500',
      };
    }

    // 4. GitHub Commit Detected
    if (act.includes('commit') || entity === 'GITHUB_COMMIT') {
      return {
        icon: GitCommit,
        iconColor: 'text-purple-500 dark:text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/30',
        badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        label: 'GitHub Commit Detected',
        category: 'GIT' as FilterCategory,
        dotColor: 'bg-purple-500',
      };
    }

    // 5. GitHub Repo Connected
    if (act.includes('github') || act.includes('repository') || entity === 'GITHUB') {
      return {
        icon: GitBranch,
        iconColor: 'text-purple-500 dark:text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/30',
        badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        label: 'GitHub Repository Connected',
        category: 'GIT' as FilterCategory,
        dotColor: 'bg-purple-500',
      };
    }

    // 6. Milestone Completed
    if (act.includes('milestone') || entity === 'MILESTONE') {
      return {
        icon: Flag,
        iconColor: 'text-teal-500 dark:text-teal-400',
        bgColor: 'bg-teal-500/10 border-teal-500/30',
        badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        label: 'Milestone Completed',
        category: 'TASKS' as FilterCategory,
        dotColor: 'bg-teal-500',
      };
    }

    // 7. Note Added / Updated
    if (act.includes('note') || entity === 'NOTE') {
      const isUpdate = act.includes('update');
      return {
        icon: isUpdate ? Edit3 : FileText,
        iconColor: 'text-amber-500 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        label: isUpdate ? 'Note Updated' : 'Note Added',
        category: 'CONTENT' as FilterCategory,
        dotColor: 'bg-amber-500',
      };
    }

    // 8. Document Added / Removed
    if (act.includes('document') || entity === 'DOCUMENT') {
      const isRemove = act.includes('remove') || act.includes('delete');
      return {
        icon: isRemove ? FileX : FileCheck,
        iconColor: isRemove ? 'text-rose-500 dark:text-rose-400' : 'text-cyan-500 dark:text-cyan-400',
        bgColor: isRemove ? 'bg-rose-500/10 border-rose-500/30' : 'bg-cyan-500/10 border-cyan-500/30',
        badgeBg: isRemove
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        label: isRemove ? 'Document Removed' : 'Document Added',
        category: 'CONTENT' as FilterCategory,
        dotColor: isRemove ? 'bg-rose-500' : 'bg-cyan-500',
      };
    }

    // 9. Website Added / Removed
    if (act.includes('website') || entity === 'WEBSITE') {
      const isRemove = act.includes('remove') || act.includes('delete');
      return {
        icon: Globe,
        iconColor: isRemove ? 'text-rose-500 dark:text-rose-400' : 'text-indigo-500 dark:text-indigo-400',
        bgColor: isRemove ? 'bg-rose-500/10 border-rose-500/30' : 'bg-indigo-500/10 border-indigo-500/30',
        badgeBg: isRemove
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        label: isRemove ? 'Website Removed' : 'Website Added',
        category: 'RESOURCES' as FilterCategory,
        dotColor: isRemove ? 'bg-rose-500' : 'bg-indigo-500',
      };
    }

    // 10. Drive Resource Added / Removed
    if (act.includes('drive') || entity === 'DRIVE_LINK') {
      const isRemove = act.includes('remove') || act.includes('delete');
      return {
        icon: HardDrive,
        iconColor: isRemove ? 'text-rose-500 dark:text-rose-400' : 'text-sky-500 dark:text-sky-400',
        bgColor: isRemove ? 'bg-rose-500/10 border-rose-500/30' : 'bg-sky-500/10 border-sky-500/30',
        badgeBg: isRemove
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        label: isRemove ? 'Drive Resource Removed' : 'Drive Resource Added',
        category: 'RESOURCES' as FilterCategory,
        dotColor: isRemove ? 'bg-rose-500' : 'bg-sky-500',
      };
    }

    // 11. Project Created / Updated
    if (act.includes('project created') || (entity === 'PROJECT' && act.includes('creat'))) {
      return {
        icon: Rocket,
        iconColor: 'text-purple-500 dark:text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/30',
        badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        label: 'Project Created',
        category: 'PROJECT' as FilterCategory,
        dotColor: 'bg-purple-500',
      };
    }

    if (act.includes('project') || entity === 'PROJECT') {
      return {
        icon: Settings,
        iconColor: 'text-slate-500 dark:text-slate-400',
        bgColor: 'bg-slate-500/10 border-slate-500/30',
        badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        label: 'Project Updated',
        category: 'PROJECT' as FilterCategory,
        dotColor: 'bg-slate-500',
      };
    }

    // Default fallback
    return {
      icon: Activity,
      iconColor: 'text-[#66736B] dark:text-[#9BB5A5]',
      bgColor: 'bg-[#F3FBF7] dark:bg-[#13261C] border-[#DCE9E1] dark:border-[#20372B]',
      badgeBg: 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] border-[#DCE9E1] dark:border-[#20372B]',
      label: activity.action || 'Project Event',
      category: 'PROJECT' as FilterCategory,
      dotColor: 'bg-[#8A9890]',
    };
  };

  // Filtered and Sorted Activities
  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // Category filter
    if (filterCategory !== 'ALL') {
      result = result.filter((item) => {
        const conf = getEventConfig(item);
        return conf.category === filterCategory;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const desc = getActivityDescription(item).toLowerCase();
        const act = (item.action || '').toLowerCase();
        const entity = (item.entityType || '').toLowerCase();
        return desc.includes(q) || act.includes(q) || entity.includes(q);
      });
    }

    // Sort chronologically (Newest first by default)
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [activities, filterCategory, searchQuery, sortOrder]);

  // Group activities by Date
  const groupedActivities = useMemo(() => {
    const groups: { key: string; label: string; items: ActivityLog[] }[] = [];
    const map = new Map<string, { label: string; items: ActivityLog[] }>();

    filteredActivities.forEach((item) => {
      const { key, label } = getDateGroupKey(item.createdAt);
      if (!map.has(key)) {
        map.set(key, { label, items: [] });
      }
      map.get(key)!.items.push(item);
    });

    map.forEach((value, key) => {
      groups.push({ key, label: value.label, items: value.items });
    });

    return groups;
  }, [filteredActivities]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#112117] p-4 rounded-2xl border border-[#DCE9E1] dark:border-[#20372B] shadow-sm">
        {/* Left: Title & Count */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Project Activity Timeline
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                {activities.length} {activities.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
              Real-time audit stream of tasks, commits, notes, documents & resource links
            </p>
          </div>
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9890] dark:text-[#6F8A7A]" />
            <input
              type="text"
              placeholder="Search activity stream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] dark:placeholder-[#6F8A7A] focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
            title="Toggle Sort Order"
            className="p-1.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sortOrder === 'NEWEST' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Activities"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Activities' },
          { id: 'TASKS', label: 'Tasks & Milestones' },
          { id: 'GIT', label: 'GitHub' },
          { id: 'CONTENT', label: 'Notes & Docs' },
          { id: 'RESOURCES', label: 'Web & Drive Resources' },
          { id: 'PROJECT', label: 'Project Settings' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterCategory(f.id as FilterCategory)}
            className={clsx(
              'px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap',
              filterCategory === f.id
                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                : 'bg-white dark:bg-[#112117] text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] border border-[#DCE9E1] dark:border-[#20372B]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {groupedActivities.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#112117] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-center text-purple-400 shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF]">
              {searchQuery || filterCategory !== 'ALL' ? 'No Matching Activities' : 'No Activity Recorded Yet'}
            </h4>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] leading-relaxed">
              {searchQuery || filterCategory !== 'ALL'
                ? 'Try clearing your search query or selecting "All Activities" to see everything.'
                : 'As you create tasks, complete work, push commits to GitHub, or link notes, documents, and resources, this chronological timeline will automatically capture every real event.'}
            </p>
          </div>
          {(searchQuery || filterCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('ALL');
              }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Grouped Events */
        <div className="space-y-6">
          {groupedActivities.map((group) => (
            <div key={group.key} className="space-y-3">
              {/* Date Header Sticky Badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{group.label}</span>
                </div>
                <div className="flex-1 h-px bg-[#DCE9E1] dark:bg-[#20372B]" />
              </div>

              {/* Event Cards inside group */}
              <div className="relative pl-6 space-y-3 border-l-2 border-purple-500/20 dark:border-purple-500/20 ml-3">
                {group.items.map((item) => {
                  const config = getEventConfig(item);
                  const Icon = config.icon;
                  const description = getActivityDescription(item);
                  const relativeTime = getRelativeTime(item.createdAt);
                  const exactTime = getExactTime(item.createdAt);

                  return (
                    <div
                      key={item.id}
                      className="relative group bg-white dark:bg-[#112117] hover:bg-[#F3FBF7] dark:hover:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] hover:border-purple-500/40 p-4 rounded-2xl shadow-sm transition-all"
                    >
                      {/* Timeline Dot Node */}
                      <span
                        className={clsx(
                          'absolute -left-[31px] top-5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0D1812] transition-transform group-hover:scale-125 shadow-sm',
                          config.dotColor
                        )}
                      />

                      <div className="flex items-start justify-between gap-3">
                        {/* Event Content */}
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Event Icon Container */}
                          <div
                            className={clsx(
                              'p-2 rounded-xl border shrink-0 transition-transform group-hover:scale-105',
                              config.bgColor
                            )}
                          >
                            <Icon className={clsx('w-4 h-4', config.iconColor)} />
                          </div>

                          {/* Event Text */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Action Badge */}
                              <span
                                className={clsx(
                                  'px-2 py-0.5 rounded-md text-[10px] font-bold border',
                                  config.badgeBg
                                )}
                              >
                                {config.label}
                              </span>

                              {/* Relative time pill */}
                              <span className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                                • {relativeTime}
                              </span>
                            </div>

                            {/* Readable Description */}
                            <p className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] break-words leading-snug">
                              {description}
                            </p>
                          </div>
                        </div>

                        {/* Exact Timestamp */}
                        <div className="shrink-0 text-right">
                          <span
                            className="text-[10px] font-mono text-[#8A9890] dark:text-[#6F8A7A] block"
                            title={new Date(item.createdAt).toLocaleString()}
                          >
                            {exactTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
