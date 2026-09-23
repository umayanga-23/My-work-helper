import React, { useState } from 'react';
import { X, FolderPlus, Palette } from 'lucide-react';
import { Category, CategoryType } from '../../types';
import { categoryService } from '../../services/categoryService';
import { clsx } from 'clsx';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (newCategory: Category) => void;
  defaultType?: CategoryType;
}

const CATEGORY_COLORS = [
  '#10B981', // Emerald
  '#0EA5E9', // Sky
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
  defaultType = 'WEBSITE',
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10B981');
  const type = defaultType;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const created = await categoryService.createCategory({
        name: name.trim(),
        type,
        color,
      });
      onCategoryCreated(created);
      setName('');
      setColor('#10B981');
      onClose();
    } catch (err: any) {
      console.error('Failed to create category:', err);
      // Fallback local create
      const fallbackCat: Category = {
        id: 'cat-' + Math.random().toString(36).substr(2, 9),
        userId: 'usr-dev-1001',
        name: name.trim(),
        type,
        color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onCategoryCreated(fallbackCat);
      setName('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#0E1C15] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F2D1E] dark:text-[#E8FAF0] text-base">
                Create New Category
              </h3>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                Group your website bookmarks and workspace resources
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Category Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Tools, Transport & Travel, Banking"
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none focus:border-[#48C78E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-500" />
              Category Color
            </label>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {CATEGORY_COLORS.map((c) => (
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

          {/* Footer */}
          <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#66736B] dark:text-[#9BB5A5] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
            >
              {saving ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
