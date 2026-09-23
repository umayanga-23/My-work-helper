import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  CheckCircle2,
  Zap,
  Check
} from 'lucide-react';
import { aiService, AiActionItem } from '../../services/aiService';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { AiVoiceButton } from './AiVoiceButton';
import { clsx } from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actionType?: string;
  proposedActions?: AiActionItem[];
  actionsExecuted?: boolean;
}

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  pageContext?: string;
  onTasksCreated?: () => void;
}

const QUICK_PROMPTS = [
  { label: '🎯 Plan Today Focus', prompt: 'Analyze my pending tasks and prioritize the Top 3 focus tasks for today.' },
  { label: '🧠 Explain (WHY-WHAT-HOW)', prompt: 'Explain an important software engineering or database concept using the WHY -> WHAT -> HOW pattern in Sinhala and English.' },
  { label: '🌤️ Morning Briefing', prompt: 'Give me my executive morning briefing and top priorities for today.' },
  { label: '⚡ Break down Task', prompt: 'Decompose my latest strategic project goal into concrete subtasks with [ACTION:CREATE_TASK] tags.' },
  { label: '💡 Workspace Ideas', prompt: 'Suggest 3 high-impact features or architectural optimizations for my AIU Workspace.' }
];

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
  pageContext,
  onTasksCreated
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "ආයුබෝවන් Induwara! 👋 මම ඔයාගේ **AIU Workspace Software Partner & Learning Coach**.\n\nඔයාගේ tasks plan කරන්න, complex projects break down කරන්න, web development & database concepts **WHY → WHAT → HOW** ක්‍රමයට ඉගෙන ගන්න මම ready. අද අපි මොන feature එකද build කරන්නේ / learn කරන්නේ?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [executingActions, setExecutingActions] = useState<string | null>(null);

  const { isListening, toggleListening } = useVoiceRecognition({
    onResult: (transcript) => {
      setInput(transcript);
    }
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await aiService.chat(query, conversationId, history, pageContext);

      setConversationId(res.conversationId);

      const botMsg: Message = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: res.reply,
        actionType: res.actionType,
        proposedActions: res.proposedActions,
        actionsExecuted: false
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to communicate with AI:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue communicating with the AI service. Please verify your connection or check your API key settings.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveActions = async (msgId: string, actions: AiActionItem[]) => {
    setExecutingActions(msgId);
    try {
      await aiService.executeActions(actions);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionsExecuted: true } : m))
      );
      if (onTasksCreated) {
        onTasksCreated();
      }
    } catch (err) {
      console.error('Failed to execute AI proposed actions:', err);
    } finally {
      setExecutingActions(null);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[var(--color-primary-deep)] via-[var(--color-primary-hover)] to-[var(--color-primary)] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all animate-in fade-in cursor-pointer"
          title="Open AI Copilot (Ctrl+K)"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <span>AI Copilot</span>
        </button>
      )}

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-[#152119] border-l border-[#E1EBE4] dark:border-[#24352A] shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1EBE4] dark:border-[#24352A] bg-[#F7FAF8] dark:bg-[#121C15]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-1.5">
                      AIU Workspace Copilot
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                    </h3>
                    <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5]">
                      Workspace Intelligence & Action Engine
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#66736B] dark:text-[#9BB5A5] hover:bg-[#E8F5EE] dark:hover:bg-[#233529] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'flex gap-2.5 max-w-[92%]',
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-xs',
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      )}
                    >
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Message Bubble */}
                    <div className="space-y-2.5">
                      <div
                        className={clsx(
                          'p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap',
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white rounded-tr-xs'
                            : 'bg-[#F7FAF8] dark:bg-[#1A281E] border border-[#E1EBE4] dark:border-[#2C3E33] text-[#17211B] dark:text-[#EAF7EF] rounded-tl-xs'
                        )}
                      >
                        {msg.content}
                      </div>

                      {/* Action Approval Card (if AI proposed creating tasks) */}
                      {msg.proposedActions && msg.proposedActions.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2.5 animate-in slide-in-from-bottom-2">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              Proposed Action Items ({msg.proposedActions.length})
                            </span>
                            {msg.actionsExecuted && (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <Check className="w-3.5 h-3.5" />
                                Created in Database
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {msg.proposedActions.map((action, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-xl bg-white dark:bg-[#1E2B22] border border-emerald-500/20 text-xs flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-[#17211B] dark:text-[#EAF7EF] block truncate">
                                    {action.title}
                                  </span>
                                  {action.description && (
                                    <span className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] line-clamp-1">
                                      {action.description}
                                    </span>
                                  )}
                                </div>
                                {action.priority && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-[10px] font-extrabold uppercase shrink-0">
                                    {action.priority}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {!msg.actionsExecuted && (
                            <button
                              onClick={() => handleApproveActions(msg.id, msg.proposedActions!)}
                              disabled={executingActions === msg.id}
                              className="w-full py-2 bg-gradient-to-r from-[var(--color-primary-hover)] to-[var(--color-primary)] hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {executingActions === msg.id
                                  ? 'Creating Tasks...'
                                  : `Approve & Create (${msg.proposedActions.length} Tasks)`}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2.5 mr-auto">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(var(--primary-rgb),0.12)] text-[var(--color-primary)] border border-[rgba(var(--primary-rgb),0.2)] flex items-center justify-center text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#F7FAF8] dark:bg-[#1A281E] border border-[#E1EBE4] dark:border-[#2C3E33] text-xs text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                      Analyzing workspace & thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Pills */}
              <div className="px-4 py-2 border-t border-[#E1EBE4] dark:border-[#24352A] bg-[#F7FAF8] dark:bg-[#121C15] overflow-x-auto">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => handleSend(qp.prompt)}
                      disabled={loading}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-[#1C2C21] border border-[#E1EBE4] dark:border-[#2E4536] text-[#3E4D44] dark:text-[#C5D6CC] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shrink-0 cursor-pointer"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Footer */}
              <div className="p-4 border-t border-[#E1EBE4] dark:border-[#24352A] bg-white dark:bg-[#152119]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening... Speak now..." : "Ask AI anything or command (e.g. Plan today)..."}
                    className={clsx(
                      "flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F7FAF8] dark:bg-[#121C15] border border-[#E1EBE4] dark:border-[#2C3E33] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#66736B] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all",
                      isListening && "border-rose-500/50 ring-2 ring-rose-500/20"
                    )}
                  />
                  <AiVoiceButton
                    isListening={isListening}
                    onToggle={toggleListening}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary-hover)] to-[var(--color-primary)] hover:brightness-105 text-white shadow-md disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
