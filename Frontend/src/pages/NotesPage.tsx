import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Archive,
  Trash2,
  Edit,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  Sparkles,
  X,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FolderArchive,
  Layers,
  Eye
} from 'lucide-react';
import type { Note, Category } from '../types';
import { noteService } from '../services/noteService';
import { categoryService } from '../services/categoryService';
import { NoteModal } from '../components/notes/NoteModal';
import { AiNoteSummaryModal } from '../components/notes/AiNoteSummaryModal';
import { CategoryModal } from '../components/categories/CategoryModal';
import { useConfirm } from '../contexts/ConfirmDialogContext';
import { useLiveSync } from '../hooks/useLiveSync';
import { clsx } from 'clsx';

type ViewMode = 'SECTIONS' | 'GRID' | 'LIST';

export const NotesPage: React.FC = () => {
  const confirm = useConfirm();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'STARRED' | 'ARCHIVED'>('ACTIVE');
  const [viewMode, setViewMode] = useState<ViewMode>('SECTIONS');

  // Modals state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [presetCategoryId, setPresetCategoryId] = useState<string | undefined>(undefined);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);
  const [readingNote, setReadingNote] = useState<Note | undefined>(undefined);
  const [summarizingNote, setSummarizingNote] = useState<Note | null>(null);

  // Collapsed categories state for Sections view
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const loadNotes = async () => {
    try {
      const isArchived = activeTab === 'ARCHIVED';
      const isFavorite = activeTab === 'STARRED' ? true : undefined;
      const [fetchedNotes, fetchedCats] = await Promise.all([
        noteService.getNotes({
          search: search || undefined,
          categoryId: selectedCategory || undefined,
          isArchived,
          isFavorite,
        }),
        categoryService.getCategories(),
      ]);
      setNotes(fetchedNotes);
      setCategories(fetchedCats);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  useEffect(() => {
    loadNotes();
    const handleCategoryUpdate = () => loadNotes();
    window.addEventListener('workspace-category-updated', handleCategoryUpdate);
    window.addEventListener('workspace-resource-created', handleCategoryUpdate);
    return () => {
      window.removeEventListener('workspace-category-updated', handleCategoryUpdate);
      window.removeEventListener('workspace-resource-created', handleCategoryUpdate);
    };
  }, [search, selectedCategory, activeTab]);

  // Automatic live sync across devices
  useLiveSync(() => {
    loadNotes();
  }, { intervalMs: 15000 });

  // Top Pinned / Starred Notes Speed Dock
  const speedDockNotes = useMemo(() => {
    return notes
      .filter((n) => Boolean(n.isFavorite && !n.isArchived))
      .slice(0, 8);
  }, [notes]);

  // Grouped notes by category for Sections View
  const categorySections = useMemo(() => {
    const sections: { id?: string; name: string; color?: string; items: Note[] }[] = [];
    const assignedNoteIds = new Set<string>();

    // 1. Map known categories
    categories.forEach((cat) => {
      const items = notes.filter((n) => {
        if (n.categoryId === cat.id || (n.categoryName && n.categoryName.toLowerCase() === cat.name.toLowerCase())) {
          assignedNoteIds.add(n.id);
          return true;
        }
        return false;
      });

      if (!selectedCategory || selectedCategory === cat.id) {
        sections.push({
          id: cat.id,
          name: cat.name,
          color: cat.color || '#10B981',
          items,
        });
      }
    });

    // 2. Unassigned / Uncategorized notes (includes any note not assigned to known categories)
    const uncategorizedItems = notes.filter((n) => !assignedNoteIds.has(n.id));
    if ((!selectedCategory || selectedCategory === 'uncategorized') && uncategorizedItems.length > 0) {
      sections.push({
        id: undefined,
        name: 'General & Uncategorized',
        color: '#64748B',
        items: uncategorizedItems,
      });
    }

    return sections;
  }, [notes, categories, selectedCategory]);

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const handleToggleFavorite = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updated = await noteService.toggleFavorite(note.id);
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
  };

  const handleToggleArchive = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updated = await noteService.toggleArchive(note.id);
    if (activeTab === 'ARCHIVED' && !updated.isArchived) {
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } else if (activeTab === 'ACTIVE' && updated.isArchived) {
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } else {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Note',
      message: 'Are you sure you want to permanently delete this note?',
      confirmText: 'Delete Note',
      variant: 'danger',
    });
    if (ok) {
      await noteService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (editingNote) {
      const updated = await noteService.updateNote(editingNote.id, noteData);
      setNotes((prev) =>
        prev.map((n) => (n.id === editingNote.id ? updated : n))
      );
    } else {
      const created = await noteService.createNote(noteData);
      setNotes((prev) => [created, ...prev]);
    }
    setEditingNote(undefined);
    setPresetCategoryId(undefined);
    loadNotes();
  };

  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCat.id || c.name.toLowerCase() === newCat.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newCat];
    });
  };

  const handleDeleteCategory = async (sec: { id?: string; name: string; items: Note[] }) => {
    if (sec.name === 'General & Uncategorized' || sec.name === 'General') {
      alert('Default General category cannot be deleted.');
      return;
    }

    const ok = await confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${sec.name}" category?`,
      description:
        sec.items.length > 0
          ? `The ${sec.items.length} note(s) inside will remain safely stored as Uncategorized.`
          : undefined,
      confirmText: 'Delete Category',
      variant: 'danger',
    });

    if (!ok) return;

    try {
      if (sec.id) {
        await categoryService.deleteCategory(sec.id);
      }
      setCategories((prev) => prev.filter((c) => (sec.id ? c.id !== sec.id : c.name !== sec.name)));
      setNotes((prev) =>
        prev.map((n) =>
          n.categoryId === sec.id || n.categoryName === sec.name
            ? { ...n, categoryId: undefined, categoryName: undefined }
            : n
        )
      );
      if (selectedCategory === sec.id) setSelectedCategory('');
    } catch (err) {
      console.error('Failed to delete category:', err);
      setCategories((prev) => prev.filter((c) => (sec.id ? c.id !== sec.id : c.name !== sec.name)));
    }
  };

  const handleOpenCreateForCategory = (catId?: string) => {
    setEditingNote(undefined);
    setPresetCategoryId(catId);
    setNoteModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-500 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            Notes & Knowledge Base
          </h1>
          <p className="text-xs sm:text-sm text-[#3D7858] dark:text-[#72B38F] mt-0.5">
            Structured engineering docs, categorized knowledge sections, markdown notes, and AI summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Create New Category Button */}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] text-xs font-semibold text-[#0F2D1E] dark:text-[#E8FAF0] transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
            title="Create a new Category Section"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>+ New Category</span>
          </button>

          {/* Create Note Button */}
          <button
            onClick={() => {
              setEditingNote(undefined);
              setPresetCategoryId(undefined);
              setNoteModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>
      </div>

      {/* Top Pinned / Starred Notes Speed Dock */}
      {speedDockNotes.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#3D7858] dark:text-[#72B38F] px-1 font-semibold">
            <span className="flex items-center gap-1.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              Starred Knowledge Notes Dock
            </span>
            <span className="text-[11px] opacity-75 font-normal">
              {speedDockNotes.length} pinned for quick access
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {speedDockNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setReadingNote(note)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-amber-400 text-xs text-[#0F2D1E] dark:text-[#E8FAF0] whitespace-nowrap transition-all shadow-2xs group flex-shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="max-w-[160px] truncate font-medium">{note.title}</span>
                {note.categoryName && (
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                    {note.categoryName}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Horizontal Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('')}
          className={clsx(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border shadow-2xs',
            !selectedCategory
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
              : 'bg-white dark:bg-[#0D2218] border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
          )}
        >
          <span>All Categories</span>
          <span className={clsx('px-1.5 py-0.2 rounded-full text-[10px]', !selectedCategory ? 'bg-emerald-700 text-white' : 'bg-[#E8F7EF] dark:bg-[#13261C]')}>
            {notes.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = notes.filter((n) => n.categoryId === cat.id || n.categoryName === cat.name).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border shadow-2xs',
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                  : 'bg-white dark:bg-[#0D2218] border-[#BBEAD0] dark:border-[#1E4933] text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color || '#10B981' }}
              />
              <span>{cat.name}</span>
              <span className={clsx('px-1.5 py-0.2 rounded-full text-[10px]', isSelected ? 'bg-emerald-700 text-white' : 'bg-[#E8F7EF] dark:bg-[#13261C]')}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Quick Add Category Pill */}
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          title="Create a new category"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Search, Tabs, & View Switcher Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#3D7858] dark:text-[#72B38F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, markdown, tags, concepts..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F2FBF6] dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] rounded-xl text-xs text-[#0F2D1E] dark:text-[#E8FAF0] placeholder-[#3D7858]/60 outline-none focus:border-[#48C78E]"
          />
        </div>

        {/* Center: Tabs Filter (Active, Starred, Archived) */}
        <div className="flex items-center gap-1 p-1 bg-[#F2FBF6] dark:bg-[#132D20] rounded-xl border border-[#BBEAD0] dark:border-[#1E4933]">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-bold transition-all',
              activeTab === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
            )}
          >
            Active Notes
          </button>
          <button
            onClick={() => setActiveTab('STARRED')}
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all',
              activeTab === 'STARRED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
            )}
          >
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            Starred
          </button>
          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all',
              activeTab === 'ARCHIVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            Archived
          </button>
        </div>

        {/* Right: View Switcher (SECTIONS / GRID / LIST) */}
        <div className="flex items-center gap-1 p-1 bg-[#F2FBF6] dark:bg-[#132D20] rounded-xl border border-[#BBEAD0] dark:border-[#1E4933]">
          <button
            onClick={() => setViewMode('SECTIONS')}
            className={clsx(
              'p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-semibold px-2',
              viewMode === 'SECTIONS'
                ? 'bg-white dark:bg-[#08170F] text-[#25935C] dark:text-[#5FBF8F] shadow-sm'
                : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
            )}
            title="Category Sections View"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Sections</span>
          </button>
          <button
            onClick={() => setViewMode('GRID')}
            className={clsx(
              'p-1.5 rounded-lg text-xs transition-colors',
              viewMode === 'GRID'
                ? 'bg-white dark:bg-[#08170F] text-[#25935C] dark:text-[#5FBF8F] shadow-sm'
                : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
            )}
            title="Flat Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('LIST')}
            className={clsx(
              'p-1.5 rounded-lg text-xs transition-colors',
              viewMode === 'LIST'
                ? 'bg-white dark:bg-[#08170F] text-[#25935C] dark:text-[#5FBF8F] shadow-sm'
                : 'text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0]'
            )}
            title="List View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'SECTIONS' ? (
        categorySections.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#F0FAF4] dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] text-center space-y-3 shadow-sm">
            <FolderArchive className="w-12 h-12 text-[#48C78E] mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
              No categories or notes found
            </h3>
            <p className="text-xs text-[#3D7858] dark:text-[#72B38F] max-w-sm mx-auto">
              Create your first category section or write engineering notes to organize your knowledge.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#132D20] border border-[#BBEAD0] dark:border-[#1E4933] text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0]"
              >
                + Create Category
              </button>
              <button
                onClick={() => handleOpenCreateForCategory()}
                className="px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl text-xs font-bold shadow"
              >
                + Create Note
              </button>
            </div>
          </div>
        ) : (
          /* CATEGORY SECTIONS VIEW */
          <div className="space-y-8">
            {categorySections.map((sec) => {
              const isCollapsed = collapsedCategories[sec.name];
              return (
                <div key={sec.name} className="space-y-3">
                  {/* Category Header with Accent Dot, Title, Count & Actions */}
                  <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#D5F2E2] dark:border-[#193A29]">
                    <div
                      onClick={() => toggleCategoryCollapse(sec.name)}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <button
                        className="p-1 rounded-lg hover:bg-emerald-500/10 text-[#3D7858] dark:text-[#72B38F] transition-colors"
                        title={isCollapsed ? 'Expand category' : 'Collapse category'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: sec.color || '#10B981' }}
                      />
                      <h2 className="font-bold text-base sm:text-lg text-[#0F2D1E] dark:text-[#E8FAF0] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                        {sec.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F7EF] dark:bg-[#13261C] text-[#1E7247] dark:text-[#5FBF8F] border border-[#BBEAD0] dark:border-[#20372B]">
                        {sec.items.length} {sec.items.length === 1 ? 'note' : 'notes'}
                      </span>
                    </div>

                    {/* Actions for this category */}
                    <div className="flex items-center gap-1.5">
                      {/* Add Note to this category */}
                      <button
                        onClick={() => handleOpenCreateForCategory(sec.id)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] text-xs font-bold text-[#1E7247] dark:text-[#5FBF8F] transition-all flex items-center gap-1.5 shadow-2xs"
                        title={`Write note in ${sec.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Note here</span>
                      </button>

                      {/* Delete Category Button */}
                      {sec.name !== 'General & Uncategorized' && sec.name !== 'General' && (
                        <button
                          onClick={() => handleDeleteCategory(sec)}
                          className="p-1.5 rounded-xl hover:bg-rose-500/10 text-[#3D7858] dark:text-[#72B38F] hover:text-rose-500 transition-colors"
                          title={`Delete "${sec.name}" category`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Items Body */}
                  {!isCollapsed && (
                    sec.items.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#0D2218] border border-dashed border-[#BBEAD0] dark:border-[#1E4933] text-center space-y-2">
                        <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                          No notes in this category yet.
                        </p>
                        <button
                          onClick={() => handleOpenCreateForCategory(sec.id)}
                          className="px-3 py-1 bg-[#E8F7EF] dark:bg-[#13261C] hover:bg-emerald-500/20 text-[#1E7247] dark:text-[#5FBF8F] rounded-lg text-xs font-bold transition-all"
                        >
                          + Write first note
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sec.items.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => setReadingNote(note)}
                            className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base group-hover:text-amber-500 transition-colors line-clamp-1">
                                  {note.title}
                                </h3>
                                <button
                                  onClick={(e) => handleToggleFavorite(e, note)}
                                  className="p-1 text-[#8A9890] dark:text-[#6F8A7A] hover:text-amber-400 transition-colors flex-shrink-0"
                                >
                                  <Star
                                    className={clsx(
                                      'w-4 h-4',
                                      note.isFavorite && 'fill-current text-amber-400'
                                    )}
                                  />
                                </button>
                              </div>

                              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] font-mono line-clamp-3 mb-3 bg-[#F3FBF7] dark:bg-[#08120D]/40 p-2.5 rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">
                                {note.content}
                              </p>

                              {/* Tags Badges */}
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                                  {note.tags.map((t) => (
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

                            {/* Card Footer */}
                            <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between text-xs">
                              <span className="text-[11px] text-amber-500 font-medium">
                                {note.categoryName || sec.name}
                              </span>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReadingNote(note);
                                  }}
                                  className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded"
                                  title="Read Note"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSummarizingNote(note);
                                  }}
                                  className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded"
                                  title="AI Summarize Note"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNote(note);
                                    setPresetCategoryId(note.categoryId);
                                    setNoteModalOpen(true);
                                  }}
                                  className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded"
                                  title="Edit note"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleToggleArchive(e, note)}
                                  className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-amber-400 rounded"
                                  title={note.isArchived ? 'Unarchive' : 'Archive'}
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, note.id)}
                                  className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 rounded"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : viewMode === 'GRID' ? (
        /* FLAT GRID VIEW */
        notes.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
            <BookOpen className="w-12 h-12 text-[#66736B] dark:text-[#9BB5A5] mx-auto opacity-60" />
            <h3 className="text-lg font-semibold text-[#17211B] dark:text-[#EAF7EF]">No notes found</h3>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
              Build your personal knowledge base by creating your first engineering note.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setReadingNote(note)}
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base group-hover:text-amber-500 transition-colors line-clamp-1">
                      {note.title}
                    </h3>
                    <button
                      onClick={(e) => handleToggleFavorite(e, note)}
                      className="p-1 text-[#8A9890] dark:text-[#6F8A7A] hover:text-amber-400 transition-colors flex-shrink-0"
                    >
                      <Star
                        className={clsx(
                          'w-4 h-4',
                          note.isFavorite && 'fill-current text-amber-400'
                        )}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] font-mono line-clamp-3 mb-4 bg-[#F3FBF7] dark:bg-[#08120D]/40 p-2.5 rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">
                    {note.content}
                  </p>

                  {/* Tags Badges */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {note.tags.map((t) => (
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

                {/* Card Footer */}
                <div className="pt-3 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-amber-500 font-medium">
                    {note.categoryName || 'General & Uncategorized'}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReadingNote(note);
                      }}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded"
                      title="Read note"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSummarizingNote(note);
                      }}
                      className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded"
                      title="AI Summarize Note"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNote(note);
                        setPresetCategoryId(note.categoryId);
                        setNoteModalOpen(true);
                      }}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded"
                      title="Edit note"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleToggleArchive(e, note)}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-amber-400 rounded"
                      title={note.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-rose-400 rounded"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* LIST VIEW */
        notes.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-3">
            <BookOpen className="w-12 h-12 text-[#66736B] dark:text-[#9BB5A5] mx-auto opacity-60" />
            <h3 className="text-lg font-semibold text-[#17211B] dark:text-[#EAF7EF]">No notes found</h3>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto">
              Build your personal knowledge base by creating your first engineering note.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setReadingNote(note)}
                className="p-4 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#17211B] dark:text-[#EAF7EF] group-hover:text-amber-500 transition-colors truncate">
                      {note.title}
                    </h4>
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate">{note.content.substring(0, 90)}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummarizingNote(note);
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 flex items-center gap-1 cursor-pointer border border-purple-500/20"
                    title="AI Summarize"
                  >
                    <Sparkles className="w-3 h-3 text-purple-500" /> Summarize
                  </button>
                  {note.categoryName && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E8F7EF] dark:bg-[#13261C] text-emerald-600 dark:text-emerald-400 border border-[#DCE9E1] dark:border-[#20372B] font-medium">
                      {note.categoryName}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleToggleFavorite(e, note)}
                    className="text-[#8A9890] dark:text-[#6F8A7A] hover:text-amber-400"
                  >
                    <Star className={clsx('w-4 h-4', note.isFavorite && 'fill-current text-amber-400')} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Note Reader Modal */}
      {readingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base">{readingNote.title}</h3>
                {readingNote.categoryName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E8F7EF] dark:bg-[#13261C] text-emerald-600 dark:text-emerald-400 border border-[#DCE9E1] dark:border-[#20372B] font-medium">
                    {readingNote.categoryName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const n = readingNote;
                    setReadingNote(undefined);
                    setSummarizingNote(n);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Summarize
                </button>
                <button
                  onClick={() => setReadingNote(undefined)}
                  className="p-1 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-[#17211B] dark:text-[#EAF7EF] leading-relaxed space-y-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {readingNote.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal Dialog with preset category support */}
      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setEditingNote(undefined);
          setPresetCategoryId(undefined);
        }}
        onSave={handleSaveNote}
        categories={categories}
        initialNote={editingNote}
        presetCategoryId={presetCategoryId}
        onOpenCategoryModal={() => setCategoryModalOpen(true)}
      />

      {/* Dynamic Category Creation Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
        defaultType="NOTE"
      />

      {/* AI Smart Note Summary Modal */}
      <AiNoteSummaryModal
        isOpen={!!summarizingNote}
        onClose={() => setSummarizingNote(null)}
        note={summarizingNote}
        onTasksCreated={() => loadNotes()}
      />
    </div>
  );
};

export default NotesPage;
