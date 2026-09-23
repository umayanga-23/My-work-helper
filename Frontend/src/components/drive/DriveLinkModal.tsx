import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Tag,
  Link,
  FolderPlus,
  Briefcase
} from 'lucide-react';
import { DriveLink, Category, Project, ResourcePlatform } from '../../types';
import { detectPlatform } from '../../services/driveService';
import { categoryService } from '../../services/categoryService';
import { projectService } from '../../services/projectService';
import { BrandIcon } from './BrandIcons';
import { clsx } from 'clsx';

interface DriveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (driveData: Partial<DriveLink>) => void;
  categories: Category[];
  initialLink?: DriveLink;
  initialCategoryId?: string;
  defaultProjectId?: string;
  onCategoryCreated?: (newCat: Category) => void;
}

export const DriveLinkModal: React.FC<DriveLinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialLink,
  initialCategoryId,
  defaultProjectId,
  onCategoryCreated,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [resourceType, setResourceType] = useState<ResourcePlatform>('GOOGLE_DRIVE');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialLink?.name || '');
      setUrl(initialLink?.url || '');
      setResourceType(
        (initialLink?.resourceType as ResourcePlatform) ||
          (initialLink?.url ? detectPlatform(initialLink.url) : 'GOOGLE_DRIVE')
      );
      setDescription(initialLink?.description || '');
      setTags(initialLink?.tags || '');
      setCategoryId(initialLink?.categoryId || initialCategoryId || '');
      setProjectId(initialLink?.projectId || defaultProjectId || '');
      setIsFavorite(Boolean(initialLink?.isFavorite || initialLink?.favorite));
      setIsCreatingCategory(false);
      setNewCategoryName('');

      // Fetch projects for dropdown
      projectService.getProjects().then(setProjects).catch(console.error);
    }
  }, [isOpen, initialLink, initialCategoryId, defaultProjectId]);

  if (!isOpen) return null;

  // Auto-detect type and default name when URL is entered
  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (val.trim()) {
      const detected = detectPlatform(val);
      setResourceType(detected);

      if (!name) {
        if (detected === 'YOUTUBE') setName('YouTube Tutorial Reference');
        else if (detected === 'CHATGPT') setName('ChatGPT Shared Conversation');
        else if (detected === 'LINKEDIN') setName('LinkedIn Professional Article');
        else if (detected === 'FACEBOOK') setName('Facebook Resource Post');
        else if (detected === 'GITHUB') setName('GitHub Repository Reference');
        else if (detected === 'GOOGLE_DOCS') setName('Google Project Document');
        else if (detected === 'GOOGLE_SHEETS') setName('Google Data Spreadsheet');
        else if (detected === 'GOOGLE_SLIDES') setName('Google Presentation Slide Deck');
        else if (detected === 'GOOGLE_DRIVE') setName('Google Drive Project Folder');
      }
    }
  };

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
    if (!name.trim() || !url.trim()) return;

    let resolvedCatId = categoryId || undefined;
    if (isCreatingCategory && newCategoryName.trim()) {
      try {
        const createdCat = await categoryService.createCategory({
          name: newCategoryName.trim(),
          type: 'DRIVE_LINK',
          color: '#10b981',
        });
        resolvedCatId = createdCat.id;
        if (onCategoryCreated) onCategoryCreated(createdCat);
      } catch (err) {
        console.error('Failed to create category:', err);
      }
    }

    onSave({
      id: initialLink?.id,
      name: name.trim(),
      url: url.trim(),
      resourceType,
      description: description.trim() || undefined,
      tags: tags.trim() || undefined,
      isFavorite,
      favorite: isFavorite,
      categoryId: resolvedCatId,
      projectId: projectId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between bg-[#ECF9F1] dark:bg-[#10271C]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <BrandIcon type={resourceType} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F2D1E] dark:text-[#E8FAF0] text-base">
                {initialLink ? 'Edit Resource Link' : 'Add Cloud Drive or Project Resource'}
              </h3>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                Store Google Drive folders, ChatGPT chats, YouTube tutorials & social posts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] hover:bg-white dark:hover:bg-[#08170F] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Resource URL */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Resource URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              autoFocus
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://drive.google.com/..., https://chatgpt.com/..., https://youtu.be/..."
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-xs sm:text-sm outline-none focus:border-[#48C78E]"
            />
          </div>

          {/* Platform / Resource Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Platform Type (Auto-Detected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'GOOGLE_DRIVE', label: 'Google Drive' },
                { id: 'GOOGLE_DOCS', label: 'Google Docs' },
                { id: 'GOOGLE_SHEETS', label: 'Google Sheets' },
                { id: 'CHATGPT', label: 'ChatGPT Prompt' },
                { id: 'YOUTUBE', label: 'YouTube Video' },
                { id: 'LINKEDIN', label: 'LinkedIn Post' },
                { id: 'FACEBOOK', label: 'Facebook Post' },
                { id: 'GITHUB', label: 'GitHub Repo' },
                { id: 'WEB_RESOURCE', label: 'Web Article' },
              ].map((p) => {
                const isSelected = resourceType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setResourceType(p.id as ResourcePlatform)}
                    className={clsx(
                      'p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all',
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-[#F9FDFB] dark:bg-[#08170F] border-[#D5F2E2] dark:border-[#193A29] text-[#3D7858] dark:text-[#72B38F]'
                    )}
                  >
                    <BrandIcon type={p.id} className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DocuSphere Architecture & UI Figma / Drive Folder"
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-xs sm:text-sm outline-none focus:border-[#48C78E]"
            />
          </div>

          {/* Category & Project Linkage Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Category Section</span>
                {!isCreatingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(true)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <FolderPlus className="w-3 h-3" /> + New
                  </button>
                )}
              </label>

              {isCreatingCategory ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New Category Name..."
                      className="flex-1 px-3 py-2 bg-[#F2FBF6] dark:bg-[#132D20] border border-emerald-500 rounded-xl text-xs text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="p-2 rounded-xl text-xs text-[#3D7858] hover:bg-[#D5F2E2] dark:hover:bg-[#193A29]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => handleCategorySelectChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] text-xs outline-none focus:border-[#48C78E]"
                >
                  <option value="">General & Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__NEW__">➕ Create New Category...</option>
                </select>
              )}
            </div>

            {/* Project Select */}
            <div>
              <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Assign to Project</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] text-xs outline-none focus:border-[#48C78E]"
              >
                <option value="">None (Standalone Resource)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this resource for? Key concepts, formulas, or instructions..."
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-xs sm:text-sm outline-none focus:border-[#48C78E] resize-none"
            />
          </div>

          {/* Tags & Favorite */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="react, springboot, prompt, tutorial"
                className="w-full px-3 py-2 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-xs outline-none focus:border-[#48C78E]"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-end pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={clsx(
                  'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all',
                  isFavorite
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                    : 'bg-[#F2FBF6] dark:bg-[#132D20] border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F]'
                )}
              >
                <Star className={clsx('w-3.5 h-3.5', isFavorite && 'fill-current text-amber-500')} />
                <span>Starred</span>
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#D5F2E2] dark:border-[#193A29]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#BBEAD0] dark:border-[#1E4933] text-xs font-bold text-[#3D7858] dark:text-[#72B38F] hover:bg-[#F2FBF6] dark:hover:bg-[#132D20] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {initialLink ? 'Update Resource' : 'Save Resource Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
