import React, { useState, useMemo } from 'react';
import { Bug, Zap, Wrench, Star, Plus, Edit2, Trash2, CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { ProjectIssue } from '../../types';
import { projectService } from '../../services/projectService';
import { useConfirm } from '../../contexts/ConfirmDialogContext';

interface ProjectIssuesPanelProps {
  projectId: string;
  issues: ProjectIssue[];
  onUpdated: () => void;
}

const ISSUE_TYPES = [
  { key: 'BUG', label: 'Bug', icon: Bug, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25' },
  { key: 'IMPROVEMENT', label: 'Improvement', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/25' },
  { key: 'TECHNICAL_DEBT', label: 'Tech Debt', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25' },
  { key: 'FEATURE_REQUEST', label: 'Feature', icon: Star, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  OPEN: { label: 'Open', icon: Circle, color: 'text-slate-400' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'text-blue-400' },
  RESOLVED: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400' },
  CLOSED: { label: 'Closed', icon: XCircle, color: 'text-slate-600' },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  HIGH: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  MEDIUM: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  LOW: 'text-slate-400 bg-slate-700/50 border-slate-600',
};

interface IssueFormData {
  title: string;
  description: string;
  issueType: string;
  priority: string;
  status: string;
}
const EMPTY_FORM: IssueFormData = { title: '', description: '', issueType: 'BUG', priority: 'MEDIUM', status: 'OPEN' };

export const ProjectIssuesPanel: React.FC<ProjectIssuesPanelProps> = ({ projectId, issues, onUpdated }) => {
  const confirm = useConfirm();
  const [activeType, setActiveType] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IssueFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return activeType ? issues.filter(i => i.issueType === activeType) : issues;
  }, [issues, activeType]);

  const openIssues = issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, issueType: activeType || 'BUG' });
    setShowForm(true);
  };

  const openEdit = (issue: ProjectIssue) => {
    setEditingId(issue.id);
    setForm({
      title: issue.title,
      description: issue.description || '',
      issueType: issue.issueType,
      priority: issue.priority,
      status: issue.status,
    });
    setShowForm(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await projectService.updateProjectIssue(projectId, editingId, form as any);
      } else {
        await projectService.createProjectIssue(projectId, form as any);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Issue',
      message: 'Are you sure you want to delete this issue?',
      confirmText: 'Delete Issue',
      variant: 'danger',
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      await projectService.deleteProjectIssue(projectId, id);
      onUpdated();
    } catch { setError('Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Issues & Technical Debt</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {openIssues} open · {issues.length} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={15} /> New Issue
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveType(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${!activeType ? 'bg-slate-700 text-slate-200 border-slate-600' : 'text-slate-500 border-slate-700/50 hover:text-slate-300'}`}
        >
          All ({issues.length})
        </button>
        {ISSUE_TYPES.map(t => {
          const count = issues.filter(i => i.issueType === t.key).length;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveType(activeType === t.key ? null : t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${activeType === t.key ? `${t.bg} ${t.color} ${t.border}` : 'text-slate-500 border-slate-700/50 hover:text-slate-300'}`}
            >
              <Icon size={12} /> {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">{editingId ? 'Edit Issue' : 'New Issue'}</h3>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Issue title *"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="grid grid-cols-3 gap-3">
            {(['issueType', 'priority', 'status'] as const).map(field => (
              <div key={field}>
                <label className="text-xs text-slate-500 mb-1 block capitalize">{field === 'issueType' ? 'Type' : field}</label>
                <select
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {field === 'issueType' && ISSUE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  {field === 'priority' && ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
                  {field === 'status' && Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setError(null); }} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Issue list */}
      {filtered.length === 0 && !showForm && (
        <div className="text-center py-12 space-y-2">
          <Bug size={36} className="mx-auto text-slate-600" />
          <p className="text-slate-400">No issues found</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(issue => {
          const typeCfg = ISSUE_TYPES.find(t => t.key === issue.issueType) || ISSUE_TYPES[0];
          const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.OPEN;
          const StatusIcon = statusCfg.icon;
          const TypeIcon = typeCfg.icon;
          const isClosed = issue.status === 'CLOSED' || issue.status === 'RESOLVED';

          return (
            <div key={issue.id} className={`rounded-xl border ${typeCfg.border} bg-slate-800/40 p-4 group hover:bg-slate-800/70 transition-all ${isClosed ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <TypeIcon size={15} className={`${typeCfg.color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>
                    <span className={`flex items-center gap-1 text-xs ${statusCfg.color}`}>
                      <StatusIcon size={11} /> {statusCfg.label}
                    </span>
                  </div>
                  <h3 className={`text-sm font-medium mt-1 ${isClosed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{issue.title}</h3>
                  {issue.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{issue.description}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEdit(issue)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all"><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(issue.id)} disabled={deletingId === issue.id} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
