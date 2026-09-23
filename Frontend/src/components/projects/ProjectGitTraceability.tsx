import React, { useMemo, useState } from 'react';
import { GitCommit, GitBranch, ExternalLink, Link2, Link2Off, Search, ChevronDown, ChevronRight, CheckCircle2, Clock, Circle, Lock } from 'lucide-react';
import { Task, TaskGitCommit } from '../../types';

interface ProjectGitTraceabilityProps {
  tasks: Task[];
  commits: TaskGitCommit[];
}

function formatCommitDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 size={13} className="text-emerald-400" />,
  IN_PROGRESS: <Clock size={13} className="text-blue-400" />,
  TODO: <Circle size={13} className="text-slate-400" />,
  CANCELLED: <Circle size={13} className="text-slate-600" />,
};

function CommitCard({ commit, compact = false }: { commit: TaskGitCommit; compact?: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 ${compact ? 'py-2' : 'px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'} transition-all group`}>
      <GitCommit size={13} className="text-slate-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 line-clamp-2 leading-snug">{commit.message || '(no message)'}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <code className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
            {commit.commitHash.slice(0, 7)}
          </code>
          {commit.authorName && <span className="text-xs text-slate-500">{commit.authorName}</span>}
          <span className="text-xs text-slate-600">{formatCommitDate(commit.timestamp)}</span>
          {commit.eventType && commit.eventType !== 'PUSH' && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
              {commit.eventType}
            </span>
          )}
        </div>
      </div>
      {commit.commitUrl && (
        <a
          href={commit.commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-slate-600 hover:text-indigo-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
          title="Open in GitHub"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

interface TaskGroup {
  task: Task;
  commits: TaskGitCommit[];
}

export const ProjectGitTraceability: React.FC<ProjectGitTraceabilityProps> = ({ tasks, commits }) => {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showUnlinked, setShowUnlinked] = useState(true);

  const toggle = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Group commits by linked task
  const { taskGroups, unlinked } = useMemo(() => {
    const groups: Map<string, TaskGitCommit[]> = new Map();
    const unlinkedList: TaskGitCommit[] = [];

    for (const commit of commits) {
      if (commit.taskId) {
        if (!groups.has(commit.taskId)) groups.set(commit.taskId, []);
        groups.get(commit.taskId)!.push(commit);
      } else {
        unlinkedList.push(commit);
      }
    }

    // Build task groups (only tasks that have at least one commit, or all tasks)
    const taskGroups: TaskGroup[] = tasks
      .filter(t => groups.has(t.id))
      .map(t => ({ task: t, commits: groups.get(t.id)! }))
      .sort((a, b) => b.commits.length - a.commits.length);

    return { taskGroups, unlinked: unlinkedList };
  }, [tasks, commits]);

  const filteredGroups = search
    ? taskGroups.filter(g =>
        g.task.title.toLowerCase().includes(search.toLowerCase()) ||
        (g.task.taskKey || '').toLowerCase().includes(search.toLowerCase())
      )
    : taskGroups;

  const filteredUnlinked = search
    ? unlinked.filter(c => (c.message || '').toLowerCase().includes(search.toLowerCase()))
    : unlinked;

  const linkedCount = commits.length - unlinked.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <GitBranch size={20} className="text-indigo-400" />
          GitHub Traceability
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">Commits linked to project tasks</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Commits', value: commits.length, color: 'text-slate-200' },
          { label: 'Linked to Tasks', value: linkedCount, color: 'text-emerald-400' },
          { label: 'Unlinked', value: unlinked.length, color: unlinked.length > 0 ? 'text-amber-400' : 'text-slate-500' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/50">
        <Search size={14} className="text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks or commit messages…"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Linked task groups */}
      {filteredGroups.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Link2 size={12} /> Task-Linked Commits
          </h3>
          <div className="space-y-2">
            {filteredGroups.map(({ task, commits: taskCommits }) => {
              const isExpanded = expandedIds.has(task.id);
              return (
                <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
                  {/* Task header */}
                  <button
                    onClick={() => toggle(task.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors text-left"
                  >
                    <span className="text-slate-500 shrink-0">
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </span>
                    <span className="shrink-0">{STATUS_ICONS[task.status] || <Circle size={13} />}</span>
                    <code className="text-xs font-mono text-indigo-400 shrink-0">{task.taskKey}</code>
                    <span className="flex-1 text-sm text-slate-200 truncate">{task.title}</span>
                    {task.isBlocked && <Lock size={12} className="text-amber-400 shrink-0" />}
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      {taskCommits.length} commit{taskCommits.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Commits */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/60 px-4 py-3 space-y-2">
                      {taskCommits.map(commit => (
                        <CommitCard key={commit.id} commit={commit} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unlinked commits */}
      {filteredUnlinked.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowUnlinked(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-500/80 hover:text-amber-400 transition-colors"
          >
            {showUnlinked ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Link2Off size={12} />
            Unlinked Commits ({filteredUnlinked.length})
          </button>
          {showUnlinked && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
              <p className="text-xs text-amber-400/80 mb-3">
                These commits don't match any task key. To link them, include a task key in commit messages
                (e.g. <code className="font-mono">fix: #AIU-5 ...</code> or <code className="font-mono">AIU-5</code>).
              </p>
              {filteredUnlinked.map(commit => (
                <CommitCard key={commit.id} commit={commit} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {commits.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <GitCommit size={40} className="mx-auto text-slate-600" />
          <p className="text-slate-400 font-medium">No commits yet</p>
          <p className="text-slate-500 text-sm">Sync your GitHub repository to see commit traceability</p>
        </div>
      )}
    </div>
  );
};
