import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles } from 'lucide-react';
import { projectService } from '../../services/projectService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface ProjectAiAssistantPanelProps {
  projectId: string;
  projectName: string;
}

export const ProjectAiAssistantPanel: React.FC<ProjectAiAssistantPanelProps> = ({
  projectId,
  projectName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const open = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm your AI assistant for **${projectName}**.\n\nI can answer questions about this project's tasks, milestones, and progress. Everything I say is based on your actual project data.\n\n*[AI-generated responses are labeled as such]*`,
        timestamp: new Date(),
      }]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await projectService.sendProjectAiMessage(projectId, text, history);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply || '(No response)',
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to get a response.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${errMsg}`,
        timestamp: new Date(),
        error: true,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (text: string) => {
    // Simple markdown-ish render
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded text-xs font-mono text-indigo-300">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={open}
          id="project-ai-assistant-btn"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white shadow-2xl shadow-indigo-500/40 transition-all hover:scale-105 group"
          title="AI Project Assistant"
        >
          <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-medium">Ask AI</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 transition-all duration-300 ${
            isMinimized ? 'w-72 h-14' : 'w-96 h-[520px]'
          }`}
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/60 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">AI Assistant</p>
              {!isMinimized && <p className="text-xs text-slate-500 truncate">{projectName}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(v => !v)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={11} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : msg.error
                          ? 'bg-rose-900/40 border border-rose-500/30 text-rose-300 rounded-tl-sm'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-700/40 rounded-tl-sm'
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                      <Bot size={11} className="text-white" />
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/40">
                      <div className="flex items-center gap-1.5">
                        <Loader2 size={12} className="text-indigo-400 animate-spin" />
                        <span className="text-xs text-slate-500">Thinking…</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* AI label notice */}
              <div className="px-3 pb-1 shrink-0">
                <p className="text-[10px] text-slate-600 text-center">
                  ✦ Responses are AI-generated and labeled [AI Suggestion] where applicable
                </p>
              </div>

              {/* Input */}
              <div className="px-3 pb-3 shrink-0">
                <div className="flex items-end gap-2 rounded-xl border border-slate-700 bg-slate-800/80 focus-within:border-indigo-500 transition-colors p-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask about tasks, progress, blockers…"
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none resize-none max-h-28"
                    style={{ minHeight: '24px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
