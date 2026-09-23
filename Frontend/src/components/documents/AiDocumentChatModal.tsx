import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  ListPlus,
  MessageSquare
} from 'lucide-react';
import { aiService, AiActionItem } from '../../services/aiService';
import { DocumentItem } from '../../types';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { AiVoiceButton } from '../ai/AiVoiceButton';
import { clsx } from 'clsx';

interface AiDocumentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onTasksCreated?: () => void;
}

interface DocMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedTasks?: AiActionItem[];
}

export const AiDocumentChatModal: React.FC<AiDocumentChatModalProps> = ({
  isOpen,
  onClose,
  document,
  onTasksCreated
}) => {
  const [messages, setMessages] = useState<DocMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I have ingested this document metadata. Ask me any question about its content, requirements, or next steps!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTaskIds, setCreatedTaskIds] = useState<Record<string, boolean>>({});

  const { isListening, toggleListening } = useVoiceRecognition({
    onResult: (transcript) => {
      setInput(transcript);
    }
  });

  if (!isOpen || !document) return null;

  const handleSend = async (customPrompt?: string) => {
    const q = (customPrompt || input).trim();
    if (!q || loading) return;

    const userMsg: DocMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: q
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chatDocument(
        document.name,
        q,
        `File: ${document.name}, Type: ${document.fileType}, Size: ${document.fileSize}, Category: ${document.categoryName || 'General'}`,
        document.id
      );

      const aiMsg: DocMessage = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: res.answer,
        suggestedTasks: res.suggestedTasks
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Failed to chat with document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async (msgId: string, tasks?: AiActionItem[]) => {
    if (!tasks || tasks.length === 0) return;
    try {
      await aiService.executeActions(tasks);
      setCreatedTaskIds((prev) => ({ ...prev, [msgId]: true }));
      if (onTasksCreated) onTasksCreated();
    } catch (err) {
      console.error('Failed to create tasks from doc chat:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0E1C15] rounded-3xl border border-[#DCE9E1] dark:border-[#20372B] shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#237A57] to-[#5FBF8F] text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                Chat With Document • Q&A Engine
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate max-w-sm">
                Document: <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{document.name}</span>
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

        {/* Messages Stream */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx('flex gap-2.5 max-w-[85%]', msg.role === 'user' ? 'ml-auto' : 'mr-auto')}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#237A57] text-white flex items-center justify-center text-xs shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={clsx(
                  'p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2',
                  msg.role === 'user'
                    ? 'bg-[#237A57] text-white rounded-br-xs'
                    : 'bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] rounded-bl-xs'
                )}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Suggested Action Tasks */}
                {msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                  <div className="pt-2 border-t border-[#DCE9E1] dark:border-[#20372B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ListPlus className="w-3.5 h-3.5" /> Actionable Tasks Identified
                      </span>
                      {createdTaskIds[msg.id] ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Created!
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateTasks(msg.id, msg.suggestedTasks)}
                          className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                        >
                          Convert to Tasks
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#66736B] dark:text-[#9BB5A5] mr-auto">
              <Sparkles className="w-4 h-4 text-[#5FBF8F] animate-spin" />
              <span>Analyzing document and formulating response...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-[#DCE9E1] dark:border-[#20372B] bg-[#F3FBF7] dark:bg-[#13261C] flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleSend('Provide a 3-bullet summary of key requirements.')}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] hover:border-[#5FBF8F] shrink-0"
          >
            📋 3-Bullet Summary
          </button>
          <button
            onClick={() => handleSend('What action items or next steps are implied in this doc?')}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] hover:border-[#5FBF8F] shrink-0"
          >
            ⚡ Extract Action Items
          </button>
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-[#DCE9E1] dark:border-[#20372B] bg-white dark:bg-[#0E1C15]">
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
              placeholder={isListening ? "Listening... Speak your question..." : "Ask anything about this document..."}
              className={clsx(
                "flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:border-[#5FBF8F]",
                isListening && "border-rose-500/50 ring-2 ring-rose-500/20"
              )}
            />
            <AiVoiceButton isListening={isListening} onToggle={toggleListening} size="sm" />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-[#237A57] hover:bg-[#5FBF8F] text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
