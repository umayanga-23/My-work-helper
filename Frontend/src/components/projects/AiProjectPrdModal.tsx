import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Layers,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { aiService, ProjectPrd, AiActionItem } from '../../services/aiService';
import { Project } from '../../types';

interface AiProjectPrdModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onMilestonesApplied?: () => void;
}

export const AiProjectPrdModal: React.FC<AiProjectPrdModalProps> = ({
  isOpen,
  onClose,
  project,
  onMilestonesApplied
}) => {
  const [prd, setPrd] = useState<ProjectPrd | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setLoading(true);
      setPrd(null);
      setApplied(false);
      aiService
        .generateProjectPrd(project.id)
        .then((res) => setPrd(res))
        .catch((err) => console.error('Failed to generate PRD:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const handleApplyMilestoneTasks = async () => {
    if (!prd?.sprintMilestones) return;
    setApplying(true);

    try {
      const allTasks: AiActionItem[] = [];
      prd.sprintMilestones.forEach((m) => {
        m.tasks.forEach((t) => {
          allTasks.push({
            ...t,
            projectId: project.id,
            projectName: project.name
          });
        });
      });

      await aiService.executeActions(allTasks);
      setApplied(true);
      if (onMilestonesApplied) onMilestonesApplied();
    } catch (err) {
      console.error('Failed to apply roadmap tasks:', err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0E1C15] rounded-3xl border border-[#DCE9E1] dark:border-[#20372B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-[#5FBF8F] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                AI Project Strategist • PRD & Sprint Roadmap
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate max-w-md">
                Project: <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{project.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                AI is architecting PRD, Tech Stack, & Sprint Milestones...
              </p>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Formulating requirements and structured sprint deliverables.
              </p>
            </div>
          ) : prd ? (
            <div className="space-y-6">
              {/* Executive PRD Summary */}
              <div className="p-5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-2">
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Product Vision & Scope
                </span>
                <p className="text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] leading-relaxed whitespace-pre-line">
                  {prd.executiveSummary}
                </p>
              </div>

              {/* Architecture & Risks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-2">
                  <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#5FBF8F]" /> Recommended Tech Stack
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prd.recommendedTechStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] border border-[#DCE9E1] dark:border-[#20372B]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-2">
                  <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Anticipated Risks & Mitigations
                  </span>
                  <div className="space-y-1 pt-1">
                    {prd.potentialRisks.map((risk, idx) => (
                      <p key={idx} className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {risk}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sprint Roadmap & Action Tasks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Agile Sprint Roadmap & Milestones
                  </h4>

                  {applied ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Added to Project Tasks!
                    </span>
                  ) : (
                    <button
                      onClick={handleApplyMilestoneTasks}
                      disabled={applying}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {applying ? 'Applying...' : '1-Click Commit All Sprint Tasks'}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {prd.sprintMilestones?.map((sprint, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          {sprint.milestoneName}
                        </span>
                        <span className="text-[10px] text-[#8A9890]">{sprint.tasks?.length || 0} Tasks</span>
                      </div>
                      <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] italic">{sprint.objective}</p>

                      <div className="space-y-1.5 pt-1">
                        {sprint.tasks?.map((t, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-2 rounded-xl bg-[#F3FBF7] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-xs text-[#17211B] dark:text-[#EAF7EF] flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{t.title}</span>
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                              {t.priority || 'MEDIUM'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-500">Failed to generate PRD roadmap. Please try again.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end bg-[#F3FBF7]/50 dark:bg-[#13261C]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-[#DCE9E1] text-[#237A57] dark:text-[#6DD6A0] font-semibold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
