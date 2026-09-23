import React, { useState } from 'react';
import {
  Flag, Calendar, CheckCircle2, Circle, Clock, Plus, Edit2, Trash2,
  AlertTriangle
} from 'lucide-react';
import { ProjectMilestone, Task } from '../../types';
import { projectService } from '../../services/projectService';
import { useConfirm } from '../../contexts/ConfirmDialogContext';

interface ProjectRoadmapProps {
  projectId: string;
  milestones: ProjectMilestone[];
  tasks: Task[];
  onUpdated: () => void;
}

const STATUS_CONFIG = {
  OPEN: { label: 'Planned', color: 'text-slate-400', bg: 'bg-slate-700/50', border: 'border-slate-600', icon: Circle },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return diff;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'No due date';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MilestoneTaskProgress({ milestone, tasks }: { milestone: ProjectMilestone; tasks: Task[] }) {
  const mDate = milestone.dueDate ? new Date(milestone.dueDate) : null;
  const relevantTasks = mDate
    ? tasks.filter(t => t.dueDate && new Date(t.dueDate) <= mDate && t.status !== 'CANCELLED')
    : tasks.filter(t => t.status !== 'CANCELLED');
  if (relevantTasks.length === 0) return null;
  const done = relevantTasks.filter(t => t.status === 'COMPLETED').length;
  const pct = Math.round((done / relevantTasks.length) * 100);
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span>{done}/{relevantTasks.length} tasks due by this milestone</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface MilestoneFormData {
  title: string;
  description: string;
  status: string;
  dueDate: string;
}

const EMPTY_FORM: MilestoneFormData = { title: '', description: '', status: 'OPEN', dueDate: '' };

export const ProjectRoadmap: React.FC<ProjectRoadmapProps> = ({
  projectId, milestones, tasks, onUpdated
}) => {
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MilestoneFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sort milestones: chronological by dueDate, nulls last
  const sorted = [...milestones].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (m: ProjectMilestone) => {
    setEditingId(m.id);
    setForm({ title: m.title, description: m.description || '', status: m.status, dueDate: m.dueDate || '' });
    setShowForm(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await projectService.updateProjectMilestone(projectId, editingId, {
          title: form.title.trim(),
          description: form.description || undefined,
          status: form.status as any,
          dueDate: form.dueDate || undefined,
        });
      } else {
        await projectService.createProjectMilestone(projectId, {
          title: form.title.trim(),
          description: form.description || undefined,
          status: form.status as any,
          dueDate: form.dueDate || undefined,
        });
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save milestone.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Milestone',
      message: 'Are you sure you want to delete this milestone?',
      confirmText: 'Delete Milestone',
      variant: 'danger',
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      await projectService.deleteProjectMilestone(projectId, id);
      onUpdated();
    } catch (err: any) {
      setError('Failed to delete milestone.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Project Roadmap</h2>
          <p className="text-sm text-slate-400 mt-0.5">Key milestones and development stages</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} /> Add Milestone
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 backdrop-blur-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Edit Milestone' : 'New Milestone'}</h3>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="grid grid-cols-1 gap-3">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Milestone title *"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Target Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setError(null); }} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && !showForm && (
        <div className="text-center py-16 space-y-3">
          <Flag size={40} className="mx-auto text-slate-600" />
          <p className="text-slate-400 font-medium">No milestones yet</p>
          <p className="text-slate-500 text-sm">Add milestones to track your project's key stages</p>
        </div>
      )}

      {/* Timeline */}
      {sorted.length > 0 && (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500/40 via-slate-600/40 to-transparent" />

          <div className="space-y-4">
            {sorted.map((m, idx) => {
              const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.OPEN;
              const Icon = cfg.icon;
              const days = daysUntil(m.dueDate);
              const isOverdue = days !== null && days < 0 && m.status !== 'COMPLETED';
              const isUrgent = days !== null && days >= 0 && days <= 7 && m.status !== 'COMPLETED';

              return (
                <div key={m.id} className="relative flex gap-4 group">
                  {/* Timeline node */}
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 ${cfg.bg} ${cfg.border} transition-all`}>
                    <Icon size={16} className={cfg.color} />
                  </div>

                  {/* Card */}
                  <div className={`flex-1 rounded-2xl border ${cfg.border} ${cfg.bg} p-4 transition-all hover:shadow-lg hover:shadow-black/20`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-xs text-rose-400">
                              <AlertTriangle size={11} /> Overdue
                            </span>
                          )}
                          {isUrgent && !isOverdue && (
                            <span className="text-xs text-amber-400">⚡ {days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`}</span>
                          )}
                        </div>
                        <h3 className="text-slate-100 font-semibold mt-1.5">{m.title}</h3>
                        {m.description && <p className="text-slate-400 text-sm mt-1">{m.description}</p>}
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                          <Calendar size={11} />
                          <span>{formatDate(m.dueDate)}</span>
                          {days !== null && m.status !== 'COMPLETED' && (
                            <span className={`ml-1 ${isOverdue ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                              ({isOverdue ? `${Math.abs(days)} days overdue` : `${days} days away`})
                            </span>
                          )}
                        </div>
                        <MilestoneTaskProgress milestone={m} tasks={tasks} />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId === m.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* End of timeline */}
          <div className="relative flex gap-4 mt-4 opacity-40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-dashed border-slate-600 shrink-0">
              <Flag size={14} className="text-slate-600" />
            </div>
            <div className="flex items-center text-sm text-slate-600 italic">Project Completion</div>
          </div>
        </div>
      )}
    </div>
  );
};
