import React, { useState, useEffect } from 'react';
import { X, Globe, Star, Sparkles, Tag, Palette, FolderPlus, Briefcase } from 'lucide-react';
import { Website, Category, Project } from '../../types';
import { extractDominantColor } from '../../utils/colorExtractor';
import { categoryService } from '../../services/categoryService';
import { projectService } from '../../services/projectService';
import { clsx } from 'clsx';

interface WebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (websiteData: Partial<Website>) => void;
  categories: Category[];
  initialWebsite?: Website;
  defaultProjectId?: string;
  onCategoryCreated?: (newCategory: Category) => void;
}

const COLOR_PRESETS = ['#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#6366f1', '#f97316'];

export const WebsiteModal: React.FC<WebsiteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialWebsite,
  defaultProjectId,
  onCategoryCreated,
}) => {
  const [name, setName] = useState(initialWebsite?.name || '');
  const [url, setUrl] = useState(initialWebsite?.url || '');
  const [description, setDescription] = useState(initialWebsite?.description || '');
  const [tags, setTags] = useState(initialWebsite?.tags || '');
  const [color, setColor] = useState(initialWebsite?.color || '#10b981');
  const [isFavorite, setIsFavorite] = useState(initialWebsite?.isFavorite || false);
  const [categoryId, setCategoryId] = useState(initialWebsite?.categoryId || '');
  const [projectId, setProjectId] = useState(initialWebsite?.projectId || defaultProjectId || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialWebsite) {
      setName(initialWebsite.name || '');
      setUrl(initialWebsite.url || '');
      setDescription(initialWebsite.description || '');
      setTags(initialWebsite.tags || '');
      setColor(initialWebsite.color || '#10b981');
      setIsFavorite(Boolean(initialWebsite.isFavorite || (initialWebsite as any).favorite));
      setCategoryId(initialWebsite.categoryId || '');
      setProjectId(initialWebsite.projectId || defaultProjectId || '');
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } else {
      setName('');
      setUrl('');
      setDescription('');
      setTags('');
      setColor('#10b981');
      setIsFavorite(false);
      setCategoryId('');
      setProjectId(defaultProjectId || '');
      setIsCreatingCategory(false);
      setNewCategoryName('');
    }

    if (isOpen) {
      projectService.getProjects().then(setProjects).catch(console.error);
    }
  }, [initialWebsite, isOpen, defaultProjectId]);

  useEffect(() => {
    if (url.trim()) {
      let domain = url.trim().replace(/https?:\/\/(www\.)?/, '').split('/')[0];
      if (domain) {
        const fav = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        setFaviconPreview(fav);
        if (!name.trim()) {
          const capitalized = domain.split('.')[0];
          setName(capitalized.charAt(0).toUpperCase() + capitalized.slice(1));
        }
        // Automatically discover dominant logo color
        extractDominantColor(fav, domain).then((extracted) => {
          if (!initialWebsite && extracted) {
            setColor(extracted);
          }
        });
      }
    } else {
      setFaviconPreview('');
    }
  }, [url]);

  if (!isOpen) return null;

  const handleCategorySelectChange = (val: string) => {
    if (val === '__NEW__') {
      setIsCreatingCategory(true);
      setCategoryId('');
    } else {
      setIsCreatingCategory(false);
      setCategoryId(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || saving) return;

    setSaving(true);
    let resolvedCategoryId = categoryId || undefined;
    let resolvedCategoryName: string | undefined = undefined;

    try {
      // If user chose to create a new category directly
      if (isCreatingCategory && newCategoryName.trim()) {
        try {
          const createdCat = await categoryService.createCategory({
            name: newCategoryName.trim(),
            type: 'WEBSITE',
            color: color || '#10b981',
          });
          resolvedCategoryId = createdCat.id;
          resolvedCategoryName = createdCat.name;
          if (onCategoryCreated) {
            onCategoryCreated(createdCat);
          }
        } catch (catErr) {
          console.warn('Backend category creation fallback:', catErr);
          const fallbackCat: Category = {
            id: 'cat-' + Math.random().toString(36).substr(2, 9),
            userId: 'usr-dev-1001',
            name: newCategoryName.trim(),
            type: 'WEBSITE',
            color: color || '#10b981',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          resolvedCategoryId = fallbackCat.id;
          resolvedCategoryName = fallbackCat.name;
          if (onCategoryCreated) {
            onCategoryCreated(fallbackCat);
          }
        }
      } else if (resolvedCategoryId) {
        const found = categories.find((c) => c.id === resolvedCategoryId);
        if (found) resolvedCategoryName = found.name;
      }

      onSave({
        id: initialWebsite?.id,
        name: name.trim(),
        url: url.trim(),
        description: description.trim(),
        tags: tags.trim(),
        color,
        isFavorite,
        projectId: projectId || undefined,
        categoryId: resolvedCategoryId,
        categoryName: resolvedCategoryName,
        faviconUrl: faviconPreview,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save website:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0E1C15] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${color}20`, color: color }}
              className="p-2.5 rounded-2xl"
            >
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F2D1E] dark:text-[#E8FAF0] text-base">
                {initialWebsite ? 'Edit Website Bookmark' : 'Add Website Bookmark'}
              </h3>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                Auto-discover logo colors, set categories, and launch instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* URL Input with Live Favicon Preview */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Website URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="url"
                required
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://chatgpt.com"
                className="w-full pl-3.5 pr-12 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none focus:border-[#48C78E]"
              />
              {faviconPreview && (
                <div
                  style={{ borderColor: `${color}60` }}
                  className="w-7 h-7 absolute right-2.5 rounded-lg bg-white dark:bg-[#08170F] border p-0.5 flex items-center justify-center shadow-xs"
                >
                  <img
                    src={faviconPreview}
                    alt="Favicon"
                    className="w-5 h-5 rounded object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Website Title */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Website Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ChatGPT Developer Console"
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none focus:border-[#48C78E]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of why this resource is useful..."
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none focus:border-[#48C78E]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. ai, tools, docs, design"
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none focus:border-[#48C78E]"
            />
          </div>

          {/* Project Selector */}
          <div className="p-3.5 rounded-2xl bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] space-y-1.5">
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-purple-500" />
              Linked Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#08170F] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] text-sm focus:outline-none focus:border-[#48C78E] cursor-pointer"
            >
              <option value="">No Project (Standalone Bookmark)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name} {p.projectKey ? `(${p.projectKey})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Section with "Other / Create New Category" Option */}
          <div className="p-3.5 rounded-2xl bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                Category Area
              </label>
              {!isCreatingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> + New Category
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="text-xs font-semibold text-[#3D7858] dark:text-[#72B38F] hover:underline"
                >
                  Select Existing
                </button>
              )}
            </div>

            {!isCreatingCategory ? (
              <select
                value={categoryId}
                onChange={(e) => handleCategorySelectChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#08170F] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] text-sm focus:outline-none focus:border-[#48C78E]"
              >
                <option value="">General & Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__NEW__" className="font-bold text-emerald-600">
                  ➕ Other (Create New Category)...
                </option>
              </select>
            ) : (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter New Category Name (e.g. Banking, Cloud, Study)"
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#08170F] border-2 border-emerald-500 rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none"
                />
                <p className="text-[11px] text-[#3D7858] dark:text-[#72B38F]">
                  ✨ This bookmark will be saved into its own brand-new dedicated Category Section.
                </p>
              </div>
            )}
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-500" />
              Theme Accent Color
            </label>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-transform',
                    color === c && 'ring-2 ring-offset-2 ring-emerald-500 scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Favorite Checkbox */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all',
                isFavorite
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                  : 'bg-[#F2FBF6] dark:bg-[#132D20] border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
            >
              <Star className={clsx('w-4 h-4', isFavorite && 'fill-amber-500 text-amber-500')} />
              <span>{isFavorite ? 'Starred Favorite Website' : 'Mark as Starred Favorite'}</span>
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#66736B] dark:text-[#9BB5A5] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !url.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {saving ? 'Saving...' : initialWebsite ? 'Save Bookmark' : 'Add Bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
