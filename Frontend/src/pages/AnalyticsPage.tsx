import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Layers,
  FileText,
  Globe,
  FolderArchive,
  HardDrive,
  Briefcase,
  GraduationCap,
  Lightbulb
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { AnalyticsSummary } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load analytics summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  const maxWeeklyCount = Math.max(...summary.weeklyTrends.map(t => Math.max(t.completedCount, t.createdCount)), 1);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#5FBF8F]" />
          Productivity Analytics & Workspace Insights
        </h1>
        <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5] mt-1">
          Live statistics, completion trends, and resource counts calculated across all connected workspace entities.
        </p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] uppercase tracking-wider">Completion Rate</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">{summary.completionRate}%</div>
          <div className="w-full bg-[#E8F7EF] dark:bg-[#13261C] h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${summary.completionRate}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] uppercase tracking-wider">Completed Tasks</span>
            <CheckCircle2 className="w-5 h-5 text-[#5FBF8F]" />
          </div>
          <div className="text-3xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">{summary.completedTasks}</div>
          <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">Out of {summary.totalTasks} total tasks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] uppercase tracking-wider">Pending Tasks</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">{summary.pendingTasks}</div>
          <p className="text-xs text-amber-400/80 font-medium">Currently active in workspace</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] uppercase tracking-wider">Overdue Tasks</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">{summary.overdueTasks}</div>
          <p className="text-xs text-rose-400/80 font-medium">Requires immediate focus</p>
        </div>
      </div>

      {/* Weekly Activity Trends Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            7-Day Task Activity Trend
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Completed
            </span>
            <span className="flex items-center gap-1.5 text-[#5FBF8F] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Created
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-48 pt-4 px-2 border-b border-[#DCE9E1] dark:border-[#20372B]">
          {summary.weeklyTrends.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
              <div className="flex items-end gap-1.5 w-full justify-center h-full">
                {/* Completed Bar */}
                <div
                  className="w-4 bg-emerald-400/90 rounded-t-md transition-all group-hover:bg-emerald-300"
                  style={{ height: `${(day.completedCount / maxWeeklyCount) * 100}%` }}
                  title={`Completed: ${day.completedCount}`}
                />
                {/* Created Bar */}
                <div
                  className="w-4 bg-brand-500/90 rounded-t-md transition-all group-hover:bg-brand-400"
                  style={{ height: `${(day.createdCount / maxWeeklyCount) * 100}%` }}
                  title={`Created: ${day.createdCount}`}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#66736B] dark:text-[#9BB5A5]">{day.dayOfWeek}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Inventory Overview Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-4">
        <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          Workspace Knowledge Inventory
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
            <FileText className="w-5 h-5 text-amber-400 mx-auto" />
            <div className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{summary.totalNotes}</div>
            <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">Notes</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
            <Globe className="w-5 h-5 text-sky-400 mx-auto" />
            <div className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{summary.totalWebsites}</div>
            <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">Websites</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
            <FolderArchive className="w-5 h-5 text-indigo-400 mx-auto" />
            <div className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{summary.totalDocuments}</div>
            <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">Documents</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
            <HardDrive className="w-5 h-5 text-teal-400 mx-auto" />
            <div className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{summary.totalDriveLinks}</div>
            <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">Drive Links</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
            <Briefcase className="w-5 h-5 text-purple-400 mx-auto" />
            <div className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{summary.totalProjects}</div>
            <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">Projects</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
            <GraduationCap className="w-5 h-5 text-pink-400 mx-auto" />
            <div className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{summary.totalSkills}</div>
            <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">Skills</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
            <Lightbulb className="w-5 h-5 text-yellow-400 mx-auto" />
            <div className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{summary.totalIdeas}</div>
            <div className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] font-medium">Ideas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
