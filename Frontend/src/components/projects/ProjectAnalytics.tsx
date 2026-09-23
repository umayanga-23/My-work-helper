import React, { useMemo } from 'react';
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, BarChart2, Target } from 'lucide-react';
import { Task } from '../../types';

interface ProjectAnalyticsProps {
  tasks: Task[];
  projectName: string;
}

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ElementType }) {
  return (
    <div className={`rounded-2xl border bg-slate-800/50 p-4 flex items-start gap-3 ${color}`}>
      <div className={`p-2 rounded-xl bg-current/10 shrink-0`}>
        <Icon size={18} className="opacity-80" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs mt-1 opacity-70">{sub}</div>}
      </div>
    </div>
  );
}

// Mini bar chart SVG
function MiniBarChart({ data, maxVal, color = '#818cf8' }: { data: number[]; maxVal: number; color?: string }) {
  if (data.length === 0 || maxVal === 0) return <div className="text-center text-slate-600 text-sm py-4">No data</div>;
  const W = 400; const H = 80; const barW = Math.floor(W / data.length) - 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
      {data.map((v, i) => {
        const barH = maxVal > 0 ? Math.round((v / maxVal) * (H - 10)) : 0;
        const x = i * (barW + 4) + 2;
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={barH > 0 ? 0.8 : 0.2} />
            {barH > 0 && (
              <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize={10} fill="#94a3b8">{v}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart SVG
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="text-slate-500 text-sm text-center py-4">No data</div>;
  const R = 40; const cx = 60; const cy = 60; const strokeW = 16;
  let cumAngle = -90;
  const arcs = segments.map(seg => {
    const frac = seg.value / total;
    const angle = frac * 360;
    const start = cumAngle;
    cumAngle += angle;
    const startRad = (start * Math.PI) / 180;
    const endRad = ((start + angle) * Math.PI) / 180;
    const x1 = cx + R * Math.cos(startRad);
    const y1 = cy + R * Math.sin(startRad);
    const x2 = cx + R * Math.cos(endRad);
    const y2 = cy + R * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    return { d: `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`, color: seg.color, label: seg.label, value: seg.value, pct: Math.round(frac * 100) };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-24 h-24 shrink-0">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={strokeW} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight="bold" fill="#f1f5f9">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="#64748b">tasks</text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {arcs.filter(a => a.value > 0).map((arc, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-xs text-slate-400 flex-1">{arc.label}</span>
            <span className="text-xs font-medium text-slate-300">{arc.value}</span>
            <span className="text-xs text-slate-500">{arc.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ tasks, projectName }) => {
  const analytics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const cancelled = tasks.filter(t => t.status === 'CANCELLED').length;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Priority breakdown
    const byPriority = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => ({
      label: p,
      count: tasks.filter(t => t.priority === p && t.status !== 'CANCELLED').length,
    }));

    // Completion velocity: last 4 weeks (by completion week)
    const weekMs = 7 * 86400000;
    const weeksAgo = (n: number) => new Date(Date.now() - n * weekMs);
    const weeklyVelocity = [3, 2, 1, 0].map(w => {
      const start = weeksAgo(w + 1).getTime();
      const end = weeksAgo(w).getTime();
      return tasks.filter(t => t.completedAt && new Date(t.completedAt).getTime() >= start && new Date(t.completedAt).getTime() < end).length;
    });

    // This week vs last week
    const thisWeek = weeklyVelocity[3];
    const lastWeek = weeklyVelocity[2];
    const velocityDelta = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    // Priority bar data
    const maxPriCount = Math.max(...byPriority.map(b => b.count), 1);

    return { total, completed, inProgress, todo, cancelled, overdue, pct, byPriority, weeklyVelocity, thisWeek, lastWeek, velocityDelta, maxPriCount };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <BarChart2 size={20} className="text-indigo-400" />
          Project Analytics
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">Metrics based on real task data</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Tasks" value={analytics.total} icon={Target} color="border-slate-700 text-slate-400" />
        <StatCard label="Completed" value={analytics.completed} sub={`${analytics.pct}%`} icon={CheckCircle2} color="border-emerald-500/20 text-emerald-400" />
        <StatCard label="In Progress" value={analytics.inProgress} icon={Clock} color="border-blue-500/20 text-blue-400" />
        <StatCard
          label="Overdue"
          value={analytics.overdue}
          sub={analytics.overdue > 0 ? 'Needs attention' : 'All on track'}
          icon={AlertTriangle}
          color={analytics.overdue > 0 ? 'border-rose-500/20 text-rose-400' : 'border-emerald-500/20 text-emerald-400'}
        />
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Overall Completion</h3>
          <span className="text-2xl font-bold text-slate-100">{analytics.pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${analytics.pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>{analytics.completed} completed</span>
          <span>{analytics.total - analytics.completed - analytics.cancelled} remaining</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status donut */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Status Distribution</h3>
          <DonutChart segments={[
            { value: analytics.completed, color: '#10b981', label: 'Completed' },
            { value: analytics.inProgress, color: '#3b82f6', label: 'In Progress' },
            { value: analytics.todo, color: '#64748b', label: 'To Do' },
            { value: analytics.cancelled, color: '#374151', label: 'Cancelled' },
          ]} />
        </div>

        {/* Weekly velocity */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-300">Weekly Velocity</h3>
            {analytics.velocityDelta !== null && (
              <span className={`flex items-center gap-1 text-xs font-medium ${analytics.velocityDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <TrendingUp size={12} />
                {analytics.velocityDelta >= 0 ? '+' : ''}{analytics.velocityDelta}% vs last week
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-3">Tasks completed per week (last 4 weeks)</p>
          <MiniBarChart data={analytics.weeklyVelocity} maxVal={Math.max(...analytics.weeklyVelocity, 1)} color="#818cf8" />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>3w ago</span><span>2w ago</span><span>Last week</span><span>This week</span>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Priority Breakdown</h3>
          <div className="space-y-3">
            {analytics.byPriority.map(({ label, count }) => {
              const colors: Record<string, string> = {
                URGENT: 'bg-rose-500', HIGH: 'bg-amber-500', MEDIUM: 'bg-blue-500', LOW: 'bg-slate-500'
              };
              const pct = analytics.maxPriCount > 0 ? Math.round((count / analytics.maxPriCount) * 100) : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs w-14 text-slate-400">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${colors[label]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
