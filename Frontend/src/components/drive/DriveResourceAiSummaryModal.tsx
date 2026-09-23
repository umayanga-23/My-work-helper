import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ListPlus,
  Copy,
  Check
} from 'lucide-react';
import { aiService, AiActionItem } from '../../services/aiService';
import { DriveLink } from '../../types';

interface DriveResourceAiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: DriveLink | null;
  onTasksCreated?: () => void;
}

export const DriveResourceAiSummaryModal: React.FC<DriveResourceAiSummaryModalProps> = ({
  isOpen,
  onClose,
  resource,
  onTasksCreated
}) => {
  const [summary, setSummary] = useState<string>('');
  const [suggestedTasks, setSuggestedTasks] = useState<AiActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksCreated, setTasksCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && resource) {
      setLoading(true);
      setTasksCreated(false);
      setSummary('');
      setSuggestedTasks([]);

      aiService
        .chat(
          `Extract key takeaways and actionable learning points for this resource: Title: ${resource.name}, URL: ${resource.url}, Description: ${resource.description || 'N/A'}. Include [ACTION:CREATE_TASK] for high-value follow-ups.`
        )
        .then((res) => {
          setSummary(res.reply);
          if (res.proposedActions) setSuggestedTasks(res.proposedActions);
        })
        .catch((err) => console.error('Failed to extract resource insights:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const handleCreateTasks = async () => {
    if (suggestedTasks.length === 0) return;
    try {
      await aiService.executeActions(suggestedTasks);
      setTasksCreated(true);
      if (onTasksCreated) onTasksCreated();
    } catch (err) {
      console.error('Failed to create tasks from resource:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0E1C15] rounded-3xl border border-[#DCE9E1] dark:border-[#20372B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between bg-gradient-to-r from-[#237A57]/10 via-[#5FBF8F]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#237A57] to-[#5FBF8F] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                AI Resource Key Takeaways & Insights
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate max-w-md">
                Resource: <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{resource.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-[#5FBF8F] border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                AI is distilling key insights & code takeaways...
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary Block */}
              <div className="p-4 rounded-2xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#237A57] dark:text-[#6DD6A0] uppercase tracking-wider">
                    Executive Summary & Takeaways
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-[#66736B] dark:text-[#9BB5A5] hover:text-[#237A57] flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#17211B] dark:text-[#EAF7EF] leading-relaxed whitespace-pre-line">
                  {summary}
                </p>
              </div>

              {/* Tasks */}
              {suggestedTasks.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-amber-600" /> Actionable Follow-up Tasks ({suggestedTasks.length})
                    </span>

                    {tasksCreated ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Added to Tasks!
                      </span>
                    ) : (
                      <button
                        onClick={handleCreateTasks}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Convert to Tasks (1-Click)
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {suggestedTasks.map((t, idx) => (
                      <p key={idx} className="text-xs text-[#17211B] dark:text-[#EAF7EF]">• {t.title}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between bg-[#F3FBF7]/50 dark:bg-[#13261C]/30">
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#237A57] dark:text-[#6DD6A0] hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Resource Link
          </a>
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
