import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckSquare,
  Folder,
  BookOpen,
  X,
  ArrowRight
} from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { AiVoiceButton } from './AiVoiceButton';

interface AiCommandBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCopilot: (initialPrompt?: string) => void;
}

const SHORTCUT_ACTIONS = [
  { label: 'Plan Today with AI', icon: Zap, prompt: 'Plan my top 3 focus tasks for today based on deadlines.' },
  { label: 'Decompose Next Epic', icon: CheckSquare, prompt: 'Break down my next strategic project task into subtasks.' },
  { label: 'Search Notes & Docs', icon: BookOpen, prompt: 'Search my notes and documents for key insights.' },
  { label: 'Executive Morning Briefing', icon: Sparkles, prompt: 'Give me my morning briefing and priority insights.' },
  { label: 'Create Project Tasks', icon: Folder, prompt: 'Help me draft a list of tasks for a new project.' }
];

export const AiCommandBarModal: React.FC<AiCommandBarModalProps> = ({
  isOpen,
  onClose,
  onOpenCopilot
}) => {
  const [query, setQuery] = useState('');

  const { isListening, toggleListening } = useVoiceRecognition({
    onResult: (transcript) => {
      setQuery(transcript);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onOpenCopilot();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenCopilot, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    onOpenCopilot(query.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#152119] border border-[#E1EBE4] dark:border-[#24352A] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Bar Input */}
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-3.5 border-b border-[#E1EBE4] dark:border-[#24352A] gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening... Speak now..." : "Ask AI anything or command workspace (Press Enter)..."}
            className="flex-1 text-sm bg-transparent border-none text-[#17211B] dark:text-[#EAF7EF] placeholder-[#66736B] dark:placeholder-[#9BB5A5] focus:outline-none"
          />
          <AiVoiceButton
            isListening={isListening}
            onToggle={toggleListening}
            size="sm"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#66736B] hover:bg-[#E8F5EE] dark:hover:bg-[#233529]"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Actions List */}
        <div className="p-3 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] dark:text-[#9BB5A5] px-3 py-1.5">
            Quick AI Actions
          </div>

          {SHORTCUT_ACTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onClose();
                  onOpenCopilot(item.prompt);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#E8F5EE] dark:hover:bg-[#1E2B22] text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#66736B] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E1EBE4] dark:border-[#24352A] bg-[#F7FAF8] dark:bg-[#121C15] text-[11px] text-[#66736B] dark:text-[#9BB5A5]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1E2B22] border text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1E2B22] border text-[10px]">K</kbd> anytime</span>
          <span>Powered by Google Gemini</span>
        </div>
      </div>
    </div>
  );
};
