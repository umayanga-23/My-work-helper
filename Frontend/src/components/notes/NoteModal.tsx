import React, { useState, useEffect } from 'react';
import { X, FileText, Star, Tag, Eye, Edit3, Plus, Briefcase } from 'lucide-react';
import { Note, Category, Project } from '../../types';
import { projectService } from '../../services/projectService';
import { clsx } from 'clsx';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Partial<Note>) => void;
  categories: Category[];
  initialNote?: Note;
  presetCategoryId?: string;
  defaultProjectId?: string;
  onOpenCategoryModal?: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialNote,
  presetCategoryId,
  defaultProjectId,
  onOpenCategoryModal,
}) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [tagsInput, setTagsInput] = useState(initialNote?.tags ? initialNote.tags.join(', ') : '');
  const [categoryId, setCategoryId] = useState(initialNote?.categoryId || presetCategoryId || '');
  const [projectId, setProjectId] = useState(initialNote?.projectId || defaultProjectId || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFavorite, setIsFavorite] = useState(initialNote?.isFavorite || false);
  const [activeTab, setActiveTab] = useState<'WRITE' | 'PREVIEW'>('WRITE');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialNote?.title || '');
      setContent(initialNote?.content || '');
      setTagsInput(initialNote?.tags ? initialNote.tags.join(', ') : '');
      setCategoryId(initialNote?.categoryId || presetCategoryId || '');
      setProjectId(initialNote?.projectId || defaultProjectId || '');
      setIsFavorite(initialNote?.isFavorite || false);
      setActiveTab('WRITE');

      projectService.getProjects().then(setProjects).catch(console.error);
    }
  }, [isOpen, initialNote, presetCategoryId, defaultProjectId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      id: initialNote?.id,
      title: title.trim(),
      content: content.trim(),
      tags: parsedTags,
      isFavorite,
      projectId: projectId || undefined,
      categoryId: categoryId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7] dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base">
                {initialNote ? 'Edit Knowledge Note' : 'Create Knowledge Note'}
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">Markdown document editor with tags and dynamic categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Note Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spring Boot 3 Security Architecture Notes"
              className="w-full px-3.5 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-sm focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          {/* Project & Category Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Linked Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F] cursor-pointer"
              >
                <option value="">No Project (Standalone Note)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name} {p.projectKey ? `(${p.projectKey})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Category
                </label>
                {onOpenCategoryModal && (
                  <button
                    type="button"
                    onClick={onOpenCategoryModal}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
                    title="Create a new category"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] text-sm focus:outline-none focus:border-[#5FBF8F]"
              >
                <option value="">General & Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF] uppercase tracking-wider mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Java, Spring Boot, Security, Architecture"
              className="w-full px-3.5 py-2 bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] rounded-xl text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] text-xs focus:outline-none focus:border-[#5FBF8F]"
            />
          </div>

          {/* Write / Preview Tab Bar */}
          <div className="border border-[#DCE9E1] dark:border-[#20372B] rounded-xl overflow-hidden bg-[#F3FBF7] dark:bg-[#08120D]/60">
            <div className="px-3 py-2 bg-white dark:bg-[#0E1C15] border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('WRITE')}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                    activeTab === 'WRITE'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                  )}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Write Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PREVIEW')}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                    activeTab === 'PREVIEW'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live Preview
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={clsx(
                  'p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1',
                  isFavorite ? 'text-amber-400 bg-amber-500/10' : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                )}
              >
                <Star className={clsx('w-3.5 h-3.5', isFavorite && 'fill-current text-amber-400')} />
                <span className="hidden sm:inline">{isFavorite ? 'Starred Note' : 'Star Note'}</span>
              </button>
            </div>

            {/* Tab Body */}
            {activeTab === 'WRITE' ? (
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Markdown Document Title&#10;&#10;Write engineering notes, code snippets, specs, or summaries..."
                className="w-full p-4 bg-transparent text-[#17211B] dark:text-[#EAF7EF] font-mono text-xs placeholder-[#8A9890] outline-none resize-y min-h-[220px]"
              />
            ) : (
              <div className="p-4 min-h-[220px] max-h-[350px] overflow-y-auto text-xs text-[#17211B] dark:text-[#EAF7EF] prose prose-invert max-w-none">
                {content.trim() ? (
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
                ) : (
                  <p className="text-[#8A9890] dark:text-[#6F8A7A] italic">No markdown content written yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
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
              {initialNote ? 'Save Note Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
