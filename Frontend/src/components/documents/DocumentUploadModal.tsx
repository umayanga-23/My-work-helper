import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FolderArchive,
  FileText,
  Tag,
  ShieldCheck,
  FolderPlus,
  Sparkles,
  File,
  Briefcase
} from 'lucide-react';
import { DocumentItem, Category, Project } from '../../types';
import { formatFileSize, documentService } from '../../services/documentService';
import { categoryService } from '../../services/categoryService';
import { projectService } from '../../services/projectService';
import { clsx } from 'clsx';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (documentData: Partial<DocumentItem>) => void;
  categories: Category[];
  initialCategoryId?: string;
  defaultProjectId?: string;
  onCategoryCreated?: (newCategory: Category) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  categories,
  initialCategoryId,
  defaultProjectId,
  onCategoryCreated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setDisplayName('');
      setDescription('');
      setTags('');
      setCategoryId(initialCategoryId || '');
      setProjectId(defaultProjectId || '');
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setErrorMsg('');
      setUploading(false);

      projectService.getProjects().then(setProjects).catch(console.error);
    }
  }, [isOpen, initialCategoryId, defaultProjectId]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    // 50 MB limit validation
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File size exceeds 50 MB limit.');
      return;
    }
    setErrorMsg('');
    setSelectedFile(file);
    if (!displayName) {
      setDisplayName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
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
    if (!selectedFile) {
      setErrorMsg('Please select a document file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    let resolvedCategoryId = categoryId || undefined;

    try {
      if (isCreatingCategory && newCategoryName.trim()) {
        const createdCat = await categoryService.createCategory({
          name: newCategoryName.trim(),
          type: 'DOCUMENT',
          color: '#10b981',
        });
        resolvedCategoryId = createdCat.id;
        if (onCategoryCreated) onCategoryCreated(createdCat);
      }

      // Direct upload to Supabase Storage and Database
      const uploadedDoc = await documentService.uploadDocument(selectedFile, {
        name: displayName.trim() || selectedFile.name,
        categoryId: resolvedCategoryId,
        projectId: projectId || undefined,
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
      });

      onUploadSuccess(uploadedDoc);
      onClose();
    } catch (err: any) {
      console.error('Supabase upload failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Supabase upload encountered an issue.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between bg-[#ECF9F1] dark:bg-[#10271C]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F2D1E] dark:text-[#E8FAF0] text-base">
                Upload Document to Vault
              </h3>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                Drag & drop project files, assign categories, and view instantly
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
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              'border-2 border-dashed rounded-3xl p-6 text-center transition-all relative cursor-pointer',
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                : 'border-[#BBEAD0] dark:border-[#1E4933] hover:border-emerald-500 bg-[#F2FBF6] dark:bg-[#132D20]/50'
            )}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <File className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[#0F2D1E] dark:text-[#E8FAF0] max-w-xs truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F2D1E] dark:text-[#E8FAF0]">
                    Click to browse or drop document here
                  </p>
                  <p className="text-xs text-[#3D7858] dark:text-[#72B38F] mt-0.5">
                    PDF, Word, Excel, Images, Code archives up to 50MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              Document Title / Alias
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. System Architecture Diagram v2"
              className="w-full px-3.5 py-2.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none focus:border-[#48C78E]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context about this document..."
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
              placeholder="e.g. srs, architecture, syllabus, assignment"
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
              <option value="">No Project (Standalone Document)</option>
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
                  placeholder="Enter New Category Name (e.g. University, Certs, Receipts)"
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#08170F] border-2 border-emerald-500 rounded-xl text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 text-sm focus:outline-none"
                />
                <p className="text-[11px] text-[#3D7858] dark:text-[#72B38F]">
                  ✨ This file will be saved directly into its own dedicated Category Section.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#3D7858] dark:text-[#72B38F] p-2.5 bg-white dark:bg-[#08170F] rounded-xl border border-[#BBEAD0] dark:border-[#1E4933]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Files are encrypted & stored in private Supabase Storage buckets.</span>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {uploading ? 'Encrypting & Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
