import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Target } from 'lucide-react';
import { Idea, IdeaStatus, Category } from '../../types';
import { categoryService } from '../../services/categoryService';
import { clsx } from 'clsx';

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ideaData: Partial<Idea>) => void;
  initialIdea?: Idea;
}

export const IdeaModal: React.FC<IdeaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialIdea,
}) => {
  const [title, setTitle] = useState(initialIdea?.title || '');
  const [description, setDescription] = useState(initialIdea?.description || '');
  const [category, setCategory] = useState(initialIdea?.category || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<IdeaStatus>(initialIdea?.status || 'IDEA');
  const [tagsInput, setTagsInput] = useState(initialIdea?.tags ? initialIdea.tags.join(', ') : '');

  useEffect(() => {
    if (isOpen) {
      categoryService.getCategories().then((cats) => {
        setCategories(cats || []);
        if (!initialIdea?.category && cats && cats.length > 0) {
          setCategory(cats[0].name);
        }
      });
    }
  }, [isOpen, initialIdea]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      id: initialIdea?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      tags: parsedTags,
    });
    onClose();
  };

  const statusOptions: { label: string; value: IdeaStatus; color: string }[] = [
    { label: 'Idea', value: 'IDEA', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    { label: 'Exploring', value: 'EXPLORING', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { label: 'Planned', value: 'PLANNED', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { label: 'Converted', value: 'CONVERTED_TO_PROJECT', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7] dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base">
                {initialIdea ? 'Edit Concept Idea' : 'Capture Developer Idea'}
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">Incubate software concepts and features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Idea Concept Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Automated Code Review Assistant"
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Description & Architectural Vision
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, solution, tech stack, and motivation..."
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value="General">General</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI, Git, Java, Crypto"
                className="w-full px-3 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-xs focus:outline-none focus:border-[#5FBF8F]"
              />
            </div>
          </div>

          {/* Status Pipeline Grid */}
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-yellow-400" />
              Incubation Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={clsx(
                    'px-2 py-1.5 text-xs font-semibold rounded-lg border text-center transition-all',
                    opt.color,
                    status === opt.value
                      ? 'ring-2 ring-brand-500 shadow-md font-bold'
                      : 'opacity-60 hover:opacity-100'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
            >
              {initialIdea ? 'Save Idea' : 'Capture Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
