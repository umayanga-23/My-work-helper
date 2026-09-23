import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ListPlus,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { aiService, NoteSummary } from '../../services/aiService';
import { Note } from '../../types';

interface AiNoteSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onTasksCreated?: () => void;
}

export const AiNoteSummaryModal: React.FC<AiNoteSummaryModalProps> = ({
  isOpen,
  onClose,
  note,
  onTasksCreated
}) => {
  const [summary, setSummary] = useState<NoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [tasksCreated, setTasksCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      setLoading(true);
      setSummary(null);
      setTasksCreated(false);
      aiService
        .summarizeNote(note.id)
        .then((res) => setSummary(res))
        .catch((err) => console.error('Failed to summarize note:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, note]);

  if (!isOpen || !note) return null;

  const handleCreateActionTasks = async () => {
    if (!summary?.actionItems || summary.actionItems.length === 0) return;
    setCreatingTasks(true);

    try {
      const actions = summary.actionItems.map((item) => ({
        type: 'CREATE_TASK',
        title: item,
        description: `Generated from note: ${note.title}`,
        priority: 'MEDIUM',
        projectId: note.projectId
      }));

      await aiService.executeActions(actions);
      setTasksCreated(true);
      if (onTasksCreated) onTasksCreated();
    } catch (err) {
      console.error('Failed to create tasks from note summary:', err);
    } finally {
      setCreatingTasks(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.executiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0E1C15] rounded-3xl border border-[#DCE9E1] dark:border-[#20372B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#237A57] to-[#5FBF8F] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                Smart Note Summary & Takeaways
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate max-w-md">
                Analyzing: <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{note.title}</span>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-[#5FBF8F] border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                AI is digesting your note content...
              </p>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Extracting key takeaways, action steps, and smart tags.
              </p>
            </div>
          ) : summary ? (
            <div className="space-y-5">
              {/* Executive Summary Block */}
              <div className="p-4 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#237A57] dark:text-[#6DD6A0] uppercase tracking-wider">
                    Executive Summary
                  </span>
                  <button
                    onClick={handleCopySummary}
                    className="text-xs text-[#66736B] dark:text-[#9BB5A5] hover:text-[#237A57] dark:hover:text-[#6DD6A0] flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] leading-relaxed whitespace-pre-line">
                  {summary.executiveSummary}
                </p>
              </div>

              {/* Key Takeaways */}
              {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5FBF8F]" /> Key Concepts & Insights
                  </h4>
                  <div className="space-y-1.5">
                    {summary.keyTakeaways.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-xs text-[#17211B] dark:text-[#EAF7EF] flex items-start gap-2 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5FBF8F] shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <ListPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Suggested Actionable Tasks ({summary.actionItems.length})
                    </h4>

                    {tasksCreated ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Added to Workspace Tasks!
                      </span>
                    ) : (
                      <button
                        onClick={handleCreateActionTasks}
                        disabled={creatingTasks}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {creatingTasks ? 'Creating...' : 'Convert to Tasks (1-Click)'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {summary.actionItems.map((action, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white/80 dark:bg-[#0E1C15]/80 border border-amber-500/20 text-xs text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-rose-500">Failed to generate summary. Please try again.</p>
          )}
        </div>

        {/* Modal Footer */}
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
