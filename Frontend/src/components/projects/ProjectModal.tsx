import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, Target } from 'lucide-react';
import { Project, ProjectStatus } from '../../types';
import { clsx } from 'clsx';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  initialProject?: Project;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status || 'PLANNING');
  const [projectKey, setProjectKey] = useState(initialProject?.projectKey || '');
  const [githubRepo, setGithubRepo] = useState(initialProject?.githubRepo || '');
  const [githubToken, setGithubToken] = useState(initialProject?.githubToken || '');
  const [startDate, setStartDate] = useState(
    initialProject?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(initialProject?.endDate || '');

  useEffect(() => {
    if (isOpen) {
      setName(initialProject?.name || '');
      setDescription(initialProject?.description || '');
      setStatus(initialProject?.status || 'PLANNING');
      setProjectKey(initialProject?.projectKey || '');
      setGithubRepo(initialProject?.githubRepo || '');
      setGithubToken(initialProject?.githubToken || '');
      setStartDate(initialProject?.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(initialProject?.endDate || '');
    }
  }, [isOpen, initialProject]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialProject?.id,
      name: name.trim(),
      description: description.trim(),
      status,
      projectKey: projectKey.trim().toUpperCase() || undefined,
      githubRepo: githubRepo.trim() || undefined,
      githubToken: githubToken.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
    });
    onClose();
  };

  const statusOptions: { label: string; value: ProjectStatus; color: string }[] = [
    { label: 'Planning', value: 'PLANNING', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { label: 'Active', value: 'ACTIVE', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { label: 'On Hold', value: 'ON_HOLD', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { label: 'Completed', value: 'COMPLETED', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    { label: 'Archived', value: 'ARCHIVED', color: 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7] dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base">
                {initialProject ? 'Edit Project' : 'Create Project Workspace'}
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">Initialize a unified project command center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DocuSphere Personal Workspace System"
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Description & Vision
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project goals, technical stack, architecture summary..."
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          {/* Jira-style Task Key and GitHub Repo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B]">
            <div>
              <label className="block text-[11px] font-semibold text-[#5FBF8F] uppercase tracking-wider mb-1">
                Project Key (Prefix)
              </label>
              <input
                type="text"
                maxLength={8}
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="e.g. AIU or NEST"
                className="w-full px-3 py-2 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-lg text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-xs font-mono uppercase focus:outline-none focus:border-[#5FBF8F]"
              />
              <p className="text-[10px] text-[#66736B] dark:text-[#9BB5A5] mt-1">Tasks will be named {projectKey ? projectKey : 'PRJ'}-1, {projectKey ? projectKey : 'PRJ'}-2</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5FBF8F] uppercase tracking-wider mb-1">
                GitHub Repository
              </label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="e.g. username/repo-name"
                className="w-full px-3 py-2 bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-lg text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-xs focus:outline-none focus:border-[#5FBF8F]"
              />
              <p className="text-[10px] text-[#66736B] dark:text-[#9BB5A5] mt-1">Enables commit tracking & auto-closing</p>
            </div>
          </div>

          {/* Status Options Grid */}
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#5FBF8F]" />
              Project Status Pipeline
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={clsx(
                    'px-2.5 py-1.5 text-xs font-semibold rounded-lg border text-center transition-all',
                    opt.color,
                    status === opt.value
                      ? 'ring-2 ring-brand-500 shadow-md font-bold'
                      : 'opacity-60 hover:opacity-100'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Target End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
            >
              {initialProject ? 'Save Project' : 'Create Project Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
