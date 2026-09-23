import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Rocket,
  Trash2,
  Edit,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Idea, IdeaStatus } from '../types';
import { ideaService } from '../services/ideaService';
import { IdeaModal } from '../components/ideas/IdeaModal';
import { AiIdeaExpansionModal } from '../components/ideas/AiIdeaExpansionModal';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export const IdeasPage: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>(undefined);
  const [expandingIdea, setExpandingIdea] = useState<Idea | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadIdeas = async () => {
    try {
      const statusParam = activeStatus !== 'ALL' ? (activeStatus as IdeaStatus) : undefined;
      const fetched = await ideaService.getIdeas({
        status: statusParam,
        search: search || undefined,
      });
      setIdeas(fetched);
    } catch (err) {
      console.error('Failed to load ideas:', err);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, [search, activeStatus]);

  const handleConvertToProject = async (idea: Idea) => {
    setConvertingId(idea.id);
    try {
      const createdProject = await ideaService.convertToProject(idea.id);
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id ? { ...i, status: 'CONVERTED_TO_PROJECT', convertedProjectId: createdProject.id } : i
        )
      );
      navigate('/projects');
    } catch (err) {
      console.error('Failed to convert idea to project:', err);
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await ideaService.deleteIdea(id);
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveIdea = async (ideaData: Partial<Idea>) => {
    if (editingIdea) {
      setIdeas((prev) =>
        prev.map((i) => (i.id === editingIdea.id ? ({ ...i, ...ideaData } as Idea) : i))
      );
    } else {
      const created = await ideaService.createIdea(ideaData);
      setIdeas((prev) => [created, ...prev]);
    }
    setEditingIdea(undefined);
  };

  const statusBadgeClass = (status: IdeaStatus) => {
    switch (status) {
      case 'IDEA': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'EXPLORING': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PLANNED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CONVERTED_TO_PROJECT': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-[#E8F7EF] dark:bg-[#13261C] text-[#66736B] dark:text-[#9BB5A5] border-[#DCE9E1] dark:border-[#20372B]';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            Ideas Incubator Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5]">
            Capture developer concepts, explore feature architectures, and convert ideas into active projects.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingIdea(undefined);
            setIdeaModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#5FBF8F]/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Capture Idea
        </button>
      </div>

      {/* Status Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B]">
        <div className="flex items-center gap-1 p-1 bg-[#F3FBF7] dark:bg-[#08120D]/60 rounded-xl border border-[#DCE9E1] dark:border-[#20372B] overflow-x-auto">
          {['ALL', 'IDEA', 'EXPLORING', 'PLANNED', 'CONVERTED_TO_PROJECT'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                activeStatus === st
                  ? 'bg-yellow-500 text-[#17211B] font-bold shadow-sm'
                  : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
              )}
            >
              {st === 'CONVERTED_TO_PROJECT' ? 'CONVERTED' : st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A9890] dark:text-[#6F8A7A] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts, tags, ideas..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-xs text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] outline-none focus:border-[#5FBF8F]"
          />
        </div>
      </div>

      {/* Grid View of Idea Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.length === 0 ? (
          <div className="col-span-full p-12 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
            <Lightbulb className="w-12 h-12 text-[#66736B] dark:text-[#9BB5A5] mx-auto" />
            <h3 className="text-lg font-semibold text-[#17211B] dark:text-[#EAF7EF]">No ideas in vault</h3>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
              Capture your first architectural concept or application feature idea.
            </p>
          </div>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] transition-all duration-200 shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className={clsx(
                      'px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider',
                      statusBadgeClass(idea.status)
                    )}
                  >
                    {idea.status === 'CONVERTED_TO_PROJECT' ? 'CONVERTED TO PROJECT' : idea.status}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingIdea(idea);
                        setIdeaModalOpen(true);
                      }}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded"
                      title="Edit Idea"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 rounded"
                      title="Delete Idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base group-hover:text-yellow-400 transition-colors line-clamp-1 mb-1">
                  {idea.title}
                </h3>

                {idea.description && (
                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] line-clamp-3 mb-3">{idea.description}</p>
                )}

                {/* Tag Pills */}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mb-4">
                    {idea.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-[#E8F7EF] dark:bg-[#13261C] text-[#17211B] dark:text-[#EAF7EF] text-[10px] font-medium border border-[#DCE9E1] dark:border-[#20372B]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setExpandingIdea(idea)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 font-semibold text-[11px] rounded-lg border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                  title="Expand into SWOT & Architecture"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                  AI Expand
                </button>

                {idea.status === 'CONVERTED_TO_PROJECT' ? (
                  <span className="text-xs text-purple-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Project
                  </span>
                ) : (
                  <button
                    onClick={() => handleConvertToProject(idea)}
                    disabled={convertingId === idea.id}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-brand-500 hover:from-purple-500 hover:to-brand-400 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    {convertingId === idea.id ? 'Converting...' : 'Convert'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Idea Modal */}
      <IdeaModal
        isOpen={ideaModalOpen}
        onClose={() => {
          setIdeaModalOpen(false);
          setEditingIdea(undefined);
        }}
        onSave={handleSaveIdea}
        initialIdea={editingIdea}
      />

      {/* AI Expansion Modal */}
      <AiIdeaExpansionModal
        isOpen={!!expandingIdea}
        onClose={() => setExpandingIdea(null)}
        idea={expandingIdea}
        onConvertedToProject={() => {
          loadIdeas();
        }}
      />
    </div>
  );
};
