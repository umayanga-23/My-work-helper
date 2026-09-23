import React, { useMemo, useState } from 'react';
import { BookOpen, FileText, Plus, ExternalLink, Tag, Clock, Search } from 'lucide-react';
import { Note } from '../../types';

interface ProjectKnowledgePanelProps {
  notes: Note[];
  projectId: string;
  onOpenNote?: (noteId: string) => void;
  onCreateNote?: (defaultTags?: string) => void;
}

function isAdr(note: Note): boolean {
  const tags = (note.tags || []).map(t => t.toLowerCase());
  const title = note.title?.toLowerCase() || '';
  return tags.some(t => t.includes('adr') || t.includes('architecture decision')) ||
    title.startsWith('adr') || title.includes('[adr]');
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function NoteCard({ note, badge, onClick }: { note: Note; badge?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 hover:border-slate-600 hover:bg-slate-800/80 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <FileText size={15} className="text-indigo-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-medium">
                {badge}
              </span>
            )}
            {(note.tags || []).filter(t => !t.toLowerCase().includes('adr')).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">
                <Tag size={10} /> {tag.trim()}
              </span>
            ))}
          </div>
          <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2">{note.title}</h3>
          {note.content && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.content.replace(/[#*`]/g, '').trim()}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
            <Clock size={10} /> {formatDate(note.updatedAt || note.createdAt)}
          </div>
        </div>
        <ExternalLink size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

export const ProjectKnowledgePanel: React.FC<ProjectKnowledgePanelProps> = ({
  notes,
  projectId,
  onOpenNote,
  onCreateNote,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'adrs' | 'all'>('all');

  const { adrs, otherNotes, allNotes } = useMemo(() => {
    const filtered = search
      ? notes.filter(n =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          (n.content || '').toLowerCase().includes(search.toLowerCase()) ||
          (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
        )
      : notes;

    return {
      adrs: filtered.filter(isAdr),
      otherNotes: filtered.filter(n => !isAdr(n)),
      allNotes: filtered,
    };
  }, [notes, search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-400" />
            Project Knowledge Base
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {adrs.length} ADR{adrs.length !== 1 ? 's' : ''} · {notes.length} total notes
          </p>
        </div>
        <button
          onClick={() => onCreateNote?.('adr')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={15} /> New ADR
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/50 focus-within:border-indigo-500 transition-colors">
        <Search size={14} className="text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search knowledge base…"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All Notes (${allNotes.length})` },
          { key: 'adrs', label: `ADRs (${adrs.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              activeTab === tab.key
                ? 'bg-slate-700 text-slate-200 border-slate-600'
                : 'text-slate-500 border-slate-700/50 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ADR section */}
      {(activeTab === 'adrs' || activeTab === 'all') && adrs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80 flex items-center gap-2">
              📐 Architecture Decision Records
            </h3>
            <button
              onClick={() => onCreateNote?.('adr')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + New ADR
            </button>
          </div>
          <div className="space-y-2">
            {adrs.map(note => (
              <NoteCard key={note.id} note={note} badge="ADR" onClick={() => onOpenNote?.(note.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Regular notes */}
      {activeTab === 'all' && otherNotes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            📝 Project Notes
          </h3>
          <div className="space-y-2">
            {otherNotes.map(note => (
              <NoteCard key={note.id} note={note} onClick={() => onOpenNote?.(note.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ADR-only view */}
      {activeTab === 'adrs' && adrs.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <BookOpen size={36} className="mx-auto text-slate-600" />
          <p className="text-slate-400">No ADRs yet</p>
          <p className="text-slate-500 text-sm">
            Create notes tagged with <code className="bg-slate-700 px-1 rounded text-xs">adr</code> to track architectural decisions.
          </p>
          <button
            onClick={() => onCreateNote?.('adr')}
            className="text-indigo-400 hover:text-indigo-300 text-sm underline"
          >
            Create your first ADR
          </button>
        </div>
      )}

      {allNotes.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <FileText size={36} className="mx-auto text-slate-600" />
          <p className="text-slate-400">No notes in this project</p>
          <p className="text-slate-500 text-sm">Add notes to build your project's knowledge base.</p>
        </div>
      )}
    </div>
  );
};
