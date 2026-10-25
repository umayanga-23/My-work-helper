import React, { useState } from 'react';
import { Folder, FolderPlus, X, Palette, Sparkles, FolderGit2, FolderArchive, FolderCode, GraduationCap, Briefcase, FileText } from 'lucide-react';
import { folderService } from '../../services/folderService';
import type { FolderItem } from '../../types';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
  parentName?: string;
  type?: 'DOCUMENT' | 'NOTE' | 'DRIVE' | 'GENERAL';
  onFolderCreated: (folder: FolderItem) => void;
}

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
];

const PRESET_ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'FolderCode', icon: FolderCode },
  { name: 'FolderArchive', icon: FolderArchive },
  { name: 'FolderGit2', icon: FolderGit2 },
  { name: 'FileText', icon: FileText },
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  parentId,
  parentName,
  type = 'DOCUMENT',
  onFolderCreated,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState('Folder');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a folder name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const created = await folderService.createFolder({
        name: name.trim(),
        parentId,
        type,
        color,
        icon,
      });
      onFolderCreated(created);
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#0c1813] border border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-emerald-500/10 flex items-center justify-between bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                {parentId ? `Create Sub-folder` : `Create New Folder`}
              </h3>
              {parentName && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Inside: <span className="font-bold">{parentName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. University, Aviation, Semester 1, Project Docs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-emerald-500/20 rounded-2xl text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-emerald-500" />
              Folder Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-all ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-gray-900 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Folder Icon
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500 shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4" />
              )}
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
