import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { AiCopilotDrawer } from '../ai/AiCopilotDrawer';
import { AiCommandBarModal } from '../ai/AiCommandBarModal';

// Modals
import { TaskModal } from '../tasks/TaskModal';
import { WebsiteModal } from '../websites/WebsiteModal';
import { NoteModal } from '../notes/NoteModal';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { DriveLinkModal } from '../drive/DriveLinkModal';

// Services
import { taskService } from '../../services/taskService';
import { websiteService } from '../../services/websiteService';
import { noteService } from '../../services/noteService';
import { documentService } from '../../services/documentService';
import { driveService } from '../../services/driveService';
import { categoryService } from '../../services/categoryService';

// Types
import type { Category, Task, Website, Note, DocumentItem, DriveLink } from '../../types';

interface AppLayoutProps {
  onOpenQuickAction?: (type: 'task' | 'website' | 'note' | 'document' | 'drive') => void;
}

export const AppLayout: React.FC<AppLayoutProps> = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiCommandBarOpen, setAiCommandBarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Quick Action Modal State
  const [activeModal, setActiveModal] = useState<'task' | 'website' | 'note' | 'document' | 'drive' | null>(null);

  useEffect(() => {
    const refreshCategories = () => {
      categoryService.getCategories().then((cats) => setCategories(cats || []));
    };
    refreshCategories();
    window.addEventListener('workspace-category-updated', refreshCategories);
    return () => window.removeEventListener('workspace-category-updated', refreshCategories);
  }, []);

  const handleOpenQuickAction = (type: 'task' | 'website' | 'note' | 'document' | 'drive') => {
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  // Handlers for saving each resource
  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      await taskService.createTask(taskData);
      handleCloseModal();
      window.dispatchEvent(new CustomEvent('workspace-resource-created', { detail: { type: 'task' } }));
      navigate('/tasks');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleSaveWebsite = async (websiteData: Partial<Website>) => {
    try {
      await websiteService.createWebsite(websiteData);
      handleCloseModal();
      window.dispatchEvent(new CustomEvent('workspace-resource-created', { detail: { type: 'website' } }));
      navigate('/websites');
    } catch (err) {
      console.error('Failed to create website:', err);
    }
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      await noteService.createNote(noteData);
      handleCloseModal();
      window.dispatchEvent(new CustomEvent('workspace-resource-created', { detail: { type: 'note' } }));
      navigate('/notes');
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleSaveDocument = async (docData: Partial<DocumentItem>) => {
    try {
      await documentService.uploadDocumentMetadata(docData);
      handleCloseModal();
      window.dispatchEvent(new CustomEvent('workspace-resource-created', { detail: { type: 'document' } }));
      navigate('/documents');
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleSaveDrive = async (driveData: Partial<DriveLink>) => {
    try {
      await driveService.createDriveLink(driveData);
      handleCloseModal();
      window.dispatchEvent(new CustomEvent('workspace-resource-created', { detail: { type: 'drive' } }));
      navigate('/drive');
    } catch (err) {
      console.error('Failed to create drive link:', err);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F3FBF7] dark:bg-[#08120D] text-[#17211B] dark:text-[#EAF7EF] antialiased selection:bg-[#5FBF8F] selection:text-[#17211B] transition-colors duration-200">
      {/* Navigation Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header Topbar */}
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickAction={handleOpenQuickAction}
          setMobileOpen={setMobileOpen}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal Overlay */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Global AI Command Bar (Ctrl + K) */}
      <AiCommandBarModal
        isOpen={aiCommandBarOpen}
        onClose={() => setAiCommandBarOpen(false)}
        onOpenCopilot={(initialPrompt) => {
          setAiDrawerOpen(true);
        }}
      />

      {/* Floating AI Copilot Drawer */}
      <AiCopilotDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        onOpen={() => setAiDrawerOpen(true)}
      />

      {/* Quick Action Modals */}
      {activeModal === 'task' && (
        <TaskModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          categories={categories}
        />
      )}

      {activeModal === 'website' && (
        <WebsiteModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSaveWebsite}
          categories={categories}
        />
      )}

      {activeModal === 'note' && (
        <NoteModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSaveNote}
          categories={categories}
        />
      )}

      {activeModal === 'document' && (
        <DocumentUploadModal
          isOpen={true}
          onClose={handleCloseModal}
          onUploadSuccess={handleSaveDocument}
          categories={categories}
        />
      )}

      {activeModal === 'drive' && (
        <DriveLinkModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSaveDrive}
          categories={categories}
        />
      )}
    </div>
  );
};
