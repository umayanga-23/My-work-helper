import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { aiService, IdeaExpansion } from '../../services/aiService';
import { Idea } from '../../types';

interface AiIdeaExpansionModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onConvertedToProject?: () => void;
}

export const AiIdeaExpansionModal: React.FC<AiIdeaExpansionModalProps> = ({
  isOpen,
  onClose,
  idea,
  onConvertedToProject
}) => {
  const [expansion, setExpansion] = useState<IdeaExpansion | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);

  useEffect(() => {
    if (isOpen && idea) {
      setLoading(true);
      setExpansion(null);
      setConverted(false);
      aiService
        .expandIdea(idea.id)
        .then((res) => setExpansion(res))
        .catch((err) => console.error('Failed to expand idea:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, idea]);

  if (!isOpen || !idea) return null;

  const handleConvertToProject = async () => {
    setConverting(true);
    try {
      await aiService.convertIdeaToProject(idea.id);
      setConverted(true);
      if (onConvertedToProject) onConvertedToProject();
    } catch (err) {
      console.error('Failed to convert idea to project:', err);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0E1C15] rounded-3xl border border-[#DCE9E1] dark:border-[#20372B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-[#5FBF8F] text-white flex items-center justify-center shadow-md">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                AI Idea Incubator • SWOT & Execution Roadmap
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate max-w-md">
                Incubating: <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{idea.title}</span>
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
              <div className="w-12 h-12 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                AI is incubating value proposition & SWOT analysis...
              </p>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Evaluating market strengths, risks, tech stack, and initial sprint tasks.
              </p>
            </div>
          ) : expansion ? (
            <div className="space-y-6">
              {/* Value Proposition */}
              <div className="p-5 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-2">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Strategic Value Proposition
                </span>
                <p className="text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] leading-relaxed whitespace-pre-line">
                  {expansion.valueProposition}
                </p>
              </div>

              {/* SWOT Matrix 2x2 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  SWOT Feasibility Evaluation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">💪 Strengths</span>
                    {expansion.strengths?.map((s, idx) => (
                      <p key={idx} className="text-[11px] text-[#17211B] dark:text-[#EAF7EF]">• {s}</p>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">⚠️ Weaknesses</span>
                    {expansion.weaknesses?.map((w, idx) => (
                      <p key={idx} className="text-[11px] text-[#17211B] dark:text-[#EAF7EF]">• {w}</p>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">🚀 Opportunities</span>
                    {expansion.opportunities?.map((o, idx) => (
                      <p key={idx} className="text-[11px] text-[#17211B] dark:text-[#EAF7EF]">• {o}</p>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">🛡️ Threats</span>
                    {expansion.threats?.map((t, idx) => (
                      <p key={idx} className="text-[11px] text-[#17211B] dark:text-[#EAF7EF]">• {t}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tech Stack & Initial Sprint Tasks */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                      Initial Sprint Tasks ({expansion.initialSprintTasks?.length || 0})
                    </span>
                    <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5]">
                      Foundational tasks ready to be scheduled upon project conversion.
                    </p>
                  </div>

                  {converted ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Converted to Live Project!
                    </span>
                  ) : (
                    <button
                      onClick={handleConvertToProject}
                      disabled={converting}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      {converting ? 'Converting...' : '1-Click Convert to Live Project'}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  {expansion.initialSprintTasks?.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F3FBF7] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-xs text-[#17211B] dark:text-[#EAF7EF] flex items-center justify-between"
                    >
                      <span>{t.title}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-[#5FBF8F]/20 text-[#237A57] dark:text-[#6DD6A0]">
                        {t.priority || 'HIGH'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-500">Failed to incubate idea. Please try again.</p>
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
